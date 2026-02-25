import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

/**
 * Custom hook to manage all footer action handlers
 * Centralizes the logic for delete, edit, cut, copy, paste actions
 */
export function useFooterActions(params) {
    const {
        selectedItems,
        clearSelection,
        openDeleteModal,
        setEditTarget,
        openCreateModal,
        openInfoModal,
        clipboard,
        clipboardMode,
        cut,
        copy,
        clearClipboard,
        reloadItems,
        parent,
        itemLabel,
        setCreateType,
        setFields,
        setFieldContext,
    } = params;

    // Delete handler
    const handleDelete = () => {
        handleDeleteSelected(selectedItems, openDeleteModal, itemLabel);
    };

    // Cut handler
    const handleCut = () => {
        handleCutSelected(selectedItems, cut, clearSelection);
    };

    // Copy handler
    const handleCopy = () => {
        handleCopySelected(selectedItems, copy, clearSelection);
    };

    // Paste handler
    const handlePasteAction = async () => {
        const result = await handlePaste(clipboard, clipboardMode, parent, clearClipboard, reloadItems);
        if (result && result.length > 0) {
            openInfoModal(result);
        }
    };

    // Edit handler
    const handleEdit = async () => {
        const result = await handleEditSelected(
            selectedItems,
            setEditTarget,
            openCreateModal,
            setCreateType,      // Only used in FolderScreen
            setFields,          // Only used in FolderScreen
            setFieldContext     // Only used in CardDetailScreen
        );
        if (result && result.length > 0) {
            openInfoModal(result);
        }
    };

    return {
        handleDelete,
        handleCut,
        handleCopy,
        handlePasteAction,
        handleEdit,
    };
}