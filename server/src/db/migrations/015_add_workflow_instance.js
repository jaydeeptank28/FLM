// Migration: Add workflow instance tracking and role authority support
// This enables per-file workflow tracking with skip logic

exports.up = async function(knex) {
    // 1. Add file_type column to workflow_templates for file-type specific workflows
    await knex.schema.alterTable('workflow_templates', (table) => {
        table.string('file_type', 100).nullable();
        table.index(['department_id', 'file_type']);
    });

    // 2. Add authority level tracking to files
    await knex.schema.alterTable('files', (table) => {
        table.integer('creator_authority_level').defaultTo(1);
        table.string('workflow_selection_reason', 255).nullable();
    });

    // 3. Create file_workflow_levels table - instance of workflow per file
    await knex.schema.createTable('file_workflow_levels', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('file_id').notNullable().references('id').inTable('files').onDelete('CASCADE');
        table.integer('level').notNullable();
        table.string('role_required', 100).notNullable();
        table.integer('authority_required').notNullable();
        table.string('status', 20).notNullable().defaultTo('PENDING');
        // PENDING | ACTIVE | COMPLETED | SKIPPED | RETURNED
        table.string('skipped_reason', 255).nullable();
        table.uuid('completed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('completed_at').nullable();
        table.text('remarks').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.unique(['file_id', 'level']);
        table.index('file_id');
        table.index('status');
    });

    // 4. Add authority_level to workflow_template_levels if not exists
    const hasAuthorityColumn = await knex.schema.hasColumn('workflow_template_levels', 'authority_level');
    if (!hasAuthorityColumn) {
        await knex.schema.alterTable('workflow_template_levels', (table) => {
            table.integer('authority_level').defaultTo(2); // Default to Section Officer level
        });
    }
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('file_workflow_levels');
    
    await knex.schema.alterTable('files', (table) => {
        table.dropColumn('creator_authority_level');
        table.dropColumn('workflow_selection_reason');
    });

    await knex.schema.alterTable('workflow_templates', (table) => {
        table.dropIndex(['department_id', 'file_type']);
        table.dropColumn('file_type');
    });

    const hasAuthorityColumn = await knex.schema.hasColumn('workflow_template_levels', 'authority_level');
    if (hasAuthorityColumn) {
        await knex.schema.alterTable('workflow_template_levels', (table) => {
            table.dropColumn('authority_level');
        });
    }
};
