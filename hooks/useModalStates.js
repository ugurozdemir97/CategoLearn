import { useState } from "react";

// All 3 screens uses these modals so I created this hook 
// It sets what is being edited or deleted and show/hide relevant modals
export function useModalStates() {

    const [editTarget, setEditTarget] = useState(null);                    // Edited item
    const [deleteTarget, setDeleteTarget] = useState(null);                // Deleted item or items
    const [errorMessages, setErrorMessages] = useState([]);                // Error messages if any
    const [modalVisible, setModalVisible] = useState(false);               // Modal visibility states
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [colorModalVisible, setColorModalVisible] = useState(false);

    // Open modals
    const openCreateModal =  () =>         setModalVisible(true);
    const openColorModal =   () =>         setColorModalVisible(true);
    const openEditModal =    (target) =>   {setEditTarget(target);                                             setModalVisible(true)};
    const openDeleteModal =  (target) =>   {setDeleteTarget(target);                                           setConfirmVisible(true)};
    const openInfoModal =    (messages) => {setErrorMessages(Array.isArray(messages) ? messages : [messages]); setInfoVisible(true)};

    // Close modals
    const closeCreateModal = () => {setEditTarget(null); setModalVisible(false)};
    const closeDeleteModal = () => {setDeleteTarget(null); setConfirmVisible(false)};
    const closeColorModal =  () => setColorModalVisible(false);
    const closeInfoModal =   () => {
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
        setModalVisible(false);
        setConfirmVisible(false);
        setInfoVisible(false);
        setColorModalVisible(false);
    };

    return {
        editTarget,        // States
        deleteTarget,
        errorMessages,
        modalVisible,
        confirmVisible,
        infoVisible,
        colorModalVisible,
        
        setEditTarget,     // Setters
        setDeleteTarget,
        setErrorMessages,

        openCreateModal,   // Actions
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
