// Departments Routes
const express = require('express');
const router = express.Router();
const departmentsController = require('./departments.controller');
const authMiddleware = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authMiddleware);

// Read operations available to all authenticated users
router.get('/', departmentsController.getAll);
router.get('/:id', departmentsController.getById);
router.get('/:id/users', departmentsController.getUsers);

// Write operations require Admin role
router.post('/', authorize('Admin'), departmentsController.create);
router.patch('/:id', authorize('Admin'), departmentsController.update);

module.exports = router;
