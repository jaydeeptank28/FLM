// Files Controller
const FilesService = require('./files.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

const getByFolder = asyncHandler(async (req, res) => {
    const { folder } = req.params;
    const { departmentId } = req.query;

    if (!departmentId) {
        return ApiResponse.badRequest(res, 'Department ID required');
    }

    const filesService = new FilesService(req.db);
    const files = await filesService.getByFolder(req.user.id, departmentId, folder);

    return ApiResponse.success(res, files);
});

const getById = asyncHandler(async (req, res) => {
    const filesService = new FilesService(req.db);
    const file = await filesService.getById(req.params.id);

    // Add allowed actions for current user
    const allowedActions = await filesService.getAllowedActions(req.params.id, req.user.id);
    file.allowedActions = allowedActions;

    return ApiResponse.success(res, file);
});

const create = asyncHandler(async (req, res) => {
    const { departmentId, subject, fileType, priority, initialNoting } = req.body;

    if (!departmentId || !subject || !fileType) {
        return ApiResponse.badRequest(res, 'Department, subject, and file type are required');
    }

    const filesService = new FilesService(req.db);
    const file = await filesService.create(req.user.id, {
        departmentId,
        subject,
        fileType,
        priority,
        initialNoting
    });

    return ApiResponse.created(res, file, 'File created successfully');
});

const update = asyncHandler(async (req, res) => {
    const filesService = new FilesService(req.db);
    const file = await filesService.update(req.params.id, req.user.id, req.body);
    return ApiResponse.success(res, file, 'File updated successfully');
});

const addNoting = asyncHandler(async (req, res) => {
    const { content, type } = req.body;

    if (!content) {
        return ApiResponse.badRequest(res, 'Content is required');
    }

    const filesService = new FilesService(req.db);
    const file = await filesService.addNoting(req.params.id, req.user.id, content, type);
    return ApiResponse.success(res, file, 'Noting added successfully');
});

const addDocument = asyncHandler(async (req, res) => {
    const { name, type, size, storagePath } = req.body;

    if (!name) {
        return ApiResponse.badRequest(res, 'Document name is required');
    }

    const filesService = new FilesService(req.db);
    const file = await filesService.addDocument(req.params.id, req.user.id, {
        name, type, size, storagePath
    });
    return ApiResponse.success(res, file, 'Document added successfully');
});

const performWorkflowAction = asyncHandler(async (req, res) => {
    const { action, remarks } = req.body;

    if (!action) {
        return ApiResponse.badRequest(res, 'Action is required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;

    const filesService = new FilesService(req.db);
    const file = await filesService.performWorkflowAction(
        req.params.id,
        req.user.id,
        action,
        remarks || '',
        ipAddress
    );

    return ApiResponse.success(res, file, `Action ${action} performed successfully`);
});

const shareFile = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return ApiResponse.badRequest(res, 'User ID is required');
    }

    const filesService = new FilesService(req.db);
    const file = await filesService.shareFile(req.params.id, req.user.id, userId);
    return ApiResponse.success(res, file, 'File shared successfully');
});

const toggleTrack = asyncHandler(async (req, res) => {
    const filesService = new FilesService(req.db);
    const file = await filesService.toggleTrack(req.params.id, req.user.id);
    return ApiResponse.success(res, file, 'Track toggled');
});

const search = asyncHandler(async (req, res) => {
    const { departmentId, text, status, fileType, priority, dateFrom, dateTo } = req.query;

    const filesService = new FilesService(req.db);
    const files = await filesService.search(req.user.id, departmentId, {
        text, status, fileType, priority, dateFrom, dateTo
    });

    return ApiResponse.success(res, files);
});

const getFolderCounts = asyncHandler(async (req, res) => {
    const { departmentId } = req.query;

    if (!departmentId) {
        return ApiResponse.badRequest(res, 'Department ID required');
    }

    const filesService = new FilesService(req.db);
    const counts = await filesService.getFolderCounts(req.user.id, departmentId);

    return ApiResponse.success(res, counts);
});

module.exports = {
    getByFolder,
    getById,
    create,
    update,
    addNoting,
    addDocument,
    performWorkflowAction,
    shareFile,
    toggleTrack,
    search,
    getFolderCounts
};
