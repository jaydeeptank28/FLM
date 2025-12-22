// File Context
// Manages file CRUD operations, workflow actions, and state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sampleFiles } from '../data/files';
import { departments } from '../data/departments';
import { getWorkflowTemplate } from '../data/workflowTemplates';
import {
    FILE_STATES,
    WORKFLOW_ACTIONS,
    STATE_TRANSITIONS,
    STORAGE_KEYS
} from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

const FileContext = createContext(null);

export function FileProvider({ children }) {
    // Use localStorage for persistence with sample data as initial
    const [files, setFiles] = useLocalStorage(STORAGE_KEYS.FILES, sampleFiles);
    const { currentUser, currentDepartment, currentRole } = useAuth();

    // Generate file number
    const generateFileNumber = useCallback((department) => {
        const dept = departments.find(d => d.code === department || d.name === department);
        const prefix = dept?.filePrefix || 'GEN';
        const year = new Date().getFullYear();

        // Find existing files in this department this year
        const deptFiles = files.filter(f =>
            f.fileNumber.includes(`/${prefix}/`) &&
            f.fileNumber.includes(`/${year}/`)
        );

        const nextNumber = (deptFiles.length + 1).toString().padStart(4, '0');
        return `FLM/${prefix}/${year}/${nextNumber}`;
    }, [files]);

    // Create new file
    // TODO: Replace with API call - POST /api/files
    const createFile = useCallback((fileData) => {
        const now = new Date().toISOString();
        const fileNumber = generateFileNumber(fileData.department);
        const workflowTemplate = getWorkflowTemplate(fileData.department, fileData.fileType);

        const newFile = {
            id: uuidv4(),
            fileNumber,
            subject: fileData.subject,
            fileType: fileData.fileType,
            department: fileData.department,
            priority: fileData.priority || 'Medium',
            currentState: FILE_STATES.DRAFT,
            createdBy: currentUser?.id,
            createdAt: now,
            updatedAt: now,

            notings: fileData.initialNoting ? [{
                id: uuidv4(),
                content: fileData.initialNoting,
                addedBy: currentUser?.id,
                addedAt: now,
                type: 'NOTING'
            }] : [],

            documents: [],

            workflow: {
                templateId: workflowTemplate?.id,
                currentLevel: 0,
                maxLevels: workflowTemplate?.levels?.length || 3,
                participants: [],
                history: []
            },

            attributeHistory: [],

            auditTrail: [{
                id: uuidv4(),
                action: 'CREATED',
                performedBy: currentUser?.id,
                performedAt: now,
                details: 'File created as draft'
            }],

            sharedWith: [],
            trackedBy: [currentUser?.id]
        };

        setFiles(prev => [...prev, newFile]);
        return newFile;
    }, [currentUser, generateFileNumber, setFiles]);

    // Update file
    // TODO: Replace with API call - PUT /api/files/:id
    const updateFile = useCallback((fileId, updates) => {
        const now = new Date().toISOString();

        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            // Track attribute changes
            const attributeChanges = [];
            const trackableFields = ['priority', 'subject', 'fileType'];

            trackableFields.forEach(field => {
                if (updates[field] && updates[field] !== file[field]) {
                    attributeChanges.push({
                        field,
                        oldValue: file[field],
                        newValue: updates[field],
                        changedBy: currentUser?.id,
                        changedAt: now
                    });
                }
            });

            return {
                ...file,
                ...updates,
                updatedAt: now,
                attributeHistory: [...file.attributeHistory, ...attributeChanges]
            };
        }));
    }, [currentUser, setFiles]);

    // Delete file (only drafts)
    // TODO: Replace with API call - DELETE /api/files/:id
    const deleteFile = useCallback((fileId) => {
        const file = files.find(f => f.id === fileId);
        if (!file) return false;

        if (file.currentState !== FILE_STATES.DRAFT) {
            console.error('Only draft files can be deleted');
            return false;
        }

        if (file.createdBy !== currentUser?.id) {
            console.error('Only the creator can delete a draft');
            return false;
        }

        setFiles(prev => prev.filter(f => f.id !== fileId));
        return true;
    }, [files, currentUser, setFiles]);

    // Get file by ID
    const getFileById = useCallback((fileId) => {
        return files.find(f => f.id === fileId);
    }, [files]);

    // Add audit log entry
    const addAuditLog = useCallback((fileId, action, details, metadata = {}) => {
        const now = new Date().toISOString();

        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            return {
                ...file,
                updatedAt: now,
                auditTrail: [...file.auditTrail, {
                    id: uuidv4(),
                    action,
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details,
                    metadata
                }]
            };
        }));
    }, [currentUser, setFiles]);

    // Add noting to file
    const addNoting = useCallback((fileId, content, type = 'NOTING') => {
        const now = new Date().toISOString();

        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            const newNoting = {
                id: uuidv4(),
                content,
                addedBy: currentUser?.id,
                addedAt: now,
                type
            };

            return {
                ...file,
                updatedAt: now,
                notings: [...file.notings, newNoting],
                auditTrail: [...file.auditTrail, {
                    id: uuidv4(),
                    action: 'NOTING_ADDED',
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: `${type} added`
                }]
            };
        }));
    }, [currentUser, setFiles]);

    // Add document to file
    const addDocument = useCallback((fileId, documentData) => {
        const now = new Date().toISOString();

        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            // Check if document with same name exists (for versioning)
            const existingDoc = file.documents.find(d => d.name === documentData.name);

            if (existingDoc) {
                // Add new version
                const newVersion = {
                    version: existingDoc.versions.length + 1,
                    uploadedAt: now,
                    uploadedBy: currentUser?.id,
                    size: documentData.size || 0
                };

                return {
                    ...file,
                    updatedAt: now,
                    documents: file.documents.map(d => {
                        if (d.id !== existingDoc.id) return d;
                        return {
                            ...d,
                            versions: [...d.versions, newVersion]
                        };
                    }),
                    auditTrail: [...file.auditTrail, {
                        id: uuidv4(),
                        action: 'DOCUMENT_VERSION_ADDED',
                        performedBy: currentUser?.id,
                        performedAt: now,
                        details: `New version (v${newVersion.version}) of ${documentData.name} added`
                    }]
                };
            } else {
                // Add new document
                const newDocument = {
                    id: uuidv4(),
                    name: documentData.name,
                    type: documentData.type || 'NORMAL',
                    versions: [{
                        version: 1,
                        uploadedAt: now,
                        uploadedBy: currentUser?.id,
                        size: documentData.size || 0
                    }],
                    linkedFileId: documentData.linkedFileId || null,
                    linkedDaakId: documentData.linkedDaakId || null
                };

                return {
                    ...file,
                    updatedAt: now,
                    documents: [...file.documents, newDocument],
                    auditTrail: [...file.auditTrail, {
                        id: uuidv4(),
                        action: 'DOCUMENT_ADDED',
                        performedBy: currentUser?.id,
                        performedAt: now,
                        details: `Document ${documentData.name} added`
                    }]
                };
            }
        }));
    }, [currentUser, setFiles]);

    // Perform workflow action
    // TODO: Replace with API call - POST /api/files/:id/workflow-action
    const performWorkflowAction = useCallback((fileId, action, remarks = '') => {
        const now = new Date().toISOString();
        const file = files.find(f => f.id === fileId);

        if (!file) {
            console.error('File not found');
            return false;
        }

        // Validate action is allowed for current state
        const allowedActions = STATE_TRANSITIONS[file.currentState] || [];
        if (!allowedActions.includes(action)) {
            console.error(`Action ${action} not allowed in state ${file.currentState}`);
            return false;
        }

        let newState = file.currentState;
        let newLevel = file.workflow.currentLevel;
        const newParticipants = [...file.workflow.participants];
        const newHistory = [...file.workflow.history];

        // Determine new state based on action
        switch (action) {
            case WORKFLOW_ACTIONS.SUBMIT:
                newState = FILE_STATES.IN_REVIEW;
                newLevel = 1;
                newHistory.push({ level: 1, action: 'SUBMITTED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.APPROVE:
                // Check if this is final level
                if (file.workflow.currentLevel >= file.workflow.maxLevels) {
                    newState = FILE_STATES.APPROVED;
                } else {
                    newLevel = file.workflow.currentLevel + 1;
                }
                newParticipants.push({
                    level: file.workflow.currentLevel,
                    role: currentRole,
                    department: currentDepartment,
                    action: 'APPROVED',
                    actionAt: now,
                    actionBy: currentUser?.id,
                    remarks
                });
                newHistory.push({ level: file.workflow.currentLevel, action: 'APPROVED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.RETURN:
                newState = FILE_STATES.RETURNED;
                newParticipants.push({
                    level: file.workflow.currentLevel,
                    role: currentRole,
                    department: currentDepartment,
                    action: 'RETURNED',
                    actionAt: now,
                    actionBy: currentUser?.id,
                    remarks
                });
                newHistory.push({ level: file.workflow.currentLevel, action: 'RETURNED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.RESUBMIT:
                newState = FILE_STATES.IN_REVIEW;
                newHistory.push({ level: file.workflow.currentLevel, action: 'RESUBMITTED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.HOLD:
                newState = FILE_STATES.CABINET;
                newParticipants.push({
                    level: file.workflow.currentLevel,
                    role: currentRole,
                    department: currentDepartment,
                    action: 'HOLD',
                    actionAt: now,
                    actionBy: currentUser?.id,
                    remarks
                });
                newHistory.push({ level: file.workflow.currentLevel, action: 'HOLD', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.RESUME:
                newState = FILE_STATES.IN_REVIEW;
                newHistory.push({ level: file.workflow.currentLevel, action: 'RESUMED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.REJECT:
                newState = FILE_STATES.REJECTED;
                newParticipants.push({
                    level: file.workflow.currentLevel,
                    role: currentRole,
                    department: currentDepartment,
                    action: 'REJECTED',
                    actionAt: now,
                    actionBy: currentUser?.id,
                    remarks
                });
                newHistory.push({ level: file.workflow.currentLevel, action: 'REJECTED', at: now, by: currentUser?.id });
                break;

            case WORKFLOW_ACTIONS.ARCHIVE:
                newState = FILE_STATES.ARCHIVED;
                newHistory.push({ level: file.workflow.currentLevel, action: 'ARCHIVED', at: now, by: currentUser?.id });
                break;

            default:
                console.error('Unknown action:', action);
                return false;
        }

        setFiles(prev => prev.map(f => {
            if (f.id !== fileId) return f;

            return {
                ...f,
                currentState: newState,
                updatedAt: now,
                workflow: {
                    ...f.workflow,
                    currentLevel: newLevel,
                    participants: newParticipants,
                    history: newHistory
                },
                auditTrail: [...f.auditTrail, {
                    id: uuidv4(),
                    action,
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: `Action: ${action}${remarks ? ` - ${remarks}` : ''}`
                }]
            };
        }));

        return true;
    }, [files, currentUser, currentRole, currentDepartment, setFiles]);

    // Get files by folder type
    const getFilesByFolder = useCallback((folder) => {
        if (!currentUser || !currentDepartment) return [];

        switch (folder) {
            case 'in-tray':
                // Files pending current user's action based on role
                return files.filter(f =>
                    f.department === currentDepartment &&
                    f.currentState === FILE_STATES.IN_REVIEW &&
                    canActOnFile(f)
                );

            case 'draft':
                // User's own drafts
                return files.filter(f =>
                    f.createdBy === currentUser.id &&
                    f.currentState === FILE_STATES.DRAFT
                );

            case 'sent':
                // Files user has sent (submitted or forwarded)
                return files.filter(f =>
                    f.createdBy === currentUser.id &&
                    f.currentState !== FILE_STATES.DRAFT &&
                    f.currentState !== FILE_STATES.ARCHIVED
                );

            case 'cabinet':
                // Files on hold in current department
                return files.filter(f =>
                    f.department === currentDepartment &&
                    f.currentState === FILE_STATES.CABINET
                );

            case 'shared':
                // Files shared with current user
                return files.filter(f =>
                    f.sharedWith?.includes(currentUser.id)
                );

            case 'tracked':
                // Files user is tracking
                return files.filter(f =>
                    f.trackedBy?.includes(currentUser.id)
                );

            case 'archived':
                // Archived files in department
                return files.filter(f =>
                    f.department === currentDepartment &&
                    f.currentState === FILE_STATES.ARCHIVED
                );

            default:
                return [];
        }
    }, [files, currentUser, currentDepartment]);

    // Check if current user can act on a file
    const canActOnFile = useCallback((file) => {
        if (!currentUser || !currentDepartment || !currentRole) return false;
        if (file.department !== currentDepartment) return false;

        // Get expected role for current level
        const workflowTemplate = getWorkflowTemplate(file.department, file.fileType);
        const currentLevelConfig = workflowTemplate?.levels?.find(l => l.level === file.workflow.currentLevel);

        if (!currentLevelConfig) return false;

        return currentRole === currentLevelConfig.role;
    }, [currentUser, currentDepartment, currentRole]);

    // Get allowed actions for a file
    const getAllowedActions = useCallback((file) => {
        if (!file) return [];
        if (!canActOnFile(file) && file.createdBy !== currentUser?.id) return [];

        // Creator can only act on drafts or returned files
        if (file.createdBy === currentUser?.id) {
            if (file.currentState === FILE_STATES.DRAFT) {
                return [WORKFLOW_ACTIONS.SAVE_DRAFT, WORKFLOW_ACTIONS.SUBMIT];
            }
            if (file.currentState === FILE_STATES.RETURNED) {
                return [WORKFLOW_ACTIONS.RESUBMIT];
            }
        }

        return STATE_TRANSITIONS[file.currentState] || [];
    }, [currentUser, canActOnFile]);

    // Share file with user
    const shareFile = useCallback((fileId, userId) => {
        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            if (file.sharedWith?.includes(userId)) return file;

            return {
                ...file,
                sharedWith: [...(file.sharedWith || []), userId],
                auditTrail: [...file.auditTrail, {
                    id: uuidv4(),
                    action: 'SHARED',
                    performedBy: currentUser?.id,
                    performedAt: new Date().toISOString(),
                    details: `File shared with user`
                }]
            };
        }));
    }, [currentUser, setFiles]);

    // Track/untrack file
    const toggleTrackFile = useCallback((fileId) => {
        setFiles(prev => prev.map(file => {
            if (file.id !== fileId) return file;

            const isTracking = file.trackedBy?.includes(currentUser?.id);

            return {
                ...file,
                trackedBy: isTracking
                    ? file.trackedBy.filter(id => id !== currentUser?.id)
                    : [...(file.trackedBy || []), currentUser?.id]
            };
        }));
    }, [currentUser, setFiles]);

    // Search files
    const searchFiles = useCallback((query) => {
        const { text, department, status, dateFrom, dateTo, fileType, priority } = query;

        return files.filter(file => {
            // Text search (file number, subject)
            if (text) {
                const searchText = text.toLowerCase();
                const matchesText =
                    file.fileNumber.toLowerCase().includes(searchText) ||
                    file.subject.toLowerCase().includes(searchText);
                if (!matchesText) return false;
            }

            // Department filter
            if (department && file.department !== department) return false;

            // Status filter
            if (status && file.currentState !== status) return false;

            // File type filter
            if (fileType && file.fileType !== fileType) return false;

            // Priority filter
            if (priority && file.priority !== priority) return false;

            // Date range filter
            if (dateFrom) {
                const fileDate = new Date(file.createdAt);
                if (fileDate < new Date(dateFrom)) return false;
            }
            if (dateTo) {
                const fileDate = new Date(file.createdAt);
                if (fileDate > new Date(dateTo)) return false;
            }

            return true;
        });
    }, [files]);

    // Get folder counts
    const getFolderCounts = useCallback(() => {
        return {
            'in-tray': getFilesByFolder('in-tray').length,
            'draft': getFilesByFolder('draft').length,
            'sent': getFilesByFolder('sent').length,
            'cabinet': getFilesByFolder('cabinet').length,
            'shared': getFilesByFolder('shared').length,
            'tracked': getFilesByFolder('tracked').length,
            'archived': getFilesByFolder('archived').length
        };
    }, [getFilesByFolder]);

    const value = {
        files,

        // CRUD
        createFile,
        updateFile,
        deleteFile,
        getFileById,

        // Notings & Documents
        addNoting,
        addDocument,

        // Workflow
        performWorkflowAction,
        canActOnFile,
        getAllowedActions,

        // Folders
        getFilesByFolder,
        getFolderCounts,

        // Sharing & Tracking
        shareFile,
        toggleTrackFile,

        // Search
        searchFiles,

        // Utilities
        generateFileNumber,
        addAuditLog
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
