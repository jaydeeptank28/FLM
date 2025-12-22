// Migration: Create file_shares and file_tracks tables
exports.up = async function(knex) {
    await knex.schema.createTable('file_shares', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.uuid('shared_with').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('shared_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('shared_at').defaultTo(knex.fn.now());

        table.unique(['file_id', 'shared_with']);
        table.index('file_id');
        table.index('shared_with');
    });

    await knex.schema.createTable('file_tracks', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.timestamp('tracked_at').defaultTo(knex.fn.now());

        table.unique(['file_id', 'user_id']);
        table.index('file_id');
        table.index('user_id');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('file_tracks');
    await knex.schema.dropTableIfExists('file_shares');
};
