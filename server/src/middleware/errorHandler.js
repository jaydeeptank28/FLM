// Centralized error handling middleware
const ApiResponse = require('../utils/response');
const config = require('../config/environment');

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log error in development
    if (config.nodeEnv === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode
        });
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Resource already exists';
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        statusCode = 400;
        message = 'Referenced resource does not exist';
    }

    // Don't leak error details in production
    if (config.nodeEnv === 'production' && !err.isOperational) {
        message = 'Something went wrong';
    }

    return ApiResponse.error(res, message, statusCode);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler
};
