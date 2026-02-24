import db from "./db";

// ************************** FOLDERS (Categories) ************************** //

// Create folder
export async function addFolder(parentId, name, color = null) {

    // Prevent creating folders inside system folder (Restored Items)
    if (parentId !== null) {
        const parent = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [parentId]);
        if (parent && parent.is_system_folder === 1) {throw new Error("Cannot create folders inside system folders")}
    }
    
    const result = await db.runAsync("INSERT INTO folders (parent_id, name, color, created_at, updated_at) VALUES (?, ?, ?, (datetime('now', 'localtime')), (datetime('now', 'localtime')))", [parentId, name, color]);
    return result.lastInsertRowId;  // Return added folder
}

// Get folders (excluding deleted folders)
export async function getFolders(parentId) {

    // Bring all folders except deleted ones with a specific parent or no parent
    let sql, params;
    if (parentId == null) {sql = "SELECT * FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY name"; params = []}
    else                  {sql = "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL ORDER BY name"; params = [parentId]}
    const folders = await db.getAllAsync(sql, params);  // folders that meet these conditions
    
    // Hide system folders if they are empty
    const filtered = [];
    for (const folder of folders) {

        // If system folder, check if it has any item inside it. System card with no fields also doesn't count
        if (folder.is_system_folder === 1) {

            const childFolders = await db.getAllAsync("SELECT COUNT(*) as count FROM folders WHERE parent_id = ? AND deleted_at IS NULL AND is_system_folder = 0", [folder.id]);
            const childCards =   await db.getAllAsync("SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL", [folder.id]);
            
            // Check if there are any cards inside the system folder, if it is a system card, check if it has fields
            let hasNonEmptyCards = false;
            for (const card of childCards) {
                if (card.is_system_card === 0) {
                    hasNonEmptyCards = true; 
                    break;
                } else {
                    const fields = await db.getAllAsync("SELECT COUNT(*) as count FROM fields WHERE parent_id = ? AND deleted_at IS NULL", [card.id]);
                    if (fields[0].count > 0) {
                        hasNonEmptyCards = true; 
                        break;
                    }
                }
            }
            
            // Only include system folder if it has folders, cards or non-empty system card
            if (childFolders[0].count > 0 || hasNonEmptyCards) filtered.push(folder);
        
        // If it is not a system folder, add it directly
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
    if (folder && folder.is_system_folder === 1) {throw new Error("Cannot edit system folders")}
    
    // Return edited folder
    return db.runAsync(`UPDATE folders SET name = ?, color = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [name, color, id]);
}

// Soft delete folder
export async function deleteFolder(folderId) {

    // Prevent deleting system folder (Restored Items), if deleted, just delete its children
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    if (folder && folder.is_system_folder === 1) {
        const childFolders = await db.getAllAsync("SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL", [folderId]);
        const childCards =   await db.getAllAsync("SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL", [folderId]);
        
        // Soft delete all children
        for (const child of childFolders) await deleteFolder(child.id);
        for (const child of childCards)   await deleteCard(child.id);
        
        return; // Don't delete the system folder itself
    }

    // Mark only this folder as deleted (children actually remain active but hidden)
    await db.runAsync("UPDATE folders SET deleted_at = datetime('now', 'localtime') WHERE id = ?", [folderId]);
}

// Permanently delete folder (recursively deletes ALL non-deleted children)
export async function permanentlyDeleteFolder(folderId) {
    
    // Get all child cards that are NOT already deleted and delete them permanently
    const childCards =             await db.getAllAsync("SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL", [folderId]);
    for (const card of childCards) await permanentlyDeleteCard(card.id);

    // Get all child folders that are NOT already deleted and delete them permanently (recursive)
    const childFolders =               await db.getAllAsync("SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL", [folderId]);
    for (const folder of childFolders) await permanentlyDeleteFolder(folder.id);

    // Finally delete this folder itself
    await db.runAsync("DELETE FROM folders WHERE id = ?", [folderId]);
}

// Check if a folder is a descendant of another, used to prevent pasting a folder into its own children
// nodeId is where we try to paste the sourceId
export async function isDescendant(sourceId, nodeId) {
    if (sourceId === nodeId) return true;         // If the folder has being tried to paste into itself
    const children = await getFolders(sourceId);  // Bring all children

    // If any children element is the same with the location we are in
    // Or any children of the children (recursive) is the same with the location we are in
    for (const child of children) {
        if (child.id === nodeId || await isDescendant(child.id, nodeId)) return true;
    }

    return false;
}

// Copy folder recursively (with cards + fields)
export async function copyFolderRecursive(itemId, newParentId, idMap = {}) {

    const copiedItem =  await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [itemId]);
    const newFolderId = await addFolder(newParentId, copiedItem.name, copiedItem.color);
    idMap[copiedItem.id] = newFolderId;

    // Copy cards with their fields
    const childCards =          await getCards(copiedItem.id);
    for (const c of childCards) await copyCardRecursive(c.id, newFolderId);

    // Copy subfolders recursively
    const childFolders =               await getFolders(copiedItem.id);
    for (const folder of childFolders) await copyFolderRecursive(folder.id, newFolderId, idMap);

    return newFolderId;
}

// Move folder (cut/paste)
export async function moveFolder(id, newParentId) {
    if (newParentId === null) return db.runAsync(`UPDATE folders SET parent_id = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?`, [id]);
    else                      return db.runAsync(`UPDATE folders SET parent_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [newParentId, id]);
}

// ************************** CARDS ************************** //

// Add card to a folder
export async function addCard(folderId, name, color = null) {

    // Prevent creating cards inside system folder (Restored Items)
    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    if (folder && folder.is_system_folder === 1) {throw new Error("Cannot create cards inside system folders")}
    
    const result = await db.runAsync(`INSERT INTO cards (parent_id, name, color, created_at, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`, [folderId, name, color]);
    return result.lastInsertRowId;  // Return added card
}

// Get cards (excluding deleted cards)
export async function getCards(folderId) {

    // Bring all cards except deleted ones
    const cards = await db.getAllAsync("SELECT * FROM cards WHERE parent_id = ? AND deleted_at IS NULL ORDER BY name", [folderId]);
    
    // If it is the system card, hide it if it is empty
    const filtered = [];
    for (const card of cards) {
        if (card.is_system_card === 1) {
            const fields = await db.getAllAsync("SELECT COUNT(*) as count FROM fields WHERE parent_id = ? AND deleted_at IS NULL", [card.id]);
            if (fields[0].count > 0) filtered.push(card);
        } else {
            filtered.push(card);  // Add normal cards
        }
    }
    
    return filtered;
}

// Edit card
export async function updateCard(id, name, color = null) {

    // Prevent editing system cards
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [id]);
    if (card && card.is_system_card === 1) {throw new Error("Cannot edit system cards")}
    
    return db.runAsync(`UPDATE cards SET name = ?, color = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [name, color, id]);

}

// Soft delete card
export async function deleteCard(cardId) {
    
    // Prevent deleting system card (Restored Fields), if deleted just delete its fields
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (card && card.is_system_card === 1) {
        const fields =              await db.getAllAsync("SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL", [cardId]);
        for (const field of fields) await deleteField(field.id);
        return; // Don't delete the system card itself
    }

    // Mark only card as deleted (fields remain active but hidden)
    await db.runAsync("UPDATE cards SET deleted_at = datetime('now', 'localtime') WHERE id = ?", [cardId]);

}

// Permanently delete card (recursively deletes ALL non-deleted fields)
export async function permanentlyDeleteCard(cardId) {

    // Get all fields that are NOT already deleted and delete them permanently
    const fields =              await db.getAllAsync("SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL", [cardId]);
    for (const field of fields) await permanentlyDeleteField(field.id);

    // Finally delete the card itself
    await db.runAsync("DELETE FROM cards WHERE id = ?", [cardId]);
}

// Move card (cut/paste)
export async function moveCard(id, newFolderId) {
    return db.runAsync(`UPDATE cards SET parent_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [newFolderId, id]);
}

// Copy card recursively (with all its fields)
export async function copyCardRecursive(copiedCard, newFolderId) {
    const card =            await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [copiedCard]);
    const newCardId =       await addCard(newFolderId, card.name);
    const fields =          await getFields(card.id);
    for (const f of fields) await addField(newCardId, f.name, f.context);

    return newCardId;
}

// ************************** FIELDS ************************** //

// Create field
export async function addField(cardId, name, context = null, color = null) {

    // Prevent creating fields inside system card (Restored Fields)
    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (card && card.is_system_card === 1) {throw new Error("Cannot create fields inside system cards")}
    
    const result = await db.runAsync(`INSERT INTO fields (parent_id, name, context, color, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`, [cardId, name, context, color]);
    return result.lastInsertRowId;  // Return added folder

}

// Get fields (excluding deleted ones)
export async function getFields(cardId) {
    const rows = await db.getAllAsync("SELECT * FROM fields WHERE parent_id = ? AND deleted_at IS NULL ORDER BY id", [cardId]);
    return rows;
}

// Edit field
export async function updateField(id, name, context = null, color = null) {
    return db.runAsync(`UPDATE fields SET name = ?, context = ?, color = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [name, context, color, id]);
}

// Soft delete field (marks as deleted)
export async function deleteField(id) {
    return db.runAsync("UPDATE fields SET deleted_at = datetime('now', 'localtime') WHERE id = ?", [id]);
}

// Permanently delete field
export async function permanentlyDeleteField(id) {
    await db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
}

// Move field (cut/paste)
export async function moveField(id, newCardId) {
    return db.runAsync(`UPDATE fields SET parent_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [newCardId, id]);
}

// ************************** RESTORE ITEMS ************************** //

// Generate unique name if conflict exists while restoring
// For example if you try to restore a folder called "A" and that folder already exist where you try to restore it
async function generateUniqueName(baseName, parentId, tableName) {

    // First, check if the original name is available in the folder we are trying to restore
    const checkQuery =   `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ? AND parent_id ${parentId === null ? 'IS NULL' : '= ?'} AND deleted_at IS NULL`;
    const checkParams =   parentId === null ? [baseName] : [baseName, parentId];
    const originalCheck = await db.getFirstAsync(checkQuery, checkParams);
    
    // If original name is available, return baseName
    if (originalCheck.count === 0) return baseName;

    // Original name is taken, we need to rename the item before restoring
    // Check if the base name already has a number suffix like "Name (1)"
    const numberPattern = /^(.+?)\s*\((\d+)\)$/;
    const match = baseName.match(numberPattern);  // If it has a number like "Folder (1)", match[1] is is "Folder", match[2] is "(1)"
    
    // By default, assume there are no numbers, start the number at 1
    let coreName = baseName;
    let counter = 1;
    
    // If it already has a number, extract the core name and start from that number
    if (match) {
        coreName = match[1];
        counter = parseInt(match[2], 10);  // Turn string into integer, if "Folder (1)" > 1
    }
    
    let uniqueName;
    let exists = true;

    // Add (1) if there is no number, if it already exist, try (2), (3)...
    while (exists) {
        uniqueName = `${coreName} (${counter})`;
        const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ? AND parent_id ${parentId === null ? 'IS NULL' : '= ?'} AND deleted_at IS NULL`;
        const params = parentId === null ? [uniqueName] : [uniqueName, parentId];
        const result = await db.getFirstAsync(query, params);
        if (result.count === 0) exists = false;
        else                    counter++;
    }

    return uniqueName;  // Return "baseName (x)" as a name
}


// Get all deleted items (only top-level parents, not their children)
export async function getDeletedItems() {
    const folders = await db.getAllAsync("SELECT *, 'Category' as type FROM folders WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC");
    const cards = await db.getAllAsync("SELECT *, 'Card' as type FROM cards WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC");
    const fields = await db.getAllAsync("SELECT *, 'Field' as type FROM fields WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC");
    return [...folders, ...cards, ...fields];
}

// Restore a folder (and all its children)
export async function restoreFolder(folderId) {


    const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [folderId]);
    if (!folder) return false;

    // Check if parent exists and is not deleted, if parent is also deleted, restore the item in Restored Items folder
    let targetParentId = folder.parent_id;
    if (targetParentId !== null) {
        const parent =                await db.getFirstAsync("SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL", [targetParentId]);
        if (!parent) targetParentId = await getOrCreateRestoredItemsFolder();
    }

    // Generate unique name if conflict exists while restoring. Then restore it
    const uniqueName = await generateUniqueName(folder.name, targetParentId, 'folders');
    await db.runAsync("UPDATE folders SET deleted_at = NULL, parent_id = ?, name = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?", [targetParentId, uniqueName, folderId]);
    return uniqueName !== folder.name; // Return true if renamed
}

// Restore a card (and all its fields)
export async function restoreCard(cardId) {

    const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (!card) return false;

    // Check if parent folder exists and is not deleted, if parent is also deleted, restore the item in Restored Items folder
    let targetFolderId = card.parent_id;
    const parentFolder =                await db.getFirstAsync("SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL", [targetFolderId]);
    if (!parentFolder) targetFolderId = await getOrCreateRestoredItemsFolder();

    // Generate unique name if conflict exists while restoring. Then restore it
    const uniqueName = await generateUniqueName(card.name, targetFolderId, 'cards');
    await db.runAsync("UPDATE cards SET deleted_at = NULL, parent_id = ?, name = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?", [targetFolderId, uniqueName, cardId]);
    return uniqueName !== card.name; // Return true if renamed
}

// Restore a field
export async function restoreField(fieldId) {

    const field = await db.getFirstAsync("SELECT * FROM fields WHERE id = ?", [fieldId]);
    if (!field) return false;

    // Check if parent card exists and is not deleted, if parent is also deleted, restore the item in Restored Fields card
    let targetCardId = field.parent_id;
    const parentCard = await db.getFirstAsync("SELECT * FROM cards WHERE id = ? AND deleted_at IS NULL",[targetCardId]);
    if (!parentCard) {
        const restoredFolder = await getOrCreateRestoredItemsFolder();
        targetCardId = await getOrCreateRestoredFieldsCard(restoredFolder);
    }
    
    // Generate unique name if conflict exists while restoring. Then restore it
    const uniqueName = await generateUniqueName(field.name, targetCardId, 'fields');
    await db.runAsync("UPDATE fields SET deleted_at = NULL, parent_id = ?, name = ?, updated_at = (datetime('now', 'localtime')) WHERE id = ?", [targetCardId, uniqueName, fieldId]);
    return uniqueName !== field.name; // Return true if renamed
}

// Get or create "Restored Items" folder
async function getOrCreateRestoredItemsFolder() {
    const existing = await db.getFirstAsync("SELECT * FROM folders WHERE is_system_folder = 1 AND parent_id IS NULL AND deleted_at IS NULL");
    if (existing)    return existing.id;

    const result = await db.runAsync("INSERT INTO folders (parent_id, name, color, is_system_folder) VALUES (NULL, 'Restored Items ', '#ff9800', 1)");
    return result.lastInsertRowId;
}

// Get or create "Restored Fields " card in Restored Items folder
async function getOrCreateRestoredFieldsCard(folderId) {
    const existing = await db.getFirstAsync("SELECT * FROM cards WHERE is_system_card = 1 AND parent_id = ? AND deleted_at IS NULL", [folderId]);
    if (existing) return existing.id;

    const result = await db.runAsync("INSERT INTO cards (parent_id, name, color, is_system_card) VALUES (?, 'Restored Fields ', '#ff9800', 1)", [folderId]);
    return result.lastInsertRowId;
}

// Restore multiple items (folders first, then cards, then fields)
export async function restoreMultipleItems(items) {

    // Sort: folders first, cards second, fields last
    const folders = items.filter(i => i.type === "Category");
    const cards =   items.filter(i => i.type === "Card");
    const fields =  items.filter(i => i.type === "Field");

    let anyRenamed = false;
    
    // Restore in order and track if any were renamed
    for (const folder of folders) {
        const wasRenamed = await restoreFolder(folder.id);
        if (wasRenamed) anyRenamed = true;
    }
    for (const card of cards) {
        const wasRenamed = await restoreCard(card.id);
        if (wasRenamed) anyRenamed = true;
    }
    for (const field of fields) {
        const wasRenamed = await restoreField(field.id);
        if (wasRenamed) anyRenamed = true;
    }
    
    return anyRenamed; // Return true if any item was renamed, this is to inform users about renaming items while restoring process
}