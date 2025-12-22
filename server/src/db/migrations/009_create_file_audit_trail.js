// Migration: Create file_audit_trail table (IMMUTABLE)
exports.up = function(knex) {
    return knex.schema.createTable('file_audit_trail', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.string('action', 100).notNullable();
        table.uuid('performed_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('performed_at').defaultTo(knex.fn.now());
        table.text('details').nullable();
        table.jsonb('metadata').nullable();
        table.string('ip_address', 45).nullable();

        table.index('file_id');
        table.index('performed_by');
        table.index('performed_at');
        table.index('action');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('file_audit_trail');
};
