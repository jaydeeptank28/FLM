// Migration: Create daak_audit_trail table
exports.up = function(knex) {
    return knex.schema.createTable('daak_audit_trail', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('daak_id').notNullable().references('id').inTable('daak').onDelete('CASCADE');
        table.string('action', 100).notNullable();
        table.uuid('performed_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('performed_at').defaultTo(knex.fn.now());
        table.text('details').nullable();
        table.jsonb('metadata').nullable();

        table.index('daak_id');
        table.index('performed_by');
        table.index('performed_at');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('daak_audit_trail');
};
