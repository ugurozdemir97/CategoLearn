import { Alert } from "react-native";
import { isDescendant, moveFolder, moveCard, moveField, copyFolderRecursive, addCard, getFields, addField } from "../database/queries.js";

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
export function handleEditSelected(selectedItems, setModalVisible, setEditTarget, setNewName, setCreateType) {
    if (selectedItems.length === 1) {
        const item = selectedItems[0];
        setNewName(item.name);
        setCreateType?.(item.type); // optional for FolderScreen
        setEditTarget(item);
        setModalVisible(true);
    } else {
        Alert.alert("Edit Error", "You can only edit one item at a time.");
    }
}

// Cut / Copy
export function handleCutSelected(selectedItems, cutFn, clearSelection) {
    cutFn(selectedItems.map((item) => ({ ...item, type: item.type })));
    clearSelection();
}

export function handleCopySelected(selectedItems, copyFn, clearSelection) {
    copyFn(selectedItems.map((item) => ({ ...item, type: item.type })));
    clearSelection();
}

// Paste with unified rules
export async function handlePaste(clipboard, isCut, isCopy, node, clearClipboard, loadFn) {
    if (clipboard.length === 0) return;

    for (const item of clipboard) {

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
            if (isCut) {
                await moveField(item.id, node.id); 
            } else if (isCopy) {
                await addField(node.id, item.name, item.context);
            }
        }

        // Rule 2: Cards can only be pasted into Folders
        else if (item.type === "Card") {
            if (node?.type !== "Category" && node?.type !== "Subject") {
                Alert.alert("Not Allowed", "Cards can only be pasted inside folders.");
                continue;
            }
            if (isCut) {
                await moveCard(item.id, node.id);
            } else if (isCopy) {
                const newCardId = await addCard(node.id, item.name);
                const oldFields = await getFields(item.id);
                for (const f of oldFields) {
                    await addField(newCardId, f.name, f.context);
                }
            }
        }

        // Rule 3: Folders cannot be pasted into Cards
        else if (item.type === "Category" || item.type === "Subject") {
            if (node?.type === "Card") {
                Alert.alert("Not Allowed", "Folders cannot be pasted inside cards.");
                continue;
            }
            if (node === null) {
                if (isCut) await moveFolder(item.id, null);
                else if (isCopy) await copyFolderRecursive(item.id, null);
            } else {
                if (isCut) await moveFolder(item.id, node.id);
                else if (isCopy) await copyFolderRecursive(item.id, node.id);
            }
        }
    
    }

    clearClipboard();
    await loadFn();
}