// Knexfile for CLI migrations
require('dotenv').config();

module.exports = {
    development: {
        client: process.env.DB_CLIENT || 'pg',
        connection: {
            host: process.env.DB_HOSTNAME || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            database: process.env.DB_DATABASE || 'flm',
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || ''
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: './src/db/migrations',
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: './src/db/seeds'
        }
    },

    production: {
        client: process.env.DB_CLIENT || 'pg',
        connection: {
            host: process.env.DB_HOSTNAME,
            port: parseInt(process.env.DB_PORT, 10),
            database: process.env.DB_DATABASE,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: './src/db/migrations',
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: './src/db/seeds'
        }
    }
};
