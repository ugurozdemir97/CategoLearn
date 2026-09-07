import db from "./db";
import { enforceDatabaseConnectionPolicy } from "./connectionPolicy.js";
import { ensureCurrentIndexes, migrateDatabase } from "./migrations.js";

export async function setupDatabase() {
    // Establish deletion behavior before migrations or ordinary queries can run.
    await enforceDatabaseConnectionPolicy(db);

    // Existing unversioned databases are adopted as version 1 without changing their schema.
    await migrateDatabase(db, { allowFreshDatabase: true });
    await ensureCurrentIndexes(db);

    // Get Restored Items folder
    let restoredItemsFolderId;
    const restoredItemsFolder = await db.getFirstAsync("SELECT * FROM folders WHERE is_system_folder = 1 AND parent_id IS NULL");

    // Create Restored Items folder if it doesn't exist
    if (!restoredItemsFolder) {
        const result = await db.runAsync("INSERT INTO folders (parent_id, name, color, is_system_folder) VALUES (NULL, 'Restored Items ', '#ff9800', 1)");
        restoredItemsFolderId = result.lastInsertRowId;
    } else {
        restoredItemsFolderId = restoredItemsFolder.id;
    }

    // Get Restored Fields card
    const restoredFieldsCard = await db.getFirstAsync("SELECT * FROM cards WHERE is_system_card = 1 AND parent_id = ?", [restoredItemsFolderId]);

    // Create Restored Fields card if it doesn't exist
    if (!restoredFieldsCard) {
        await db.runAsync("INSERT INTO cards (parent_id, name, color, is_system_card) VALUES (?, 'Restored Fields ', '#ff9800', 1)", [restoredItemsFolderId]);
    }
}
