import { Alert } from "react-native";
import { isDescendant, moveFolder, moveCard, moveField, copyFolderRecursive, addField, getFields, copyCardRecursive } from "../database/queries.js";

// Delete selected
export function handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, itemLabel = "items") {
    if (selectedItems.length === 0) return;
    const message =
        selectedItems.length === 1
            ? `Are you sure you want to delete "${selectedItems[0].name}"?`
            : `Are you sure you want to delete these ${selectedItems.length} ${itemLabel}?`;
    setDeleteTarget({ items: [...selectedItems], message });
    setConfirmVisible(true);
}

// Edit selected
export async function handleEditSelected(selectedItems, setEditTarget, setModalVisible, setNewName, setCreateType, setFields, setFieldContext) {
    if (selectedItems.length === 1) {
        const item = selectedItems[0];
        setEditTarget(item);                    // Store the item being edited  
        setNewName(item.name);                  // Pre-fill modal input with current name
        setCreateType?.(item.type);             // For folder screen, set the type (card or category) in the modal
        setFieldContext?.(item.context);        // Context of the field for the CardDetailScreen
        if (item.type === "Card") {
            setFields?.(await getFields(item.id));  // Set fields of the card for card editing
        }

        setModalVisible(true);
    } else {
        Alert.alert("Edit Error", "You can only edit one item at a time.");
    }
}

// Cut Selected
export function handleCutSelected(selectedItems, cutFn, clearSelection) {
    cutFn(selectedItems.map((item) => ({ ...item, type: item.type })));
    clearSelection();
}

// Copy Selected
export function handleCopySelected(selectedItems, copyFn, clearSelection) {
    copyFn(selectedItems.map((item) => ({ ...item, type: item.type })));
    clearSelection();
}

// Paste with unified rules
export async function handlePaste(clipboard, clipboardMode, node, clearClipboard, loadFn) {
    
    if (clipboard.length === 0) return;

    for (const item of clipboard) {

        // Prevent pasting a folder into its own children
        if ((item.type === "Category" || item.type === "Subject") && node?.id) {
            if (await isDescendant(item.id, node.id)) {
                Alert.alert("Not Allowed", "You cannot paste a folder into its own descendant.");
                continue;
            }
        }

        // Rule 1: Fields can only be pasted into Cards
        if (item.type === "Field") {
            if (node?.type !== "Card") {
                Alert.alert("Not Allowed", "Fields can only be pasted inside cards.");
                continue;
            }

            if (clipboardMode === "cut")       await moveField(item.id, node.id); 
            else if (clipboardMode === "copy") await addField(node.id, item.name, item.context);
        }

        // Rule 2: Cards can only be pasted into Folders
        else if (item.type === "Card") {
            if (node?.type !== "Category" && node?.type !== "Subject") {
                Alert.alert("Not Allowed", "Cards can only be pasted inside folders.");
                continue;
            }
            if (clipboardMode === "cut")       await moveCard(item.id, node.id);
            else if (clipboardMode === "copy") await copyCardRecursive(item.id, node.id);
        }

        // Rule 3: Folders cannot be pasted into Cards
        else if (item.type === "Category" || item.type === "Subject") {
            if (node?.type === "Card") {
                Alert.alert("Not Allowed", "Folders cannot be pasted inside cards.");
                continue;
            }
            if (node === null) {
                if (clipboardMode === "cut")       await moveFolder(item.id, null);
                else if (clipboardMode === "copy") await copyFolderRecursive(item.id, null);
            } else {
                if (clipboardMode === "cut")      await moveFolder(item.id, node.id);
                else if (clipboardMode === "copy") await copyFolderRecursive(item.id, node.id);
            }
        }
    
    }

    clearClipboard();
    await loadFn();
}