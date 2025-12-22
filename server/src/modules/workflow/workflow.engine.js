// Workflow Engine - Server-side state machine
const { FILE_STATES, WORKFLOW_ACTIONS, STATE_TRANSITIONS } = require('../../config/constants');
const { AppError } = require('../../middleware/errorHandler');

class WorkflowEngine {
    constructor(db) {
        this.db = db;
    }

    // Validate if action is allowed for current state
    isActionAllowed(currentState, action) {
        const allowedActions = STATE_TRANSITIONS[currentState] || [];
        return allowedActions.includes(action);
    }

    // Get the next state based on action
    getNextState(file, action) {
        switch (action) {
            case WORKFLOW_ACTIONS.SUBMIT:
                return { state: FILE_STATES.IN_REVIEW, level: 1 };

            case WORKFLOW_ACTIONS.APPROVE:
                // Check if this is the final level
                if (file.current_level >= file.max_levels) {
                    return { state: FILE_STATES.APPROVED, level: file.current_level };
                }
                return { state: FILE_STATES.IN_REVIEW, level: file.current_level + 1 };

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

    // Execute workflow action with full validation
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

            // Validate action
            if (!this.isActionAllowed(file.current_state, action)) {
                throw new AppError(
                    `Action "${action}" is not allowed in state "${file.current_state}"`,
                    400
                );
            }

            // Get user's role for this file's department
            const userRole = await trx('user_department_roles')
                .where({
                    user_id: userId,
                    department_id: file.department_id
                })
                .first();

            // Get level config for current level
            const levelConfig = await trx('workflow_template_levels')
                .where({
                    template_id: file.workflow_template_id,
                    level: file.current_level
                })
                .first();

            // Authorization check
            const isCreator = file.created_by === userId;
            const hasRoleForLevel = userRole && levelConfig && userRole.role === levelConfig.role;

            // Creator can only SUBMIT (from DRAFT) or RESUBMIT (from RETURNED)
            if (action === WORKFLOW_ACTIONS.SUBMIT || action === WORKFLOW_ACTIONS.RESUBMIT) {
                if (!isCreator) {
                    throw new AppError('Only the file creator can submit/resubmit', 403);
                }
            } else if (action === WORKFLOW_ACTIONS.SAVE_DRAFT) {
                if (!isCreator) {
                    throw new AppError('Only the file creator can save draft', 403);
                }
            } else {
                // For all other actions, user must have the correct role for current level
                if (!hasRoleForLevel) {
                    throw new AppError('You do not have permission to perform this action', 403);
                }
            }

            // Calculate next state
            const { state: newState, level: newLevel } = this.getNextState(file, action);

            // Update file
            await trx('files')
                .where({ id: fileId })
                .update({
                    current_state: newState,
                    current_level: newLevel,
                    updated_at: new Date()
                });

            // Record workflow participant (for approval chain actions)
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
                    toLevel: newLevel
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

    getAuditDetails(action, fromLevel, toLevel, remarks) {
        const details = {
            [WORKFLOW_ACTIONS.SAVE_DRAFT]: 'File saved as draft',
            [WORKFLOW_ACTIONS.SUBMIT]: `File submitted for Level ${toLevel} approval`,
            [WORKFLOW_ACTIONS.APPROVE]: fromLevel >= toLevel
                ? 'Final approval granted'
                : `Approved at Level ${fromLevel}, moved to Level ${toLevel}`,
            [WORKFLOW_ACTIONS.RETURN]: `Returned from Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.RESUBMIT]: 'File resubmitted after corrections',
            [WORKFLOW_ACTIONS.HOLD]: `Placed in Cabinet at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.RESUME]: `Resumed from Cabinet at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.REJECT]: `Rejected at Level ${fromLevel}`,
            [WORKFLOW_ACTIONS.ARCHIVE]: 'File archived'
        };

        let detail = details[action] || `Action: ${action}`;
        if (remarks) {
            detail += ` - ${remarks}`;
        }
        return detail;
    }

    // Get allowed actions for a user on a file
    async getAllowedActions(file, userId) {
        const isCreator = file.created_by === userId;

        // Get user's role in this department
        const userRole = await this.db('user_department_roles')
            .where({
                user_id: userId,
                department_id: file.department_id
            })
            .first();

        // Get level config
        const levelConfig = await this.db('workflow_template_levels')
            .where({
                template_id: file.workflow_template_id,
                level: file.current_level
            })
            .first();

        const hasRoleForLevel = userRole && levelConfig && userRole.role === levelConfig.role;

        const allowedByState = STATE_TRANSITIONS[file.current_state] || [];
        const allowed = [];

        for (const action of allowedByState) {
            if (action === WORKFLOW_ACTIONS.SUBMIT || action === WORKFLOW_ACTIONS.RESUBMIT ||
                action === WORKFLOW_ACTIONS.SAVE_DRAFT) {
                if (isCreator) allowed.push(action);
            } else {
                if (hasRoleForLevel) allowed.push(action);
            }
        }

        return allowed;
    }
}

module.exports = WorkflowEngine;
