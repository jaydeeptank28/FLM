// Daak Controller
const DaakService = require('./daak.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

const getByType = asyncHandler(async (req, res) => {
    const { departmentId, type } = req.query;

    if (!departmentId) {
        return ApiResponse.badRequest(res, 'Department ID required');
    }

    const daakService = new DaakService(req.db);
    const daaks = await daakService.getByType(departmentId, type);

    return ApiResponse.success(res, daaks);
});

const getById = asyncHandler(async (req, res) => {
    const daakService = new DaakService(req.db);
    const daak = await daakService.getById(req.params.id);
    return ApiResponse.success(res, daak);
});

const create = asyncHandler(async (req, res) => {
    const { type, departmentId, subject } = req.body;

    if (!type || !departmentId || !subject) {
        return ApiResponse.badRequest(res, 'Type, department, and subject are required');
    }

    const daakService = new DaakService(req.db);
    const daak = await daakService.create(req.user.id, req.body);

    return ApiResponse.created(res, daak, 'Daak created successfully');
});

const update = asyncHandler(async (req, res) => {
    const daakService = new DaakService(req.db);
    const daak = await daakService.update(req.params.id, req.user.id, req.body);
    return ApiResponse.success(res, daak, 'Daak updated successfully');
});

const linkToFile = asyncHandler(async (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
        return ApiResponse.badRequest(res, 'File ID required');
    }

    const daakService = new DaakService(req.db);
    const daak = await daakService.linkToFile(req.params.id, req.user.id, fileId);
    return ApiResponse.success(res, daak, 'Daak linked to file');
});

const changeState = asyncHandler(async (req, res) => {
    const { state, remarks } = req.body;

    if (!state) {
        return ApiResponse.badRequest(res, 'State required');
    }

    const daakService = new DaakService(req.db);
    const daak = await daakService.changeState(req.params.id, req.user.id, state, remarks);
    return ApiResponse.success(res, daak, 'Daak state changed');
});

const search = asyncHandler(async (req, res) => {
    const { departmentId, text, type, status, priority, dateFrom, dateTo } = req.query;

    const daakService = new DaakService(req.db);
    const daaks = await daakService.search(departmentId, {
        text, type, status, priority, dateFrom, dateTo
    });

    return ApiResponse.success(res, daaks);
});

module.exports = {
    getByType,
    getById,
    create,
    update,
    linkToFile,
    changeState,
    search
};
