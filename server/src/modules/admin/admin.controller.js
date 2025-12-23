// Admin Controller
const AdminService = require('./admin.service');
const ApiResponse = require('../../utils/response');
const { asyncHandler } = require('../../middleware/errorHandler');

// Workflow Templates
const getAllWorkflowTemplates = asyncHandler(async (req, res) => {
    const adminService = new AdminService(req.db);
    const templates = await adminService.getAllWorkflowTemplates();
    return ApiResponse.success(res, templates);
});

const getWorkflowTemplateById = asyncHandler(async (req, res) => {
    const adminService = new AdminService(req.db);
    const template = await adminService.getWorkflowTemplateById(req.params.id);
    return ApiResponse.success(res, template);
});

const createWorkflowTemplate = asyncHandler(async (req, res) => {
    const { name, levels } = req.body;

    if (!name || !levels || levels.length === 0) {
        return ApiResponse.badRequest(res, 'Name and at least one level are required');
    }

    const adminService = new AdminService(req.db);
    const template = await adminService.createWorkflowTemplate(req.body);
    return ApiResponse.created(res, template, 'Workflow template created');
});

const updateWorkflowTemplate = asyncHandler(async (req, res) => {
    const adminService = new AdminService(req.db);
    const template = await adminService.updateWorkflowTemplate(req.params.id, req.body);
    return ApiResponse.success(res, template, 'Workflow template updated');
});

const deleteWorkflowTemplate = asyncHandler(async (req, res) => {
    const adminService = new AdminService(req.db);
    await adminService.deleteWorkflowTemplate(req.params.id);
    return ApiResponse.success(res, null, 'Workflow template deleted');
});

// System Audit
const getSystemAuditLog = asyncHandler(async (req, res) => {
    const { type, userId, fileId, daakId, dateFrom, dateTo, limit } = req.query;

    const adminService = new AdminService(req.db);
    const auditLog = await adminService.getSystemAuditLog({
        type, userId, fileId, daakId, dateFrom, dateTo,
        limit: limit ? parseInt(limit) : 100
    });

    return ApiResponse.success(res, auditLog);
});

// Dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
    const adminService = new AdminService(req.db);
    const stats = await adminService.getDashboardStats();
    return ApiResponse.success(res, stats);
});

module.exports = {
    getAllWorkflowTemplates,
    getWorkflowTemplateById,
    createWorkflowTemplate,
    updateWorkflowTemplate,
    deleteWorkflowTemplate,
    getSystemAuditLog,
    getDashboardStats
};
