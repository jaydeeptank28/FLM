// Knex database configuration
const config = require('./environment');

const knexConfig = {
    client: config.db.client,
    connection: {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        directory: '../db/migrations',
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: '../db/seeds'
    }
};

module.exports = knexConfig;
