// Users Routes
const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const authMiddleware = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication and Admin role
router.use(authMiddleware);
router.use(authorize('Admin'));

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.patch('/:id', usersController.update);
router.delete('/:id', usersController.delete);
router.post('/:id/reset-password', usersController.resetPassword);
router.post('/:id/deactivate', usersController.deactivate);

module.exports = router;
