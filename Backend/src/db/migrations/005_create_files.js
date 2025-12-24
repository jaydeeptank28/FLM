// Migration: Create files table (core entity)
exports.up = function(knex) {
    return knex.schema.createTable('files', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('file_number', 100).notNullable().unique();
        table.string('subject', 500).notNullable();
        table.string('file_type', 100).notNullable();
        table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
        table.string('priority', 20).notNullable().defaultTo('Medium');
        table.string('current_state', 50).notNullable().defaultTo('DRAFT');
        table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.uuid('workflow_template_id').nullable().references('id').inTable('workflow_templates').onDelete('SET NULL');
        table.integer('current_level').defaultTo(0);
        table.integer('max_levels').defaultTo(1);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index('file_number');
        table.index('department_id');
        table.index('current_state');
        table.index('created_by');
        table.index('created_at');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('files');
};
