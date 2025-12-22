// Migration: Create file_documents and file_document_versions tables
exports.up = async function(knex) {
    await knex.schema.createTable('file_documents', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.string('name', 500).notNullable();
        table.string('document_type', 50).notNullable().defaultTo('NORMAL');
        table.uuid('linked_file_id').nullable().references('id').inTable('files').onDelete('SET NULL');
        table.uuid('linked_daak_id').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index('file_id');
        table.index('name');
    });

    await knex.schema.createTable('file_document_versions', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('document_id').notNullable().references('id').inTable('file_documents').onDelete('CASCADE');
        table.integer('version').notNullable();
        table.string('storage_path', 1000).nullable();
        table.bigInteger('size').defaultTo(0);
        table.uuid('uploaded_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.timestamp('uploaded_at').defaultTo(knex.fn.now());

        table.unique(['document_id', 'version']);
        table.index('document_id');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('file_document_versions');
    await knex.schema.dropTableIfExists('file_documents');
};
