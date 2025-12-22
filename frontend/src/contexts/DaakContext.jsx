// Daak Context - Production API Version
// Manages Daak (correspondence) operations

import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DaakContext = createContext(null);

export function DaakProvider({ children }) {
    const [daakList, setDaakList] = useState([]);
    const [currentDaak, setCurrentDaak] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { currentDepartmentId } = useAuth();

    // Fetch daak list by type
    const fetchDaakList = useCallback(async (type = null) => {
        if (!currentDepartmentId) return [];
        try {
            setLoading(true);
            setError(null);
            const result = await api.getDaakList(currentDepartmentId, type);
            setDaakList(result);
            return result;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Get daak by ID
    const getDaakById = useCallback(async (daakId) => {
        try {
            setLoading(true);
            setError(null);
            const daak = await api.getDaakById(daakId);
            setCurrentDaak(daak);
            return daak;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new daak
    const createDaak = useCallback(async (daakData) => {
        try {
            setLoading(true);
            setError(null);
            const newDaak = await api.createDaak({
                ...daakData,
                departmentId: currentDepartmentId
            });
            return { success: true, daak: newDaak };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Update daak
    const updateDaak = useCallback(async (daakId, updates) => {
        try {
            setLoading(true);
            setError(null);
            const updatedDaak = await api.updateDaak(daakId, updates);
            setCurrentDaak(updatedDaak);
            return { success: true, daak: updatedDaak };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Link daak to file
    const linkToFile = useCallback(async (daakId, fileId) => {
        try {
            setLoading(true);
            setError(null);
            const updatedDaak = await api.linkDaakToFile(daakId, fileId);
            setCurrentDaak(updatedDaak);
            return { success: true, daak: updatedDaak };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Change daak state
    const changeState = useCallback(async (daakId, state, remarks = '') => {
        try {
            setLoading(true);
            setError(null);
            const updatedDaak = await api.changeDaakState(daakId, state, remarks);
            setCurrentDaak(updatedDaak);
            return { success: true, daak: updatedDaak };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Search daak
    const searchDaak = useCallback(async (params) => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.searchDaak({
                departmentId: currentDepartmentId,
                ...params
            });
            setDaakList(result);
            return result;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Get inward daak
    const getInwardDaak = useCallback(() => {
        return daakList.filter(d => d.type === 'INWARD');
    }, [daakList]);

    // Get outward daak
    const getOutwardDaak = useCallback(() => {
        return daakList.filter(d => d.type === 'OUTWARD');
    }, [daakList]);

    // Get pending daak count (async for sidebar)
    const getPendingCount = useCallback(async () => {
        if (!currentDepartmentId) return 0;
        try {
            // For now, return count from state; later can add API endpoint
            const pending = daakList.filter(d => 
                d.current_state === 'PENDING' || d.currentState === 'PENDING'
            );
            return pending.length;
        } catch (err) {
            console.error('Error getting pending daak count:', err);
            return 0;
        }
    }, [currentDepartmentId, daakList]);

    const value = {
        // State
        daakList,
        currentDaak,
        loading,
        error,

        // Actions
        fetchDaakList,
        getDaakById,
        createDaak,
        updateDaak,
        linkToFile,
        changeState,
        searchDaak,

        // Helpers
        getInwardDaak,
        getOutwardDaak,
        getPendingCount,

        // Clear error
        clearError: () => setError(null)
    };

    return (
        <DaakContext.Provider value={value}>
            {children}
        </DaakContext.Provider>
    );
}

export function useDaak() {
    const context = useContext(DaakContext);
    if (!context) {
        throw new Error('useDaak must be used within a DaakProvider');
    }
    return context;
}

export default DaakContext;
