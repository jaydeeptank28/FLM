// Migration: Create workflow_templates and workflow_template_levels tables
exports.up = async function(knex) {
    await knex.schema.createTable('workflow_templates', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('name', 255).notNullable();
        table.uuid('department_id').nullable().references('id').inTable('departments').onDelete('SET NULL');
        table.specificType('file_types', 'text[]').notNullable();
        table.boolean('is_default').defaultTo(false);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index('department_id');
        table.index('is_active');
    });

    await knex.schema.createTable('workflow_template_levels', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('template_id').notNullable().references('id').inTable('workflow_templates').onDelete('CASCADE');
        table.integer('level').notNullable();
        table.string('role', 100).notNullable();
        table.text('description').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.unique(['template_id', 'level']);
        table.index('template_id');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('workflow_template_levels');
    await knex.schema.dropTableIfExists('workflow_templates');
};
