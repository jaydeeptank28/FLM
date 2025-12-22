// Migration: Create departments table
exports.up = function(knex) {
    return knex.schema.createTable('departments', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('code', 50).notNullable().unique();
        table.string('name', 255).notNullable();
        table.string('file_prefix', 10).notNullable();
        table.text('description').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index('code');
        table.index('is_active');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('departments');
};
