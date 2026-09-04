const VERSION_ONE_COLUMNS = {
    folders: ['id', 'parent_id', 'name', 'color', 'type', 'is_system_folder', 'sort_index', 'created_at', 'updated_at', 'deleted_at'],
    cards: ['id', 'parent_id', 'name', 'color', 'type', 'is_system_card', 'sort_index', 'created_at', 'updated_at', 'deleted_at'],
    fields: ['id', 'parent_id', 'name', 'color', 'type', 'context', 'sort_index', 'created_at', 'updated_at', 'deleted_at']
};

// Keep this list synchronized with the schema produced by every migration.
export const CURRENT_SCHEMA_COLUMNS = {
    folders: [...VERSION_ONE_COLUMNS.folders],
    cards: [...VERSION_ONE_COLUMNS.cards],
    fields: [...VERSION_ONE_COLUMNS.fields]
};

const VERSION_ONE_SCHEMA = `
    CREATE TABLE folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
        color TEXT,
        type TEXT DEFAULT 'Category',
        is_system_folder INTEGER DEFAULT 0,
        sort_index INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT (datetime('now', 'localtime')),
        updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
        deleted_at DATETIME DEFAULT NULL,
        FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL,
        name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
        color TEXT,
        type TEXT DEFAULT 'Card',
        is_system_card INTEGER DEFAULT 0,
        sort_index INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT (datetime('now', 'localtime')),
        updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
        deleted_at DATETIME DEFAULT NULL,
        FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL,
        name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 50),
        color TEXT,
        type TEXT DEFAULT 'Field',
        context TEXT,
        sort_index INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT (datetime('now', 'localtime')),
        updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
        deleted_at DATETIME DEFAULT NULL,
        FOREIGN KEY(parent_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX idx_unique_folders
        ON folders(parent_id, name)
        WHERE is_system_folder = 0 AND deleted_at IS NULL;
    CREATE UNIQUE INDEX idx_unique_cards
        ON cards(parent_id, name)
        WHERE is_system_card = 0 AND deleted_at IS NULL;
    CREATE UNIQUE INDEX idx_unique_fields
        ON fields(parent_id, name)
        WHERE deleted_at IS NULL;
`;

const CURRENT_INDEXES = `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_folders
        ON folders(parent_id, name)
        WHERE is_system_folder = 0 AND deleted_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cards
        ON cards(parent_id, name)
        WHERE is_system_card = 0 AND deleted_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_fields
        ON fields(parent_id, name)
        WHERE deleted_at IS NULL;
`;

function hasExactColumns(actualColumns, expectedColumns) {
    const actual = [...actualColumns].sort();
    const expected = [...expectedColumns].sort();
    return actual.length === expected.length
        && actual.every((column, index) => column === expected[index]);
}

async function getUserTableNames(database) {
    const rows = await database.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    );
    return rows.map((row) => row.name);
}

async function adoptOrCreateVersionOne(database, { allowFreshDatabase }) {
    const tableNames = await getUserTableNames(database);

    if (tableNames.length === 0) {
        if (!allowFreshDatabase) {
            throw new Error('The selected file is not a CategoLearn database.');
        }
        await database.execAsync(VERSION_ONE_SCHEMA);
        return;
    }

    for (const [tableName, expectedColumns] of Object.entries(VERSION_ONE_COLUMNS)) {
        if (!tableNames.includes(tableName)) {
            throw new Error(`The unversioned database is missing the ${tableName} table.`);
        }

        const tableInfo = await database.getAllAsync(`PRAGMA table_info(${tableName})`);
        const actualColumns = tableInfo.map((column) => column.name);
        if (!hasExactColumns(actualColumns, expectedColumns)) {
            throw new Error(`The unversioned ${tableName} schema is not recognized.`);
        }
    }
}

const MIGRATIONS = [
    {
        version: 1,
        name: 'Initial CategoLearn schema',
        up: adoptOrCreateVersionOne
    }
];

export const CURRENT_DATABASE_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function getDatabaseVersion(database) {
    const result = await database.getFirstAsync('PRAGMA user_version');
    const version = result?.user_version ?? 0;

    if (!Number.isInteger(version) || version < 0) {
        throw new Error('The database has an invalid schema version.');
    }
    return version;
}

/**
 * Applies every missing migration in order. Each migration and its version
 * update share one transaction, so a failed migration leaves the old version
 * unchanged.
 */
export async function migrateDatabase(database, options = {}) {
    const migrationOptions = { allowFreshDatabase: false, ...options };
    let version = await getDatabaseVersion(database);

    if (version > CURRENT_DATABASE_VERSION) {
        throw new Error(
            `Database version ${version} is newer than supported version ${CURRENT_DATABASE_VERSION}.`
        );
    }

    for (const migration of MIGRATIONS) {
        if (migration.version <= version) continue;
        if (migration.version !== version + 1) {
            throw new Error(`Database migration ${version + 1} is missing.`);
        }

        await database.withExclusiveTransactionAsync(async (transaction) => {
            await migration.up(transaction, migrationOptions);
            await transaction.execAsync(`PRAGMA user_version = ${migration.version}`);
        });

        version = migration.version;
    }

    return version;
}

export async function ensureCurrentIndexes(database) {
    await database.execAsync(CURRENT_INDEXES);
}
