// Departments Data

export const departments = [
    {
        id: 'dept-hr',
        code: 'HR',
        name: 'Human Resources',
        description: 'Handles employee management, recruitment, and HR policies',
        isActive: true,
        workflowLevels: 3, // Number of approval levels for this department
        filePrefix: 'HR'
    },
    {
        id: 'dept-fin',
        code: 'Finance',
        name: 'Finance & Accounts',
        description: 'Manages budgets, payments, and financial reporting',
        isActive: true,
        workflowLevels: 4, // Finance needs more approvals
        filePrefix: 'FIN'
    },
    {
        id: 'dept-eng',
        code: 'Engineering',
        name: 'Engineering',
        description: 'Technical projects and infrastructure development',
        isActive: true,
        workflowLevels: 3,
        filePrefix: 'ENG'
    },
    {
        id: 'dept-admin',
        code: 'Administration',
        name: 'Administration',
        description: 'General administration and support services',
        isActive: true,
        workflowLevels: 2, // Admin has fewer levels
        filePrefix: 'ADM'
    }
];

export default departments;
