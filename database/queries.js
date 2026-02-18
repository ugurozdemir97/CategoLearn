import db from "./db";

// ---------- FOLDERS (Subjects + Categories) ---------- //

// Create folder
export async function addFolder(parentId, name, color = null) {
    const result = await db.runAsync(
        "INSERT INTO folders (parent_id, name, color) VALUES (?, ?, ?)",
        [parentId, name, color]
    );
    return result.lastInsertRowId;
}

// Get folders (excluding deleted)
export async function getFolders(parentId) {
    let sql, params;

    if (parentId == null) {
        sql = "SELECT * FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY name";
        params = [];
    } else {
        sql = "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL ORDER BY name";
        params = [parentId];
    }

    const rows = await db.getAllAsync(sql, params);
    return rows;
}

// Edit folder
export async function updateFolder(id, name, color = null) {
    return db.runAsync(
        `UPDATE folders
         SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, color, id]
    );
}

// Soft delete folder (marks as deleted)
export async function deleteFolder(folderId) {
    // Mark this folder as deleted
    await db.runAsync(
        "UPDATE folders SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
        [folderId]
    );

    // Mark all child cards as deleted
    const childCards = await db.getAllAsync(
        "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    for (const c of childCards) {
        await deleteCard(c.id);
    }

    // Mark all child folders as deleted recursively
    const childFolders = await db.getAllAsync(
        "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    for (const folder of childFolders) {
        await deleteFolder(folder.id);
    }
}

// Permanently delete folder (CASCADE handles children automatically)
export async function permanentlyDeleteFolder(folderId) {
    // Just delete the folder - SQL CASCADE will handle all children
    await db.runAsync("DELETE FROM folders WHERE id = ?", [folderId]);
}

// Check if a folder is a descendant of another
export async function isDescendant(sourceId, nodeId) {
    if (sourceId === nodeId) return true;
    const children = await getFolders(sourceId);

    for (const child of children) {
        if (child.id === nodeId || await isDescendant(child.id, nodeId)) return true;
    }
    return false;
}

// Copy folder recursively (with cards + fields)
export async function copyFolderRecursive(itemId, newParentId, idMap = {}) {
    const copiedItem = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [itemId]);
    const newFolderId = await addFolder(newParentId, copiedItem.name, copiedItem.color);
    idMap[copiedItem.id] = newFolderId;

    // Copy cards with their fields
    const childCards = await getCards(copiedItem.id);
    for (const c of childCards) await copyCardRecursive(c.id, newFolderId);

    // Copy subfolders recursively
    const childFolders = await getFolders(copiedItem.id);
    for (const folder of childFolders) await copyFolderRecursive(folder.id, newFolderId, idMap);

    return newFolderId;
}

// Move folder (cut/paste)
export async function moveFolder(id, newParentId) {
    if (newParentId === null) {
        return db.runAsync(
            `UPDATE folders
             SET parent_id = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );
    } else {
        return db.runAsync(
            `UPDATE folders
             SET parent_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newParentId, id]
        );
    }
}

// ---------- CARDS ---------- //

// Add card to a folder
export async function addCard(folderId, name, color = null) {
    const result = await db.runAsync(
        `INSERT INTO cards (parent_id, name, color, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [folderId, name, color]
    );
    return result.lastInsertRowId;
}

// Get cards in a folder (excluding deleted)
export async function getCards(folderId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL ORDER BY name",
        [folderId]
    );
    return rows;
}

// Edit card
export async function updateCard(id, name, color = null) {
    return db.runAsync(
        `UPDATE cards
         SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, color, id]
    );
}

// Soft delete card (marks as deleted)
export async function deleteCard(cardId) {
    // Mark card as deleted
    await db.runAsync(
        "UPDATE cards SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
        [cardId]
    );

    // Mark all fields as deleted
    const fields = await db.getAllAsync(
        "SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL",
        [cardId]
    );
    for (const f of fields) {
        await deleteField(f.id);
    }
}

// Permanently delete card (CASCADE handles fields automatically)
export async function permanentlyDeleteCard(cardId) {
    // Just delete the card - SQL CASCADE will handle all fields
    const result = await db.runAsync("DELETE FROM cards WHERE id = ?", [cardId]);
    return result;
}

// Move card (cut/paste)
export async function moveCard(id, newFolderId) {
    return db.runAsync(
        `UPDATE cards
         SET parent_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newFolderId, id]
    );
}

// Copy card recursively (with all its fields)
export async function copyCardRecursive(copiedCard, newFolderId) {
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [copiedCard]);
    const newCardId = await addCard(newFolderId, card.name);

    const fields = await getFields(card.id);
    for (const f of fields) await addField(newCardId, f.name, f.context);

    return newCardId;
}

// ---------- FIELDS ---------- //

// Create field
export async function addField(cardId, name, context = null, color = null) {
    const result = await db.runAsync(
        `INSERT INTO fields (parent_id, name, context, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cardId, name, context, color]
    );
    return result.lastInsertRowId;
}

// Get fields (excluding deleted)
export async function getFields(cardId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL ORDER BY id",
        [cardId]
    );
    return rows;
}

// Edit field
export async function updateField(id, name, context = null, color = null) {
    return db.runAsync(
        `UPDATE fields
         SET name = ?, context = ?, color = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, context, color, id]
    );
}

// Soft delete field (marks as deleted)
export async function deleteField(id) {
    return db.runAsync(
        "UPDATE fields SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
    );
}

// Permanently delete field
export async function permanentlyDeleteField(id) {
    const result = await db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
    return result;
}

// Move field (cut/paste)
export async function moveField(id, newCardId) {
    return db.runAsync(
        `UPDATE fields
         SET parent_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newCardId, id]
    );
}

// ---------- TRASH / RESTORE ---------- //

// Get all deleted items
export async function getDeletedItems() {
    const folders = await db.getAllAsync(
        "SELECT *, 'Category' as type FROM folders WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    const cards = await db.getAllAsync(
        "SELECT *, 'Card' as type FROM cards WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    const fields = await db.getAllAsync(
        "SELECT *, 'Field' as type FROM fields WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    return [...folders, ...cards, ...fields];
}

// Restore a folder
export async function restoreFolder(folderId) {
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    if (!folder) return;

    // Check if parent exists and is not deleted
    let targetParentId = folder.parent_id;
    if (targetParentId !== null) {
        const parent = await db.getFirstAsync(
            "SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL",
            [targetParentId]
        );
        if (!parent) {
            // Parent doesn't exist or is deleted, restore to "Restored Items" folder
            targetParentId = await getOrCreateRestoredItemsFolder();
        }
    }

    // Restore this folder
    await db.runAsync(
        "UPDATE folders SET deleted_at = NULL, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [targetParentId, folderId]
    );
}

// Restore a card
export async function restoreCard(cardId) {
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (!card) return;

    // Check if parent folder exists and is not deleted
    const parentFolder = await db.getFirstAsync(
        "SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL",
        [card.parent_id]
    );

    let targetFolderId = card.parent_id;
    if (!parentFolder) {
        // Parent folder doesn't exist or is deleted, restore to "Restored Items" folder
        targetFolderId = await getOrCreateRestoredItemsFolder();
    }

    // Restore this card
    await db.runAsync(
        "UPDATE cards SET deleted_at = NULL, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [targetFolderId, cardId]
    );
}

// Restore a field
export async function restoreField(fieldId) {
    const field = await db.getFirstAsync("SELECT * FROM fields WHERE id = ?", [fieldId]);
    if (!field) return;

    // Check if parent card exists and is not deleted
    const parentCard = await db.getFirstAsync(
        "SELECT * FROM cards WHERE id = ? AND deleted_at IS NULL",
        [field.parent_id]
    );

    if (!parentCard) {
        // Parent card doesn't exist or is deleted - cannot restore field without card
        // We need to restore the parent card first or move to a "Restored Fields" card
        const restoredFolder = await getOrCreateRestoredItemsFolder();
        const restoredCard = await getOrCreateRestoredFieldsCard(restoredFolder);
        
        await db.runAsync(
            "UPDATE fields SET deleted_at = NULL, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [restoredCard, fieldId]
        );
    } else {
        // Parent exists, restore normally
        await db.runAsync(
            "UPDATE fields SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [fieldId]
        );
    }
}

// Get or create "Restored Items" folder
async function getOrCreateRestoredItemsFolder() {
    const existing = await db.getFirstAsync(
        "SELECT * FROM folders WHERE name = 'Restored Items' AND parent_id IS NULL AND deleted_at IS NULL"
    );
    if (existing) return existing.id;

    const result = await db.runAsync(
        "INSERT INTO folders (parent_id, name, color) VALUES (NULL, 'Restored Items', '#ff9800')",
        []
    );
    return result.lastInsertRowId;
}

// Get or create "Restored Fields" card in given folder
async function getOrCreateRestoredFieldsCard(folderId) {
    const existing = await db.getFirstAsync(
        "SELECT * FROM cards WHERE name = 'Restored Fields' AND parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    if (existing) return existing.id;

    const result = await db.runAsync(
        "INSERT INTO cards (parent_id, name, color) VALUES (?, 'Restored Fields', '#ff9800')",
        [folderId]
    );
    return result.lastInsertRowId;
}

// Restore multiple items (folders first, then cards, then fields)
export async function restoreMultipleItems(items) {
    // Sort: folders first, cards second, fields last
    const folders = items.filter(i => i.type === "Category");
    const cards = items.filter(i => i.type === "Card");
    const fields = items.filter(i => i.type === "Field");

    // Restore in order
    for (const folder of folders) await restoreFolder(folder.id);
    for (const card of cards) await restoreCard(card.id);
    for (const field of fields) await restoreField(field.id);
}