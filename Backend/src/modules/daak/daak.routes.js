// Daak Routes
const express = require('express');
const router = express.Router();
const daakController = require('./daak.controller');
const authMiddleware = require('../../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Daak listing and search
router.get('/', daakController.getByType);
router.get('/search', daakController.search);

// Daak CRUD
router.get('/:id', daakController.getById);
router.post('/', daakController.create);
router.patch('/:id', daakController.update);

// Daak operations
router.post('/:id/link-file', daakController.linkToFile);
router.post('/:id/state', daakController.changeState);

module.exports = router;
