# FLM Auto-Default Testing Guide

## System-Controlled Default Workflow Logic

---

## 🔒 AUTO-DEFAULT RULES

### How Default is Determined

| Scope Selection       | Auto-Classification        | Priority       |
| --------------------- | -------------------------- | -------------- |
| Department + FileType | **SPECIFIC** (not default) | 1st (highest)  |
| Department only       | **DEPARTMENT DEFAULT**     | 2nd            |
| FileType only         | **FILETYPE DEFAULT**       | 3rd            |
| Neither (empty)       | **GLOBAL DEFAULT**         | 4th (fallback) |

### Key Differences from Manual System

| Before                         | After                         |
| ------------------------------ | ----------------------------- |
| Admin checks "Default: Yes/No" | Admin has NO default toggle   |
| Multiple defaults possible     | System enforces ONE per scope |
| Default can be deleted         | Default is PROTECTED          |
| Default can be deactivated     | Default CANNOT be deactivated |

---

## 🔐 Test Users

| User   | Role                 | Department | Email            |
| ------ | -------------------- | ---------- | ---------------- |
| Admin  | Administrator        | All        | admin@flm.local  |
| Ramesh | Clerk (L1)           | Finance    | ramesh@flm.local |
| Suresh | Section Officer (L2) | Finance    | suresh@flm.local |

**Password for all:** `password123`

---

## 🧪 VALIDATION TEST SCENARIOS

### Test 1: Auto-Classification Shows Correctly

**Purpose:** Verify UI shows correct auto-classification

1. Login: `admin@flm.local`
2. Go to Admin → Workflow Templates
3. Click **Create New Workflow**

**Test A: Specific Workflow**

- Select Department: Finance
- Select FileType: Budget
- Check the green info box

**Expected:** "This will be a **SPECIFIC** workflow (highest priority)"

**Test B: Department Default**

- Select Department: Finance
- Leave FileType: empty
- Check the green info box

**Expected:** "This will be a **DEPARTMENT DEFAULT** for the selected department"

**Test C: Global Default**

- Leave Department: empty
- Leave FileType: empty
- Check the green info box

**Expected:** "This will be the **GLOBAL DEFAULT** workflow"

---

### Test 2: No Default Toggle in UI

**Purpose:** Verify manual default selection is removed

1. Login as Admin
2. Go to Workflow Templates → Create New
3. Look at the form fields

**Expected:**

- ✅ Name field
- ✅ Description field
- ✅ Department dropdown
- ✅ File Type dropdown
- ✅ Approval Levels section
- ❌ NO "Default: Yes/No" toggle

---

### Test 3: Duplicate Scope Blocked

**Purpose:** Verify only ONE workflow per scope

1. Admin → Workflow Templates
2. Note an existing workflow's scope (e.g., Finance + Budget)
3. Click Create New Workflow
4. Use SAME Department + FileType
5. Add a level, click Save

**Expected:** ❌ Error message:

```
"A workflow already exists for scope: Finance + Budget.
Existing workflow: "Finance Budget 4-Level".
Only ONE active workflow per scope is allowed."
```

---

### Test 4: Protected Default - Cannot Delete

**Purpose:** Verify default workflows are protected from deletion

1. Identify a DEPARTMENT DEFAULT or GLOBAL DEFAULT workflow
   (one with Department only, or neither Dept nor FileType)
2. Try to delete it

**Expected:** ❌ Error message:

```
"Cannot delete "Default 2-Level": This is a GLOBAL DEFAULT.
Default workflows are system-protected.
You may edit it or create a more specific workflow."
```

---

### Test 5: Protected Default - Cannot Deactivate

**Purpose:** Verify default workflows cannot be deactivated

1. Identify a default workflow
2. Try to toggle it to inactive

**Expected:** ❌ Error message:

```
"Cannot deactivate "HR Standard 2-Level": This is a DEPARTMENT DEFAULT.
Default workflows must remain active to ensure file routing.
You may edit it or create a more specific workflow to override it."
```

---

### Test 6: Override Default with Specific

**Purpose:** Verify specific workflows take priority over defaults

1. Ensure Global Default exists (no dept, no file type)
2. Create new workflow: Finance + General
3. Add approval levels, Save

4. Login as `ramesh@flm.local`
5. Create file in Finance with FileType: General
6. Check Workflow Preview

**Expected:**

- Shows the Finance+General specific workflow
- NOT the global default

---

### Test 7: Fallback to Global Default

**Purpose:** Verify global default is used when no specific match

1. Ensure Global Default exists
2. Login as `ramesh@flm.local`
3. Create file with a FileType that has NO specific workflow
4. Check Workflow Preview

**Expected:**

- Shows the Global Default workflow
- Selection reason: "Selected: Default system workflow"

---

### Test 8: No Workflow = Submission Blocked

**Purpose:** Verify file creation blocked without any workflow

1. Login as Admin
2. Delete or note all workflows
3. Create new department "Engineering" with no workflows
4. Logout

5. Create user in Engineering department
6. Login as that user
7. Try to create a file

**Expected:**

- ❌ Workflow Preview shows error
- Submit button DISABLED
- Error: "No workflow configured for Department 'Engineering' + File Type 'X'"

---

### Test 9: Edit Default Workflow Allowed

**Purpose:** Verify defaults CAN be edited (just not deleted)

1. Admin → Workflow Templates
2. Click Edit on a default workflow
3. Change the name or add/remove levels
4. Save

**Expected:** ✅ Workflow updates successfully

---

### Test 10: Backend Ignores Manual isDefault

**Purpose:** Verify backend doesn't accept isDefault from payload

1. Using Postman or curl, send API request:

```json
POST /api/admin/workflow-templates
{
  "name": "Test Manual Default",
  "departmentId": "some-dept-id",
  "fileType": "Budget",
  "isDefault": true,  // SHOULD BE IGNORED
  "levels": [...]
}
```

**Expected:**

- Workflow created successfully
- `is_default` = FALSE (because dept+fileType = specific)
- Backend ignored the `isDefault: true` from payload

---

## 📊 Workflow Type Reference

| Type               | Dept | FileType | is_default | Priority |
| ------------------ | ---- | -------- | ---------- | -------- |
| SPECIFIC           | ✅   | ✅       | false      | 1        |
| DEPARTMENT_DEFAULT | ✅   | ❌       | true       | 2        |
| FILETYPE_DEFAULT   | ❌   | ✅       | true       | 3        |
| GLOBAL_DEFAULT     | ❌   | ❌       | true       | 4        |

---

## ✅ Quick Verification Checklist

### UI Checks

- [ ] No "Default: Yes/No" toggle in create form
- [ ] Auto-classification info shows correctly
- [ ] Scope fields work (Department, FileType)

### Validation Checks

- [ ] Duplicate scope blocked with clear error
- [ ] Delete default blocked with clear error
- [ ] Deactivate default blocked with clear error

### Workflow Selection

- [ ] Specific workflow takes priority
- [ ] Falls back to global default correctly
- [ ] No workflow = submission blocked

### Backend

- [ ] isDefault ignored from payload
- [ ] is_default auto-derived from scope
- [ ] Default workflows protected

---

## 🌐 URLs

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
