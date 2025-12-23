// Application Constants and Enums

// File States
export const FILE_STATES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  RETURNED: 'RETURNED',
  CABINET: 'CABINET',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED'
};

// State Labels for display
export const FILE_STATE_LABELS = {
  [FILE_STATES.DRAFT]: 'Draft',
  [FILE_STATES.SUBMITTED]: 'Submitted',
  [FILE_STATES.IN_REVIEW]: 'In Review',
  [FILE_STATES.RETURNED]: 'Returned',
  [FILE_STATES.CABINET]: 'Cabinet (On Hold)',
  [FILE_STATES.APPROVED]: 'Approved',
  [FILE_STATES.REJECTED]: 'Rejected',
  [FILE_STATES.ARCHIVED]: 'Archived'
};

// State Colors for badges
export const FILE_STATE_COLORS = {
  [FILE_STATES.DRAFT]: 'default',
  [FILE_STATES.SUBMITTED]: 'info',
  [FILE_STATES.IN_REVIEW]: 'warning',
  [FILE_STATES.RETURNED]: 'error',
  [FILE_STATES.CABINET]: 'secondary',
  [FILE_STATES.APPROVED]: 'success',
  [FILE_STATES.REJECTED]: 'error',
  [FILE_STATES.ARCHIVED]: 'default'
};

// Workflow Actions
export const WORKFLOW_ACTIONS = {
  SAVE_DRAFT: 'SAVE_DRAFT',
  SUBMIT: 'SUBMIT',
  SEND: 'SEND',
  APPROVE: 'APPROVE',
  RETURN: 'RETURN',
  RESUBMIT: 'RESUBMIT',
  HOLD: 'HOLD',
  RESUME: 'RESUME',
  REJECT: 'REJECT',
  ARCHIVE: 'ARCHIVE'
};

// Action Labels
export const WORKFLOW_ACTION_LABELS = {
  [WORKFLOW_ACTIONS.SAVE_DRAFT]: 'Save Draft',
  [WORKFLOW_ACTIONS.SUBMIT]: 'Submit',
  [WORKFLOW_ACTIONS.SEND]: 'Send',
  [WORKFLOW_ACTIONS.APPROVE]: 'Approve',
  [WORKFLOW_ACTIONS.RETURN]: 'Return',
  [WORKFLOW_ACTIONS.RESUBMIT]: 'Resubmit',
  [WORKFLOW_ACTIONS.HOLD]: 'Hold',
  [WORKFLOW_ACTIONS.RESUME]: 'Resume',
  [WORKFLOW_ACTIONS.REJECT]: 'Reject',
  [WORKFLOW_ACTIONS.ARCHIVE]: 'Archive'
};

// Allowed transitions per state
export const STATE_TRANSITIONS = {
  [FILE_STATES.DRAFT]: [WORKFLOW_ACTIONS.SAVE_DRAFT, WORKFLOW_ACTIONS.SUBMIT],
  [FILE_STATES.SUBMITTED]: [], // Auto-transitions to IN_REVIEW
  [FILE_STATES.IN_REVIEW]: [
    WORKFLOW_ACTIONS.APPROVE,
    WORKFLOW_ACTIONS.RETURN,
    WORKFLOW_ACTIONS.HOLD,
    WORKFLOW_ACTIONS.REJECT
  ],
  [FILE_STATES.RETURNED]: [WORKFLOW_ACTIONS.RESUBMIT],
  [FILE_STATES.CABINET]: [WORKFLOW_ACTIONS.RESUME],
  [FILE_STATES.APPROVED]: [WORKFLOW_ACTIONS.ARCHIVE],
  [FILE_STATES.REJECTED]: [],
  [FILE_STATES.ARCHIVED]: []
};

// FLM Standard Roles with Authority Levels
export const ROLES = {
  Clerk: 'Clerk',
  Section_Officer: 'Section_Officer',
  Under_Secretary: 'Under_Secretary',
  Deputy_Secretary: 'Deputy_Secretary',
  Joint_Secretary: 'Joint_Secretary',
  Additional_Secretary: 'Additional_Secretary',
  Secretary: 'Secretary',
  Admin: 'Admin'
};

// Role display labels
export const ROLE_LABELS = {
  [ROLES.Clerk]: 'Clerk',
  [ROLES.Section_Officer]: 'Section Officer',
  [ROLES.Under_Secretary]: 'Under Secretary',
  [ROLES.Deputy_Secretary]: 'Deputy Secretary',
  [ROLES.Joint_Secretary]: 'Joint Secretary',
  [ROLES.Additional_Secretary]: 'Additional Secretary',
  [ROLES.Secretary]: 'Secretary',
  [ROLES.Admin]: 'Administrator'
};

// Role authority levels (for skip logic display)
export const ROLE_AUTHORITY = {
  [ROLES.Clerk]: 1,
  [ROLES.Section_Officer]: 2,
  [ROLES.Under_Secretary]: 3,
  [ROLES.Deputy_Secretary]: 4,
  [ROLES.Joint_Secretary]: 5,
  [ROLES.Additional_Secretary]: 6,
  [ROLES.Secretary]: 7,
  [ROLES.Admin]: 0  // Admin has management authority, not workflow authority
};

// Workflow-eligible roles (excludes Admin)
export const WORKFLOW_ROLES = Object.keys(ROLES).filter(r => r !== 'Admin');

// Workflow Level Status
export const LEVEL_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  RETURNED: 'RETURNED'
};

export const LEVEL_STATUS_LABELS = {
  [LEVEL_STATUS.PENDING]: 'Pending',
  [LEVEL_STATUS.ACTIVE]: 'Active',
  [LEVEL_STATUS.COMPLETED]: 'Completed',
  [LEVEL_STATUS.SKIPPED]: 'Skipped',
  [LEVEL_STATUS.RETURNED]: 'Returned'
};

export const LEVEL_STATUS_COLORS = {
  [LEVEL_STATUS.PENDING]: 'default',
  [LEVEL_STATUS.ACTIVE]: 'warning',
  [LEVEL_STATUS.COMPLETED]: 'success',
  [LEVEL_STATUS.SKIPPED]: 'info',
  [LEVEL_STATUS.RETURNED]: 'error'
};

// Departments
export const DEPARTMENTS = {
  HR: 'HR',
  FINANCE: 'Finance',
  ENGINEERING: 'Engineering',
  ADMINISTRATION: 'Administration'
};

// Priority Levels
export const PRIORITIES = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const PRIORITY_COLORS = {
  [PRIORITIES.HIGH]: 'error',
  [PRIORITIES.MEDIUM]: 'warning',
  [PRIORITIES.LOW]: 'success'
};

// File Types
export const FILE_TYPES = {
  BUDGET: 'Budget',
  POLICY: 'Policy',
  CORRESPONDENCE: 'Correspondence',
  PROPOSAL: 'Proposal',
  REPORT: 'Report',
  CONTRACT: 'Contract',
  MEMO: 'Memo',
  CIRCULAR: 'Circular',
  GENERAL: 'General'
};

// Document Types
export const DOCUMENT_TYPES = {
  NORMAL: 'Normal',
  COMPARISON_SHEET: 'Comparison Sheet',
  REFERENCE: 'Reference',
  DAAK_LETTER: 'Daak Letter'
};

// Noting Types
export const NOTING_TYPES = {
  NOTING: 'Noting',
  DIRECTION: 'Direction',
  OBSERVATION: 'Observation'
};

// Daak Types
export const DAAK_TYPES = {
  INWARD: 'Inward',
  OUTWARD: 'Outward'
};

// Daak States
export const DAAK_STATES = {
  RECEIVED: 'RECEIVED',
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  DISPATCHED: 'DISPATCHED',
  ARCHIVED: 'ARCHIVED'
};

export const DAAK_STATE_LABELS = {
  [DAAK_STATES.RECEIVED]: 'Received',
  [DAAK_STATES.PENDING]: 'Pending',
  [DAAK_STATES.IN_REVIEW]: 'In Review',
  [DAAK_STATES.DISPATCHED]: 'Dispatched',
  [DAAK_STATES.ARCHIVED]: 'Archived'
};

export const DAAK_STATE_COLORS = {
  [DAAK_STATES.RECEIVED]: 'info',
  [DAAK_STATES.PENDING]: 'warning',
  [DAAK_STATES.IN_REVIEW]: 'warning',
  [DAAK_STATES.DISPATCHED]: 'success',
  [DAAK_STATES.ARCHIVED]: 'default'
};

// Daak Modes
export const DAAK_MODES = {
  POST: 'Post',
  EMAIL: 'Email',
  HAND_DELIVERY: 'Hand Delivery',
  FAX: 'Fax',
  COURIER: 'Courier'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  FILES: 'flm_files',
  DAAK: 'flm_daak',
  USERS: 'flm_users',
  CURRENT_USER: 'flm_current_user',
  CURRENT_DEPARTMENT: 'flm_current_department'
};

// Folder Types for Dashboard
export const FOLDERS = {
  IN_TRAY: 'in-tray',
  DRAFT: 'draft',
  SENT: 'sent',
  CABINET: 'cabinet',
  SHARED: 'shared',
  TRACKED: 'tracked',
  ARCHIVED: 'archived'
};

export const FOLDER_LABELS = {
  [FOLDERS.IN_TRAY]: 'In-Tray',
  [FOLDERS.DRAFT]: 'Draft',
  [FOLDERS.SENT]: 'Sent',
  [FOLDERS.CABINET]: 'Cabinet',
  [FOLDERS.SHARED]: 'Shared',
  [FOLDERS.TRACKED]: 'Tracked',
  [FOLDERS.ARCHIVED]: 'Archived'
};
