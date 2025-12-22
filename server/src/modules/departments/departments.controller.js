// Departments Controller
const DepartmentsService = require('./departments.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const departmentsService = new DepartmentsService(req.db);
    const { isActive } = req.query;

    const departments = await departmentsService.getAll({
        isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    return ApiResponse.success(res, departments);
});

const getById = asyncHandler(async (req, res) => {
    const departmentsService = new DepartmentsService(req.db);
    const department = await departmentsService.getById(req.params.id);
    return ApiResponse.success(res, department);
});

const create = asyncHandler(async (req, res) => {
    const { code, name, filePrefix, description } = req.body;

    if (!code || !name) {
        return ApiResponse.badRequest(res, 'Code and name are required');
    }

    const departmentsService = new DepartmentsService(req.db);
    const department = await departmentsService.create({ code, name, filePrefix, description });

    return ApiResponse.created(res, department, 'Department created successfully');
});

const update = asyncHandler(async (req, res) => {
    const departmentsService = new DepartmentsService(req.db);
    const department = await departmentsService.update(req.params.id, req.body);
    return ApiResponse.success(res, department, 'Department updated successfully');
});

const getUsers = asyncHandler(async (req, res) => {
    const departmentsService = new DepartmentsService(req.db);
    const users = await departmentsService.getUsersInDepartment(req.params.id);
    return ApiResponse.success(res, users);
});

module.exports = {
    getAll,
    getById,
    create,
    update,
    getUsers
};
