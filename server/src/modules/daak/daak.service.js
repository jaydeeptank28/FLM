// Daak Service - Correspondence management
const { v4: uuidv4 } = require('uuid');
const { DAAK_STATES, DAAK_TYPES } = require('../../config/constants');
const { AppError } = require('../../middleware/errorHandler');

class DaakService {
    constructor(db) {
        this.db = db;
    }

    // Generate daak number
    async generateDaakNumber(type) {
        const year = new Date().getFullYear();
        const prefix = type === DAAK_TYPES.INWARD ? 'IN' : 'OUT';

        // Count existing daak of this type this year
        const count = await this.db('daak')
            .where('type', type)
            .whereRaw(`EXTRACT(YEAR FROM created_at) = ?`, [year])
            .count('id as count')
            .first();

        const nextNumber = (parseInt(count.count) + 1).toString().padStart(5, '0');
        return `DAAK/${prefix}/${year}/${nextNumber}`;
    }

    // Create new daak
    async create(userId, data) {
        const {
            type,
            departmentId,
            subject,
            senderName,
            senderAddress,
            receiverName,
            receiverAddress,
            mode,
            receivedDate,
            dispatchDate,
            priority,
            remarks
        } = data;

        const daakNumber = await this.generateDaakNumber(type);

        const [daak] = await this.db('daak')
            .insert({
                daak_number: daakNumber,
                type,
                subject,
                sender_name: senderName,
                sender_address: senderAddress,
                receiver_name: receiverName,
                receiver_address: receiverAddress,
                mode,
                received_date: receivedDate,
                dispatch_date: dispatchDate,
                priority: priority || 'Medium',
                current_state: type === DAAK_TYPES.INWARD ? DAAK_STATES.RECEIVED : DAAK_STATES.PENDING,
                department_id: departmentId,
                created_by: userId,
                remarks
            })
            .returning('*');

        // Add audit trail
        await this.db('daak_audit_trail').insert({
            daak_id: daak.id,
            action: 'CREATED',
            performed_by: userId,
            details: `${type} daak created`
        });

        return this.getById(daak.id);
    }

    // Get daak by ID
    async getById(id) {
        const daak = await this.db('daak')
            .select('daak.*', 'departments.code as department_code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'daak.department_id')
            .where('daak.id', id)
            .first();

        if (!daak) {
            throw new AppError('Daak not found', 404);
        }

        // Get creator info
        const creator = await this.db('users')
            .select('id', 'name', 'email')
            .where({ id: daak.created_by })
            .first();

        // Get linked file if any
        let linkedFile = null;
        if (daak.linked_file_id) {
            linkedFile = await this.db('files')
                .select('id', 'file_number', 'subject', 'current_state')
                .where({ id: daak.linked_file_id })
                .first();
        }

        // Get audit trail
        const auditTrail = await this.db('daak_audit_trail')
            .select('daak_audit_trail.*', 'users.name as performed_by_name')
            .join('users', 'users.id', 'daak_audit_trail.performed_by')
            .where({ daak_id: id })
            .orderBy('performed_at', 'desc');

        return {
            ...daak,
            creator,
            linkedFile,
            auditTrail
        };
    }

    // List daak by type
    async getByType(departmentId, type) {
        let query = this.db('daak')
            .select('daak.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'daak.department_id')
            .join('users', 'users.id', 'daak.created_by')
            .where('daak.department_id', departmentId);

        if (type) {
            query = query.where('daak.type', type);
        }

        return query.orderBy('daak.created_at', 'desc');
    }

    // Update daak
    async update(id, userId, data) {
        const daak = await this.db('daak').where({ id }).first();
        if (!daak) {
            throw new AppError('Daak not found', 404);
        }

        const {
            subject,
            senderName,
            senderAddress,
            receiverName,
            receiverAddress,
            mode,
            receivedDate,
            dispatchDate,
            priority,
            remarks
        } = data;

        const updates = {};
        if (subject) updates.subject = subject;
        if (senderName !== undefined) updates.sender_name = senderName;
        if (senderAddress !== undefined) updates.sender_address = senderAddress;
        if (receiverName !== undefined) updates.receiver_name = receiverName;
        if (receiverAddress !== undefined) updates.receiver_address = receiverAddress;
        if (mode) updates.mode = mode;
        if (receivedDate !== undefined) updates.received_date = receivedDate;
        if (dispatchDate !== undefined) updates.dispatch_date = dispatchDate;
        if (priority) updates.priority = priority;
        if (remarks !== undefined) updates.remarks = remarks;
        updates.updated_at = new Date();

        await this.db('daak').where({ id }).update(updates);

        await this.db('daak_audit_trail').insert({
            daak_id: id,
            action: 'UPDATED',
            performed_by: userId,
            details: 'Daak details updated'
        });

        return this.getById(id);
    }

    // Link daak to file
    async linkToFile(daakId, userId, fileId) {
        const daak = await this.db('daak').where({ id: daakId }).first();
        if (!daak) {
            throw new AppError('Daak not found', 404);
        }

        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        await this.db('daak').where({ id: daakId }).update({
            linked_file_id: fileId,
            updated_at: new Date()
        });

        await this.db('daak_audit_trail').insert({
            daak_id: daakId,
            action: 'LINKED_TO_FILE',
            performed_by: userId,
            details: `Linked to file ${file.file_number}`,
            metadata: JSON.stringify({ fileId, fileNumber: file.file_number })
        });

        return this.getById(daakId);
    }

    // Change daak state
    async changeState(daakId, userId, newState, remarks = '') {
        const daak = await this.db('daak').where({ id: daakId }).first();
        if (!daak) {
            throw new AppError('Daak not found', 404);
        }

        const validStates = Object.values(DAAK_STATES);
        if (!validStates.includes(newState)) {
            throw new AppError('Invalid state', 400);
        }

        await this.db('daak').where({ id: daakId }).update({
            current_state: newState,
            updated_at: new Date()
        });

        await this.db('daak_audit_trail').insert({
            daak_id: daakId,
            action: 'STATE_CHANGED',
            performed_by: userId,
            details: `State changed from ${daak.current_state} to ${newState}${remarks ? ': ' + remarks : ''}`,
            metadata: JSON.stringify({ fromState: daak.current_state, toState: newState })
        });

        return this.getById(daakId);
    }

    // Search daak
    async search(departmentId, query) {
        const { text, type, status, priority, dateFrom, dateTo } = query;

        let q = this.db('daak')
            .select('daak.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'daak.department_id')
            .join('users', 'users.id', 'daak.created_by');

        if (departmentId) {
            q = q.where('daak.department_id', departmentId);
        }

        if (text) {
            q = q.where(function() {
                this.whereILike('daak.daak_number', `%${text}%`)
                    .orWhereILike('daak.subject', `%${text}%`)
                    .orWhereILike('daak.sender_name', `%${text}%`)
                    .orWhereILike('daak.receiver_name', `%${text}%`);
            });
        }

        if (type) {
            q = q.where('daak.type', type);
        }

        if (status) {
            q = q.where('daak.current_state', status);
        }

        if (priority) {
            q = q.where('daak.priority', priority);
        }

        if (dateFrom) {
            q = q.where('daak.created_at', '>=', dateFrom);
        }
        if (dateTo) {
            q = q.where('daak.created_at', '<=', dateTo);
        }

        return q.orderBy('daak.created_at', 'desc').limit(100);
    }
}

module.exports = DaakService;
