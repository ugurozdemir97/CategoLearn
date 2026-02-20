import db from "./db";

// ---------- FOLDERS (Subjects + Categories) ---------- //

// Create folder
export async function addFolder(parentId, name, color = null) {
    // Prevent creating folders inside system folder (Restored Items)
    if (parentId !== null) {
        const parent = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [parentId]);
        if (parent && parent.is_system_folder === 1) {
            throw new Error("Cannot create folders inside system folders");
        }
    }
    
    const result = await db.runAsync(
        "INSERT INTO folders (parent_id, name, color) VALUES (?, ?, ?)",
        [parentId, name, color]
    );
    return result.lastInsertRowId;
}

// Get folders (excluding deleted and hiding empty Restored Items)
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
    
    // Filter out Restored Items folder if it's empty (system folder with no non-system children)
    const filtered = [];
    for (const folder of rows) {
        if (folder.is_system_folder === 1) {
            // Check if it has any non-system folders
            const childFolders = await db.getAllAsync(
                "SELECT COUNT(*) as count FROM folders WHERE parent_id = ? AND deleted_at IS NULL AND is_system_folder = 0",
                [folder.id]
            );
            
            // Check if it has any non-system cards (excluding empty system cards)
            const childCards = await db.getAllAsync(
                "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL",
                [folder.id]
            );
            
            let hasNonEmptyCards = false;
            for (const card of childCards) {
                if (card.is_system_card === 0) {
                    // Regular card counts
                    hasNonEmptyCards = true;
                    break;
                } else {
                    // System card only counts if it has fields
                    const fields = await db.getAllAsync(
                        "SELECT COUNT(*) as count FROM fields WHERE parent_id = ? AND deleted_at IS NULL",
                        [card.id]
                    );
                    if (fields[0].count > 0) {
                        hasNonEmptyCards = true;
                        break;
                    }
                }
            }
            
            // Only include if it has non-system folders or non-empty cards
            if (childFolders[0].count > 0 || hasNonEmptyCards) {
                filtered.push(folder);
            }
        } else {
            filtered.push(folder);
        }
    }
    
    return filtered;
}

// Edit folder
export async function updateFolder(id, name, color = null) {
    // Prevent editing system folders
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [id]);
    if (folder && folder.is_system_folder === 1) {
        throw new Error("Cannot edit system folders");
    }
    
    return db.runAsync(
        `UPDATE folders
         SET name = ?, color = ?, updated_at = (datetime('now', 'localtime'))
         WHERE id = ?`,
        [name, color, id]
    );
}

// Soft delete folder (marks ONLY the folder as deleted, not its children)
export async function deleteFolder(folderId) {
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    
    // Prevent deleting system folder (Restored Items)
    if (folder && folder.is_system_folder === 1) {
        // Instead of deleting the folder, soft-delete all its children
        const childFolders = await db.getAllAsync(
            "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL",
            [folderId]
        );
        const childCards = await db.getAllAsync(
            "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL",
            [folderId]
        );
        
        // Soft delete all children
        for (const child of childFolders) {
            await deleteFolder(child.id);
        }
        for (const child of childCards) {
            await deleteCard(child.id);
        }
        
        return; // Don't delete the system folder itself
    }

    // Mark only this folder as deleted (children remain active but hidden)
    await db.runAsync(
        "UPDATE folders SET deleted_at = (datetime('now', 'localtime')) WHERE id = ?",
        [folderId]
    );
}

// Permanently delete folder (recursively deletes ALL non-deleted children)
export async function permanentlyDeleteFolder(folderId) {
    // Get all child cards that are NOT already deleted and delete them permanently
    const childCards = await db.getAllAsync(
        "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    for (const card of childCards) {
        await permanentlyDeleteCard(card.id);
    }

    // Get all child folders that are NOT already deleted and delete them permanently (recursive)
    const childFolders = await db.getAllAsync(
        "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    for (const folder of childFolders) {
        await permanentlyDeleteFolder(folder.id);
    }

    // Finally delete this folder itself
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
             SET parent_id = NULL, updated_at = (datetime('now', 'localtime'))
             WHERE id = ?`,
            [id]
        );
    } else {
        return db.runAsync(
            `UPDATE folders
             SET parent_id = ?, updated_at = (datetime('now', 'localtime'))
             WHERE id = ?`,
            [newParentId, id]
        );
    }
}

// ---------- CARDS ---------- //

// Add card to a folder
export async function addCard(folderId, name, color = null) {
    // Prevent creating cards inside system folder (Restored Items)
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    if (folder && folder.is_system_folder === 1) {
        throw new Error("Cannot create cards inside system folders");
    }
    
    const result = await db.runAsync(
        `INSERT INTO cards (parent_id, name, color, created_at, updated_at)
         VALUES (?, ?, ?, (datetime('now', 'localtime')), (datetime('now', 'localtime')))`,
        [folderId, name, color]
    );
    return result.lastInsertRowId;
}

// Get cards in a folder (excluding deleted and hiding empty Restored Fields)
export async function getCards(folderId) {
    const rows = await db.getAllAsync(
        "SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL ORDER BY name",
        [folderId]
    );
    
    // Filter out Restored Fields card if it's empty (system card with no fields)
    const filtered = [];
    for (const card of rows) {
        if (card.is_system_card === 1) {
            // Check if it has any fields
            const fields = await db.getAllAsync(
                "SELECT COUNT(*) as count FROM fields WHERE parent_id = ? AND deleted_at IS NULL",
                [card.id]
            );
            
            // Only include if it has fields
            if (fields[0].count > 0) {
                filtered.push(card);
            }
        } else {
            filtered.push(card);
        }
    }
    
    return filtered;
}

// Edit card
export async function updateCard(id, name, color = null) {
    // Prevent editing system cards
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [id]);
    if (card && card.is_system_card === 1) {
        throw new Error("Cannot edit system cards");
    }
    
    return db.runAsync(
        `UPDATE cards
         SET name = ?, color = ?, updated_at = (datetime('now', 'localtime'))
         WHERE id = ?`,
        [name, color, id]
    );
}

// Soft delete card (marks ONLY the card as deleted, not its fields)
export async function deleteCard(cardId) {
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    
    // Prevent deleting system card (Restored Fields)
    if (card && card.is_system_card === 1) {
        // Instead of deleting the card, soft-delete all its fields
        const fields = await db.getAllAsync(
            "SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL",
            [cardId]
        );
        
        // Soft delete all fields
        for (const field of fields) {
            await deleteField(field.id);
        }
        
        return; // Don't delete the system card itself
    }

    // Mark only card as deleted (fields remain active but hidden)
    await db.runAsync(
        "UPDATE cards SET deleted_at = (datetime('now', 'localtime')) WHERE id = ?",
        [cardId]
    );
}

// Permanently delete card (recursively deletes ALL non-deleted fields)
export async function permanentlyDeleteCard(cardId) {
    // Get all fields that are NOT already deleted and delete them permanently
    const fields = await db.getAllAsync(
        "SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL",
        [cardId]
    );
    for (const field of fields) {
        await permanentlyDeleteField(field.id);
    }

    // Finally delete the card itself
    await db.runAsync("DELETE FROM cards WHERE id = ?", [cardId]);
}

// Move card (cut/paste)
export async function moveCard(id, newFolderId) {
    return db.runAsync(
        `UPDATE cards
         SET parent_id = ?, updated_at = (datetime('now', 'localtime'))
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
    // Prevent creating fields inside system card (Restored Fields)
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (card && card.is_system_card === 1) {throw new Error("Cannot create fields inside system cards");}
    
    const result = await db.runAsync(
        `INSERT INTO fields (parent_id, name, context, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, (datetime('now', 'localtime')), (datetime('now', 'localtime')))`,
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
         SET name = ?, context = ?, color = ?, updated_at = (datetime('now', 'localtime'))
         WHERE id = ?`,
        [name, context, color, id]
    );
}

// Soft delete field (marks as deleted)
export async function deleteField(id) {
    return db.runAsync(
        "UPDATE fields SET deleted_at = (datetime('now', 'localtime')) WHERE id = ?",
        [id]
    );
}

// Permanently delete field
export async function permanentlyDeleteField(id) {
    await db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
}

// Move field (cut/paste)
export async function moveField(id, newCardId) {
    return db.runAsync(
        `UPDATE fields
         SET parent_id = ?, updated_at = (datetime('now', 'localtime'))
         WHERE id = ?`,
        [newCardId, id]
    );
}

// ---------- TRASH / RESTORE ---------- //

// Get all deleted items (only top-level parents, not their children)
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

// Restore a folder (and all its children)
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
        "UPDATE folders SET deleted_at = NULL, parent_id = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?",
        [targetParentId, folderId]
    );
}

// Restore a card (and all its fields)
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
        "UPDATE cards SET deleted_at = NULL, parent_id = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?",
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
        // Parent card doesn't exist or is deleted - move to "Restored Fields" card
        const restoredFolder = await getOrCreateRestoredItemsFolder();
        const restoredCard = await getOrCreateRestoredFieldsCard(restoredFolder);
        
        await db.runAsync(
            "UPDATE fields SET deleted_at = NULL, parent_id = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?",
            [restoredCard, fieldId]
        );
    } else {
        // Parent exists, restore normally
        await db.runAsync(
            "UPDATE fields SET deleted_at = NULL, updated_at = (datetime('now', 'localtime')) WHERE id = ?",
            [fieldId]
        );
    }
}

// Get or create "Restored Items" folder
async function getOrCreateRestoredItemsFolder() {
    const existing = await db.getFirstAsync(
        "SELECT * FROM folders WHERE is_system_folder = 1 AND parent_id IS NULL AND deleted_at IS NULL"
    );
    if (existing) return existing.id;

    const result = await db.runAsync(
        "INSERT INTO folders (parent_id, name, color, is_system_folder) VALUES (NULL, 'Restored Items ', '#ff9800', 1)"
    );
    return result.lastInsertRowId;
}

// Get or create "Restored Fields " card in Restored Items folder
async function getOrCreateRestoredFieldsCard(folderId) {
    const existing = await db.getFirstAsync(
        "SELECT * FROM cards WHERE is_system_card = 1 AND parent_id = ? AND deleted_at IS NULL",
        [folderId]
    );
    if (existing) return existing.id;

    const result = await db.runAsync(
        "INSERT INTO cards (parent_id, name, color, is_system_card) VALUES (?, 'Restored Fields ', '#ff9800', 1)",
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