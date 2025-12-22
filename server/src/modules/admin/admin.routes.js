// Admin Routes
const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authMiddleware = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication and Admin role
router.use(authMiddleware);
router.use(authorize('Admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Workflow Templates
router.get('/workflow-templates', adminController.getAllWorkflowTemplates);
router.get('/workflow-templates/:id', adminController.getWorkflowTemplateById);
router.post('/workflow-templates', adminController.createWorkflowTemplate);
router.patch('/workflow-templates/:id', adminController.updateWorkflowTemplate);

// System Audit
router.get('/audit', adminController.getSystemAuditLog);

module.exports = router;
