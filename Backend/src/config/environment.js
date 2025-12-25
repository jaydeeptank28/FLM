// Environment configuration
require('dotenv').config();

module.exports = {
    // Server
    port: process.env.PORT || 4747,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    db: {
        client: process.env.DB_CLIENT || 'pg',
        host: process.env.DB_HOSTNAME || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_DATABASE || 'flm',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
