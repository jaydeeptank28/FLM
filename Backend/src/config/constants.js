// Server-side constants - FLM Production Standards
// Authoritative source for all FLM business rules

/**
 * Role Authority System
 * Each role has a numeric authority level.
 * Higher level = higher authority.
 * Used for skip logic: if creator's authority >= workflow level's required authority,
 * that level is automatically skipped.
 */
const ROLE_AUTHORITY = {
    'Clerk': 1,
    'Section Officer': 2,
    'Under Secretary': 3,
    'Deputy Secretary': 4,
    'Joint Secretary': 5,
    'Additional Secretary': 6,
    'Secretary': 7,
    'Admin': 0  
};

const ROLE_LABELS = {
    'Clerk': 'Clerk',
    'Section Officer': 'Section Officer',
    'Under Secretary': 'Under Secretary',
    'Deputy Secretary': 'Deputy Secretary',
    'Joint Secretary': 'Joint Secretary',
    'Additional Secretary': 'Additional Secretary',
    'Secretary': 'Secretary',
    'Admin': 'Administrator'
};

// Get all workflow-eligible roles (excludes Admin)
const WORKFLOW_ROLES = Object.keys(ROLE_AUTHORITY).filter(r => r !== 'Admin');

// Get role authority level
function getRoleAuthority(role) {
    return ROLE_AUTHORITY[role] || 0;
}

// Check if role1 has higher or equal authority than role2
function hasHigherOrEqualAuthority(role1, role2) {
    return getRoleAuthority(role1) >= getRoleAuthority(role2);
}

module.exports = {
    // Role Authority System
    ROLE_AUTHORITY,
    ROLE_LABELS,
    WORKFLOW_ROLES,
    getRoleAuthority,
    hasHigherOrEqualAuthority,

    // File States
    FILE_STATES: {
        DRAFT: 'DRAFT',
        IN_REVIEW: 'IN_REVIEW',
        RETURNED: 'RETURNED',
        CABINET: 'CABINET',       // On hold
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

    // Valid state transitions (action allowed from state)
    STATE_TRANSITIONS: {
        DRAFT: ['SAVE_DRAFT', 'SUBMIT'],
        IN_REVIEW: ['APPROVE', 'RETURN', 'HOLD', 'REJECT'],
        RETURNED: ['RESUBMIT'],
        CABINET: ['RESUME'],
        APPROVED: ['ARCHIVE'],
        REJECTED: [],
        ARCHIVED: []
    },

    // Workflow Level Status
    LEVEL_STATUS: {
        PENDING: 'PENDING',    // Not yet reached
        ACTIVE: 'ACTIVE',      // Current level
        COMPLETED: 'COMPLETED', // Approved at this level
        SKIPPED: 'SKIPPED',    // Skipped due to creator authority
        RETURNED: 'RETURNED'   // Returned from this level
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
    },

    WORKFLOW_SCOPE_REASONS: {
        DEPARTMENT_FILETYPE_MATCH: 'DEPARTMENT_FILETYPE_MATCH',
        DEPARTMENT_DEFAULT: 'DEPARTMENT_DEFAULT',
        GLOBAL_DEFAULT: 'GLOBAL_DEFAULT'
    }
};
