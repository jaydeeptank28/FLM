// Migration: Create refresh_tokens table for JWT refresh token storage
exports.up = function(knex) {
    return knex.schema.createTable('refresh_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('token_hash', 255).notNullable();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.boolean('is_revoked').defaultTo(false);

        table.index('user_id');
        table.index('token_hash');
        table.index('expires_at');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('refresh_tokens');
};
