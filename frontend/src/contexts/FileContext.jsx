// File Context - Production API Version
// Manages file CRUD operations, workflow actions, and state

import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FileContext = createContext(null);

export function FileProvider({ children }) {
    const [files, setFiles] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [folderCounts, setFolderCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { currentDepartmentId } = useAuth();

    // Fetch files by folder
    const fetchFilesByFolder = useCallback(async (folder) => {
        if (!currentDepartmentId) return [];
        try {
            setLoading(true);
            setError(null);
            const result = await api.getFilesByFolder(currentDepartmentId, folder);
            setFiles(result);
            return result;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Get file by ID
    const getFileById = useCallback(async (fileId) => {
        try {
            setLoading(true);
            setError(null);
            const file = await api.getFileById(fileId);
            setCurrentFile(file);
            return file;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new file
    const createFile = useCallback(async (fileData) => {
        try {
            setLoading(true);
            setError(null);
            const newFile = await api.createFile({
                departmentId: currentDepartmentId,
                subject: fileData.subject,
                fileType: fileData.fileType,
                priority: fileData.priority,
                initialNoting: fileData.initialNoting
            });
            return { success: true, file: newFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Update file
    const updateFile = useCallback(async (fileId, updates) => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.updateFile(fileId, updates);
            setCurrentFile(updatedFile);
            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Add noting
    const addNoting = useCallback(async (fileId, content, type = 'NOTING') => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.addNoting(fileId, content, type);
            setCurrentFile(updatedFile);
            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Add document
    const addDocument = useCallback(async (fileId, documentData) => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.addDocument(fileId, documentData);
            setCurrentFile(updatedFile);
            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Perform workflow action
    const performWorkflowAction = useCallback(async (fileId, action, remarks = '') => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.performWorkflowAction(fileId, action, remarks);
            setCurrentFile(updatedFile);
            
            // Auto-refresh folder counts after workflow action
            if (currentDepartmentId) {
                try {
                    const counts = await api.getFolderCounts(currentDepartmentId);
                    setFolderCounts(counts);
                } catch (err) {
                    console.error('Error refreshing folder counts:', err);
                }
            }
            
            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Share file
    const shareFile = useCallback(async (fileId, userId) => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.shareFile(fileId, userId);
            setCurrentFile(updatedFile);
            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle track
    const toggleTrack = useCallback(async (fileId) => {
        try {
            setLoading(true);
            setError(null);
            const updatedFile = await api.toggleTrackFile(fileId);
            setCurrentFile(updatedFile);

            // Auto-refresh folder counts after track toggle (for sidebar "Tracked" count)
            if (currentDepartmentId) {
                try {
                    const counts = await api.getFolderCounts(currentDepartmentId);
                    setFolderCounts(counts);
                } catch (err) {
                    console.error('Error refreshing folder counts:', err);
                }
            }

            return { success: true, file: updatedFile };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Search files
    const searchFiles = useCallback(async (params) => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.searchFiles({
                departmentId: currentDepartmentId,
                ...params
            });
            setFiles(result);
            return result;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentDepartmentId]);

    // Get folder counts
    const getFolderCounts = useCallback(async () => {
        if (!currentDepartmentId) return {};
        try {
            const counts = await api.getFolderCounts(currentDepartmentId);
            setFolderCounts(counts);
            return counts;
        } catch (err) {
            console.error('Error getting folder counts:', err);
            return {};
        }
    }, [currentDepartmentId]);

    // Helper: Get files for a specific folder (sync from state)
    const getFilesByFolder = useCallback((folder) => {
        // This returns cached files; use fetchFilesByFolder for fresh data
        return files;
    }, [files]);

    // Check if user can perform action
    const canPerformAction = useCallback((file, action) => {
        if (!file || !file.allowedActions) return false;
        return file.allowedActions.includes(action);
    }, []);

    const value = {
        // State
        files,
        currentFile,
        folderCounts,
        loading,
        error,

        // Actions
        fetchFilesByFolder,
        getFileById,
        createFile,
        updateFile,
        addNoting,
        addDocument,
        performWorkflowAction,
        shareFile,
        toggleTrack,
        searchFiles,
        getFolderCounts,

        // Helpers
        getFilesByFolder,
        canPerformAction,

        // Clear error
        clearError: () => setError(null)
    };

    return (
        <FileContext.Provider value={value}>
            {children}
        </FileContext.Provider>
    );
}

export function useFiles() {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFiles must be used within a FileProvider');
    }
    return context;
}

export default FileContext;
