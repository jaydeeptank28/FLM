// Seed: FLM Production Data
// Creates proper test users with FLM hierarchy roles

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    await knex('file_workflow_levels').del();
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

    const hrDept = departments.find(d => d.code === 'HR');
    const finDept = departments.find(d => d.code === 'FIN');
    const engDept = departments.find(d => d.code === 'ENG');
    const admDept = departments.find(d => d.code === 'ADM');

    // Create users with hashed password
    const password = await bcrypt.hash('password123', 12);
    const adminPassword = await bcrypt.hash('admin123', 12);

    const users = [
        // System Admin
        { id: generateUUID(), name: 'System Admin', email: 'admin@flm.local', password_hash: adminPassword, is_active: true },
        
        // Finance Department Users (complete hierarchy for testing)
        { id: generateUUID(), name: 'Ramesh Kumar', email: 'ramesh@flm.local', password_hash: password, is_active: true },      // Clerk
        { id: generateUUID(), name: 'Suresh Singh', email: 'suresh@flm.local', password_hash: password, is_active: true },      // Section Officer
        { id: generateUUID(), name: 'Mahesh Gupta', email: 'mahesh@flm.local', password_hash: password, is_active: true },      // Under Secretary
        { id: generateUUID(), name: 'Dinesh Sharma', email: 'dinesh@flm.local', password_hash: password, is_active: true },     // Deputy Secretary
        { id: generateUUID(), name: 'Rajesh Verma', email: 'rajesh@flm.local', password_hash: password, is_active: true },      // Joint Secretary
        
        // HR Department Users
        { id: generateUUID(), name: 'Priya Sharma', email: 'priya@flm.local', password_hash: password, is_active: true },       // Clerk
        { id: generateUUID(), name: 'Neha Patel', email: 'neha@flm.local', password_hash: password, is_active: true },          // Section Officer
        { id: generateUUID(), name: 'Anita Singh', email: 'anita@flm.local', password_hash: password, is_active: true },        // Under Secretary
    ];
    await knex('users').insert(users);

    const admin = users[0];
    const ramesh = users[1];  // Clerk - Finance
    const suresh = users[2];  // Section Officer - Finance
    const mahesh = users[3];  // Under Secretary - Finance
    const dinesh = users[4];  // Deputy Secretary - Finance
    const rajesh = users[5];  // Joint Secretary - Finance
    const priya = users[6];   // Clerk - HR
    const neha = users[7];    // Section Officer - HR
    const anita = users[8];   // Under Secretary - HR

    // Assign user-department-roles
    const userRoles = [
        // Admin has Admin role in all departments
        { id: generateUUID(), user_id: admin.id, department_id: finDept.id, role: 'Admin' },
        { id: generateUUID(), user_id: admin.id, department_id: hrDept.id, role: 'Admin' },
        { id: generateUUID(), user_id: admin.id, department_id: engDept.id, role: 'Admin' },
        { id: generateUUID(), user_id: admin.id, department_id: admDept.id, role: 'Admin' },

        // Finance Department - Complete Hierarchy
        { id: generateUUID(), user_id: ramesh.id, department_id: finDept.id, role: 'Clerk' },
        { id: generateUUID(), user_id: suresh.id, department_id: finDept.id, role: 'Section_Officer' },
        { id: generateUUID(), user_id: mahesh.id, department_id: finDept.id, role: 'Under_Secretary' },
        { id: generateUUID(), user_id: dinesh.id, department_id: finDept.id, role: 'Deputy_Secretary' },
        { id: generateUUID(), user_id: rajesh.id, department_id: finDept.id, role: 'Joint_Secretary' },

        // HR Department - 3 Level Setup
        { id: generateUUID(), user_id: priya.id, department_id: hrDept.id, role: 'Clerk' },
        { id: generateUUID(), user_id: neha.id, department_id: hrDept.id, role: 'Section_Officer' },
        { id: generateUUID(), user_id: anita.id, department_id: hrDept.id, role: 'Under_Secretary' },
    ];
    await knex('user_department_roles').insert(userRoles);

    // Create workflow templates with proper FLM roles
    const templates = [
        {
            id: generateUUID(),
            name: 'Finance 3-Level Approval',
            description: 'Standard 3-level approval for Finance department: Section Officer → Under Secretary → Deputy Secretary',
            department_id: finDept.id,
            file_type: null,  // Any file type in Finance
            max_levels: 3,
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Finance Budget Approval',
            description: '4-level approval for Budget files: Section Officer → Under Secretary → Deputy Secretary → Joint Secretary',
            department_id: finDept.id,
            file_type: 'Budget',  // Only for Budget files
            max_levels: 4,
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'HR Standard Approval',
            description: '3-level approval for HR: Section Officer → Under Secretary → (Final)',
            department_id: hrDept.id,
            file_type: null,
            max_levels: 2,
            is_default: false,
            is_active: true
        },
        {
            id: generateUUID(),
            name: 'Default 2-Level Approval',
            description: 'Default approval for any department without specific workflow: Section Officer → Under Secretary',
            department_id: null,  // Default for all
            file_type: null,
            max_levels: 2,
            is_default: true,  // This is the default
            is_active: true
        }
    ];
    await knex('workflow_templates').insert(templates);

    // Create workflow template levels with authority levels
    // Authority matches role: Clerk=1, Section_Officer=2, Under_Secretary=3, Deputy_Secretary=4, Joint_Secretary=5
    const levels = [
        // Finance 3-Level
        { id: generateUUID(), template_id: templates[0].id, level: 1, role: 'Section_Officer', authority_level: 2, description: 'Section Officer Review' },
        { id: generateUUID(), template_id: templates[0].id, level: 2, role: 'Under_Secretary', authority_level: 3, description: 'Under Secretary Verification' },
        { id: generateUUID(), template_id: templates[0].id, level: 3, role: 'Deputy_Secretary', authority_level: 4, description: 'Deputy Secretary Final Approval' },

        // Finance Budget 4-Level
        { id: generateUUID(), template_id: templates[1].id, level: 1, role: 'Section_Officer', authority_level: 2, description: 'Section Officer Initial Check' },
        { id: generateUUID(), template_id: templates[1].id, level: 2, role: 'Under_Secretary', authority_level: 3, description: 'Under Secretary Budget Review' },
        { id: generateUUID(), template_id: templates[1].id, level: 3, role: 'Deputy_Secretary', authority_level: 4, description: 'Deputy Secretary Financial Approval' },
        { id: generateUUID(), template_id: templates[1].id, level: 4, role: 'Joint_Secretary', authority_level: 5, description: 'Joint Secretary Final Sign-off' },

        // HR 2-Level
        { id: generateUUID(), template_id: templates[2].id, level: 1, role: 'Section_Officer', authority_level: 2, description: 'Section Officer Review' },
        { id: generateUUID(), template_id: templates[2].id, level: 2, role: 'Under_Secretary', authority_level: 3, description: 'Under Secretary Final Approval' },

        // Default 2-Level
        { id: generateUUID(), template_id: templates[3].id, level: 1, role: 'Section_Officer', authority_level: 2, description: 'Initial Approval' },
        { id: generateUUID(), template_id: templates[3].id, level: 2, role: 'Under_Secretary', authority_level: 3, description: 'Final Approval' }
    ];
    await knex('workflow_template_levels').insert(levels);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ FLM Production Seed Completed Successfully');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  📋 DEPARTMENTS CREATED:');
    console.log('     • Finance (FIN)');
    console.log('     • Human Resources (HR)');
    console.log('     • Engineering (ENG)');
    console.log('     • Administration (ADM)');
    console.log('');
    console.log('  👤 TEST USERS CREATED:');
    console.log('');
    console.log('  ┌──────────────────────────────────────────────────────────────┐');
    console.log('  │  Admin User:                                                 │');
    console.log('  │    Email: admin@flm.local  |  Password: admin123            │');
    console.log('  └──────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  FINANCE DEPARTMENT (for skip logic testing):');
    console.log('  ┌──────────────────────────────────────────────────────────────┐');
    console.log('  │  Ramesh (Clerk)           → ramesh@flm.local : password123  │');
    console.log('  │  Suresh (Section Officer) → suresh@flm.local : password123  │');
    console.log('  │  Mahesh (Under Secretary) → mahesh@flm.local : password123  │');
    console.log('  │  Dinesh (Deputy Secretary)→ dinesh@flm.local : password123  │');
    console.log('  │  Rajesh (Joint Secretary) → rajesh@flm.local : password123  │');
    console.log('  └──────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  HR DEPARTMENT:');
    console.log('  ┌──────────────────────────────────────────────────────────────┐');
    console.log('  │  Priya (Clerk)            → priya@flm.local  : password123  │');
    console.log('  │  Neha (Section Officer)   → neha@flm.local   : password123  │');
    console.log('  │  Anita (Under Secretary)  → anita@flm.local  : password123  │');
    console.log('  └──────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  🔄 WORKFLOWS CREATED:');
    console.log('     • Finance 3-Level (Finance dept)');
    console.log('     • Finance Budget 4-Level (Finance + Budget file type)');
    console.log('     • HR Standard 2-Level (HR dept)');
    console.log('     • Default 2-Level (fallback for any dept)');
    console.log('');
    console.log('  📊 TEST SCENARIOS:');
    console.log('     1. Ramesh creates file → All 3 levels execute');
    console.log('     2. Suresh creates file → Level 1 SKIPPED');
    console.log('     3. Mahesh creates file → Levels 1 & 2 SKIPPED');
    console.log('     4. Finance file NEVER goes to HR user');
    console.log('     5. Budget file in Finance → Uses 4-Level workflow');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
};
