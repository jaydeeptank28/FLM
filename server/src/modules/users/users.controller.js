// Users Controller
const UsersService = require('./users.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const usersService = new UsersService(req.db);
    const { isActive } = req.query;

    const users = await usersService.getAll({
        isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    return ApiResponse.success(res, users);
});

const getById = asyncHandler(async (req, res) => {
    const usersService = new UsersService(req.db);
    const user = await usersService.getById(req.params.id);
    return ApiResponse.success(res, user);
});

const create = asyncHandler(async (req, res) => {
    const { name, email, password, departmentRoles } = req.body;

    if (!name || !email || !password) {
        return ApiResponse.badRequest(res, 'Name, email, and password are required');
    }

    const usersService = new UsersService(req.db);
    const user = await usersService.create({ name, email, password, departmentRoles });

    return ApiResponse.created(res, user, 'User created successfully');
});

const update = asyncHandler(async (req, res) => {
    const usersService = new UsersService(req.db);
    const user = await usersService.update(req.params.id, req.body);
    return ApiResponse.success(res, user, 'User updated successfully');
});

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return ApiResponse.badRequest(res, 'Password must be at least 6 characters');
    }

    const usersService = new UsersService(req.db);
    await usersService.resetPassword(req.params.id, newPassword);

    return ApiResponse.success(res, null, 'Password reset successfully');
});

const deactivate = asyncHandler(async (req, res) => {
    const usersService = new UsersService(req.db);
    await usersService.deactivate(req.params.id);
    return ApiResponse.success(res, null, 'User deactivated successfully');
});

module.exports = {
    getAll,
    getById,
    create,
    update,
    resetPassword,
    deactivate
};
