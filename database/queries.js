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


// Get folders
export async function getFolders(parentId) {
    let sql, params;

    // If parentId is null, we want to fetch root folders (subjects) otherwise fetch categories under the given parent
    if (parentId == null) {
        sql = "SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name";
        params = [];
    } else {
        sql = "SELECT * FROM folders WHERE parent_id = ? ORDER BY name";
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

// Delete folder and everything that belongs to it
export async function deleteFolder(folderId) {

    // Delete all cards in this folder (deleteCard already handles fields)
    const childCards =          await getCards(folderId);
    for (const c of childCards) await deleteCard(c.id);

    // Delete all subfolders recursively
    const childFolders =               await getFolders(folderId);
    for (const folder of childFolders) await deleteFolder(folder.id);

    // Finally delete this folder
    await db.runAsync("DELETE FROM folders WHERE id = ?", [folderId]);
}

// Check if a folder is a descendant of another, used to prevent pasting a folder into its own children
export async function isDescendant(sourceId, nodeId) {
    // SourceId is the id of the folder we have cut/copy
    // NodeId is the id of the folder we want to paste into (So the parent folder's id, if pasting into root then nodeId is null)
    if (sourceId === nodeId) return true;
    const children = await getFolders(sourceId);

    for (const child of children) {

        // If the child is the nodeId return true
        // If any of the child's descendants is the nodeId return true, do this recursively
        if (child.id === nodeId || await isDescendant(child.id, nodeId)) return true;

    }
    return false;
}

// Copy folder recursively (with cards + fields)
export async function copyFolderRecursive(itemId, newParentId, idMap = {}) {
    
    // Get copied item
    const copiedItem = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [itemId]);

    // Change the root if necessary
    const isRoot = newParentId === null ? 1 : 0;

    // Create a new folder inside the target parent
    const newFolderId = await addFolder(newParentId, copiedItem.name, copiedItem.color);
    idMap[copiedItem.id] = newFolderId;

    // Copy cards with their fields
    const childCards =          await getCards(copiedItem.id);
    for (const c of childCards) await copyCardRecursive(c.id, newFolderId);

    // Copy subfolders and their contents recursively
    const childFolders =               await getFolders(copiedItem.id);
    for (const folder of childFolders) await copyFolderRecursive(folder.id, newFolderId, idMap);

    return newFolderId;
}

// Move folder (cut/paste)
export async function moveFolder(id, newParentId) {

    // Move to root (subject)
    if (newParentId === null) {
        return db.runAsync(
            `UPDATE folders
             SET parent_id = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

    // Move under another folder (category)
    } else {
        return db.runAsync(
            `UPDATE folders
             SET parent_id = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newParentId, id]
        );
    }
}

// ---------- CARDS ---------- //

// Add card to a folder
export async function addCard(folderId, name, color = null) {
    const result = await db.runAsync(
        `INSERT INTO cards (folder_id, name, color, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [folderId, name, color]
    );
    return result.lastInsertRowId;
}

// Get cards in a folder
export async function getCards(folderId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM cards WHERE folder_id = ? ORDER BY name",
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

// Delete card and all its fields
export async function deleteCard(cardId) {

    const fields =          await getFields(cardId);
    for (const f of fields) await deleteField(f.id);

    // Finally delete the card itself
    return db.runAsync("DELETE FROM cards WHERE id = ?", [cardId]);
}

// Move card (cut/paste)
export async function moveCard(id, newFolderId) {
    return db.runAsync(
        `UPDATE cards
         SET folder_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newFolderId, id]
    );
}

// Copy card recursively (with all its fields)
export async function copyCardRecursive(copiedCard, newFolderId) {
    // Get copied card details
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [copiedCard]);

    // Insert new card into the target folder
    const newCardId = await addCard(newFolderId, card.name);

    // Copy fields
    const fields =          await getFields(card.id);
    for (const f of fields) await addField(newCardId, f.name, f.context);

    return newCardId;
}

// ---------- FIELDS ---------- //

// Create field
export async function addField(cardId, name, context = null, color = null) {
    const result = await db.runAsync(
        `INSERT INTO fields (card_id, name, context, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cardId, name, context, color]
    );
    return result.lastInsertRowId;
}

// Get fields
export async function getFields(cardId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM fields WHERE card_id = ? ORDER BY id",
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

// Delete field
export async function deleteField(id) {
    return db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
}

// Move field (cut/paste)
export async function moveField(id, newCardId) {
    return db.runAsync(
        `UPDATE fields
         SET card_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newCardId, id]
    );
}