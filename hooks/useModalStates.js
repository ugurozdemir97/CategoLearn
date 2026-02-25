import { useState } from "react";

/**
 * Custom hook to manage all modal states for list screens
 * Handles: Create, Edit, Delete, Color, Info modals
 */
export function useModalStates() {
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [errorMessages, setErrorMessages] = useState([]);
    const [selectedColor, setSelectedColor] = useState(null);
    
    // Modal visibility states
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [colorModalVisible, setColorModalVisible] = useState(false);

    // Open modals
    const openCreateModal = () => setModalVisible(true);

    const openEditModal = (target) => {
        setEditTarget(target);
        setModalVisible(true);
    };

    const openDeleteModal = (target) => {
        setDeleteTarget(target);
        setConfirmVisible(true);
    };

    const openColorModal = () => setColorModalVisible(true);
    
    const openInfoModal = (messages) => {
        setErrorMessages(Array.isArray(messages) ? messages : [messages]);
        setInfoVisible(true);
    };

    // Close modals
    const closeCreateModal = () => {
        setEditTarget(null);
        setModalVisible(false);
    };

    const closeDeleteModal = () => {
        setDeleteTarget(null);
        setConfirmVisible(false);
    };

    const closeColorModal = () => {
        setSelectedColor(null);
        setColorModalVisible(false);
    };

    const closeInfoModal = () => {
        const remaining = [...errorMessages];
        remaining.shift();
        setErrorMessages(remaining);
        if (remaining.length === 0) setInfoVisible(false);
    };

    // Reset all modals
    const resetModals = () => {
        setEditTarget(null);
        setDeleteTarget(null);
        setErrorMessages([]);
        setSelectedColor(null);
        setModalVisible(false);
        setConfirmVisible(false);
        setInfoVisible(false);
        setColorModalVisible(false);
    };

    return {

        // States
        editTarget,
        deleteTarget,
        errorMessages,
        selectedColor,
        modalVisible,
        confirmVisible,
        infoVisible,
        colorModalVisible,
        
        // Setters (for direct control if needed)
        setEditTarget,
        setDeleteTarget,
        setSelectedColor,
        setErrorMessages,
        
        // Actions
        openCreateModal,
        openEditModal,
        openDeleteModal,
        openColorModal,
        openInfoModal,
        closeCreateModal,
        closeDeleteModal,
        closeColorModal,
        closeInfoModal,
        resetModals

    };
}