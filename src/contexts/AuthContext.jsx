// Authentication Context
// Manages user session and department selection

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { users } from '../data/users';
import { departments } from '../data/departments';
import { STORAGE_KEYS } from '../utils/constants';
import { getFromStorage, setToStorage, removeFromStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentDepartment, setCurrentDepartment] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedUserId = getFromStorage(STORAGE_KEYS.CURRENT_USER);
        const storedDepartment = getFromStorage(STORAGE_KEYS.CURRENT_DEPARTMENT);

        if (storedUserId) {
            const user = users.find(u => u.id === storedUserId);
            if (user) {
                setCurrentUser(user);

                if (storedDepartment) {
                    const deptRole = user.departmentRoles.find(dr => dr.department === storedDepartment);
                    if (deptRole) {
                        setCurrentDepartment(storedDepartment);
                        setCurrentRole(deptRole.role);
                    }
                }
            }
        }
        setIsLoading(false);
    }, []);

    // Login function - sets user and optionally department
    const login = useCallback((userId, department = null) => {
        const user = users.find(u => u.id === userId);
        if (!user) {
            console.error('User not found:', userId);
            return false;
        }

        setCurrentUser(user);
        setToStorage(STORAGE_KEYS.CURRENT_USER, userId);

        // If user has only one department, auto-select it
        if (user.departmentRoles.length === 1) {
            const deptRole = user.departmentRoles[0];
            setCurrentDepartment(deptRole.department);
            setCurrentRole(deptRole.role);
            setToStorage(STORAGE_KEYS.CURRENT_DEPARTMENT, deptRole.department);
        } else if (department) {
            selectDepartment(department);
        }

        return true;
    }, []);

    // Select department for current user
    const selectDepartment = useCallback((department) => {
        if (!currentUser) {
            console.error('No user logged in');
            return false;
        }

        const deptRole = currentUser.departmentRoles.find(dr => dr.department === department);
        if (!deptRole) {
            console.error('User does not have access to department:', department);
            return false;
        }

        setCurrentDepartment(department);
        setCurrentRole(deptRole.role);
        setToStorage(STORAGE_KEYS.CURRENT_DEPARTMENT, department);
        return true;
    }, [currentUser]);

    // Logout function
    const logout = useCallback(() => {
        setCurrentUser(null);
        setCurrentDepartment(null);
        setCurrentRole(null);
        removeFromStorage(STORAGE_KEYS.CURRENT_USER);
        removeFromStorage(STORAGE_KEYS.CURRENT_DEPARTMENT);
    }, []);

    // Get user's departments
    const getUserDepartments = useCallback(() => {
        if (!currentUser) return [];
        return currentUser.departmentRoles.map(dr => dr.department);
    }, [currentUser]);

    // Get user's role in a specific department
    const getRoleInDepartment = useCallback((department) => {
        if (!currentUser) return null;
        const deptRole = currentUser.departmentRoles.find(dr => dr.department === department);
        return deptRole ? deptRole.role : null;
    }, [currentUser]);

    // Check if user has a specific role in any department
    const hasRole = useCallback((role) => {
        if (!currentUser) return false;
        return currentUser.departmentRoles.some(dr => dr.role === role);
    }, [currentUser]);

    // Check if user has a specific role in the current department
    const hasRoleInCurrentDepartment = useCallback((role) => {
        if (!currentUser || !currentDepartment) return false;
        const deptRole = currentUser.departmentRoles.find(
            dr => dr.department === currentDepartment && dr.role === role
        );
        return !!deptRole;
    }, [currentUser, currentDepartment]);

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return currentRole === 'Admin';
    }, [currentRole]);

    // Get all users (for dropdowns and admin views)
    const getAllUsers = useCallback(() => {
        return users.filter(u => u.isActive);
    }, []);

    // Get all departments
    const getAllDepartments = useCallback(() => {
        return departments.filter(d => d.isActive);
    }, []);

    // Get users by department and role
    const getUsersByDepartmentRole = useCallback((department, role) => {
        return users.filter(u =>
            u.isActive &&
            u.departmentRoles.some(dr => dr.department === department && dr.role === role)
        );
    }, []);

    const value = {
        // State
        currentUser,
        currentDepartment,
        currentRole,
        isLoading,
        isAuthenticated: !!currentUser && !!currentDepartment,
        needsDepartmentSelection: !!currentUser && !currentDepartment && currentUser?.departmentRoles?.length > 1,

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
