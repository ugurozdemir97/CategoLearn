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
            name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
            color TEXT,
            type TEXT DEFAULT 'Category',
            is_system_folder INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
            deleted_at DATETIME DEFAULT NULL,
            FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
        );
    `);

    // Cards table (must belong to a folder, never root)
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER NOT NULL,
            name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
            color TEXT,
            type TEXT DEFAULT 'Card',
            is_system_card INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
            deleted_at DATETIME DEFAULT NULL,
            FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
        );
    `);

    // Fields table (extra content for cards)
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER NOT NULL,
            name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
            color TEXT,
            type TEXT DEFAULT 'Field',
            context TEXT,
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
            deleted_at DATETIME DEFAULT NULL,
            FOREIGN KEY(parent_id) REFERENCES cards(id) ON DELETE CASCADE
        );
    `);

    // Drop old indexes if they exist (to recreate with new WHERE clause)
    await db.execAsync(`DROP INDEX IF EXISTS idx_unique_folders;`);
    await db.execAsync(`DROP INDEX IF EXISTS idx_unique_cards;`);
    await db.execAsync(`DROP INDEX IF EXISTS idx_unique_fields;`);

    // Create UNIQUE indexes that exclude system items AND deleted items
    await db.execAsync(`
        CREATE UNIQUE INDEX idx_unique_folders 
        ON folders(parent_id, name) 
        WHERE is_system_folder = 0 AND deleted_at IS NULL;
    `);

    await db.execAsync(`
        CREATE UNIQUE INDEX idx_unique_cards 
        ON cards(parent_id, name) 
        WHERE is_system_card = 0 AND deleted_at IS NULL;
    `);

    await db.execAsync(`
        CREATE UNIQUE INDEX idx_unique_fields 
        ON fields(parent_id, name)
        WHERE deleted_at IS NULL;
    `);

    // Create Restored Items folder if it doesn't exist
    const restoredItemsFolder = await db.getFirstAsync("SELECT * FROM folders WHERE is_system_folder = 1 AND parent_id IS NULL");
    
    let restoredItemsFolderId;
    if (!restoredItemsFolder) {
        const result = await db.runAsync("INSERT INTO folders (parent_id, name, color, is_system_folder) VALUES (NULL, 'Restored Items ', '#ff9800', 1)");
        restoredItemsFolderId = result.lastInsertRowId;
    } else {
        restoredItemsFolderId = restoredItemsFolder.id;
    }

    // Create Restored Fields card if it doesn't exist
    const restoredFieldsCard = await db.getFirstAsync("SELECT * FROM cards WHERE is_system_card = 1 AND parent_id = ?", [restoredItemsFolderId]);
    
    if (!restoredFieldsCard) {
        await db.runAsync("INSERT INTO cards (parent_id, name, color, is_system_card) VALUES (?, 'Restored Fields ', '#ff9800', 1)", [restoredItemsFolderId]);
    }
}