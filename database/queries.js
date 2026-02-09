import db from "./db";

// ---------- FOLDERS (Subjects + Categories) ---------- //

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

// Create folder (subject if is_root=1, category if is_root=0)
export async function addFolder(parentId, name, color = null, isRoot = 0) {
    const result = await db.runAsync(
        `INSERT INTO folders (parent_id, name, color, is_root, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [parentId, name, color, isRoot]
    );

    return result.lastInsertRowId;
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

// Copy folder recursively (with cards + fields)
export async function copyFolderRecursive(oldFolderId, newParentId, idMap = {}) {
    // Get old folder
    const oldFolder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [oldFolderId]);

    // Insert new folder
    const newFolderId = await addFolder(newParentId, oldFolder.name, oldFolder.color, oldFolder.is_root);
    idMap[oldFolderId] = newFolderId;

    // Copy cards
    const childCards = await getCards(oldFolderId);
    for (const c of childCards) {
        const newCardId = await addCard(newFolderId, c.name);
        const oldFields = await getFields(c.id);
        for (const f of oldFields) {
            await addField(newCardId, f.name, f.context);
        }
    }

    // Copy subfolders
    const childFolders = await getFolders(oldFolderId);
    for (const folder of childFolders) {
        await copyFolderRecursive(folder.id, newFolderId, idMap);
    }

    return newFolderId;
}

// Check if a folder is a descendant of another
export async function isDescendant(sourceId, targetId) {
    if (sourceId === targetId) return true;
    const children = await getFolders(sourceId);
    for (const child of children) {
        if (child.id === targetId || await isDescendant(child.id, targetId)) {
            return true;
        }
    }
    return false;
}

// Delete folder
export async function deleteFolder(id) {
    return db.runAsync("DELETE FROM folders WHERE id = ?", [id]);
}

// Move folder (cut/paste)
export async function moveFolder(id, newParentId) {
    if (newParentId === null) {
        // Move to root: mark as subject
        return db.runAsync(
            `UPDATE folders
             SET parent_id = NULL,
                 is_root = 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );
    } else {
        // Move under another folder: mark as category
        return db.runAsync(
            `UPDATE folders
             SET parent_id = ?,
                 is_root = 0,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newParentId, id]
        );
    }
}

// ---------- CARDS ---------- //

export async function addCard(folderId, name) {
    const result = await db.runAsync(
        `INSERT INTO cards (folder_id, name, created_at, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [folderId, name]
    );
    return result.lastInsertRowId;
}

export async function getCards(folderId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM cards WHERE folder_id = ? ORDER BY name",
        [folderId]
    );
    return rows;
}

export async function updateCard(id, name) {
    return db.runAsync(
        `UPDATE cards
         SET name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, id]
    );
}

export async function deleteCard(id) {
    return db.runAsync("DELETE FROM cards WHERE id = ?", [id]);
}

export async function moveCard(id, newFolderId) {
    return db.runAsync(
        `UPDATE cards
         SET folder_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newFolderId, id]
    );
}

// ---------- FIELDS ---------- //

export async function addField(cardId, name, context) {
    const result = await db.runAsync(
        `INSERT INTO fields (card_id, name, context, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cardId, name, context]
    );
    return result.lastInsertRowId;
}

export async function getFields(cardId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM fields WHERE card_id = ? ORDER BY id",
        [cardId]
    );
    return rows;
}

export async function updateField(id, name, context) {
    return db.runAsync(
        `UPDATE fields
         SET name = ?, context = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, context, id]
    );
}

export async function deleteField(id) {
    return db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
}

// ---------- FIELDS ---------- //

export async function moveField(id, newCardId) {
    return db.runAsync(
        `UPDATE fields
         SET card_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newCardId, id]
    );
}