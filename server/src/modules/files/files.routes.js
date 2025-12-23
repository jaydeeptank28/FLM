// Files Routes
const express = require('express');
const router = express.Router();
const filesController = require('./files.controller');
const authMiddleware = require('../../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// File listing and search
router.get('/search', filesController.search);
router.get('/counts', filesController.getFolderCounts);
router.get('/workflow-preview', filesController.getWorkflowPreview);
router.get('/folder/:folder', filesController.getByFolder);

// File CRUD
router.get('/:id', filesController.getById);
router.post('/', filesController.create);
router.patch('/:id', filesController.update);

// File operations
router.post('/:id/notings', filesController.addNoting);
router.post('/:id/documents', filesController.addDocument);
router.post('/:id/workflow-action', filesController.performWorkflowAction);
router.post('/:id/share', filesController.shareFile);
router.post('/:id/track', filesController.toggleTrack);

module.exports = router;
