// Sample Files Data for initial demo
// These files demonstrate various states and workflows

import { v4 as uuidv4 } from 'uuid';

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const weekAgo = new Date(Date.now() - 604800000).toISOString();

export const sampleFiles = [
    // HR Department Files
    {
        id: 'file-001',
        fileNumber: 'FLM/HR/2024/0001',
        subject: 'Annual Budget Proposal 2024-25',
        fileType: 'Budget',
        department: 'HR',
        priority: 'High',
        currentState: 'IN_REVIEW',
        createdBy: 'user-002', // Priya Sharma - HR Initiator
        createdAt: weekAgo,
        updatedAt: yesterday,

        notings: [
            {
                id: 'noting-001',
                content: 'This budget proposal covers all HR initiatives for FY 2024-25 including recruitment, training, and employee welfare programs.',
                addedBy: 'user-002',
                addedAt: weekAgo,
                type: 'NOTING'
            },
            {
                id: 'noting-002',
                content: 'Proposal reviewed. Training budget should be increased by 10% to cover new skill development programs.',
                addedBy: 'user-001', // Ramesh Kumar - HR First Level Approver
                addedAt: twoDaysAgo,
                type: 'OBSERVATION'
            }
        ],

        documents: [
            {
                id: 'doc-001',
                name: 'HR_Budget_2024-25.pdf',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-002',
                        size: 245000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            },
            {
                id: 'doc-002',
                name: 'Training_Expenses_Breakdown.xlsx',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-002',
                        size: 89000
                    },
                    {
                        version: 2,
                        uploadedAt: twoDaysAgo,
                        uploadedBy: 'user-002',
                        size: 92500
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            }
        ],

        workflow: {
            templateId: 'wf-template-001',
            currentLevel: 2,
            maxLevels: 3,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'HR',
                    assignedUser: null,
                    action: 'APPROVED',
                    actionAt: twoDaysAgo,
                    actionBy: 'user-001',
                    remarks: 'Approved. Please increase training budget as suggested.'
                }
            ],
            history: [
                { level: 1, action: 'SUBMITTED', at: weekAgo, by: 'user-002' },
                { level: 1, action: 'APPROVED', at: twoDaysAgo, by: 'user-001' }
            ]
        },

        attributeHistory: [
            {
                field: 'priority',
                oldValue: 'Medium',
                newValue: 'High',
                changedBy: 'user-001',
                changedAt: twoDaysAgo
            }
        ],

        auditTrail: [
            {
                id: 'audit-001',
                action: 'CREATED',
                performedBy: 'user-002',
                performedAt: weekAgo,
                details: 'File created'
            },
            {
                id: 'audit-002',
                action: 'DOCUMENT_ADDED',
                performedBy: 'user-002',
                performedAt: weekAgo,
                details: 'Document HR_Budget_2024-25.pdf added'
            },
            {
                id: 'audit-003',
                action: 'SUBMITTED',
                performedBy: 'user-002',
                performedAt: weekAgo,
                details: 'File submitted for First Level Approval'
            },
            {
                id: 'audit-004',
                action: 'APPROVED',
                performedBy: 'user-001',
                performedAt: twoDaysAgo,
                details: 'Approved at Level 1. Moved to Level 2.'
            },
            {
                id: 'audit-005',
                action: 'PRIORITY_CHANGED',
                performedBy: 'user-001',
                performedAt: twoDaysAgo,
                details: 'Priority changed from Medium to High'
            }
        ],

        sharedWith: ['user-008'],
        trackedBy: ['user-002', 'user-001']
    },

    // Draft File
    {
        id: 'file-002',
        fileNumber: 'FLM/HR/2024/0002',
        subject: 'Employee Wellness Program Proposal',
        fileType: 'Proposal',
        department: 'HR',
        priority: 'Medium',
        currentState: 'DRAFT',
        createdBy: 'user-008', // Neha Joshi - HR Initiator
        createdAt: yesterday,
        updatedAt: yesterday,

        notings: [
            {
                id: 'noting-010',
                content: 'Draft proposal for introducing mental health and wellness initiatives.',
                addedBy: 'user-008',
                addedAt: yesterday,
                type: 'NOTING'
            }
        ],

        documents: [],

        workflow: {
            templateId: 'wf-template-001',
            currentLevel: 0,
            maxLevels: 3,
            participants: [],
            history: []
        },

        attributeHistory: [],

        auditTrail: [
            {
                id: 'audit-010',
                action: 'CREATED',
                performedBy: 'user-008',
                performedAt: yesterday,
                details: 'File created as draft'
            }
        ],

        sharedWith: [],
        trackedBy: ['user-008']
    },

    // Finance File - Cabinet (On Hold)
    {
        id: 'file-003',
        fileNumber: 'FLM/FIN/2024/0001',
        subject: 'Vendor Contract Renewal - ABC Corp',
        fileType: 'Contract',
        department: 'Finance',
        priority: 'High',
        currentState: 'CABINET',
        createdBy: 'user-001', // Ramesh Kumar - Finance Initiator
        createdAt: weekAgo,
        updatedAt: twoDaysAgo,

        notings: [
            {
                id: 'noting-020',
                content: 'Contract renewal for ABC Corp for IT services. Current contract expires in 45 days.',
                addedBy: 'user-001',
                addedAt: weekAgo,
                type: 'NOTING'
            },
            {
                id: 'noting-021',
                content: 'Put on hold pending legal review of new terms.',
                addedBy: 'user-004', // Kavita Gupta - Finance First Level
                addedAt: twoDaysAgo,
                type: 'DIRECTION'
            }
        ],

        documents: [
            {
                id: 'doc-010',
                name: 'ABC_Corp_Contract_Draft.pdf',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-001',
                        size: 156000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            }
        ],

        workflow: {
            templateId: 'wf-template-002',
            currentLevel: 1,
            maxLevels: 4,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'Finance',
                    action: 'HOLD',
                    actionAt: twoDaysAgo,
                    actionBy: 'user-004',
                    remarks: 'On hold - awaiting legal review'
                }
            ],
            history: [
                { level: 1, action: 'SUBMITTED', at: weekAgo, by: 'user-001' },
                { level: 1, action: 'HOLD', at: twoDaysAgo, by: 'user-004' }
            ]
        },

        attributeHistory: [],

        auditTrail: [
            {
                id: 'audit-020',
                action: 'CREATED',
                performedBy: 'user-001',
                performedAt: weekAgo,
                details: 'File created'
            },
            {
                id: 'audit-021',
                action: 'SUBMITTED',
                performedBy: 'user-001',
                performedAt: weekAgo,
                details: 'File submitted for approval'
            },
            {
                id: 'audit-022',
                action: 'HOLD',
                performedBy: 'user-004',
                performedAt: twoDaysAgo,
                details: 'File placed in Cabinet pending legal review'
            }
        ],

        sharedWith: [],
        trackedBy: ['user-001']
    },

    // Returned File
    {
        id: 'file-004',
        fileNumber: 'FLM/ENG/2024/0001',
        subject: 'Server Infrastructure Upgrade Proposal',
        fileType: 'Proposal',
        department: 'Engineering',
        priority: 'High',
        currentState: 'RETURNED',
        createdBy: 'user-003', // Amit Singh - Engineering Initiator
        createdAt: weekAgo,
        updatedAt: yesterday,

        notings: [
            {
                id: 'noting-030',
                content: 'Proposal for upgrading server infrastructure to support increased load.',
                addedBy: 'user-003',
                addedAt: weekAgo,
                type: 'NOTING'
            },
            {
                id: 'noting-031',
                content: 'Please provide cost comparison with alternative vendors before approval.',
                addedBy: 'user-005', // Suresh Reddy - Eng First Level
                addedAt: yesterday,
                type: 'DIRECTION'
            }
        ],

        documents: [
            {
                id: 'doc-020',
                name: 'Server_Upgrade_Proposal.pdf',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-003',
                        size: 320000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            }
        ],

        workflow: {
            templateId: 'wf-template-004',
            currentLevel: 1,
            maxLevels: 3,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'Engineering',
                    action: 'RETURNED',
                    actionAt: yesterday,
                    actionBy: 'user-005',
                    remarks: 'Need vendor comparison'
                }
            ],
            history: [
                { level: 1, action: 'SUBMITTED', at: weekAgo, by: 'user-003' },
                { level: 1, action: 'RETURNED', at: yesterday, by: 'user-005' }
            ]
        },

        attributeHistory: [],

        auditTrail: [
            {
                id: 'audit-030',
                action: 'CREATED',
                performedBy: 'user-003',
                performedAt: weekAgo,
                details: 'File created'
            },
            {
                id: 'audit-031',
                action: 'SUBMITTED',
                performedBy: 'user-003',
                performedAt: weekAgo,
                details: 'File submitted for review'
            },
            {
                id: 'audit-032',
                action: 'RETURNED',
                performedBy: 'user-005',
                performedAt: yesterday,
                details: 'File returned - vendor comparison required'
            }
        ],

        sharedWith: [],
        trackedBy: ['user-003']
    },

    // Approved File
    {
        id: 'file-005',
        fileNumber: 'FLM/ADM/2024/0001',
        subject: 'Office Renovation - Phase 1',
        fileType: 'Proposal',
        department: 'Administration',
        priority: 'Medium',
        currentState: 'APPROVED',
        createdBy: 'user-007', // Vikram Patel - Admin Initiator
        createdAt: weekAgo,
        updatedAt: twoDaysAgo,

        notings: [
            {
                id: 'noting-040',
                content: 'Proposal for renovating the east wing conference rooms.',
                addedBy: 'user-007',
                addedAt: weekAgo,
                type: 'NOTING'
            },
            {
                id: 'noting-041',
                content: 'Approved. Work may commence.',
                addedBy: 'user-006', // Anita Desai - Final Approver
                addedAt: twoDaysAgo,
                type: 'NOTING'
            }
        ],

        documents: [
            {
                id: 'doc-030',
                name: 'Renovation_Plan.pdf',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-007',
                        size: 1250000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            },
            {
                id: 'doc-031',
                name: 'Cost_Estimate.xlsx',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: weekAgo,
                        uploadedBy: 'user-007',
                        size: 45000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            }
        ],

        workflow: {
            templateId: 'wf-template-003',
            currentLevel: 2,
            maxLevels: 2,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'Administration',
                    action: 'APPROVED',
                    actionAt: twoDaysAgo,
                    actionBy: 'user-002', // Priya Sharma - Admin First Level
                    remarks: 'Looks good, forwarding for final approval'
                },
                {
                    level: 2,
                    role: 'Final Approver',
                    department: 'Administration',
                    action: 'APPROVED',
                    actionAt: twoDaysAgo,
                    actionBy: 'user-006',
                    remarks: 'Approved'
                }
            ],
            history: [
                { level: 1, action: 'SUBMITTED', at: weekAgo, by: 'user-007' },
                { level: 1, action: 'APPROVED', at: twoDaysAgo, by: 'user-002' },
                { level: 2, action: 'APPROVED', at: twoDaysAgo, by: 'user-006' }
            ]
        },

        attributeHistory: [],

        auditTrail: [
            {
                id: 'audit-040',
                action: 'CREATED',
                performedBy: 'user-007',
                performedAt: weekAgo,
                details: 'File created'
            },
            {
                id: 'audit-041',
                action: 'SUBMITTED',
                performedBy: 'user-007',
                performedAt: weekAgo,
                details: 'File submitted for approval'
            },
            {
                id: 'audit-042',
                action: 'APPROVED',
                performedBy: 'user-002',
                performedAt: twoDaysAgo,
                details: 'Approved at Level 1'
            },
            {
                id: 'audit-043',
                action: 'APPROVED',
                performedBy: 'user-006',
                performedAt: twoDaysAgo,
                details: 'Final approval granted'
            }
        ],

        sharedWith: ['user-002', 'user-006'],
        trackedBy: ['user-007']
    },

    // Archived File
    {
        id: 'file-006',
        fileNumber: 'FLM/HR/2023/0015',
        subject: 'Annual Training Plan 2023',
        fileType: 'Policy',
        department: 'HR',
        priority: 'Low',
        currentState: 'ARCHIVED',
        createdBy: 'user-002',
        createdAt: new Date('2023-03-15').toISOString(),
        updatedAt: new Date('2023-04-10').toISOString(),

        notings: [
            {
                id: 'noting-050',
                content: 'Annual training plan for 2023 covering all departments.',
                addedBy: 'user-002',
                addedAt: new Date('2023-03-15').toISOString(),
                type: 'NOTING'
            }
        ],

        documents: [
            {
                id: 'doc-040',
                name: 'Training_Plan_2023.pdf',
                type: 'NORMAL',
                versions: [
                    {
                        version: 1,
                        uploadedAt: new Date('2023-03-15').toISOString(),
                        uploadedBy: 'user-002',
                        size: 180000
                    }
                ],
                linkedFileId: null,
                linkedDaakId: null
            }
        ],

        workflow: {
            templateId: 'wf-template-001',
            currentLevel: 3,
            maxLevels: 3,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'HR',
                    action: 'APPROVED',
                    actionAt: new Date('2023-03-20').toISOString(),
                    actionBy: 'user-001',
                    remarks: 'Approved'
                },
                {
                    level: 2,
                    role: 'Second Level Approver',
                    department: 'HR',
                    action: 'APPROVED',
                    actionAt: new Date('2023-03-25').toISOString(),
                    actionBy: 'user-003',
                    remarks: 'Approved'
                },
                {
                    level: 3,
                    role: 'Final Approver',
                    department: 'HR',
                    action: 'APPROVED',
                    actionAt: new Date('2023-04-01').toISOString(),
                    actionBy: 'user-006',
                    remarks: 'Final approval'
                }
            ],
            history: []
        },

        attributeHistory: [],

        auditTrail: [
            {
                id: 'audit-050',
                action: 'CREATED',
                performedBy: 'user-002',
                performedAt: new Date('2023-03-15').toISOString(),
                details: 'File created'
            },
            {
                id: 'audit-051',
                action: 'ARCHIVED',
                performedBy: 'user-010', // Admin
                performedAt: new Date('2023-04-10').toISOString(),
                details: 'File archived'
            }
        ],

        sharedWith: [],
        trackedBy: []
    }
];

export default sampleFiles;
