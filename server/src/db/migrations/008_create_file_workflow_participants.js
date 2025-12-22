// Migration: Create file_workflow_participants table
exports.up = function(knex) {
    return knex.schema.createTable('file_workflow_participants', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.integer('level').notNullable();
        table.string('role', 100).notNullable();
        table.uuid('department_id').nullable().references('id').inTable('departments').onDelete('SET NULL');
        table.string('action', 50).notNullable();
        table.uuid('action_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('action_at').defaultTo(knex.fn.now());
        table.text('remarks').nullable();

        table.index('file_id');
        table.index('action_by');
        table.index(['file_id', 'level']);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('file_workflow_participants');
};
