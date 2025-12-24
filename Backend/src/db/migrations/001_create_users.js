// Migration: Create users table
exports.up = function(knex) {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('name', 255).notNullable();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('last_login_at').nullable();

        table.index('email');
        table.index('is_active');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('users');
};
