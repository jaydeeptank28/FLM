// Migration: Create file_attribute_history table
exports.up = function(knex) {
    return knex.schema.createTable('file_attribute_history', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.string('field', 100).notNullable();
        table.text('old_value').nullable();
        table.text('new_value').nullable();
        table.uuid('changed_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('changed_at').defaultTo(knex.fn.now());

        table.index('file_id');
        table.index('changed_by');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('file_attribute_history');
};
