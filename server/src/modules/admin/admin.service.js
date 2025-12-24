// Admin Service - FLM Production with AUTO-DEFAULT Logic
// Implements SAP-grade workflow management rules
// DEFAULT IS SYSTEM-CONTROLLED, NOT ADMIN-CONTROLLED

const { AppError } = require('../../middleware/errorHandler');
const { getRoleAuthority, ROLE_LABELS } = require('../../config/constants');

class AdminService {
    constructor(db) {
        this.db = db;
    }

    // ═══════════════════════════════════════════════════════════════
    // AUTO-DEFAULT LOGIC (SYSTEM-CONTROLLED)
    // ═══════════════════════════════════════════════════════════════

    /**
     * AUTO-DETERMINE if workflow should be marked as default
     * Based ONLY on scope - Admin never controls this
     * 
     * Rules:
     * - Department + FileType selected → NOT default (specific/highest priority)
     * - Only Department selected → DEPARTMENT DEFAULT (one per dept)
     * - Neither selected → GLOBAL DEFAULT (only one allowed)
     */
    deriveIsDefault(departmentId, fileType) {
        // If both department and file type are specified → NOT default (specific workflow)
        if (departmentId && fileType) {
            return false;
        }
        
        // If only department (no file type) → Department Default
        // If neither (no department, no file type) → Global Default
        // These are automatically "default" for their scope
        return true;
    }

    /**
     * Get human-readable scope description
     */
    getScopeDescription(departmentId, fileType, deptName = null) {
        if (departmentId && fileType) {
            return `${deptName || 'Department'} + ${fileType}`;
        } else if (departmentId && !fileType) {
            return `${deptName || 'Department'} Default`;
        } else if (!departmentId && fileType) {
            return `${fileType} (Any Department)`;
        } else {
            return 'Global Default';
        }
    }

    /**
     * Determine workflow type for UI display
     */
    getWorkflowType(departmentId, fileType) {
        if (departmentId && fileType) {
            return 'SPECIFIC';  // Highest priority - specific scope
        } else if (departmentId && !fileType) {
            return 'DEPARTMENT_DEFAULT';  // Default for this department
        } else if (!departmentId && fileType) {
            return 'FILETYPE_DEFAULT';  // Default for this file type
        } else {
            return 'GLOBAL_DEFAULT';  // Fallback for everything
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION HELPERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * RULE: ONE WORKFLOW PER SCOPE
     * For (department, file_type) combination, only ONE active workflow allowed
     */
    async validateUniqueScope(departmentId, fileType, excludeId = null) {
        let query = this.db('workflow_templates')
            .where({ is_active: true });

        if (departmentId) {
            query = query.where('department_id', departmentId);
        } else {
            query = query.whereNull('department_id');
        }

        if (fileType) {
            query = query.where('file_type', fileType);
        } else {
            query = query.whereNull('file_type');
        }

        if (excludeId) {
            query = query.whereNot('id', excludeId);
        }

        const existing = await query.first();

        if (existing) {
            const dept = departmentId 
                ? await this.db('departments').where({ id: departmentId }).first()
                : null;
            const scope = this.getScopeDescription(departmentId, fileType, dept?.name);

            throw new AppError(
                `${existing.name} (${scope}) workflow already exists.`,
                400
            );
        }
    }

    /**
     * RULE: WORKFLOW COMPLETENESS VALIDATION
     */
    async validateWorkflowCompleteness(levels, departmentId, isActive = true) {
        if (!isActive) return;
        
        if (!levels || levels.length === 0) {
            throw new AppError(
                'Workflow must have at least one approval level.',
                400
            );
        }

        const errors = [];

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const levelNum = i + 1;
            const role = level.role || level.roleRequired;

            if (!role) {
                errors.push(`Level ${levelNum}: No role assigned.`);
                continue;
            }

            // If department specific, check if role has users
            if (departmentId) {
                const userCount = await this.db('user_department_roles')
                    .where({ department_id: departmentId, role: role })
                    .count('id as count')
                    .first();

                if (parseInt(userCount.count) === 0) {
                    const roleLabel = ROLE_LABELS[role] || role;
                    const dept = await this.db('departments').where({ id: departmentId }).first();
                    errors.push(
                        `Level ${levelNum} (${roleLabel}): No user assigned for this role in ${dept?.name || 'department'}.`
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new AppError(
                `Workflow cannot be activated:\n${errors.join('\n')}`,
                400
            );
        }
    }

    /**
     * RULE: PROTECTED DEFAULT WORKFLOWS
     * Default workflows cannot be deleted or deactivated
     */
    validateDefaultProtection(template, action) {
        const workflowType = this.getWorkflowType(template.department_id, template.file_type);
        
        if (workflowType === 'GLOBAL_DEFAULT' || workflowType === 'DEPARTMENT_DEFAULT') {
            if (action === 'DELETE') {
                throw new AppError(
                    `Cannot delete "${template.name}": This is a ${workflowType.replace('_', ' ')}. ` +
                    `Default workflows are system-protected. ` +
                    `You may edit it or create a more specific workflow.`,
                    400
                );
            }
            if (action === 'DEACTIVATE') {
                throw new AppError(
                    `Cannot deactivate "${template.name}": This is a ${workflowType.replace('_', ' ')}. ` +
                    `Default workflows must remain active to ensure file routing. ` +
                    `You may edit it or create a more specific workflow to override it.`,
                    400
                );
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKFLOW TEMPLATE CRUD
    // ═══════════════════════════════════════════════════════════════

    async getAllWorkflowTemplates() {
        const templates = await this.db('workflow_templates')
            .select('workflow_templates.*', 'departments.code as department_code', 'departments.name as department_name')
            .leftJoin('departments', 'departments.id', 'workflow_templates.department_id')
            .orderBy([
                { column: 'workflow_templates.is_active', order: 'desc' },
                { column: 'workflow_templates.is_default', order: 'desc' },
                { column: 'workflow_templates.name', order: 'asc' }
            ]);

        for (const template of templates) {
            template.levels = await this.db('workflow_template_levels')
                .where({ template_id: template.id })
                .orderBy('level');
            
            // Add workflow type for UI
            template.workflow_type = this.getWorkflowType(template.department_id, template.file_type);
            template.scope_description = this.getScopeDescription(
                template.department_id, 
                template.file_type, 
                template.department_name
            );
            
            // Add user count for each level if department specific
            if (template.department_id) {
                for (const level of template.levels) {
                    const userCount = await this.db('user_department_roles')
                        .where({ department_id: template.department_id, role: level.role })
                        .count('id as count')
                        .first();
                    level.userCount = parseInt(userCount.count);
                }
            }
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

        template.workflow_type = this.getWorkflowType(template.department_id, template.file_type);
        template.scope_description = this.getScopeDescription(
            template.department_id, 
            template.file_type, 
            template.department_name
        );

        if (template.department_id) {
            for (const level of template.levels) {
                const userCount = await this.db('user_department_roles')
                    .where({ department_id: template.department_id, role: level.role })
                    .count('id as count')
                    .first();
                level.userCount = parseInt(userCount.count);
            }
        }

        return template;
    }

    async createWorkflowTemplate(data) {
        // IMPORTANT: Ignore any incoming isDefault - we derive it automatically
        const { name, description, departmentId, fileType, maxLevels, levels, isActive = true } = data;

        // AUTO-DERIVE is_default based on scope (ADMIN CANNOT CONTROL THIS)
        const isDefault = this.deriveIsDefault(departmentId, fileType);
        const workflowType = this.getWorkflowType(departmentId, fileType);

        // ═══════════════════════════════════════════════════════════
        // STRICT VALIDATIONS
        // ═══════════════════════════════════════════════════════════
        
        // Validate unique scope
        if (isActive) {
            await this.validateUniqueScope(departmentId, fileType);
        }

        // Validate completeness
        await this.validateWorkflowCompleteness(levels, departmentId, isActive);

        // ═══════════════════════════════════════════════════════════
        // CREATE WORKFLOW
        // ═══════════════════════════════════════════════════════════

        const trx = await this.db.transaction();

        try {
            const insertData = {
                name,
                is_default: isDefault,  // AUTO-DERIVED, not from payload
                is_active: isActive
            };
            
            if (description) insertData.description = description;
            if (departmentId) insertData.department_id = departmentId;
            if (fileType) insertData.file_type = fileType;
            if (maxLevels) insertData.max_levels = maxLevels;
            
            const [template] = await trx('workflow_templates')
                .insert(insertData)
                .returning('*');

            if (levels && levels.length > 0) {
                const levelRecords = levels.map((level, index) => {
                    const role = level.role || level.roleRequired;
                    return {
                        template_id: template.id,
                        level: level.level || index + 1,
                        role: role,
                        authority_level: getRoleAuthority(role),
                        description: level.description || null
                    };
                });
                await trx('workflow_template_levels').insert(levelRecords);
            }

            await trx.commit();
            
            // Return with additional info
            const result = await this.getWorkflowTemplateById(template.id);
            result._autoDefaultInfo = {
                wasAutoDefault: isDefault,
                reason: isDefault 
                    ? `Auto-classified as ${workflowType} based on scope`
                    : 'Specific workflow (not default)'
            };
            
            return result;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    async updateWorkflowTemplate(id, data) {
        // IMPORTANT: Ignore any incoming isDefault - we derive it automatically
        const { name, description, departmentId, fileType, isActive, maxLevels, levels } = data;

        const template = await this.db('workflow_templates').where({ id }).first();
        if (!template) {
            throw new AppError('Workflow template not found', 404);
        }

        // ═══════════════════════════════════════════════════════════
        // PROTECTED DEFAULT CHECK
        // ═══════════════════════════════════════════════════════════
        
        // If trying to deactivate a default workflow, block
        if (isActive === false && template.is_active === true) {
            this.validateDefaultProtection(template, 'DEACTIVATE');
        }

        // ═══════════════════════════════════════════════════════════
        // CALCULATE NEW VALUES
        // ═══════════════════════════════════════════════════════════

        const newDeptId = departmentId !== undefined ? (departmentId || null) : template.department_id;
        const newFileType = fileType !== undefined ? (fileType || null) : template.file_type;
        const newIsActive = isActive !== undefined ? isActive : template.is_active;

        // AUTO-DERIVE is_default based on new scope
        const newIsDefault = this.deriveIsDefault(newDeptId, newFileType);

        // ═══════════════════════════════════════════════════════════
        // VALIDATIONS
        // ═══════════════════════════════════════════════════════════

        // Validate unique scope if activating or changing scope
        if (newIsActive) {
            const scopeChanged = newDeptId !== template.department_id || newFileType !== template.file_type;
            const activating = !template.is_active && newIsActive;
            
            if (scopeChanged || activating) {
                await this.validateUniqueScope(newDeptId, newFileType, id);
            }
        }

        // Validate completeness if activating
        const newLevels = levels || template.levels;
        if (newIsActive) {
            await this.validateWorkflowCompleteness(newLevels, newDeptId, true);
        }

        // ═══════════════════════════════════════════════════════════
        // UPDATE WORKFLOW
        // ═══════════════════════════════════════════════════════════

        const trx = await this.db.transaction();

        try {
            const updates = {
                is_default: newIsDefault,  // AUTO-DERIVED
                updated_at: new Date()
            };
            
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (departmentId !== undefined) updates.department_id = departmentId || null;
            if (fileType !== undefined) updates.file_type = fileType || null;
            if (isActive !== undefined) updates.is_active = isActive;
            if (maxLevels !== undefined) updates.max_levels = maxLevels;

            await trx('workflow_templates').where({ id }).update(updates);

            if (levels) {
                await trx('workflow_template_levels').where({ template_id: id }).del();
                const levelRecords = levels.map((level, index) => {
                    const role = level.role || level.roleRequired;
                    return {
                        template_id: id,
                        level: level.level || index + 1,
                        role: role,
                        authority_level: getRoleAuthority(role),
                        description: level.description || null
                    };
                });
                await trx('workflow_template_levels').insert(levelRecords);
            }

            await trx.commit();
            return this.getWorkflowTemplateById(id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    async deleteWorkflowTemplate(id) {
        const template = await this.db('workflow_templates').where({ id }).first();
        if (!template) {
            throw new AppError('Workflow template not found', 404);
        }

        // PROTECTED DEFAULT CHECK
        this.validateDefaultProtection(template, 'DELETE');

        // Check if workflow is in use by any files
        const filesUsingWorkflow = await this.db('files')
            .where({ workflow_template_id: id })
            .count('id as count')
            .first();

        if (parseInt(filesUsingWorkflow.count) > 0) {
            throw new AppError(
                `Cannot delete workflow "${template.name}": ${filesUsingWorkflow.count} file(s) are using this workflow. ` +
                `Existing files continue with their original workflow.`,
                400
            );
        }

        await this.db('workflow_template_levels').where({ template_id: id }).del();
        await this.db('workflow_templates').where({ id }).del();

        return true;
    }

    /**
     * Toggle workflow active status with validation
     */
    async toggleWorkflowActive(id, isActive) {
        const template = await this.getWorkflowTemplateById(id);

        // Cannot deactivate default workflows
        if (!isActive) {
            this.validateDefaultProtection(template, 'DEACTIVATE');
        }

        if (isActive) {
            await this.validateUniqueScope(template.department_id, template.file_type, id);
            await this.validateWorkflowCompleteness(template.levels, template.department_id, true);
        }

        await this.db('workflow_templates')
            .where({ id })
            .update({ is_active: isActive, updated_at: new Date() });

        return this.getWorkflowTemplateById(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM AUDIT
    // ═══════════════════════════════════════════════════════════════

    async getSystemAuditLog(filters = {}) {
        const { type, userId, fileId, daakId, dateFrom, dateTo, limit = 100 } = filters;
        let results = [];

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

        results.sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
        return results.slice(0, limit);
    }

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════

    async getDashboardStats() {
        const [userCount] = await this.db('users').count('id as count');
        const [activeUserCount] = await this.db('users').where({ is_active: true }).count('id as count');
        const [departmentCount] = await this.db('departments').where({ is_active: true }).count('id as count');
        const [fileCount] = await this.db('files').count('id as count');
        const [daakCount] = await this.db('daak').count('id as count');
        const [workflowCount] = await this.db('workflow_templates').where({ is_active: true }).count('id as count');

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
            workflows: parseInt(workflowCount.count),
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
