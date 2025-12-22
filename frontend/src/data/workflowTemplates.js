// Workflow Templates per File Type and Department

export const workflowTemplates = [
    {
        id: 'wf-template-001',
        name: 'Standard 3-Level Approval',
        department: 'HR',
        fileTypes: ['Budget', 'Policy', 'Proposal'],
        levels: [
            { level: 1, role: 'First Level Approver', description: 'Initial review and verification' },
            { level: 2, role: 'Second Level Approver', description: 'Technical and compliance review' },
            { level: 3, role: 'Final Approver', description: 'Final approval and sign-off' }
        ]
    },
    {
        id: 'wf-template-002',
        name: 'Finance 4-Level Approval',
        department: 'Finance',
        fileTypes: ['Budget', 'Contract', 'Proposal'],
        levels: [
            { level: 1, role: 'First Level Approver', description: 'Initial financial review' },
            { level: 2, role: 'Second Level Approver', description: 'Budget verification' },
            { level: 3, role: 'Third Level Approver', description: 'Compliance check' },
            { level: 4, role: 'Final Approver', description: 'Final approval' }
        ]
    },
    {
        id: 'wf-template-003',
        name: 'Quick 2-Level Approval',
        department: 'Administration',
        fileTypes: ['Memo', 'Correspondence', 'Circular', 'General'],
        levels: [
            { level: 1, role: 'First Level Approver', description: 'Review and verification' },
            { level: 2, role: 'Final Approver', description: 'Final approval' }
        ]
    },
    {
        id: 'wf-template-004',
        name: 'Engineering Project Approval',
        department: 'Engineering',
        fileTypes: ['Proposal', 'Report', 'Contract'],
        levels: [
            { level: 1, role: 'First Level Approver', description: 'Technical review' },
            { level: 2, role: 'Second Level Approver', description: 'Project feasibility review' },
            { level: 3, role: 'Final Approver', description: 'Final approval' }
        ]
    },
    {
        id: 'wf-template-005',
        name: 'Default Single Level',
        department: null, // Applies to all if no specific template found
        fileTypes: ['General'],
        levels: [
            { level: 1, role: 'First Level Approver', description: 'Single approval' }
        ]
    }
];

// Get workflow template for a file type and department
export const getWorkflowTemplate = (department, fileType) => {
    // Try to find department + fileType specific template
    let template = workflowTemplates.find(
        t => t.department === department && t.fileTypes.includes(fileType)
    );

    // Fallback to department-only template
    if (!template) {
        template = workflowTemplates.find(
            t => t.department === department
        );
    }

    // Fallback to default
    if (!template) {
        template = workflowTemplates.find(t => t.department === null);
    }

    return template;
};

export default workflowTemplates;
