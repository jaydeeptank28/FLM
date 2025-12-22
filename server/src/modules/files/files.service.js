// Files Service - Core file operations
const { v4: uuidv4 } = require('uuid');
const { FILE_STATES } = require('../../config/constants');
const { AppError } = require('../../middleware/errorHandler');
const WorkflowEngine = require('../workflow/workflow.engine');

class FilesService {
    constructor(db) {
        this.db = db;
        this.workflowEngine = new WorkflowEngine(db);
    }

    // Generate file number
    async generateFileNumber(departmentId) {
        const department = await this.db('departments').where({ id: departmentId }).first();
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        const year = new Date().getFullYear();
        const prefix = department.file_prefix;

        // Count existing files for this department this year
        const count = await this.db('files')
            .where('department_id', departmentId)
            .whereRaw(`EXTRACT(YEAR FROM created_at) = ?`, [year])
            .count('id as count')
            .first();

        const nextNumber = (parseInt(count.count) + 1).toString().padStart(4, '0');
        return `FLM/${prefix}/${year}/${nextNumber}`;
    }

    // Get workflow template for department and file type
    async getWorkflowTemplate(departmentId, fileType) {
        // Try department + file type specific
        let template = await this.db('workflow_templates')
            .where({ department_id: departmentId, is_active: true })
            .whereRaw('? = ANY(file_types)', [fileType])
            .first();

        // Fallback to department default
        if (!template) {
            template = await this.db('workflow_templates')
                .where({ department_id: departmentId, is_active: true })
                .first();
        }

        // Fallback to system default
        if (!template) {
            template = await this.db('workflow_templates')
                .where({ is_default: true, is_active: true })
                .first();
        }

        if (!template) {
            throw new AppError('No workflow template found', 500);
        }

        // Get levels
        const levels = await this.db('workflow_template_levels')
            .where({ template_id: template.id })
            .orderBy('level');

        return { ...template, levels };
    }

    // Create a new file
    async create(userId, data) {
        const { departmentId, subject, fileType, priority, initialNoting } = data;

        // Generate file number
        const fileNumber = await this.generateFileNumber(departmentId);

        // Get workflow template
        const template = await this.getWorkflowTemplate(departmentId, fileType);

        const trx = await this.db.transaction();

        try {
            // Create file
            const [file] = await trx('files')
                .insert({
                    file_number: fileNumber,
                    subject,
                    file_type: fileType,
                    department_id: departmentId,
                    priority: priority || 'Medium',
                    current_state: FILE_STATES.DRAFT,
                    created_by: userId,
                    workflow_template_id: template.id,
                    current_level: 0,
                    max_levels: template.levels.length
                })
                .returning('*');

            // Add initial noting if provided
            if (initialNoting) {
                await trx('file_notings').insert({
                    file_id: file.id,
                    content: initialNoting,
                    type: 'NOTING',
                    added_by: userId
                });
            }

            // Add audit trail
            await trx('file_audit_trail').insert({
                file_id: file.id,
                action: 'CREATED',
                performed_by: userId,
                details: 'File created as draft'
            });

            // Auto-track by creator
            await trx('file_tracks').insert({
                file_id: file.id,
                user_id: userId
            });

            await trx.commit();

            return this.getById(file.id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // Get file by ID with all related data
    async getById(id) {
        const file = await this.db('files')
            .select('files.*', 'departments.code as department_code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'files.department_id')
            .where('files.id', id)
            .first();

        if (!file) {
            throw new AppError('File not found', 404);
        }

        // Get creator info
        const creator = await this.db('users')
            .select('id', 'name', 'email')
            .where({ id: file.created_by })
            .first();

        // Get notings
        const notings = await this.db('file_notings')
            .select('file_notings.*', 'users.name as added_by_name')
            .join('users', 'users.id', 'file_notings.added_by')
            .where({ file_id: id })
            .orderBy('created_at', 'desc');

        // Get documents with versions
        const documents = await this.db('file_documents')
            .where({ file_id: id })
            .orderBy('created_at', 'desc');

        for (const doc of documents) {
            doc.versions = await this.db('file_document_versions')
                .select('file_document_versions.*', 'users.name as uploaded_by_name')
                .join('users', 'users.id', 'file_document_versions.uploaded_by')
                .where({ document_id: doc.id })
                .orderBy('version', 'desc');
        }

        // Get workflow participants
        const participants = await this.db('file_workflow_participants')
            .select('file_workflow_participants.*', 'users.name as action_by_name')
            .join('users', 'users.id', 'file_workflow_participants.action_by')
            .where({ file_id: id })
            .orderBy('action_at', 'desc');

        // Get audit trail
        const auditTrail = await this.db('file_audit_trail')
            .select('file_audit_trail.*', 'users.name as performed_by_name')
            .join('users', 'users.id', 'file_audit_trail.performed_by')
            .where({ file_id: id })
            .orderBy('performed_at', 'desc');

        // Get shares
        const sharedWith = await this.db('file_shares')
            .select('users.id', 'users.name', 'users.email')
            .join('users', 'users.id', 'file_shares.shared_with')
            .where({ file_id: id });

        // Get tracks
        const trackedBy = await this.db('file_tracks')
            .select('users.id', 'users.name')
            .join('users', 'users.id', 'file_tracks.user_id')
            .where({ file_id: id });

        // Get attribute history
        const attributeHistory = await this.db('file_attribute_history')
            .select('file_attribute_history.*', 'users.name as changed_by_name')
            .join('users', 'users.id', 'file_attribute_history.changed_by')
            .where({ file_id: id })
            .orderBy('changed_at', 'desc');

        return {
            ...file,
            creator,
            notings,
            documents,
            workflow: {
                templateId: file.workflow_template_id,
                currentLevel: file.current_level,
                maxLevels: file.max_levels,
                participants
            },
            auditTrail,
            sharedWith,
            trackedBy: trackedBy.map(t => t.id),
            attributeHistory
        };
    }

    // List files by folder type
    async getByFolder(userId, departmentId, folder) {
        let query = this.db('files')
            .select('files.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'files.department_id')
            .join('users', 'users.id', 'files.created_by');

        switch (folder) {
            case 'in-tray':
                // Files pending user's action based on role
                const userRoles = await this.db('user_department_roles')
                    .where({ user_id: userId, department_id: departmentId });

                if (userRoles.length === 0) {
                    return [];
                }

                const roleNames = userRoles.map(r => r.role);

                query = query
                    .where('files.department_id', departmentId)
                    .where('files.current_state', FILE_STATES.IN_REVIEW)
                    .whereExists(function() {
                        this.select('*')
                            .from('workflow_template_levels')
                            .whereRaw('workflow_template_levels.template_id = files.workflow_template_id')
                            .whereRaw('workflow_template_levels.level = files.current_level')
                            .whereIn('workflow_template_levels.role', roleNames);
                    });
                break;

            case 'draft':
                query = query
                    .where('files.created_by', userId)
                    .where('files.current_state', FILE_STATES.DRAFT);
                break;

            case 'sent':
                query = query
                    .where('files.created_by', userId)
                    .whereNot('files.current_state', FILE_STATES.DRAFT)
                    .whereNot('files.current_state', FILE_STATES.ARCHIVED);
                break;

            case 'cabinet':
                query = query
                    .where('files.department_id', departmentId)
                    .where('files.current_state', FILE_STATES.CABINET);
                break;

            case 'shared':
                query = query
                    .join('file_shares', 'file_shares.file_id', 'files.id')
                    .where('file_shares.shared_with', userId);
                break;

            case 'tracked':
                query = query
                    .join('file_tracks', 'file_tracks.file_id', 'files.id')
                    .where('file_tracks.user_id', userId);
                break;

            case 'archived':
                query = query
                    .where('files.department_id', departmentId)
                    .where('files.current_state', FILE_STATES.ARCHIVED);
                break;

            default:
                throw new AppError('Invalid folder type', 400);
        }

        return query.orderBy('files.updated_at', 'desc');
    }

    // Update file metadata
    async update(fileId, userId, data) {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        // Only creator can update, and only in DRAFT or RETURNED state
        if (file.created_by !== userId) {
            throw new AppError('Only the creator can update this file', 403);
        }

        if (![FILE_STATES.DRAFT, FILE_STATES.RETURNED].includes(file.current_state)) {
            throw new AppError('File cannot be updated in current state', 400);
        }

        const { subject, priority, fileType } = data;
        const updates = {};
        const attributeChanges = [];

        if (subject && subject !== file.subject) {
            updates.subject = subject;
            attributeChanges.push({ field: 'subject', oldValue: file.subject, newValue: subject });
        }

        if (priority && priority !== file.priority) {
            updates.priority = priority;
            attributeChanges.push({ field: 'priority', oldValue: file.priority, newValue: priority });
        }

        if (fileType && fileType !== file.file_type) {
            updates.file_type = fileType;
            attributeChanges.push({ field: 'file_type', oldValue: file.file_type, newValue: fileType });
        }

        if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date();

            await this.db('files').where({ id: fileId }).update(updates);

            // Record attribute changes
            for (const change of attributeChanges) {
                await this.db('file_attribute_history').insert({
                    file_id: fileId,
                    field: change.field,
                    old_value: change.oldValue,
                    new_value: change.newValue,
                    changed_by: userId
                });
            }
        }

        return this.getById(fileId);
    }

    // Add noting
    async addNoting(fileId, userId, content, type = 'NOTING') {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        if ([FILE_STATES.ARCHIVED, FILE_STATES.REJECTED].includes(file.current_state)) {
            throw new AppError('Cannot add noting to archived/rejected file', 400);
        }

        await this.db('file_notings').insert({
            file_id: fileId,
            content,
            type,
            added_by: userId
        });

        await this.db('file_audit_trail').insert({
            file_id: fileId,
            action: 'NOTING_ADDED',
            performed_by: userId,
            details: `${type} added`
        });

        return this.getById(fileId);
    }

    // Add document
    async addDocument(fileId, userId, documentData) {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        if ([FILE_STATES.ARCHIVED, FILE_STATES.REJECTED].includes(file.current_state)) {
            throw new AppError('Cannot add document to archived/rejected file', 400);
        }

        const { name, type = 'NORMAL', size = 0, storagePath = null } = documentData;

        // Check if document with same name exists (for versioning)
        const existingDoc = await this.db('file_documents')
            .where({ file_id: fileId, name })
            .first();

        if (existingDoc) {
            // Add new version
            const maxVersion = await this.db('file_document_versions')
                .where({ document_id: existingDoc.id })
                .max('version as max')
                .first();

            const newVersion = (maxVersion.max || 0) + 1;

            await this.db('file_document_versions').insert({
                document_id: existingDoc.id,
                version: newVersion,
                storage_path: storagePath,
                size,
                uploaded_by: userId
            });

            await this.db('file_audit_trail').insert({
                file_id: fileId,
                action: 'DOCUMENT_VERSION_ADDED',
                performed_by: userId,
                details: `New version (v${newVersion}) of ${name} added`
            });
        } else {
            // Create new document
            const [doc] = await this.db('file_documents')
                .insert({
                    file_id: fileId,
                    name,
                    document_type: type
                })
                .returning('*');

            await this.db('file_document_versions').insert({
                document_id: doc.id,
                version: 1,
                storage_path: storagePath,
                size,
                uploaded_by: userId
            });

            await this.db('file_audit_trail').insert({
                file_id: fileId,
                action: 'DOCUMENT_ADDED',
                performed_by: userId,
                details: `Document ${name} added`
            });
        }

        return this.getById(fileId);
    }

    // Perform workflow action
    async performWorkflowAction(fileId, userId, action, remarks = '', ipAddress = null) {
        const updatedFile = await this.workflowEngine.executeAction(
            fileId, userId, action, remarks, ipAddress
        );
        return this.getById(updatedFile.id);
    }

    // Share file
    async shareFile(fileId, userId, shareWithUserId) {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        // Check if already shared
        const existing = await this.db('file_shares')
            .where({ file_id: fileId, shared_with: shareWithUserId })
            .first();

        if (existing) {
            return this.getById(fileId);
        }

        await this.db('file_shares').insert({
            file_id: fileId,
            shared_with: shareWithUserId,
            shared_by: userId
        });

        await this.db('file_audit_trail').insert({
            file_id: fileId,
            action: 'SHARED',
            performed_by: userId,
            details: 'File shared with user'
        });

        return this.getById(fileId);
    }

    // Toggle track
    async toggleTrack(fileId, userId) {
        const existing = await this.db('file_tracks')
            .where({ file_id: fileId, user_id: userId })
            .first();

        if (existing) {
            await this.db('file_tracks')
                .where({ file_id: fileId, user_id: userId })
                .del();
        } else {
            await this.db('file_tracks').insert({
                file_id: fileId,
                user_id: userId
            });
        }

        return this.getById(fileId);
    }

    // Get allowed actions for user
    async getAllowedActions(fileId, userId) {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        return this.workflowEngine.getAllowedActions(file, userId);
    }

    // Search files
    async search(userId, departmentId, query) {
        const { text, status, fileType, priority, dateFrom, dateTo } = query;

        let q = this.db('files')
            .select('files.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'files.department_id')
            .join('users', 'users.id', 'files.created_by');

        // Text search
        if (text) {
            q = q.where(function() {
                this.whereILike('files.file_number', `%${text}%`)
                    .orWhereILike('files.subject', `%${text}%`);
            });
        }

        // Department filter
        if (departmentId) {
            q = q.where('files.department_id', departmentId);
        }

        // Status filter
        if (status) {
            q = q.where('files.current_state', status);
        }

        // File type filter
        if (fileType) {
            q = q.where('files.file_type', fileType);
        }

        // Priority filter
        if (priority) {
            q = q.where('files.priority', priority);
        }

        // Date range
        if (dateFrom) {
            q = q.where('files.created_at', '>=', dateFrom);
        }
        if (dateTo) {
            q = q.where('files.created_at', '<=', dateTo);
        }

        return q.orderBy('files.updated_at', 'desc').limit(100);
    }

    // Get folder counts
    async getFolderCounts(userId, departmentId) {
        const counts = {};

        for (const folder of ['in-tray', 'draft', 'sent', 'cabinet', 'shared', 'tracked', 'archived']) {
            const files = await this.getByFolder(userId, departmentId, folder);
            counts[folder] = files.length;
        }

        return counts;
    }
}

module.exports = FilesService;
