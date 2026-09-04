import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import db from './db.js';
import { setupDatabase } from './schema.js';
import {
    CURRENT_DATABASE_VERSION,
    CURRENT_SCHEMA_COLUMNS,
    getDatabaseVersion,
    migrateDatabase
} from './migrations.js';

const DATABASE_EXTENSION = '.db';
const DATABASE_MIME_TYPE = 'application/x-sqlite3';
const IMPORT_FOLDER_COLOR = '#ff9800';
const MAX_NAME_LENGTH = 50;

const EXPECTED_PARENT_TABLE = {
    folders: 'folders',
    cards: 'folders',
    fields: 'cards'
};

function timestampedName(prefix) {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return `${prefix}_${date}_${now.getTime()}${DATABASE_EXTENSION}`;
}

function directoryPath(uri) {
    if (!uri) throw new Error('A writable database directory is unavailable.');
    return uri.endsWith('/') ? uri : `${uri}/`;
}

async function deleteDatabaseArtifacts(directory, fileName) {
    const basePath = `${directoryPath(directory)}${fileName}`;
    await Promise.all([
        FileSystem.deleteAsync(basePath, { idempotent: true }),
        FileSystem.deleteAsync(`${basePath}-wal`, { idempotent: true }),
        FileSystem.deleteAsync(`${basePath}-shm`, { idempotent: true })
    ]);
}

async function safelyDeleteDatabaseArtifacts(directory, fileName) {
    try {
        await deleteDatabaseArtifacts(directory, fileName);
    } catch (error) {
        console.warn('Temporary database cleanup error:', error);
    }
}

async function createConsistentSnapshot(directory, fileName) {
    if (!directory) throw new Error('A writable database backup directory is unavailable.');

    await deleteDatabaseArtifacts(directory, fileName);
    let destination;

    try {
        destination = await SQLite.openDatabaseAsync(fileName, { useNewConnection: true }, directory);
        await SQLite.backupDatabaseAsync({ sourceDatabase: db, destDatabase: destination });

        const check = await destination.getFirstAsync('PRAGMA quick_check');
        if (!check || Object.values(check)[0] !== 'ok') {
            throw new Error('The database snapshot did not pass its integrity check.');
        }

        await destination.closeAsync();
        return `${directoryPath(directory)}${fileName}`;
    } catch (error) {
        if (destination) {
            try { await destination.closeAsync(); } catch (closeError) { console.warn('Snapshot close error:', closeError); }
        }
        await deleteDatabaseArtifacts(directory, fileName);
        throw error;
    }
}

async function openPreparedDatabase(preparedImport) {
    return SQLite.openDatabaseAsync(
        preparedImport.stagedFileName,
        { useNewConnection: true },
        FileSystem.cacheDirectory
    );
}

function ensureExpectedColumns(tableName, tableInfo) {
    const actualColumns = tableInfo.map((column) => column.name).sort();
    const expectedColumns = [...CURRENT_SCHEMA_COLUMNS[tableName]].sort();
    if (actualColumns.length !== expectedColumns.length || actualColumns.some((name, index) => name !== expectedColumns[index])) {
        throw new Error(`Unexpected ${tableName} schema.`);
    }
}

function validateHierarchy(folders, cards, fields) {
    const folderIds = new Set(folders.map((folder) => folder.id));
    const cardIds = new Set(cards.map((card) => card.id));
    const folderParents = new Map(folders.map((folder) => [folder.id, folder.parent_id]));
    const activeFolderNames = new Set();
    const activeCardNames = new Set();
    const activeFieldNames = new Set();

    for (const folder of folders) {
        if (folder.type != null && folder.type !== 'Category') throw new Error('Unexpected folder type.');
        if (folder.parent_id != null && !folderIds.has(folder.parent_id)) throw new Error('A folder parent is missing.');
        if (typeof folder.name !== 'string' || folder.name.length < 1 || folder.name.length > MAX_NAME_LENGTH) {
            throw new Error('A folder name is invalid.');
        }
        if (folder.parent_id != null && !folder.is_system_folder && folder.deleted_at == null) {
            const nameKey = `${folder.parent_id}\u0000${folder.name}`;
            if (activeFolderNames.has(nameKey)) throw new Error('Duplicate active folder names were found.');
            activeFolderNames.add(nameKey);
        }

        const visited = new Set([folder.id]);
        let parentId = folder.parent_id;
        while (parentId != null) {
            if (visited.has(parentId)) throw new Error('The folder hierarchy contains a cycle.');
            visited.add(parentId);
            parentId = folderParents.get(parentId);
        }
    }

    for (const card of cards) {
        if (card.type != null && card.type !== 'Card') throw new Error('Unexpected card type.');
        if (!folderIds.has(card.parent_id)) throw new Error('A card parent is missing.');
        if (typeof card.name !== 'string' || card.name.length < 1 || card.name.length > MAX_NAME_LENGTH) {
            throw new Error('A card name is invalid.');
        }
        if (!card.is_system_card && card.deleted_at == null) {
            const nameKey = `${card.parent_id}\u0000${card.name}`;
            if (activeCardNames.has(nameKey)) throw new Error('Duplicate active card names were found.');
            activeCardNames.add(nameKey);
        }
    }

    for (const field of fields) {
        if (field.type != null && field.type !== 'Field') throw new Error('Unexpected field type.');
        if (!cardIds.has(field.parent_id)) throw new Error('A field parent is missing.');
        if (typeof field.name !== 'string' || field.name.length < 1 || field.name.length > MAX_NAME_LENGTH) {
            throw new Error('A field name is invalid.');
        }
        if (field.deleted_at == null) {
            const nameKey = `${field.parent_id}\u0000${field.name}`;
            if (activeFieldNames.has(nameKey)) throw new Error('Duplicate active field names were found.');
            activeFieldNames.add(nameKey);
        }
    }
}

async function ensureDatabaseIntegrity(candidate) {
    const integrityRows = await candidate.getAllAsync('PRAGMA integrity_check');
    if (integrityRows.length === 0 || integrityRows.some((row) => Object.values(row)[0] !== 'ok')) {
        throw new Error('SQLite integrity check failed.');
    }
}

async function readAndValidateDatabase(candidate) {
    await ensureDatabaseIntegrity(candidate);

    const schemaObjects = await candidate.getAllAsync(
        "SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"
    );
    const tableNames = schemaObjects.filter((item) => item.type === 'table').map((item) => item.name).sort();
    const databaseVersion = await getDatabaseVersion(candidate);
    if (databaseVersion !== CURRENT_DATABASE_VERSION) {
        throw new Error(`Expected database version ${CURRENT_DATABASE_VERSION}, received ${databaseVersion}.`);
    }

    const expectedTableNames = Object.keys(CURRENT_SCHEMA_COLUMNS).sort();
    if (tableNames.length !== expectedTableNames.length || tableNames.some((name, index) => name !== expectedTableNames[index])) {
        throw new Error('Required CategoLearn tables are missing or do not match.');
    }
    if (schemaObjects.some((item) => item.type === 'trigger' || item.type === 'view')) {
        throw new Error('Unexpected database objects were found.');
    }

    for (const tableName of expectedTableNames) {
        ensureExpectedColumns(tableName, await candidate.getAllAsync(`PRAGMA table_info(${tableName})`));
        const foreignKeys = await candidate.getAllAsync(`PRAGMA foreign_key_list(${tableName})`);
        const expectedParent = EXPECTED_PARENT_TABLE[tableName];
        const hasExpectedParent = foreignKeys.some((foreignKey) => (
            foreignKey.table === expectedParent
            && foreignKey.from === 'parent_id'
            && foreignKey.to === 'id'
            && String(foreignKey.on_delete).toUpperCase() === 'CASCADE'
        ));
        if (!hasExpectedParent) throw new Error(`Unexpected ${tableName} relationships.`);
    }

    const foreignKeyProblems = await candidate.getAllAsync('PRAGMA foreign_key_check');
    if (foreignKeyProblems.length > 0) throw new Error('The database contains broken relationships.');

    const [folders, cards, fields] = await Promise.all([
        candidate.getAllAsync('SELECT * FROM folders ORDER BY id'),
        candidate.getAllAsync('SELECT * FROM cards ORDER BY id'),
        candidate.getAllAsync('SELECT * FROM fields ORDER BY id')
    ]);
    validateHierarchy(folders, cards, fields);

    return { folders, cards, fields };
}

function importedFolderBaseName(fileName) {
    const withoutExtension = (fileName || '').replace(/\.[^.]+$/, '');
    const cleaned = withoutExtension.replace(/[\u0000-\u001f]/g, '').trim();
    return (cleaned || 'Imported database').slice(0, MAX_NAME_LENGTH);
}

function uniqueName(baseName, usedNames) {
    if (!usedNames.has(baseName)) return baseName;

    let number = 1;
    while (true) {
        const suffix = ` (${number})`;
        const candidate = `${baseName.slice(0, MAX_NAME_LENGTH - suffix.length)}${suffix}`;
        if (!usedNames.has(candidate)) return candidate;
        number += 1;
    }
}

function insertMigratedRow(transaction, tableName, row, overrides = {}) {
    const columns = CURRENT_SCHEMA_COLUMNS[tableName].filter((column) => column !== 'id');
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((column) => (
        Object.prototype.hasOwnProperty.call(overrides, column) ? overrides[column] : row[column]
    ));

    return transaction.runAsync(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
    );
}

async function createPermanentPreImportBackup() {
    const backupName = timestampedName('CategoLearn_backup_before_import');
    await createConsistentSnapshot(FileSystem.documentDirectory, backupName);
    return backupName;
}

async function replaceCurrentDatabase(sourceDatabase, backupName) {
    try {
        await SQLite.backupDatabaseAsync({ sourceDatabase, destDatabase: db });
        await readAndValidateDatabase(db);
        await setupDatabase();
    } catch (error) {
        console.error('Replace import failed; restoring the pre-import backup:', error);
        let backupDatabase;
        try {
            backupDatabase = await SQLite.openDatabaseAsync(
                backupName,
                { useNewConnection: true },
                FileSystem.documentDirectory
            );
            await SQLite.backupDatabaseAsync({ sourceDatabase: backupDatabase, destDatabase: db });
        } finally {
            if (backupDatabase) await backupDatabase.closeAsync();
        }
        throw error;
    }
}

async function keepCurrentDatabase(sourceData, displayName) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
        const rootRows = await transaction.getAllAsync(
            'SELECT name FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL'
        );
        const usedRootNames = new Set(rootRows.map((row) => row.name));
        const containerName = uniqueName(importedFolderBaseName(displayName), usedRootNames);
        const containerResult = await transaction.runAsync(
            'INSERT INTO folders (parent_id, name, color, type, is_system_folder) VALUES (NULL, ?, ?, ?, 0)',
            [containerName, IMPORT_FOLDER_COLOR, 'Category']
        );
        const containerId = containerResult.lastInsertRowId;

        const folderIdMap = new Map();
        const pendingFolders = [...sourceData.folders];
        const activeFolderNamesByParent = new Map();

        while (pendingFolders.length > 0) {
            let insertedThisPass = 0;

            for (let index = pendingFolders.length - 1; index >= 0; index -= 1) {
                const folder = pendingFolders[index];
                if (folder.parent_id != null && !folderIdMap.has(folder.parent_id)) continue;

                const newParentId = folder.parent_id == null ? containerId : folderIdMap.get(folder.parent_id);
                let folderName = folder.name;
                if (folder.deleted_at == null) {
                    const siblingNames = activeFolderNamesByParent.get(newParentId) || new Set();
                    folderName = uniqueName(folderName, siblingNames);
                    siblingNames.add(folderName);
                    activeFolderNamesByParent.set(newParentId, siblingNames);
                }

                const result = await insertMigratedRow(transaction, 'folders', folder, {
                    parent_id: newParentId,
                    name: folderName,
                    type: 'Category',
                    is_system_folder: 0
                });
                folderIdMap.set(folder.id, result.lastInsertRowId);
                pendingFolders.splice(index, 1);
                insertedThisPass += 1;
            }

            if (insertedThisPass === 0) throw new Error('The imported folder hierarchy could not be copied safely.');
        }

        const cardIdMap = new Map();
        const activeCardNamesByParent = new Map();
        for (const card of sourceData.cards) {
            const newParentId = folderIdMap.get(card.parent_id);
            let cardName = card.name;
            if (card.deleted_at == null) {
                const siblingNames = activeCardNamesByParent.get(newParentId) || new Set();
                cardName = uniqueName(cardName, siblingNames);
                siblingNames.add(cardName);
                activeCardNamesByParent.set(newParentId, siblingNames);
            }

            const result = await insertMigratedRow(transaction, 'cards', card, {
                parent_id: newParentId,
                name: cardName,
                type: 'Card',
                is_system_card: 0
            });
            cardIdMap.set(card.id, result.lastInsertRowId);
        }

        for (const field of sourceData.fields) {
            await insertMigratedRow(transaction, 'fields', field, {
                parent_id: cardIdMap.get(field.parent_id),
                type: 'Field'
            });
        }
    });
}

// Creates a SQLite-consistent snapshot, then lets the user choose an actual folder on Android.
export async function exportDatabase() {
    const exportFileName = timestampedName('CategoLearn_backup');
    let exportPath;

    try {
        exportPath = await createConsistentSnapshot(FileSystem.cacheDirectory, exportFileName);

        if (Platform.OS === 'android') {
            const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permission.granted) return { success: false, cancelled: true };

            let destinationUri;
            try {
                destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permission.directoryUri,
                    exportFileName,
                    DATABASE_MIME_TYPE
                );
                const snapshotFile = new ExpoFile(exportPath);
                const savedFile = new ExpoFile(destinationUri);
                savedFile.write(await snapshotFile.bytes());

                if (!savedFile.exists || savedFile.size === 0) throw new Error('The exported file is empty.');
            } catch (error) {
                if (destinationUri) {
                    try { await FileSystem.deleteAsync(destinationUri, { idempotent: true }); } catch (cleanupError) { console.warn('Export cleanup error:', cleanupError); }
                }
                throw error;
            }

            return { success: true };
        }

        if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
        await Sharing.shareAsync(exportPath, {
            mimeType: DATABASE_MIME_TYPE,
            dialogTitle: 'Save CategoLearn Backup',
            UTI: 'public.database'
        });

        // iOS does not report whether its share sheet was cancelled, so never claim that the file was saved.
        return { success: true, saveUnconfirmed: true };
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, errorCode: 'exportFailed' };
    } finally {
        if (exportPath) await safelyDeleteDatabaseArtifacts(FileSystem.cacheDirectory, exportFileName);
    }
}

// Picks and validates a temporary copy without touching the active database.
export async function prepareDatabaseImport(onSelectionAccepted) {
    let stagedFileName;

    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: [DATABASE_MIME_TYPE, 'application/octet-stream', '*/*'],
            copyToCacheDirectory: true
        });
        if (result.canceled) return { success: false, cancelled: true };

        const pickedFile = result.assets?.[0];
        if (!pickedFile?.uri) throw new Error('No import file was returned.');
        onSelectionAccepted?.();
        stagedFileName = timestampedName('CategoLearn_pending_import');
        const stagedUri = `${directoryPath(FileSystem.cacheDirectory)}${stagedFileName}`;
        await FileSystem.copyAsync({ from: pickedFile.uri, to: stagedUri });

        const candidate = await SQLite.openDatabaseAsync(
            stagedFileName,
            { useNewConnection: true },
            FileSystem.cacheDirectory
        );
        try {
            // Never run migrations on a damaged file, even though this is only a temporary copy.
            await ensureDatabaseIntegrity(candidate);
            await migrateDatabase(candidate);
            await readAndValidateDatabase(candidate);
        } finally {
            await candidate.closeAsync();
        }

        return {
            success: true,
            preparedImport: {
                stagedFileName,
                displayName: pickedFile.name || stagedFileName
            }
        };
    } catch (error) {
        console.error('Import validation error:', error);
        if (stagedFileName) await safelyDeleteDatabaseArtifacts(FileSystem.cacheDirectory, stagedFileName);
        return { success: false, errorCode: 'invalidDatabase' };
    }
}

export async function discardPreparedImport(preparedImport) {
    if (!preparedImport?.stagedFileName) return;
    await safelyDeleteDatabaseArtifacts(FileSystem.cacheDirectory, preparedImport.stagedFileName);
}

// Applies a previously validated import only after a permanent snapshot of current data exists.
export async function importPreparedDatabase(preparedImport, mode) {
    let sourceDatabase;
    let backupName;

    try {
        if (!preparedImport || !['replace', 'keep'].includes(mode)) throw new Error('Invalid import request.');

        sourceDatabase = await openPreparedDatabase(preparedImport);
        await migrateDatabase(sourceDatabase);
        const sourceData = await readAndValidateDatabase(sourceDatabase);

        try {
            backupName = await createPermanentPreImportBackup();
        } catch (error) {
            console.error('Pre-import backup error:', error);
            return { success: false, errorCode: 'backupFailed' };
        }

        if (mode === 'replace') {
            await replaceCurrentDatabase(sourceDatabase, backupName);
        } else {
            await keepCurrentDatabase(sourceData, preparedImport.displayName);
        }

        return { success: true, mode };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, errorCode: 'importFailed' };
    } finally {
        if (sourceDatabase) {
            try { await sourceDatabase.closeAsync(); } catch (closeError) { console.warn('Import database close error:', closeError); }
        }
        await discardPreparedImport(preparedImport);
    }
}
