// Admin Service - Workflow templates and system management
const { AppError } = require('../../middleware/errorHandler');

class AdminService {
    constructor(db) {
        this.db = db;
    }

    // Workflow Templates
    async getAllWorkflowTemplates() {
        const templates = await this.db('workflow_templates')
            .select('workflow_templates.*', 'departments.code as department_code', 'departments.name as department_name')
            .leftJoin('departments', 'departments.id', 'workflow_templates.department_id')
            .orderBy('workflow_templates.name');

        for (const template of templates) {
            template.levels = await this.db('workflow_template_levels')
                .where({ template_id: template.id })
                .orderBy('level');
        }

        return templates;
    }

    async getWorkflowTemplateById(id) {
        const template = await this.db('workflow_templates')
            .select('workflow_templates.*', 'departments.code as department_code', 'departments.name as department_name')
            .leftJoin('departments', 'departments.id', 'workflow_templates.department_id')
            .where('workflow_templates.id', id)
            .first();

        if (!template) {
            throw new AppError('Workflow template not found', 404);
        }

        template.levels = await this.db('workflow_template_levels')
            .where({ template_id: template.id })
            .orderBy('level');

        return template;
    }

    async createWorkflowTemplate(data) {
        const { name, description, departmentId, isDefault, maxLevels, levels } = data;

        const trx = await this.db.transaction();

        try {
            const insertData = {
                name,
                is_default: isDefault || false,
                is_active: true
            };
            
            // Only add optional fields if provided
            if (description) insertData.description = description;
            if (departmentId) insertData.department_id = departmentId;
            if (maxLevels) insertData.max_levels = maxLevels;
            
            const [template] = await trx('workflow_templates')
                .insert(insertData)
                .returning('*');

            if (levels && levels.length > 0) {
                const levelRecords = levels.map((level, index) => ({
                    template_id: template.id,
                    level: level.level || index + 1,
                    role: level.role || level.roleRequired,
                    description: level.description || null
                }));
                await trx('workflow_template_levels').insert(levelRecords);
            }

            await trx.commit();
            return this.getWorkflowTemplateById(template.id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    async updateWorkflowTemplate(id, data) {
        const { name, description, departmentId, isDefault, isActive, maxLevels, levels } = data;

        const template = await this.db('workflow_templates').where({ id }).first();
        if (!template) {
            throw new AppError('Workflow template not found', 404);
        }

        const trx = await this.db.transaction();

        try {
            const updates = {};
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (departmentId !== undefined) updates.department_id = departmentId;
            if (isDefault !== undefined) updates.is_default = isDefault;
            if (isActive !== undefined) updates.is_active = isActive;
            if (maxLevels !== undefined) updates.max_levels = maxLevels;
            updates.updated_at = new Date();

            await trx('workflow_templates').where({ id }).update(updates);

            if (levels) {
                await trx('workflow_template_levels').where({ template_id: id }).del();
                const levelRecords = levels.map((level, index) => ({
                    template_id: id,
                    level: level.level || index + 1,
                    role: level.role || level.roleRequired,
                    description: level.description || null
                }));
                await trx('workflow_template_levels').insert(levelRecords);
            }

            await trx.commit();
            return this.getWorkflowTemplateById(id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // System Audit
    async getSystemAuditLog(filters = {}) {
        const { type, userId, fileId, daakId, dateFrom, dateTo, limit = 100 } = filters;

        let results = [];

        // Get file audit if requested or no specific type
        if (!type || type === 'file') {
            let fileQuery = this.db('file_audit_trail')
                .select(
                    'file_audit_trail.id',
                    'file_audit_trail.action',
                    'file_audit_trail.performed_at',
                    'file_audit_trail.details',
                    'file_audit_trail.ip_address',
                    'users.name as performed_by_name',
                    'files.file_number',
                    this.db.raw("'file' as entity_type")
                )
                .join('users', 'users.id', 'file_audit_trail.performed_by')
                .join('files', 'files.id', 'file_audit_trail.file_id');

            if (userId) fileQuery = fileQuery.where('file_audit_trail.performed_by', userId);
            if (fileId) fileQuery = fileQuery.where('file_audit_trail.file_id', fileId);
            if (dateFrom) fileQuery = fileQuery.where('file_audit_trail.performed_at', '>=', dateFrom);
            if (dateTo) fileQuery = fileQuery.where('file_audit_trail.performed_at', '<=', dateTo);

            const fileAudit = await fileQuery.orderBy('file_audit_trail.performed_at', 'desc').limit(limit);
            results = [...results, ...fileAudit];
        }

        // Get daak audit if requested or no specific type
        if (!type || type === 'daak') {
            let daakQuery = this.db('daak_audit_trail')
                .select(
                    'daak_audit_trail.id',
                    'daak_audit_trail.action',
                    'daak_audit_trail.performed_at',
                    'daak_audit_trail.details',
                    this.db.raw('NULL as ip_address'),
                    'users.name as performed_by_name',
                    'daak.daak_number as file_number',
                    this.db.raw("'daak' as entity_type")
                )
                .join('users', 'users.id', 'daak_audit_trail.performed_by')
                .join('daak', 'daak.id', 'daak_audit_trail.daak_id');

            if (userId) daakQuery = daakQuery.where('daak_audit_trail.performed_by', userId);
            if (daakId) daakQuery = daakQuery.where('daak_audit_trail.daak_id', daakId);
            if (dateFrom) daakQuery = daakQuery.where('daak_audit_trail.performed_at', '>=', dateFrom);
            if (dateTo) daakQuery = daakQuery.where('daak_audit_trail.performed_at', '<=', dateTo);

            const daakAudit = await daakQuery.orderBy('daak_audit_trail.performed_at', 'desc').limit(limit);
            results = [...results, ...daakAudit];
        }

        // Sort combined results by date
        results.sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));

        return results.slice(0, limit);
    }

    // Dashboard stats
    async getDashboardStats() {
        const [userCount] = await this.db('users').count('id as count');
        const [activeUserCount] = await this.db('users').where({ is_active: true }).count('id as count');
        const [departmentCount] = await this.db('departments').where({ is_active: true }).count('id as count');
        const [fileCount] = await this.db('files').count('id as count');
        const [daakCount] = await this.db('daak').count('id as count');

        const filesByState = await this.db('files')
            .select('current_state')
            .count('id as count')
            .groupBy('current_state');

        const daaksByType = await this.db('daak')
            .select('type')
            .count('id as count')
            .groupBy('type');

        return {
            users: {
                total: parseInt(userCount.count),
                active: parseInt(activeUserCount.count)
            },
            departments: parseInt(departmentCount.count),
            files: {
                total: parseInt(fileCount.count),
                byState: filesByState.reduce((acc, row) => {
                    acc[row.current_state] = parseInt(row.count);
                    return acc;
                }, {})
            },
            daak: {
                total: parseInt(daakCount.count),
                byType: daaksByType.reduce((acc, row) => {
                    acc[row.type] = parseInt(row.count);
                    return acc;
                }, {})
            }
        };
    }
}

module.exports = AdminService;
