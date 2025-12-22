// Server-side constants - mirrors frontend but authoritative
module.exports = {
    // File States
    FILE_STATES: {
        DRAFT: 'DRAFT',
        SUBMITTED: 'SUBMITTED',
        IN_REVIEW: 'IN_REVIEW',
        RETURNED: 'RETURNED',
        CABINET: 'CABINET',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        ARCHIVED: 'ARCHIVED'
    },

    // Workflow Actions
    WORKFLOW_ACTIONS: {
        SAVE_DRAFT: 'SAVE_DRAFT',
        SUBMIT: 'SUBMIT',
        APPROVE: 'APPROVE',
        RETURN: 'RETURN',
        RESUBMIT: 'RESUBMIT',
        HOLD: 'HOLD',
        RESUME: 'RESUME',
        REJECT: 'REJECT',
        ARCHIVE: 'ARCHIVE'
    },

    // Valid state transitions
    STATE_TRANSITIONS: {
        DRAFT: ['SAVE_DRAFT', 'SUBMIT'],
        SUBMITTED: [],
        IN_REVIEW: ['APPROVE', 'RETURN', 'HOLD', 'REJECT'],
        RETURNED: ['RESUBMIT'],
        CABINET: ['RESUME'],
        APPROVED: ['ARCHIVE'],
        REJECTED: [],
        ARCHIVED: []
    },

    // Roles
    ROLES: {
        INITIATOR: 'Initiator',
        FIRST_LEVEL_APPROVER: 'First Level Approver',
        SECOND_LEVEL_APPROVER: 'Second Level Approver',
        THIRD_LEVEL_APPROVER: 'Third Level Approver',
        FINAL_APPROVER: 'Final Approver',
        ADMIN: 'Admin'
    },

    // Daak States
    DAAK_STATES: {
        RECEIVED: 'RECEIVED',
        PENDING: 'PENDING',
        IN_REVIEW: 'IN_REVIEW',
        DISPATCHED: 'DISPATCHED',
        ARCHIVED: 'ARCHIVED'
    },

    // Daak Types
    DAAK_TYPES: {
        INWARD: 'INWARD',
        OUTWARD: 'OUTWARD'
    },

    // Priorities
    PRIORITIES: {
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low'
    },

    // File Types
    FILE_TYPES: [
        'Budget',
        'Policy',
        'Correspondence',
        'Proposal',
        'Report',
        'Contract',
        'Memo',
        'Circular',
        'General'
    ],

    // Noting Types
    NOTING_TYPES: {
        NOTING: 'NOTING',
        DIRECTION: 'DIRECTION',
        OBSERVATION: 'OBSERVATION'
    }
};
