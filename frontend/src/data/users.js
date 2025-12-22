// Dummy Users Data
// In production, this would come from an API

export const users = [
    {
        id: 'user-001',
        name: 'Ramesh Kumar',
        email: 'ramesh.kumar@org.gov',
        departmentRoles: [
            { department: 'HR', role: 'First Level Approver' },
            { department: 'Finance', role: 'Initiator' }
        ],
        isActive: true
    },
    {
        id: 'user-002',
        name: 'Priya Sharma',
        email: 'priya.sharma@org.gov',
        departmentRoles: [
            { department: 'HR', role: 'Initiator' },
            { department: 'Administration', role: 'First Level Approver' }
        ],
        isActive: true
    },
    {
        id: 'user-003',
        name: 'Amit Singh',
        email: 'amit.singh@org.gov',
        departmentRoles: [
            { department: 'HR', role: 'Second Level Approver' },
            { department: 'Engineering', role: 'Initiator' }
        ],
        isActive: true
    },
    {
        id: 'user-004',
        name: 'Kavita Gupta',
        email: 'kavita.gupta@org.gov',
        departmentRoles: [
            { department: 'Finance', role: 'First Level Approver' },
            { department: 'Finance', role: 'Second Level Approver' }
        ],
        isActive: true
    },
    {
        id: 'user-005',
        name: 'Suresh Reddy',
        email: 'suresh.reddy@org.gov',
        departmentRoles: [
            { department: 'Engineering', role: 'First Level Approver' },
            { department: 'Engineering', role: 'Second Level Approver' }
        ],
        isActive: true
    },
    {
        id: 'user-006',
        name: 'Anita Desai',
        email: 'anita.desai@org.gov',
        departmentRoles: [
            { department: 'HR', role: 'Final Approver' },
            { department: 'Finance', role: 'Final Approver' },
            { department: 'Engineering', role: 'Final Approver' },
            { department: 'Administration', role: 'Final Approver' }
        ],
        isActive: true
    },
    {
        id: 'user-007',
        name: 'Vikram Patel',
        email: 'vikram.patel@org.gov',
        departmentRoles: [
            { department: 'Administration', role: 'Initiator' }
        ],
        isActive: true
    },
    {
        id: 'user-008',
        name: 'Neha Joshi',
        email: 'neha.joshi@org.gov',
        departmentRoles: [
            { department: 'Administration', role: 'Second Level Approver' },
            { department: 'HR', role: 'Initiator' }
        ],
        isActive: true
    },
    {
        id: 'user-009',
        name: 'Rajesh Verma',
        email: 'rajesh.verma@org.gov',
        departmentRoles: [
            { department: 'Finance', role: 'Third Level Approver' }
        ],
        isActive: true
    },
    {
        id: 'user-010',
        name: 'System Admin',
        email: 'admin@org.gov',
        departmentRoles: [
            { department: 'HR', role: 'Admin' },
            { department: 'Finance', role: 'Admin' },
            { department: 'Engineering', role: 'Admin' },
            { department: 'Administration', role: 'Admin' }
        ],
        isActive: true
    }
];

export default users;
