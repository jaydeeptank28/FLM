// Express Application Setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const knex = require('knex');

const config = require('./config/environment');
const knexConfig = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Knex
const db = knex(knexConfig);

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Make db available to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// API Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/departments', require('./modules/departments/departments.routes'));
app.use('/api/files', require('./modules/files/files.routes'));
app.use('/api/daak', require('./modules/daak/daak.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Export app and db
module.exports = { app, db };
