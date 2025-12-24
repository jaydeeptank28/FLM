// Auth Middleware - JWT verification
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const ApiResponse = require('../utils/response');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.unauthorized(res, 'Access token required');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database
        const user = await req.db('users')
            .where({ id: decoded.userId, is_active: true })
            .first();

        if (!user) {
            return ApiResponse.unauthorized(res, 'User not found or inactive');
        }

        // Get user's department roles
        const departmentRoles = await req.db('user_department_roles')
            .select('user_department_roles.*', 'departments.code as department_code', 'departments.name as department_name')
            .join('departments', 'departments.id', 'user_department_roles.department_id')
            .where('user_department_roles.user_id', user.id);

        // Attach user to request
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            departmentRoles: departmentRoles.map(dr => ({
                departmentId: dr.department_id,
                departmentCode: dr.department_code,
                departmentName: dr.department_name,
                role: dr.role
            }))
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.unauthorized(res, 'Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            return ApiResponse.unauthorized(res, 'Invalid token');
        }
        next(error);
    }
};

module.exports = authMiddleware;
