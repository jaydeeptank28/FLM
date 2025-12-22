// Migration: Create user_department_roles junction table
exports.up = function(knex) {
    return knex.schema.createTable('user_department_roles', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('CASCADE');
        table.string('role', 100).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.unique(['user_id', 'department_id', 'role']);
        table.index('user_id');
        table.index('department_id');
        table.index('role');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user_department_roles');
};
