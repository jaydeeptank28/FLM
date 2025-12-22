// Seed: Initial admin user and base data
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Simple UUID generator without external dependency
function generateUUID() {
    return crypto.randomUUID();
}

exports.seed = async function(knex) {
    // Clear existing data (in reverse dependency order)
    await knex('refresh_tokens').del();
    await knex('file_attribute_history').del();
    await knex('daak_audit_trail').del();
    await knex('daak').del();
    await knex('file_tracks').del();
    await knex('file_shares').del();
    await knex('file_audit_trail').del();
    await knex('file_workflow_participants').del();
    await knex('file_document_versions').del();
    await knex('file_documents').del();
    await knex('file_notings').del();
    await knex('files').del();
    await knex('workflow_template_levels').del();
    await knex('workflow_templates').del();
    await knex('user_department_roles').del();
    await knex('users').del();
    await knex('departments').del();

    // Create departments
    const departments = [
        { id: generateUUID(), code: 'HR', name: 'Human Resources', file_prefix: 'HR' },
        { id: generateUUID(), code: 'FIN', name: 'Finance', file_prefix: 'FIN' },
        { id: generateUUID(), code: 'ENG', name: 'Engineering', file_prefix: 'ENG' },
        { id: generateUUID(), code: 'ADM', name: 'Administration', file_prefix: 'ADM' }
    ];
    await knex('departments').insert(departments);

    // Create admin user with hashed password
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminId = generateUUID();
    await knex('users').insert({
        id: adminId,
        name: 'System Admin',
        email: 'admin@flm.local',
        password_hash: adminPassword,
        is_active: true
    });

    // Assign admin role to all departments
    const adminRoles = departments.map(dept => ({
        id: generateUUID(),
        user_id: adminId,
        department_id: dept.id,
        role: 'Admin'
    }));
    await knex('user_department_roles').insert(adminRoles);

    // Create workflow templates
    const hrDept = departments.find(d => d.code === 'HR');
    const finDept = departments.find(d => d.code === 'FIN');
    const engDept = departments.find(d => d.code === 'ENG');
    const admDept = departments.find(d => d.code === 'ADM');

    const templates = [
        {
            id: generateUUID(),
            name: 'HR Standard 3-Level',
            department_id: hrDept.id,
            file_types: ['Budget', 'Policy', 'Proposal'],
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Finance 4-Level',
            department_id: finDept.id,
            file_types: ['Budget', 'Contract', 'Proposal'],
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Administration Quick 2-Level',
            department_id: admDept.id,
            file_types: ['Memo', 'Correspondence', 'Circular', 'General'],
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Engineering Project',
            department_id: engDept.id,
            file_types: ['Proposal', 'Report', 'Contract'],
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Default Single Level',
            department_id: null,
            file_types: ['General'],
            is_default: true,
            is_active: true
        }
    ];
    await knex('workflow_templates').insert(templates);

    // Create workflow template levels
    const levels = [
        // HR 3-Level
        { id: generateUUID(), template_id: templates[0].id, level: 1, role: 'First Level Approver', description: 'Initial review' },
        { id: generateUUID(), template_id: templates[0].id, level: 2, role: 'Second Level Approver', description: 'Technical review' },
        { id: generateUUID(), template_id: templates[0].id, level: 3, role: 'Final Approver', description: 'Final approval' },
        // Finance 4-Level
        { id: generateUUID(), template_id: templates[1].id, level: 1, role: 'First Level Approver', description: 'Initial financial review' },
        { id: generateUUID(), template_id: templates[1].id, level: 2, role: 'Second Level Approver', description: 'Budget verification' },
        { id: generateUUID(), template_id: templates[1].id, level: 3, role: 'Third Level Approver', description: 'Compliance check' },
        { id: generateUUID(), template_id: templates[1].id, level: 4, role: 'Final Approver', description: 'Final approval' },
        // Administration 2-Level
        { id: generateUUID(), template_id: templates[2].id, level: 1, role: 'First Level Approver', description: 'Review' },
        { id: generateUUID(), template_id: templates[2].id, level: 2, role: 'Final Approver', description: 'Final approval' },
        // Engineering 3-Level
        { id: generateUUID(), template_id: templates[3].id, level: 1, role: 'First Level Approver', description: 'Technical review' },
        { id: generateUUID(), template_id: templates[3].id, level: 2, role: 'Second Level Approver', description: 'Feasibility review' },
        { id: generateUUID(), template_id: templates[3].id, level: 3, role: 'Final Approver', description: 'Final approval' },
        // Default Single Level
        { id: generateUUID(), template_id: templates[4].id, level: 1, role: 'First Level Approver', description: 'Single approval' }
    ];
    await knex('workflow_template_levels').insert(levels);

    console.log('✅ Seed completed: Admin user created with email admin@flm.local and password admin123');
};
