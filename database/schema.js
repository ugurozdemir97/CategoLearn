import db from "./db";

export async function setupDatabase() {
  // Drop old tables if you want a clean reset
//await db.execAsync("DROP TABLE IF EXISTS fields");
//await db.execAsync("DROP TABLE IF EXISTS cards");
//await db.execAsync("DROP TABLE IF EXISTS folders");

  // Folders table (subjects + categories unified)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      name TEXT NOT NULL CHECK(length(name) <= 50),
      color TEXT,
      is_root INTEGER DEFAULT 0, -- 1 = subject, 0 = category
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE(parent_id, name) -- prevent duplicate names in same folder
    );
  `);

  // Cards table (must belong to a folder, never root)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      name TEXT NOT NULL CHECK(length(name) <= 50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
    );
  `);

  // Fields table (extra content for cards)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      name TEXT CHECK(length(name) <= 50),
      context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
    );
  `);
}