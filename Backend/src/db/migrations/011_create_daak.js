// Migration: Create daak table
exports.up = function(knex) {
    return knex.schema.createTable('daak', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('daak_number', 100).notNullable().unique();
        table.string('type', 20).notNullable();
        table.string('subject', 500).notNullable();
        table.string('sender_name', 255).nullable();
        table.string('sender_address', 500).nullable();
        table.string('receiver_name', 255).nullable();
        table.string('receiver_address', 500).nullable();
        table.string('mode', 50).notNullable();
        table.date('received_date').nullable();
        table.date('dispatch_date').nullable();
        table.string('priority', 20).notNullable().defaultTo('Medium');
        table.string('current_state', 50).notNullable().defaultTo('PENDING');
        table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
        table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.uuid('linked_file_id').nullable().references('id').inTable('files').onDelete('SET NULL');
        table.text('remarks').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index('daak_number');
        table.index('type');
        table.index('department_id');
        table.index('current_state');
        table.index('created_by');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('daak');
};
