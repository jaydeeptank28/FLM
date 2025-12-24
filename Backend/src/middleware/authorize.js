// Authorization Middleware - Role-based access control
const ApiResponse = require('../utils/response');

// Check if user has any of the specified roles in a department
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Authentication required');
        }

        // If no specific roles required, just check authentication
        if (allowedRoles.length === 0) {
            return next();
        }

        // Check if user has any of the allowed roles
        const hasRole = req.user.departmentRoles.some(dr =>
            allowedRoles.includes(dr.role)
        );

        if (!hasRole) {
            return ApiResponse.forbidden(res, 'Insufficient permissions');
        }

        next();
    };
};

// Check if user has a specific role in a specific department
const authorizeInDepartment = (departmentId, ...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const hasRoleInDept = req.user.departmentRoles.some(dr =>
            dr.departmentId === departmentId && allowedRoles.includes(dr.role)
        );

        if (!hasRoleInDept) {
            return ApiResponse.forbidden(res, 'Insufficient permissions in this department');
        }

        next();
    };
};

// Middleware to check if user can act on a file at current level
const canActOnFile = async (req, res, next) => {
    try {
        const { id: fileId } = req.params;
        const db = req.db;

        const file = await db('files')
            .select('files.*', 'departments.code as department_code')
            .join('departments', 'departments.id', 'files.department_id')
            .where('files.id', fileId)
            .first();

        if (!file) {
            return ApiResponse.notFound(res, 'File not found');
        }

        // Get workflow template level for current file level
        const levelConfig = await db('workflow_template_levels')
            .where({
                template_id: file.workflow_template_id,
                level: file.current_level
            })
            .first();

        if (!levelConfig) {
            return ApiResponse.error(res, 'Workflow configuration error', 500);
        }

        // Check if user has the required role in the file's department
        const canAct = req.user.departmentRoles.some(dr =>
            dr.departmentId === file.department_id && dr.role === levelConfig.role
        );

        if (!canAct) {
            // Also check if user is the creator (for draft/returned states)
            if (file.created_by === req.user.id &&
                ['DRAFT', 'RETURNED'].includes(file.current_state)) {
                req.file = file;
                req.isCreator = true;
                return next();
            }
            return ApiResponse.forbidden(res, 'You cannot act on this file at its current stage');
        }

        req.file = file;
        req.levelConfig = levelConfig;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authorize,
    authorizeInDepartment,
    canActOnFile
};
