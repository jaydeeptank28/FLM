// Sample Daak (Correspondence) Data

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const weekAgo = new Date(Date.now() - 604800000).toISOString();

export const sampleDaak = [
    // Inward Daak
    {
        id: 'daak-001',
        daakNumber: 'DAAK/IN/2024/0001',
        type: 'INWARD',
        subject: 'Request for Budget Revision - Ministry of Finance',
        letterDate: weekAgo,
        receivedDate: weekAgo,
        referenceNumber: 'MOF/BUD/2024/156',
        mode: 'Post',

        senderName: 'Ministry of Finance',
        senderAddress: 'North Block, New Delhi - 110001',
        receiverName: null,
        receiverAddress: null,

        attachments: [
            {
                id: 'daak-att-001',
                name: 'Budget_Revision_Request.pdf',
                uploadedAt: weekAgo,
                uploadedBy: 'user-007'
            }
        ],

        notings: [
            {
                id: 'daak-noting-001',
                content: 'Letter received from Ministry requesting budget revision for Q4.',
                addedBy: 'user-007',
                addedAt: weekAgo,
                type: 'NOTING'
            },
            {
                id: 'daak-noting-002',
                content: 'Forwarding to Finance department for necessary action.',
                addedBy: 'user-007',
                addedAt: twoDaysAgo,
                type: 'DIRECTION'
            }
        ],

        linkedFileId: 'file-003', // Linked to Finance file

        workflow: {
            currentLevel: 1,
            maxLevels: 2,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'Administration',
                    action: 'SENT',
                    actionAt: twoDaysAgo,
                    actionBy: 'user-007',
                    remarks: 'Forwarded to Finance'
                }
            ],
            history: []
        },

        auditTrail: [
            {
                id: 'daak-audit-001',
                action: 'RECEIVED',
                performedBy: 'user-007',
                performedAt: weekAgo,
                details: 'Inward correspondence received and logged'
            },
            {
                id: 'daak-audit-002',
                action: 'LINKED',
                performedBy: 'user-007',
                performedAt: twoDaysAgo,
                details: 'Linked to File FLM/FIN/2024/0001'
            }
        ],

        currentState: 'IN_REVIEW',
        department: 'Finance',
        createdBy: 'user-007',
        createdAt: weekAgo,
        updatedAt: twoDaysAgo
    },

    // Inward Daak - Pending
    {
        id: 'daak-002',
        daakNumber: 'DAAK/IN/2024/0002',
        type: 'INWARD',
        subject: 'Invitation for Annual HR Conference 2024',
        letterDate: twoDaysAgo,
        receivedDate: yesterday,
        referenceNumber: 'HRCONF/2024/INV/089',
        mode: 'Email',

        senderName: 'HR Association of India',
        senderAddress: 'Mumbai, Maharashtra - 400001',
        receiverName: null,
        receiverAddress: null,

        attachments: [
            {
                id: 'daak-att-002',
                name: 'Conference_Invitation.pdf',
                uploadedAt: yesterday,
                uploadedBy: 'user-007'
            },
            {
                id: 'daak-att-003',
                name: 'Conference_Brochure.pdf',
                uploadedAt: yesterday,
                uploadedBy: 'user-007'
            }
        ],

        notings: [
            {
                id: 'daak-noting-010',
                content: 'Invitation received for HR Conference. Forwarding to HR department.',
                addedBy: 'user-007',
                addedAt: yesterday,
                type: 'NOTING'
            }
        ],

        linkedFileId: null,

        workflow: {
            currentLevel: 0,
            maxLevels: 2,
            participants: [],
            history: []
        },

        auditTrail: [
            {
                id: 'daak-audit-010',
                action: 'RECEIVED',
                performedBy: 'user-007',
                performedAt: yesterday,
                details: 'Inward correspondence received'
            }
        ],

        currentState: 'PENDING',
        department: 'HR',
        createdBy: 'user-007',
        createdAt: yesterday,
        updatedAt: yesterday
    },

    // Outward Daak
    {
        id: 'daak-003',
        daakNumber: 'DAAK/OUT/2024/0001',
        type: 'OUTWARD',
        subject: 'Reply to Budget Revision Request',
        letterDate: yesterday,
        receivedDate: null,
        referenceNumber: 'ORG/FIN/2024/REP/001',
        mode: 'Post',

        senderName: null,
        senderAddress: null,
        receiverName: 'Ministry of Finance',
        receiverAddress: 'North Block, New Delhi - 110001',

        attachments: [
            {
                id: 'daak-att-010',
                name: 'Budget_Revision_Response.pdf',
                uploadedAt: yesterday,
                uploadedBy: 'user-004'
            }
        ],

        notings: [
            {
                id: 'daak-noting-020',
                content: 'Response letter prepared addressing the budget revision request.',
                addedBy: 'user-004',
                addedAt: yesterday,
                type: 'NOTING'
            }
        ],

        linkedFileId: 'file-003',

        workflow: {
            currentLevel: 1,
            maxLevels: 2,
            participants: [
                {
                    level: 1,
                    role: 'First Level Approver',
                    department: 'Finance',
                    action: 'APPROVED',
                    actionAt: yesterday,
                    actionBy: 'user-004',
                    remarks: 'Ready for dispatch'
                }
            ],
            history: []
        },

        auditTrail: [
            {
                id: 'daak-audit-020',
                action: 'CREATED',
                performedBy: 'user-004',
                performedAt: yesterday,
                details: 'Outward correspondence created'
            },
            {
                id: 'daak-audit-021',
                action: 'APPROVED',
                performedBy: 'user-004',
                performedAt: yesterday,
                details: 'Approved for dispatch'
            }
        ],

        currentState: 'DISPATCHED',
        department: 'Finance',
        createdBy: 'user-004',
        createdAt: yesterday,
        updatedAt: yesterday
    },

    // Archived Daak
    {
        id: 'daak-004',
        daakNumber: 'DAAK/IN/2023/0045',
        type: 'INWARD',
        subject: 'Annual Audit Completion Notice',
        letterDate: new Date('2023-06-15').toISOString(),
        receivedDate: new Date('2023-06-18').toISOString(),
        referenceNumber: 'CAG/AUD/2023/COMP/789',
        mode: 'Post',

        senderName: 'Comptroller and Auditor General',
        senderAddress: 'CAG Office, New Delhi',
        receiverName: null,
        receiverAddress: null,

        attachments: [
            {
                id: 'daak-att-020',
                name: 'Audit_Completion_Certificate.pdf',
                uploadedAt: new Date('2023-06-18').toISOString(),
                uploadedBy: 'user-007'
            }
        ],

        notings: [
            {
                id: 'daak-noting-030',
                content: 'Annual audit completed. No discrepancies found.',
                addedBy: 'user-007',
                addedAt: new Date('2023-06-18').toISOString(),
                type: 'NOTING'
            }
        ],

        linkedFileId: null,

        workflow: {
            currentLevel: 2,
            maxLevels: 2,
            participants: [],
            history: []
        },

        auditTrail: [
            {
                id: 'daak-audit-030',
                action: 'RECEIVED',
                performedBy: 'user-007',
                performedAt: new Date('2023-06-18').toISOString(),
                details: 'Inward correspondence received'
            },
            {
                id: 'daak-audit-031',
                action: 'ARCHIVED',
                performedBy: 'user-010',
                performedAt: new Date('2023-07-01').toISOString(),
                details: 'Correspondence archived'
            }
        ],

        currentState: 'ARCHIVED',
        department: 'Finance',
        createdBy: 'user-007',
        createdAt: new Date('2023-06-18').toISOString(),
        updatedAt: new Date('2023-07-01').toISOString()
    }
];

export default sampleDaak;
