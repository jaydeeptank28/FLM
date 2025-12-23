// Workflow Engine - FLM Production State Machine
// Strict enforcement of workflow rules, department scoping, and skip logic

const { 
    FILE_STATES, 
    WORKFLOW_ACTIONS, 
    STATE_TRANSITIONS,
    LEVEL_STATUS,
    ROLE_LABELS,
    getRoleAuthority,
    hasHigherOrEqualAuthority
} = require('../../config/constants');
const { AppError } = require('../../middleware/errorHandler');

class WorkflowEngine {
    constructor(db) {
        this.db = db;
    }

    /**
     * Initialize workflow instance for a file
     * Creates per-file workflow levels with skip logic applied
     */
    async initializeWorkflowInstance(trx, file, templateLevels, creatorRole) {
        const creatorAuthority = getRoleAuthority(creatorRole);
        const workflowLevels = [];
        let firstActiveLevel = null;

        for (const templateLevel of templateLevels) {
            const levelAuthority = templateLevel.authority_level || getRoleAuthority(templateLevel.role);
            const shouldSkip = creatorAuthority >= levelAuthority;

            const levelData = {
                file_id: file.id,
                level: templateLevel.level,
                role_required: templateLevel.role,
                authority_required: levelAuthority,
                status: shouldSkip ? LEVEL_STATUS.SKIPPED : LEVEL_STATUS.PENDING,
                skipped_reason: shouldSkip 
                    ? `Creator has ${creatorRole} (authority ${creatorAuthority}) >= required ${templateLevel.role} (authority ${levelAuthority})`
                    : null
            };

            // Find first non-skipped level
            if (!shouldSkip && !firstActiveLevel) {
                firstActiveLevel = templateLevel.level;
                levelData.status = LEVEL_STATUS.PENDING; // Will be set to ACTIVE on submit
            }

            workflowLevels.push(levelData);
        }

        // Insert all levels
        if (workflowLevels.length > 0) {
            await trx('file_workflow_levels').insert(workflowLevels);
        }

        // Record skipped levels in audit trail
        const skippedLevels = workflowLevels.filter(l => l.status === LEVEL_STATUS.SKIPPED);
        for (const skipped of skippedLevels) {
            await trx('file_audit_trail').insert({
                file_id: file.id,
                action: 'LEVEL_SKIPPED',
                performed_by: file.created_by,
                details: `Level ${skipped.level} (${skipped.role_required}) skipped: ${skipped.skipped_reason}`,
                metadata: JSON.stringify({
                    level: skipped.level,
                    roleRequired: skipped.role_required,
                    reason: skipped.skipped_reason
                })
            });
        }

        return { workflowLevels, firstActiveLevel };
    }

    /**
     * Get the first active (non-skipped) level for a file
     */
    async getFirstActiveLevel(fileId) {
        const level = await this.db('file_workflow_levels')
            .where({ file_id: fileId })
            .whereNot({ status: LEVEL_STATUS.SKIPPED })
            .orderBy('level', 'asc')
            .first();
        return level ? level.level : 1;
    }

    /**
     * Get current workflow level info for a file
     */
    async getCurrentLevelInfo(fileId, currentLevel) {
        return await this.db('file_workflow_levels')
            .where({ file_id: fileId, level: currentLevel })
            .first();
    }

    /**
     * Validate if action is allowed for current state
     */
    isActionAllowed(currentState, action) {
        const allowedActions = STATE_TRANSITIONS[currentState] || [];
        return allowedActions.includes(action);
    }

    /**
     * Get the next state based on action
     */
    async getNextState(file, action) {
        switch (action) {
            case WORKFLOW_ACTIONS.SUBMIT: {
                // Get first non-skipped level
                const firstLevel = await this.getFirstActiveLevel(file.id);
                return { state: FILE_STATES.IN_REVIEW, level: firstLevel };
            }

            case WORKFLOW_ACTIONS.APPROVE: {
                // Find next non-skipped level
                const nextLevel = await this.db('file_workflow_levels')
                    .where({ file_id: file.id })
                    .where('level', '>', file.current_level)
                    .whereNot({ status: LEVEL_STATUS.SKIPPED })
                    .orderBy('level', 'asc')
                    .first();

                if (!nextLevel) {
                    // No more levels - file is approved
                    return { state: FILE_STATES.APPROVED, level: file.current_level };
                }
                return { state: FILE_STATES.IN_REVIEW, level: nextLevel.level };
            }

            case WORKFLOW_ACTIONS.RETURN:
                return { state: FILE_STATES.RETURNED, level: file.current_level };

            case WORKFLOW_ACTIONS.RESUBMIT:
                return { state: FILE_STATES.IN_REVIEW, level: file.current_level };

            case WORKFLOW_ACTIONS.HOLD:
                return { state: FILE_STATES.CABINET, level: file.current_level };

            case WORKFLOW_ACTIONS.RESUME:
                return { state: FILE_STATES.IN_REVIEW, level: file.current_level };

            case WORKFLOW_ACTIONS.REJECT:
                return { state: FILE_STATES.REJECTED, level: file.current_level };

            case WORKFLOW_ACTIONS.ARCHIVE:
                return { state: FILE_STATES.ARCHIVED, level: file.current_level };

            default:
                throw new AppError(`Unknown action: ${action}`, 400);
        }
    }

    /**
     * Execute workflow action with strict validation
     * Enforces: department scoping, role matching, state machine
     */
    async executeAction(fileId, userId, action, remarks = '', ipAddress = null) {
        const trx = await this.db.transaction();

        try {
            // Get file with lock
            const file = await trx('files')
                .where({ id: fileId })
                .forUpdate()
                .first();

            if (!file) {
                throw new AppError('File not found', 404);
            }

            // STRICT: Archived files are read-only
            if (file.current_state === FILE_STATES.ARCHIVED) {
                throw new AppError('Archived files are read-only', 403);
            }

            // Validate action is allowed for current state
            if (!this.isActionAllowed(file.current_state, action)) {
                throw new AppError(
                    `Action "${action}" is not allowed in state "${file.current_state}"`,
                    400
                );
            }

            // Get user's role in THIS file's department (strict department scoping)
            const userRole = await trx('user_department_roles')
                .where({
                    user_id: userId,
                    department_id: file.department_id
                })
                .first();

            // STRICT: User must have a role in the file's department
            if (!userRole && action !== WORKFLOW_ACTIONS.ARCHIVE) {
                throw new AppError(
                    'You do not have any role in this file\'s department. Cross-department actions are not allowed.',
                    403
                );
            }

            // Get current level config from file's workflow instance
            const currentLevelConfig = await trx('file_workflow_levels')
                .where({
                    file_id: fileId,
                    level: file.current_level
                })
                .first();

            const isCreator = file.created_by === userId;
            const isAdmin = userRole?.role === 'Admin';
            const hasRoleForLevel = userRole && currentLevelConfig && 
                                    userRole.role === currentLevelConfig.role_required;

            // Authorization based on action type
            if (action === WORKFLOW_ACTIONS.SUBMIT || action === WORKFLOW_ACTIONS.RESUBMIT) {
                if (!isCreator) {
                    throw new AppError('Only the file creator can submit/resubmit', 403);
                }
            } else if (action === WORKFLOW_ACTIONS.SAVE_DRAFT) {
                if (!isCreator) {
                    throw new AppError('Only the file creator can save draft', 403);
                }
            } else if (action === WORKFLOW_ACTIONS.ARCHIVE) {
                // Archive: creator or Admin only
                if (!isCreator && !isAdmin) {
                    throw new AppError('Only the file creator or Admin can archive', 403);
                }
            } else {
                // Approval actions (APPROVE, RETURN, HOLD, RESUME, REJECT)
                // STRICT: Must have exact role for current level
                if (!hasRoleForLevel) {
                    const expectedRole = currentLevelConfig?.role_required || 'unknown';
                    const expectedRoleLabel = ROLE_LABELS[expectedRole] || expectedRole;
                    const userRoleName = userRole?.role || 'No role';
                    const userRoleLabel = ROLE_LABELS[userRoleName] || userRoleName;
                    throw new AppError(
                        `Access denied. Level ${file.current_level} requires "${expectedRoleLabel}" role. ` +
                        `Your role in this department: "${userRoleLabel}". ` +
                        `The file must be processed by a user with the correct role.`,
                        403
                    );
                }
            }

            // Calculate next state
            const { state: newState, level: newLevel } = await this.getNextState(file, action);

            // Update file state
            await trx('files')
                .where({ id: fileId })
                .update({
                    current_state: newState,
                    current_level: newLevel,
                    updated_at: new Date()
                });

            // Update workflow level status
            if (currentLevelConfig && file.current_level > 0) {
                if (action === WORKFLOW_ACTIONS.APPROVE) {
                    await trx('file_workflow_levels')
                        .where({ file_id: fileId, level: file.current_level })
                        .update({
                            status: LEVEL_STATUS.COMPLETED,
                            completed_by: userId,
                            completed_at: new Date(),
                            remarks: remarks,
                            updated_at: new Date()
                        });
                } else if (action === WORKFLOW_ACTIONS.RETURN) {
                    await trx('file_workflow_levels')
                        .where({ file_id: fileId, level: file.current_level })
                        .update({
                            status: LEVEL_STATUS.RETURNED,
                            remarks: remarks,
                            updated_at: new Date()
                        });
                }
            }

            // Set next level as ACTIVE
            if (newState === FILE_STATES.IN_REVIEW && newLevel !== file.current_level) {
                await trx('file_workflow_levels')
                    .where({ file_id: fileId, level: newLevel })
                    .update({
                        status: LEVEL_STATUS.ACTIVE,
                        updated_at: new Date()
                    });
            }

            // On SUBMIT, set first level as ACTIVE
            if (action === WORKFLOW_ACTIONS.SUBMIT) {
                await trx('file_workflow_levels')
                    .where({ file_id: fileId, level: newLevel })
                    .update({
                        status: LEVEL_STATUS.ACTIVE,
                        updated_at: new Date()
                    });
            }

            // Record workflow participant
            if ([WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.RETURN, WORKFLOW_ACTIONS.REJECT,
                 WORKFLOW_ACTIONS.HOLD, WORKFLOW_ACTIONS.RESUME].includes(action)) {
                await trx('file_workflow_participants').insert({
                    file_id: fileId,
                    level: file.current_level,
                    role: userRole?.role || 'Unknown',
                    department_id: file.department_id,
                    action: action,
                    action_by: userId,
                    action_at: new Date(),
                    remarks: remarks
                });
            }

            // Record audit trail
            await trx('file_audit_trail').insert({
                file_id: fileId,
                action: action,
                performed_by: userId,
                performed_at: new Date(),
                details: this.getAuditDetails(action, file.current_level, newLevel, remarks),
                metadata: JSON.stringify({
                    fromState: file.current_state,
                    toState: newState,
                    fromLevel: file.current_level,
                    toLevel: newLevel,
                    performedBy: userRole?.role || 'Creator'
                }),
                ip_address: ipAddress
            });

            await trx.commit();

            // Return updated file
            return this.db('files').where({ id: fileId }).first();
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Get audit trail details for an action
     */
    getAuditDetails(action, fromLevel, toLevel, remarks) {
        const details = {
            [WORKFLOW_ACTIONS.SAVE_DRAFT]: 'File saved as draft',
            [WORKFLOW_ACTIONS.SUBMIT]: `File submitted, moved to Level ${toLevel} approval`,
            [WORKFLOW_ACTIONS.APPROVE]: fromLevel === toLevel
                ? 'Final approval granted - File APPROVED'
                : `Approved at Level ${fromLevel}, moved to Level ${toLevel}`,
            [WORKFLOW_ACTIONS.RETURN]: `Returned from Level ${fromLevel} for corrections`,
            [WORKFLOW_ACTIONS.RESUBMIT]: `File resubmitted to Level ${toLevel}`,
            [WORKFLOW_ACTIONS.HOLD]: `Placed in Cabinet (on hold) at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.RESUME]: `Resumed from Cabinet at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.REJECT]: `Rejected at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.ARCHIVE]: 'File archived - now read-only'
        };

        let detail = details[action] || `Action: ${action}`;
        if (remarks) {
            detail += ` | Remarks: ${remarks}`;
        }
        return detail;
    }

    /**
     * Get allowed actions for a user on a file
     */
    async getAllowedActions(file, userId) {
        const isCreator = file.created_by === userId;
        
        // Get user's role in file's department
        const userRole = await this.db('user_department_roles')
            .where({
                user_id: userId,
                department_id: file.department_id
            })
            .first();

        const isAdmin = userRole?.role === 'Admin';

        // Get current level config
        const levelConfig = await this.db('file_workflow_levels')
            .where({
                file_id: file.id,
                level: file.current_level
            })
            .first();

        const hasRoleForLevel = userRole && levelConfig && 
                                userRole.role === levelConfig.role_required;

        const allowedByState = STATE_TRANSITIONS[file.current_state] || [];
        const allowed = [];

        for (const action of allowedByState) {
            if (action === WORKFLOW_ACTIONS.SUBMIT || 
                action === WORKFLOW_ACTIONS.RESUBMIT ||
                action === WORKFLOW_ACTIONS.SAVE_DRAFT) {
                // Creator actions
                if (isCreator) allowed.push(action);
            } else if (action === WORKFLOW_ACTIONS.ARCHIVE) {
                // Archive: creator or Admin
                if (isCreator || isAdmin) allowed.push(action);
            } else {
                // Approval actions require exact role for level
                if (hasRoleForLevel) allowed.push(action);
            }
        }

        return allowed;
    }

    /**
     * Get file's workflow levels with status
     */
    async getFileWorkflowLevels(fileId) {
        return await this.db('file_workflow_levels')
            .where({ file_id: fileId })
            .orderBy('level', 'asc');
    }

    /**
     * Check if user is admin in a department
     */
    async isUserAdmin(userId, departmentId) {
        const userRole = await this.db('user_department_roles')
            .where({
                user_id: userId,
                department_id: departmentId,
                role: 'Admin'
            })
            .first();
        return !!userRole;
    }
}

module.exports = WorkflowEngine;
