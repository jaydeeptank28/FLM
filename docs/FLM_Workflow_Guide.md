# FLM Workflow System - Complete Guide

## Overview

The FLM (File Lifecycle Management) system uses a **role-based multi-level approval workflow**. This guide explains how everything works together.

---

## 🔑 Key Concepts

### 1. Users & Roles

Every user has a **role** that determines what workflow actions they can perform.

### 2. Workflow Templates

A workflow template defines the **approval chain** - how many levels of approval a file needs and which roles are required at each level.

### 3. Workflow Levels

Each level in a workflow requires a specific **role**. A file moves from Level 1 → Level 2 → Level 3 (etc.) as it gets approved.

### 4. File States

Files move through different states based on workflow actions:

```
DRAFT → IN_REVIEW → APPROVED
                  ↘ RETURNED → (corrections) → IN_REVIEW
                  ↘ REJECTED
                  ↘ CABINET (on hold)
```

---

## 📊 How the Workflow System Works

```
                    ┌─────────────────┐
                    │  User Creates   │
                    │     File        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Save as Draft? │
                    └────────┬────────┘
                        Yes  │  No
                   ┌─────────┴──────────┐
                   ▼                    ▼
            ┌──────────┐        ┌─────────────────┐
            │  DRAFT   │        │  IN_REVIEW L1   │
            └────┬─────┘        └────────┬────────┘
                 │ Submit               │
                 └──────────────────────┤
                                        ▼
                               ┌─────────────────┐
                               │ Level 1 Action  │
                               └────────┬────────┘
                    ┌──────────┬────────┴────────┬──────────┐
                    ▼          ▼                 ▼          ▼
              ┌──────────┐ ┌────────┐    ┌────────────┐ ┌────────┐
              │ APPROVE  │ │ RETURN │    │   REJECT   │ │  HOLD  │
              └────┬─────┘ └───┬────┘    └──────┬─────┘ └───┬────┘
                   │           │                │           │
              More Levels?  Back to        REJECTED     CABINET
                   │         Creator        (Closed)    (On Hold)
              Yes  │  No        │
         ┌─────────┴────┐       │
         ▼              ▼       └──────► Resubmit ──► Level 1
   IN_REVIEW L2    APPROVED
```

---

## 👥 Step 1: Understanding Roles

The system has these roles (defined in `server/src/config/constants.js`):

| Role                   | Hindi          | Level       | Can Do                    |
| ---------------------- | -------------- | ----------- | ------------------------- |
| `Clerk`                | लिपिक          | Entry Level | Create files, add notings |
| `Section_Officer`      | अनुभाग अधिकारी | Level 1     | Approve/Return at Level 1 |
| `Under_Secretary`      | अवर सचिव       | Level 2     | Approve/Return at Level 2 |
| `Deputy_Secretary`     | उप सचिव        | Level 3     | Approve/Return at Level 3 |
| `Joint_Secretary`      | संयुक्त सचिव   | Level 4     | Approve/Return at Level 4 |
| `Additional_Secretary` | अपर सचिव       | Level 5     | Approve/Return at Level 5 |
| `Secretary`            | सचिव           | Level 6     | Final Approval            |
| `Admin`                | प्रशासक        | All         | System administration     |

---

## 🛠️ Step 2: Create Workflow Template

A workflow template defines the approval chain.

### Example: 3-Level Approval Workflow

```
Level 1: Section Officer reviews
Level 2: Under Secretary reviews
Level 3: Deputy Secretary gives final approval
```

### How to Create Workflow Template:

**Option A: Using the Seed File**

Edit `server/src/db/seeds/001_initial_data.js`:

```javascript
// Create workflow template
const [workflowId] = await knex("workflow_templates")
  .insert({
    name: "Three Level Approval",
    description: "Standard 3-level approval process",
    max_levels: 3,
    is_default: true,
  })
  .returning("id");

// Add levels
await knex("workflow_template_levels").insert([
  {
    template_id: workflowId,
    level: 1,
    role: "Section_Officer",
    description: "Section Officer Review",
  },
  {
    template_id: workflowId,
    level: 2,
    role: "Under_Secretary",
    description: "Under Secretary Review",
  },
  {
    template_id: workflowId,
    level: 3,
    role: "Deputy_Secretary",
    description: "Deputy Secretary Final Approval",
  },
]);
```

**Option B: Using Admin UI**

1. Login as Admin
2. Go to Admin → Workflows
3. Click "Add Workflow"
4. Enter name and add levels

---

## 👤 Step 3: Create Users with Roles

Users need to be assigned to a department with a specific role.

### Example: Create a Complete Team

```
Finance Department Team:
├── Clerk1 (role: Clerk) - Creates files
├── SO1 (role: Section_Officer) - Approves Level 1
├── US1 (role: Under_Secretary) - Approves Level 2
└── DS1 (role: Deputy_Secretary) - Approves Level 3
```

### How to Create Users:

**Using Admin UI:**

1. Login as Admin (`admin@flm.local` / `admin123`)
2. Go to Admin → Users
3. Click "Add User"
4. Fill in:
   - **Name:** Clerk One
   - **Email:** clerk1@flm.local
   - **Password:** password123
   - **Department:** Finance
   - **Role:** Clerk
5. Click "Save"

Repeat for other roles:

| Name                 | Email         | Role             |
| -------------------- | ------------- | ---------------- |
| Section Officer One  | so1@flm.local | Section_Officer  |
| Under Secretary One  | us1@flm.local | Under_Secretary  |
| Deputy Secretary One | ds1@flm.local | Deputy_Secretary |

---

## 📁 Step 4: Create a File

### Who Can Create Files?

Any user can create files. Usually Clerk or Section Officer creates files.

### How to Create:

1. Login as Clerk (`clerk1@flm.local`)
2. Select Department (Finance)
3. Click "Create File" in sidebar
4. Fill in:
   - **File Type:** General / Correspondence / etc.
   - **Subject:** "Budget Proposal for Q1 2025"
   - **Priority:** Normal / High / Urgent
   - **Initial Noting:** "Please review and approve this budget proposal"
5. Choose action:
   - **Save as Draft** - File stays with you (DRAFT state)
   - **Submit for Approval** - File goes to Level 1 (IN_REVIEW state)

---

## 🔄 Step 5: How File Moves Through Levels

### Scenario: 3-Level Approval

```
┌─────────────────────────────────────────────────────────────────┐
│                        FILE JOURNEY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CLERK creates file                                              │
│     ↓                                                            │
│  [Submit for Approval]                                           │
│     ↓                                                            │
│  ════════════════════════════════════════════════════════════    │
│  LEVEL 1: Section Officer                                        │
│  ────────────────────────────────────────────────────────────    │
│  File appears in Section Officer's IN-TRAY                       │
│  SO opens file → sees "Approve", "Return", "Hold", "Reject"      │
│     ↓                                                            │
│  [Approve] clicked                                               │
│     ↓                                                            │
│  ════════════════════════════════════════════════════════════    │
│  LEVEL 2: Under Secretary                                        │
│  ────────────────────────────────────────────────────────────    │
│  File appears in Under Secretary's IN-TRAY                       │
│  US opens file → sees action buttons                             │
│     ↓                                                            │
│  [Approve] clicked                                               │
│     ↓                                                            │
│  ════════════════════════════════════════════════════════════    │
│  LEVEL 3: Deputy Secretary (FINAL)                               │
│  ────────────────────────────────────────────────────────────    │
│  File appears in Deputy Secretary's IN-TRAY                      │
│  DS opens file → sees action buttons                             │
│     ↓                                                            │
│  [Approve] clicked                                               │
│     ↓                                                            │
│  ════════════════════════════════════════════════════════════    │
│  FILE APPROVED ✅                                                │
│  ────────────────────────────────────────────────────────────    │
│  File status: APPROVED                                           │
│  File can now be archived                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Who Sees What Actions?

The system checks:

1. **Current file state** - What state is the file in?
2. **Current workflow level** - What level is the file at?
3. **User's role** - Does user's role match the level's required role?

### Action Visibility Rules:

| User Role       | File State | File Level | Level Requires  | Actions Visible               |
| --------------- | ---------- | ---------- | --------------- | ----------------------------- |
| Clerk (Creator) | DRAFT      | 0          | -               | Submit, Save Draft            |
| Clerk (Creator) | RETURNED   | 1          | -               | Resubmit                      |
| Section_Officer | IN_REVIEW  | 1          | Section_Officer | Approve, Return, Hold, Reject |
| Under_Secretary | IN_REVIEW  | 1          | Section_Officer | NONE (wrong level)            |
| Under_Secretary | IN_REVIEW  | 2          | Under_Secretary | Approve, Return, Hold, Reject |

### Code Logic (from workflow.engine.js):

```javascript
async getAllowedActions(file, userId) {
    const isCreator = file.created_by === userId;

    // Get user's role in this department
    const userRole = await this.db('user_department_roles')
        .where({ user_id: userId, department_id: file.department_id })
        .first();

    // Get what role is needed for current level
    const levelConfig = await this.db('workflow_template_levels')
        .where({ template_id: file.workflow_template_id, level: file.current_level })
        .first();

    // Does user have the right role for this level?
    const hasRoleForLevel = userRole && levelConfig && userRole.role === levelConfig.role;

    // Get allowed actions for current state
    const allowedByState = STATE_TRANSITIONS[file.current_state] || [];
    const allowed = [];

    for (const action of allowedByState) {
        if (action === 'SUBMIT' || action === 'RESUBMIT') {
            // Only creator can submit
            if (isCreator) allowed.push(action);
        } else {
            // Only users with correct role can approve/return/etc.
            if (hasRoleForLevel) allowed.push(action);
        }
    }

    return allowed;
}
```

---

## 📋 Complete Example Walkthrough

### Setup: Create Users

```
Login as admin: admin@flm.local / admin123
Go to Admin → Users and create:

1. Ramesh Kumar (ramesh@flm.local) - Clerk - Finance
2. Suresh Singh (suresh@flm.local) - Section_Officer - Finance
3. Mahesh Gupta (mahesh@flm.local) - Under_Secretary - Finance
4. Dinesh Sharma (dinesh@flm.local) - Deputy_Secretary - Finance
```

### 1. Ramesh (Clerk) Creates File

1. Login: `ramesh@flm.local` / `password123`
2. Select: Finance Department
3. Create File → Subject: "Office Furniture Purchase Request"
4. Click: "Submit for Approval"
5. **Result:** File goes to Level 1, appears in Suresh's In-Tray

### 2. Suresh (Section Officer) Reviews at Level 1

1. Login: `suresh@flm.local` / `password123`
2. Select: Finance Department
3. Go to: In-Tray → File is there!
4. Open file → See action buttons: **Approve, Return, Hold, Reject**
5. Add noting: "Reviewed. Budget seems reasonable."
6. Click: "Approve"
7. **Result:** File moves to Level 2, appears in Mahesh's In-Tray

### 3. Mahesh (Under Secretary) Reviews at Level 2

1. Login: `mahesh@flm.local`
2. Go to: In-Tray → File is there!
3. Open file → See action buttons
4. Click: "Approve"
5. **Result:** File moves to Level 3

### 4. Dinesh (Deputy Secretary) Final Approval at Level 3

1. Login: `dinesh@flm.local`
2. Go to: In-Tray → File is there!
3. Open file → See action buttons
4. Click: "Approve"
5. **Result:** File status = APPROVED ✅

---

## 🔁 What Happens on Return?

If at any level, approver clicks "Return":

1. File status changes to RETURNED
2. File goes back to **creator** (Ramesh)
3. Ramesh sees the return remarks
4. Ramesh makes corrections, adds noting
5. Ramesh clicks "Resubmit"
6. File goes back to the **same level** it was returned from

---

## 📊 Database Tables Involved

```
┌─────────────────────────────────────────────────────────────────┐
│  users                  │  departments           │  user_dept_   │
│  ─────                  │  ───────────           │  roles        │
│  id                     │  id                    │  user_id      │
│  name                   │  code                  │  department_id│
│  email                  │  name                  │  role ←───────│
│  password_hash          │  description           │               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  workflow_templates     │  workflow_template_levels              │
│  ──────────────────     │  ────────────────────────              │
│  id                     │  template_id (FK)                      │
│  name                   │  level (1, 2, 3...)                    │
│  max_levels             │  role ←──── Which role approves here   │
│  is_default             │  description                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  files                                                           │
│  ─────                                                           │
│  id                                                              │
│  file_number (auto-generated)                                    │
│  subject                                                         │
│  current_state (DRAFT, IN_REVIEW, APPROVED, etc.)               │
│  current_level (1, 2, 3...)  ←──── Current workflow level       │
│  workflow_template_id (FK)  ←──── Which workflow is file using  │
│  department_id (FK)                                              │
│  created_by (FK to users)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Reference Card

### Creating Users

```
Admin → Users → Add User → Fill form → Save
```

### Creating Workflow

```
Admin → Workflows → Add Workflow → Define levels → Save
```

### Creating File

```
Sidebar → Create File → Fill form → Submit/Save Draft
```

### Processing File (Approver)

```
In-Tray → Open File → Review → Click Action (Approve/Return/Reject)
```

### State Transitions

```
DRAFT        → Submit    → IN_REVIEW
IN_REVIEW    → Approve   → IN_REVIEW (next level) or APPROVED (final)
IN_REVIEW    → Return    → RETURNED
IN_REVIEW    → Reject    → REJECTED
IN_REVIEW    → Hold      → CABINET
CABINET      → Resume    → IN_REVIEW
RETURNED     → Resubmit  → IN_REVIEW
APPROVED     → Archive   → ARCHIVED
```

---

## 🔧 Troubleshooting

### "No Action Buttons Visible"

**Check:**

1. Is user assigned to the same department as the file?
2. Does user have the correct role for the current level?
3. Is the file at the correct level for this user's role?

### "File Not in In-Tray"

**Check:**

1. Is file in IN_REVIEW state?
2. Is file at a level that matches user's role?
3. Is user in the same department as the file?

### "Cannot Submit File"

**Check:**

1. Is user the file creator?
2. Is file in DRAFT or RETURNED state?

---

## 📝 Summary

1. **Workflow Template** = Blueprint for approval chain (Level 1 → Level 2 → ...)
2. **Each Level** = Requires a specific Role
3. **Users** = Have roles assigned per department
4. **File Movement** = Based on matching user role with level requirement
5. **Creator** = Can only Submit/Resubmit
6. **Approvers** = Can Approve/Return/Hold/Reject at their assigned level
