// Daak Context
// Manages Daak (Correspondence) operations - Inward/Outward

import React, { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sampleDaak } from '../data/daak';
import { DAAK_STATES, DAAK_TYPES } from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

const DaakContext = createContext(null);

export function DaakProvider({ children }) {
    const [daakList, setDaakList] = useLocalStorage('flm_daak', sampleDaak);
    const { currentUser, currentDepartment } = useAuth();

    // Generate Daak number
    const generateDaakNumber = useCallback((type) => {
        const prefix = type === DAAK_TYPES.INWARD ? 'IN' : 'OUT';
        const year = new Date().getFullYear();

        const typeDaak = daakList.filter(d =>
            d.daakNumber.includes(`/${prefix}/`) &&
            d.daakNumber.includes(`/${year}/`)
        );

        const nextNumber = (typeDaak.length + 1).toString().padStart(4, '0');
        return `DAAK/${prefix}/${year}/${nextNumber}`;
    }, [daakList]);

    // Create new Daak
    // TODO: Replace with API call - POST /api/daak
    const createDaak = useCallback((daakData) => {
        const now = new Date().toISOString();
        const daakNumber = generateDaakNumber(daakData.type);

        const newDaak = {
            id: uuidv4(),
            daakNumber,
            type: daakData.type,
            subject: daakData.subject,
            letterDate: daakData.letterDate,
            receivedDate: daakData.type === DAAK_TYPES.INWARD ? (daakData.receivedDate || now) : null,
            referenceNumber: daakData.referenceNumber || '',
            mode: daakData.mode,

            senderName: daakData.type === DAAK_TYPES.INWARD ? daakData.senderName : null,
            senderAddress: daakData.type === DAAK_TYPES.INWARD ? daakData.senderAddress : null,
            receiverName: daakData.type === DAAK_TYPES.OUTWARD ? daakData.receiverName : null,
            receiverAddress: daakData.type === DAAK_TYPES.OUTWARD ? daakData.receiverAddress : null,

            attachments: [],
            notings: daakData.initialNoting ? [{
                id: uuidv4(),
                content: daakData.initialNoting,
                addedBy: currentUser?.id,
                addedAt: now,
                type: 'NOTING'
            }] : [],

            linkedFileId: daakData.linkedFileId || null,

            workflow: {
                currentLevel: 0,
                maxLevels: 2,
                participants: [],
                history: []
            },

            auditTrail: [{
                id: uuidv4(),
                action: daakData.type === DAAK_TYPES.INWARD ? 'RECEIVED' : 'CREATED',
                performedBy: currentUser?.id,
                performedAt: now,
                details: `${daakData.type} correspondence ${daakData.type === DAAK_TYPES.INWARD ? 'received' : 'created'}`
            }],

            currentState: daakData.type === DAAK_TYPES.INWARD ? DAAK_STATES.RECEIVED : DAAK_STATES.PENDING,
            department: daakData.department || currentDepartment,
            createdBy: currentUser?.id,
            createdAt: now,
            updatedAt: now
        };

        setDaakList(prev => [...prev, newDaak]);
        return newDaak;
    }, [currentUser, currentDepartment, generateDaakNumber, setDaakList]);

    // Update Daak
    // TODO: Replace with API call - PUT /api/daak/:id
    const updateDaak = useCallback((daakId, updates) => {
        const now = new Date().toISOString();

        setDaakList(prev => prev.map(daak => {
            if (daak.id !== daakId) return daak;

            return {
                ...daak,
                ...updates,
                updatedAt: now
            };
        }));
    }, [setDaakList]);

    // Get Daak by ID
    const getDaakById = useCallback((daakId) => {
        return daakList.find(d => d.id === daakId);
    }, [daakList]);

    // Add attachment to Daak
    const addAttachment = useCallback((daakId, attachmentData) => {
        const now = new Date().toISOString();

        setDaakList(prev => prev.map(daak => {
            if (daak.id !== daakId) return daak;

            const newAttachment = {
                id: uuidv4(),
                name: attachmentData.name,
                uploadedAt: now,
                uploadedBy: currentUser?.id
            };

            return {
                ...daak,
                updatedAt: now,
                attachments: [...daak.attachments, newAttachment],
                auditTrail: [...daak.auditTrail, {
                    id: uuidv4(),
                    action: 'ATTACHMENT_ADDED',
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: `Attachment ${attachmentData.name} added`
                }]
            };
        }));
    }, [currentUser, setDaakList]);

    // Add noting to Daak
    const addNoting = useCallback((daakId, content, type = 'NOTING') => {
        const now = new Date().toISOString();

        setDaakList(prev => prev.map(daak => {
            if (daak.id !== daakId) return daak;

            return {
                ...daak,
                updatedAt: now,
                notings: [...daak.notings, {
                    id: uuidv4(),
                    content,
                    addedBy: currentUser?.id,
                    addedAt: now,
                    type
                }],
                auditTrail: [...daak.auditTrail, {
                    id: uuidv4(),
                    action: 'NOTING_ADDED',
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: `${type} added`
                }]
            };
        }));
    }, [currentUser, setDaakList]);

    // Link Daak to File
    const linkToFile = useCallback((daakId, fileId) => {
        const now = new Date().toISOString();

        setDaakList(prev => prev.map(daak => {
            if (daak.id !== daakId) return daak;

            return {
                ...daak,
                linkedFileId: fileId,
                updatedAt: now,
                auditTrail: [...daak.auditTrail, {
                    id: uuidv4(),
                    action: 'LINKED',
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: `Linked to file ${fileId}`
                }]
            };
        }));
    }, [currentUser, setDaakList]);

    // Perform workflow action on Daak
    const performAction = useCallback((daakId, action, remarks = '') => {
        const now = new Date().toISOString();
        const daak = daakList.find(d => d.id === daakId);

        if (!daak) return false;

        let newState = daak.currentState;

        switch (action) {
            case 'SEND':
                newState = DAAK_STATES.IN_REVIEW;
                break;
            case 'APPROVE':
                newState = daak.type === DAAK_TYPES.OUTWARD ? DAAK_STATES.DISPATCHED : DAAK_STATES.IN_REVIEW;
                break;
            case 'DISPATCH':
                newState = DAAK_STATES.DISPATCHED;
                break;
            case 'ARCHIVE':
                newState = DAAK_STATES.ARCHIVED;
                break;
            default:
                break;
        }

        setDaakList(prev => prev.map(d => {
            if (d.id !== daakId) return d;

            return {
                ...d,
                currentState: newState,
                updatedAt: now,
                auditTrail: [...d.auditTrail, {
                    id: uuidv4(),
                    action,
                    performedBy: currentUser?.id,
                    performedAt: now,
                    details: remarks || `Action: ${action}`
                }]
            };
        }));

        return true;
    }, [daakList, currentUser, setDaakList]);

    // Get Daak by type
    const getDaakByType = useCallback((type) => {
        return daakList.filter(d => d.type === type);
    }, [daakList]);

    // Get Daak by department
    const getDaakByDepartment = useCallback((department) => {
        return daakList.filter(d => d.department === department);
    }, [daakList]);

    // Get pending Daak for current department
    const getPendingDaak = useCallback(() => {
        return daakList.filter(d =>
            d.department === currentDepartment &&
            (d.currentState === DAAK_STATES.RECEIVED || d.currentState === DAAK_STATES.PENDING)
        );
    }, [daakList, currentDepartment]);

    // Search Daak
    const searchDaak = useCallback((query) => {
        const { text, type, department, dateFrom, dateTo, status } = query;

        return daakList.filter(daak => {
            if (text) {
                const searchText = text.toLowerCase();
                const matchesText =
                    daak.daakNumber.toLowerCase().includes(searchText) ||
                    daak.subject.toLowerCase().includes(searchText) ||
                    (daak.referenceNumber && daak.referenceNumber.toLowerCase().includes(searchText));
                if (!matchesText) return false;
            }

            if (type && daak.type !== type) return false;
            if (department && daak.department !== department) return false;
            if (status && daak.currentState !== status) return false;

            if (dateFrom) {
                const daakDate = new Date(daak.createdAt);
                if (daakDate < new Date(dateFrom)) return false;
            }
            if (dateTo) {
                const daakDate = new Date(daak.createdAt);
                if (daakDate > new Date(dateTo)) return false;
            }

            return true;
        });
    }, [daakList]);

    const value = {
        daakList,

        // CRUD
        createDaak,
        updateDaak,
        getDaakById,

        // Attachments & Notings
        addAttachment,
        addNoting,

        // Linking
        linkToFile,

        // Actions
        performAction,

        // Queries
        getDaakByType,
        getDaakByDepartment,
        getPendingDaak,
        searchDaak,

        // Utilities
        generateDaakNumber
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
