// Files Service - FLM Production Core File Operations
// Strict workflow selection and department scoping

const { v4: uuidv4 } = require('uuid');
const { FILE_STATES, getRoleAuthority, LEVEL_STATUS } = require('../../config/constants');
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
        const prefix = department.file_prefix || department.code;

        // Count existing files for this department this year
        const count = await this.db('files')
            .where('department_id', departmentId)
            .whereRaw(`EXTRACT(YEAR FROM created_at) = ?`, [year])
            .count('id as count')
            .first();

        const nextNumber = (parseInt(count.count) + 1).toString().padStart(4, '0');
        return `FLM/${prefix}/${year}/${nextNumber}`;
    }


    async getWorkflowTemplate(departmentId, fileType) {
        const { WORKFLOW_SCOPE_REASONS } = require('../../config/constants');
        
        let template = null;
        let reason = '';
        let scopeReason = '';

        const dept = await this.db('departments').where({ id: departmentId }).first();
        if (!dept) {
            throw new AppError(`Department not found: ${departmentId}`, 404);
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORITY 1: Department + FileType specific workflow
        // ═══════════════════════════════════════════════════════════════
        if (fileType) {
            // Check for duplicates at this priority level
            const duplicates = await this.db('workflow_templates')
                .where({ 
                    department_id: departmentId, 
                    file_type: fileType,
                    is_active: true 
                })
                .count('id as count')
                .first();
            
            if (parseInt(duplicates.count) > 1) {
                throw new AppError(
                    `Configuration error: Multiple workflows found for "${dept.name}" + "${fileType}". ` +
                    `Admin must resolve this before files can be created.`,
                    400
                );
            }

            template = await this.db('workflow_templates')
                .where({ 
                    department_id: departmentId, 
                    file_type: fileType,
                    is_active: true 
                })
                .first();
            
            if (template) {
                reason = `Matched: ${dept.name} + ${fileType} specific workflow`;
                scopeReason = WORKFLOW_SCOPE_REASONS.DEPARTMENT_FILETYPE_MATCH;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORITY 2: Department Default (any file type)
        // ═══════════════════════════════════════════════════════════════
        if (!template) {
            // Check for duplicates - multiple department defaults
            const duplicates = await this.db('workflow_templates')
                .where({ 
                    department_id: departmentId, 
                    is_active: true 
                })
                .whereNull('file_type')
                .count('id as count')
                .first();
            
            if (parseInt(duplicates.count) > 1) {
                throw new AppError(
                    `Configuration error: Multiple default workflows found for "${dept.name}". ` +
                    `Admin must keep only one department default workflow.`,
                    400
                );
            }

            template = await this.db('workflow_templates')
                .where({ 
                    department_id: departmentId, 
                    is_active: true 
                })
                .whereNull('file_type')
                .first();
            
            if (template) {
                reason = `Using ${dept.name} department default workflow (no ${fileType || 'specific'} workflow found)`;
                scopeReason = WORKFLOW_SCOPE_REASONS.DEPARTMENT_DEFAULT;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORITY 3: Global Default (system-wide fallback)
        // ═══════════════════════════════════════════════════════════════
        if (!template) {
            // Check for multiple global defaults
            const duplicates = await this.db('workflow_templates')
                .where({ 
                    is_default: true, 
                    is_active: true 
                })
                .whereNull('department_id')
                .count('id as count')
                .first();
            
            if (parseInt(duplicates.count) > 1) {
                throw new AppError(
                    `Configuration error: Multiple global default workflows found. ` +
                    `Admin must designate exactly one global default.`,
                    400
                );
            }

            template = await this.db('workflow_templates')
                .where({ 
                    is_default: true, 
                    is_active: true 
                })
                .whereNull('department_id')
                .first();
            
            if (template) {
                reason = `Using global default workflow (no ${dept.name} specific workflow found)`;
                scopeReason = WORKFLOW_SCOPE_REASONS.GLOBAL_DEFAULT;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // ❌ NO WORKFLOW FOUND - STRICT BLOCK
        // ═══════════════════════════════════════════════════════════════
        if (!template) {
            throw new AppError(
                `NO WORKFLOW CONFIGURED\n\n` +
                `Department: "${dept.name}"\n` +
                `File Type: "${fileType || 'Any'}"\n\n` +
                `System checked (in order):\n` +
                `  1. ${dept.name} + ${fileType || 'Any'} specific workflow ❌\n` +
                `  2. ${dept.name} department default workflow ❌\n` +
                `  3. Global default workflow ❌\n\n` +
                `File creation is BLOCKED until Admin configures a workflow.`,
                400
            );
        }

        // Get levels with authority
        const levels = await this.db('workflow_template_levels')
            .where({ template_id: template.id })
            .orderBy('level');

        // Ensure levels have authority_level
        for (const level of levels) {
            if (!level.authority_level) {
                level.authority_level = getRoleAuthority(level.role);
            }
        }

        return { 
            ...template, 
            levels, 
            selectionReason: reason,
            scopeReason: scopeReason  // Enum value for storage
        };
    }

    /**
     * Get workflow preview - what workflow will be applied
     * Used by frontend before submission
     */
    async getWorkflowPreview(departmentId, fileType, userId) {
        try {
            const template = await this.getWorkflowTemplate(departmentId, fileType);
            
            // Get creator's role to show skip preview
            const userRole = await this.db('user_department_roles')
                .where({ user_id: userId, department_id: departmentId })
                .first();

            const creatorAuthority = userRole ? getRoleAuthority(userRole.role) : 0;

            // Calculate which levels will be skipped
            const levelsWithSkip = template.levels.map(level => {
                const levelAuthority = level.authority_level || getRoleAuthority(level.role);
                const willSkip = creatorAuthority >= levelAuthority;
                return {
                    ...level,
                    willSkip,
                    skipReason: willSkip 
                        ? `Your role has equal/higher authority than required`
                        : null
                };
            });

            const firstActiveLevel = levelsWithSkip.find(l => !l.willSkip)?.level || 
                                     (template.levels.length > 0 ? template.levels.length : 1);

            return {
                success: true,
                workflow: {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    selectionReason: template.selectionReason,
                    scopeReason: template.scopeReason,
                    totalLevels: template.levels.length,
                    levels: levelsWithSkip,
                    firstActiveLevel,
                    creatorRole: userRole?.role || 'Unknown',
                    creatorAuthority
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create a new file
    async create(userId, data) {
        const { departmentId, subject, fileType, priority, initialNoting } = data;

        // Get user's role in department
        const userRole = await this.db('user_department_roles')
            .where({ user_id: userId, department_id: departmentId })
            .first();

        if (!userRole) {
            throw new AppError('You do not have a role in this department', 403);
        }

        // Generate file number
        const fileNumber = await this.generateFileNumber(departmentId);

        // Get workflow template (will throw if none found)
        const template = await this.getWorkflowTemplate(departmentId, fileType);

        const creatorAuthority = getRoleAuthority(userRole.role);

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
                    max_levels: template.levels.length,
                    creator_authority_level: creatorAuthority,
                    workflow_selection_reason: template.selectionReason
                })
                .returning('*');

            // Initialize workflow instance with skip logic
            await this.workflowEngine.initializeWorkflowInstance(
                trx, 
                file, 
                template.levels, 
                userRole.role
            );

            // Add initial noting if provided
            if (initialNoting) {
                await trx('file_notings').insert({
                    file_id: file.id,
                    content: initialNoting,
                    type: 'NOTING',
                    added_by: userId
                });
            }

            // Add audit trail with scope reason for enterprise compliance
            await trx('file_audit_trail').insert({
                file_id: file.id,
                action: 'CREATED',
                performed_by: userId,
                details: `File created as draft. Workflow: ${template.name}. Scope: ${template.scopeReason}. ${template.selectionReason}`,
                metadata: JSON.stringify({
                    workflowId: template.id,
                    workflowName: template.name,
                    scopeReason: template.scopeReason,
                    selectionReason: template.selectionReason,
                    creatorRole: userRole.role,
                    creatorAuthority
                })
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
            .select(
                'files.*', 
                'departments.code as department_code', 
                'departments.name as department_name',
                'workflow_templates.name as workflow_name'
            )
            .join('departments', 'departments.id', 'files.department_id')
            .leftJoin('workflow_templates', 'workflow_templates.id', 'files.workflow_template_id')
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

        // Get workflow levels (instance-level, not template)
        const workflowLevels = await this.db('file_workflow_levels')
            .select('file_workflow_levels.*')
            .leftJoin('users', 'users.id', 'file_workflow_levels.completed_by')
            .select('users.name as completed_by_name')
            .where({ file_id: id })
            .orderBy('level', 'asc');

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
                templateName: file.workflow_name,
                selectionReason: file.workflow_selection_reason,
                currentLevel: file.current_level,
                maxLevels: file.max_levels,
                creatorAuthorityLevel: file.creator_authority_level,
                levels: workflowLevels,
                participants
            },
            auditTrail,
            sharedWith,
            trackedBy: trackedBy.map(t => t.id),
            attributeHistory
        };
    }

    // List files by folder type - UPDATED to use file_workflow_levels
    async getByFolder(userId, departmentId, folder) {
        let query = this.db('files')
            .select('files.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'files.department_id')
            .join('users', 'users.id', 'files.created_by');

        switch (folder) {
            case 'in-tray':
                // Files pending user's action based on role - using file_workflow_levels
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
                            .from('file_workflow_levels')
                            .whereRaw('file_workflow_levels.file_id = files.id')
                            .whereRaw('file_workflow_levels.level = files.current_level')
                            .where('file_workflow_levels.status', LEVEL_STATUS.ACTIVE)
                            .whereIn('file_workflow_levels.role_required', roleNames);
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

        // STRICT: Archived files are read-only
        if (file.current_state === FILE_STATES.ARCHIVED) {
            throw new AppError('Archived files are read-only', 403);
        }

        // Only creator can update, and only in DRAFT or RETURNED state
        if (file.created_by !== userId) {
            throw new AppError('Only the file creator can update the file', 403);
        }

        if (![FILE_STATES.DRAFT, FILE_STATES.RETURNED].includes(file.current_state)) {
            throw new AppError('File can only be updated in DRAFT or RETURNED state', 400);
        }

        const { subject, priority, fileType } = data;
        const updates = {};
        const oldValues = {};

        if (subject && subject !== file.subject) {
            oldValues.subject = file.subject;
            updates.subject = subject;
        }
        if (priority && priority !== file.priority) {
            oldValues.priority = file.priority;
            updates.priority = priority;
        }
        if (fileType && fileType !== file.file_type) {
            oldValues.file_type = file.file_type;
            updates.file_type = fileType;
        }

        if (Object.keys(updates).length === 0) {
            return this.getById(fileId);
        }

        updates.updated_at = new Date();

        const trx = await this.db.transaction();

        try {
            await trx('files').where({ id: fileId }).update(updates);

            // Record attribute history
            for (const [key, oldValue] of Object.entries(oldValues)) {
                await trx('file_attribute_history').insert({
                    file_id: fileId,
                    attribute_name: key,
                    old_value: String(oldValue),
                    new_value: String(updates[key]),
                    changed_by: userId
                });
            }

            // Record audit trail
            await trx('file_audit_trail').insert({
                file_id: fileId,
                action: 'UPDATED',
                performed_by: userId,
                details: `File metadata updated: ${Object.keys(updates).filter(k => k !== 'updated_at').join(', ')}`
            });

            await trx.commit();

            return this.getById(fileId);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // Add noting
    async addNoting(fileId, userId, content, type = 'NOTING') {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        // STRICT: Archived files are read-only
        if (file.current_state === FILE_STATES.ARCHIVED) {
            throw new AppError('Archived files are read-only', 403);
        }

        const [noting] = await this.db('file_notings')
            .insert({
                file_id: fileId,
                content,
                type,
                added_by: userId
            })
            .returning('*');

        // Record audit trail
        await this.db('file_audit_trail').insert({
            file_id: fileId,
            action: 'NOTING_ADDED',
            performed_by: userId,
            details: `${type} added to file`
        });

        return noting;
    }

    // Add document
    async addDocument(fileId, userId, documentData) {
        const file = await this.db('files').where({ id: fileId }).first();
        if (!file) {
            throw new AppError('File not found', 404);
        }

        // STRICT: Archived files are read-only
        if (file.current_state === FILE_STATES.ARCHIVED) {
            throw new AppError('Archived files are read-only', 403);
        }

        const { name, type, filePath, fileSize, mimeType, description } = documentData;

        const trx = await this.db.transaction();

        try {
            // Create document
            const [document] = await trx('file_documents')
                .insert({
                    file_id: fileId,
                    name,
                    type: type || 'NORMAL',
                    current_version: 1
                })
                .returning('*');

            // Create first version
            await trx('file_document_versions').insert({
                document_id: document.id,
                version: 1,
                file_path: filePath,
                file_size: fileSize,
                mime_type: mimeType,
                uploaded_by: userId,
                description: description || 'Initial upload'
            });

            // Record audit trail
            await trx('file_audit_trail').insert({
                file_id: fileId,
                action: 'DOCUMENT_ADDED',
                performed_by: userId,
                details: `Document "${name}" added to file`
            });

            await trx.commit();

            return document;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // Perform workflow action
    async performWorkflowAction(fileId, userId, action, remarks = '', ipAddress = null) {
        return this.workflowEngine.executeAction(fileId, userId, action, remarks, ipAddress);
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
            throw new AppError('File already shared with this user', 400);
        }

        await this.db('file_shares').insert({
            file_id: fileId,
            shared_by: userId,
            shared_with: shareWithUserId
        });

        // Record audit trail
        const sharedWithUser = await this.db('users')
            .select('name')
            .where({ id: shareWithUserId })
            .first();

        await this.db('file_audit_trail').insert({
            file_id: fileId,
            action: 'SHARED',
            performed_by: userId,
            details: `File shared with ${sharedWithUser?.name || 'user'}`
        });

        return { success: true };
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
            return { tracked: false };
        } else {
            await this.db('file_tracks').insert({
                file_id: fileId,
                user_id: userId
            });
            return { tracked: true };
        }
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
        const { searchTerm, fileType, status, priority, dateFrom, dateTo } = query;

        let dbQuery = this.db('files')
            .select('files.*', 'departments.code as department_code', 'users.name as created_by_name')
            .join('departments', 'departments.id', 'files.department_id')
            .join('users', 'users.id', 'files.created_by')
            .where('files.department_id', departmentId);

        if (searchTerm) {
            dbQuery = dbQuery.where(function() {
                this.where('files.file_number', 'ilike', `%${searchTerm}%`)
                    .orWhere('files.subject', 'ilike', `%${searchTerm}%`);
            });
        }

        if (fileType) dbQuery = dbQuery.where('files.file_type', fileType);
        if (status) dbQuery = dbQuery.where('files.current_state', status);
        if (priority) dbQuery = dbQuery.where('files.priority', priority);
        if (dateFrom) dbQuery = dbQuery.where('files.created_at', '>=', dateFrom);
        if (dateTo) dbQuery = dbQuery.where('files.created_at', '<=', dateTo);

        return dbQuery.orderBy('files.updated_at', 'desc').limit(100);
    }

    // Get folder counts
    async getFolderCounts(userId, departmentId) {
        const counts = {};

        // Get user's roles
        const userRoles = await this.db('user_department_roles')
            .where({ user_id: userId, department_id: departmentId });
        const roleNames = userRoles.map(r => r.role);

        // In-Tray: Files pending user's action (using file_workflow_levels)
        if (roleNames.length > 0) {
            const inTrayCount = await this.db('files')
                .where('department_id', departmentId)
                .where('current_state', FILE_STATES.IN_REVIEW)
                .whereExists(function() {
                    this.select('*')
                        .from('file_workflow_levels')
                        .whereRaw('file_workflow_levels.file_id = files.id')
                        .whereRaw('file_workflow_levels.level = files.current_level')
                        .where('file_workflow_levels.status', LEVEL_STATUS.ACTIVE)
                        .whereIn('file_workflow_levels.role_required', roleNames);
                })
                .count('id as count')
                .first();
            counts['in-tray'] = parseInt(inTrayCount.count);
        } else {
            counts['in-tray'] = 0;
        }

        // Draft
        const draftCount = await this.db('files')
            .where({ created_by: userId, current_state: FILE_STATES.DRAFT })
            .count('id as count')
            .first();
        counts['draft'] = parseInt(draftCount.count);

        // Sent
        const sentCount = await this.db('files')
            .where({ created_by: userId })
            .whereNot('current_state', FILE_STATES.DRAFT)
            .whereNot('current_state', FILE_STATES.ARCHIVED)
            .count('id as count')
            .first();
        counts['sent'] = parseInt(sentCount.count);

        // Cabinet
        const cabinetCount = await this.db('files')
            .where({ department_id: departmentId, current_state: FILE_STATES.CABINET })
            .count('id as count')
            .first();
        counts['cabinet'] = parseInt(cabinetCount.count);

        // Shared
        const sharedCount = await this.db('file_shares')
            .where({ shared_with: userId })
            .count('id as count')
            .first();
        counts['shared'] = parseInt(sharedCount.count);

        // Tracked
        const trackedCount = await this.db('file_tracks')
            .where({ user_id: userId })
            .count('id as count')
            .first();
        counts['tracked'] = parseInt(trackedCount.count);

        // Archived
        const archivedCount = await this.db('files')
            .where({ department_id: departmentId, current_state: FILE_STATES.ARCHIVED })
            .count('id as count')
            .first();
        counts['archived'] = parseInt(archivedCount.count);

        return counts;
    }
}

module.exports = FilesService;
