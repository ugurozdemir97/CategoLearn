import db from "./db";

// ---------- FOLDERS (subjects + categories) ----------

// Create folder (subject if is_root=1, category if is_root=0)
export async function addFolder(parentId, name, color = null, isRoot = 0) {
  const result = await db.runAsync(
    `INSERT INTO folders (parent_id, name, color, is_root, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [parentId, name, color, isRoot]
  );
  console.log("Inserted folder rowid:", result.lastInsertRowId);
  return result.lastInsertRowId;
}

// Get folders under a parent
export async function getFolders(parentId) {
  let sql, params;
  if (parentId == null) {
    sql = "SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name";
    params = [];
  } else {
    sql = "SELECT * FROM folders WHERE parent_id = ? ORDER BY name";
    params = [parentId];
  }

  const rows = await db.getAllAsync(sql, params);
  console.log("Fetched folders:", rows);
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

// Delete folder
export async function deleteFolder(id) {
  return db.runAsync("DELETE FROM folders WHERE id = ?", [id]);
}

// Move folder (cut/paste)
export async function moveFolder(id, newParentId) {
  return db.runAsync(
    `UPDATE folders
     SET parent_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newParentId, id]
  );
}

// ---------- CARDS ----------

export async function addCard(folderId, title) {
  const result = await db.runAsync(
    `INSERT INTO cards (folder_id, title, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [folderId, title]
  );
  console.log("Inserted card rowid:", result.lastInsertRowId);
  return result.lastInsertRowId;
}

export async function getCards(folderId) {
  const rows = await db.getAllAsync(
    "SELECT * FROM cards WHERE folder_id = ? ORDER BY title",
    [folderId]
  );
  console.log("Fetched cards:", rows);
  return rows;
}

export async function updateCard(id, title) {
  return db.runAsync(
    `UPDATE cards
     SET title = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, id]
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

// ---------- FIELDS ----------

export async function addField(cardId, fieldName, context) {
  console.log("Here")
  const result = await db.runAsync(
    `INSERT INTO fields (card_id, field_name, context, created_at, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [cardId, fieldName, context]
  );
  console.log("Inserted field rowid:", result.lastInsertRowId);
  return result.lastInsertRowId;
}

export async function getFields(cardId) {
  const rows = await db.getAllAsync(
    "SELECT * FROM fields WHERE card_id = ? ORDER BY id",
    [cardId]
  );
  console.log("Fetched fields:", rows);
  return rows;
}

export async function updateField(id, fieldName, context) {
  return db.runAsync(
    `UPDATE fields
     SET field_name = ?, context = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [fieldName, context, id]
  );
}

export async function deleteField(id) {
  return db.runAsync("DELETE FROM fields WHERE id = ?", [id]);
}