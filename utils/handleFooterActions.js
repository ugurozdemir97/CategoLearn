import { isDescendant, moveFolder, moveCard, moveField, copyFolderRecursive, addField, getFields, copyCardRecursive, getFolders, getCards } from "../database/queries.js";
    
// Delete selected items
export function handleDeleteSelected(selectedItems, openDeleteModal, itemLabel, t) {
    if (selectedItems.length === 0) return;
    const message =
        selectedItems.length === 1
            ? t("infoMessages.sureDeleteOne", {item: selectedItems[0].name})
            : t("infoMessages.sureDelete", {length: selectedItems.length, label: itemLabel || t("titles.items")});
    openDeleteModal({ items: [...selectedItems], message });
}

// Edit selected
export async function handleEditSelected(selectedItems, setEditTarget, setModalVisible, t, setCreateType, setFields, setFieldContext) {
    if (selectedItems.length === 1) {
        const item = selectedItems[0];
        setEditTarget(item);                                              // Store the item being edited  
        setCreateType?.(item.type);                                       // For folder screen, set the type (card or category) in the modal
        setFieldContext?.(item.context);                                  // Context of the field for the CardDetailScreen
        if (item.type === "Card") setFields?.(await getFields(item.id));  // Set fields of the card for card editing
        setModalVisible(true);
    } else {
        return [{ type: t("errorTitles.edit"), message: t("errorMessages.editOne")}];
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

// Paste Items
export async function handlePaste(clipboard, clipboardMode, node, clearClipboard, loadFn, t) {
    if (clipboard.length === 0) return [];

    let errorMessages = new Map();  // Use this to show error messages with information modal in screens

    for (const item of clipboard) {

        // Rule 1: Fields can only be pasted into Cards
        if (item.type === "Field") {
            if (node?.type !== "Card") {
                errorMessages.set(t("errorTitles.notAllowed"), t("errorMessages.fieldInFolder"));
                continue;
            }

            // Check if a field with the same name already exist in the card
            const existingFields = await getFields(node.id);
            if (existingFields.some(f => f.name === item.name)) {
                errorMessages.set(t("errorTitles.duplicate"), t("errorMessages.duplicateField", {title: item.name}));
                continue;
            }

            if (clipboardMode === "cut")       await moveField(item.id, node.id);
            else if (clipboardMode === "copy") await addField(node.id, item.name, item.context, item.color);
        }

        // Rule 2: Cards can only be pasted into Folders
        else if (item.type === "Card") {
            if (node?.type !== "Category") {
                errorMessages.set(t("errorTitles.notAllowed"), t("errorMessages.cardInCard"));
                continue;
            }

            // Check if a card with the same name already exist in the folder
            const existingCards = await getCards(node.id);
            if (existingCards.some(c => c.name === item.name)) {
                errorMessages.set(t("errorTitles.duplicate"), t("errorMessages.duplicateCard", {title: item.name}));
                continue;
            }

            if (clipboardMode === "cut")       await moveCard(item.id, node.id);
            else if (clipboardMode === "copy") await copyCardRecursive(item.id, node.id);
        }

        // Rule 3: Folders cannot be pasted into Cards
        else if (item.type === "Category") {
            if (node?.type === "Card") {
                errorMessages.set(t("errorTitles.notAllowed"), t("errorMessages.folderInCard"));
                continue;
            }

            // If we are trying to paste folders to the root
            if (node === null) {

                // Check if a folder with the same name already exist in the root
                const rootFolders = await getFolders(null);
                if (rootFolders.some(f => f.name === item.name)) {
                    errorMessages.set(t("errorTitles.duplicate"), t("errorMessages.duplicateFolder", {title: item.name}));
                    continue;
                }

                if (clipboardMode === "cut")       await moveFolder(item.id, null);
                else if (clipboardMode === "copy") await copyFolderRecursive(item.id, null);

            // If we are pasting it inside another folder, prevent pasting a folder into its own children
            } else {

                if (await isDescendant(item.id, node.id)) {
                    errorMessages.set(t("errorTitles.notAllowed"), t("errorMessages.cantPasteDescendant"));
                    continue;
                }

                // Check if a folder with the same name already exist in the folder
                const siblingFolders = await getFolders(node.id);
                if (siblingFolders.some(f => f.name === item.name)) {
                    errorMessages.set(t("errorTitles.duplicate"), t("errorMessages.duplicateFolder", {title: item.name}));
                    continue;
                }

                if (clipboardMode === "cut")       await moveFolder(item.id, node.id);
                else if (clipboardMode === "copy") await copyFolderRecursive(item.id, node.id);
            }
        }
    }

    clearClipboard();
    await loadFn();

    // Return error messages if any
    return Array.from(errorMessages.entries()).map(([type, message]) => ({ type, message }));

}
