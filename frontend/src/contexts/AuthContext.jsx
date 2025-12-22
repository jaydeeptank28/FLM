// Authentication Context
// Manages user session and department selection - Production API Version

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentDepartment, setCurrentDepartment] = useState(null);
    const [currentDepartmentId, setCurrentDepartmentId] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [departments, setDepartments] = useState([]);

    // Initialize from stored token on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = api.getAccessToken();
            if (token) {
                try {
                    const user = await api.getMe();
                    setCurrentUser(user);

                    // Restore department selection from localStorage
                    const storedDeptId = localStorage.getItem('currentDepartmentId');
                    if (storedDeptId && user.departmentRoles) {
                        const deptRole = user.departmentRoles.find(dr => dr.departmentId === storedDeptId);
                        if (deptRole) {
                            setCurrentDepartmentId(storedDeptId);
                            setCurrentDepartment(deptRole.departmentCode);
                            setCurrentRole(deptRole.role);
                        }
                    } else if (user.departmentRoles?.length === 1) {
                        // Auto-select single department
                        const dr = user.departmentRoles[0];
                        setCurrentDepartmentId(dr.departmentId);
                        setCurrentDepartment(dr.departmentCode);
                        setCurrentRole(dr.role);
                        localStorage.setItem('currentDepartmentId', dr.departmentId);
                    }

                    // Load departments
                    const depts = await api.getDepartments();
                    setDepartments(depts);
                } catch (error) {
                    console.error('Auth init failed:', error);
                    api.setAccessToken(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();

        // Listen for auth expiry events
        const handleAuthExpired = () => {
            setCurrentUser(null);
            setCurrentDepartment(null);
            setCurrentDepartmentId(null);
            setCurrentRole(null);
        };
        window.addEventListener('auth:expired', handleAuthExpired);

        return () => window.removeEventListener('auth:expired', handleAuthExpired);
    }, []);

    // Login function
    const login = useCallback(async (email, password) => {
        try {
            setIsLoading(true);
            const result = await api.login(email, password);
            setCurrentUser(result.user);

            // Load departments
            const depts = await api.getDepartments();
            setDepartments(depts);

            // Auto-select if single department
            if (result.user.departmentRoles?.length === 1) {
                const dr = result.user.departmentRoles[0];
                setCurrentDepartmentId(dr.departmentId);
                setCurrentDepartment(dr.departmentCode);
                setCurrentRole(dr.role);
                localStorage.setItem('currentDepartmentId', dr.departmentId);
            }

            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Select department for current user
    const selectDepartment = useCallback((departmentId) => {
        if (!currentUser) {
            console.error('No user logged in');
            return false;
        }

        const deptRole = currentUser.departmentRoles.find(dr => dr.departmentId === departmentId);
        if (!deptRole) {
            console.error('User does not have access to department:', departmentId);
            return false;
        }

        setCurrentDepartmentId(departmentId);
        setCurrentDepartment(deptRole.departmentCode);
        setCurrentRole(deptRole.role);
        localStorage.setItem('currentDepartmentId', departmentId);
        return true;
    }, [currentUser]);

    // Logout function
    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setCurrentUser(null);
            setCurrentDepartment(null);
            setCurrentDepartmentId(null);
            setCurrentRole(null);
            localStorage.removeItem('currentDepartmentId');
        }
    }, []);

    // Get user's departments
    const getUserDepartments = useCallback(() => {
        if (!currentUser) return [];
        return currentUser.departmentRoles.map(dr => ({
            id: dr.departmentId,
            code: dr.departmentCode,
            name: dr.departmentName,
            role: dr.role
        }));
    }, [currentUser]);

    // Get user's role in a specific department
    const getRoleInDepartment = useCallback((departmentId) => {
        if (!currentUser) return null;
        const deptRole = currentUser.departmentRoles.find(dr => dr.departmentId === departmentId);
        return deptRole ? deptRole.role : null;
    }, [currentUser]);

    // Check if user has a specific role in any department
    const hasRole = useCallback((role) => {
        if (!currentUser) return false;
        return currentUser.departmentRoles.some(dr => dr.role === role);
    }, [currentUser]);

    // Check if user has a specific role in the current department
    const hasRoleInCurrentDepartment = useCallback((role) => {
        if (!currentUser || !currentDepartmentId) return false;
        const deptRole = currentUser.departmentRoles.find(
            dr => dr.departmentId === currentDepartmentId && dr.role === role
        );
        return !!deptRole;
    }, [currentUser, currentDepartmentId]);

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return currentRole === 'Admin';
    }, [currentRole]);

    // Get all users (for admin views)
    const getAllUsers = useCallback(async () => {
        try {
            return await api.getUsers();
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }, []);

    // Get all departments
    const getAllDepartments = useCallback(() => {
        return departments;
    }, [departments]);

    // Get users by department and role
    const getUsersByDepartmentRole = useCallback(async (departmentId, role) => {
        try {
            const users = await api.getDepartmentUsers(departmentId);
            return users.filter(u => u.role === role);
        } catch (error) {
            console.error('Error fetching department users:', error);
            return [];
        }
    }, []);

    const value = {
        // State
        currentUser,
        currentDepartment,
        currentDepartmentId,
        currentRole,
        isLoading,
        isAuthenticated: !!currentUser && !!currentDepartmentId,
        needsDepartmentSelection: !!currentUser && !currentDepartmentId && currentUser?.departmentRoles?.length > 1,

        // Actions
        login,
        logout,
        selectDepartment,

        // Getters
        getUserDepartments,
        getRoleInDepartment,
        hasRole,
        hasRoleInCurrentDepartment,
        isAdmin,
        getAllUsers,
        getAllDepartments,
        getUsersByDepartmentRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
