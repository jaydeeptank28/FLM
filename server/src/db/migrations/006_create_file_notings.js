// Migration: Create file_notings table
exports.up = function(knex) {
    return knex.schema.createTable('file_notings', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.text('content').notNullable();
        table.string('type', 50).notNullable().defaultTo('NOTING');
        table.uuid('added_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.index('file_id');
        table.index('added_by');
        table.index('created_at');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('file_notings');
};
