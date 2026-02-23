import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import db from './db.js';

// Get the correct database path by checking SQLite internals
async function getDatabasePath() {
    try {
        // Your database is named app.db (from db.js: openDatabaseSync("app.db"))
        const dbName = 'app.db';
        
        console.log('Database name:', dbName);
        console.log('Document directory:', FileSystem.documentDirectory);
        
        // On Android, expo-sqlite stores in: /data/data/[package]/databases/
        // On iOS, it's in: documentDirectory/SQLite/
        const possiblePaths = [
            // Most common location for expo-sqlite
            `${FileSystem.documentDirectory}SQLite/${dbName}`,
            // Alternative locations
            `/data/data/com.ugur97.CategoLearn/databases/${dbName}`,
            `${FileSystem.documentDirectory}../databases/${dbName}`,
            `${FileSystem.documentDirectory}${dbName}`,
        ];
        
        console.log('Searching for database...');
        for (const path of possiblePaths) {
            console.log('Trying:', path);
            try {
                const fileInfo = await FileSystem.getInfoAsync(path);
                if (fileInfo.exists) {
                    console.log('✅ Found database at:', path);
                    console.log('File size:', fileInfo.size, 'bytes');
                    return path;
                }
            } catch (err) {
                console.log('Could not access:', path);
            }
        }
        
        // Last resort: List all files in document directory to see what's there
        console.log('Database not found. Listing files in document directory:');
        try {
            const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
            console.log('Files:', files);
            
            // Check if SQLite folder exists
            if (files.includes('SQLite')) {
                const sqliteFiles = await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
                console.log('SQLite folder contents:', sqliteFiles);
            }
        } catch (err) {
            console.log('Could not list directory:', err);
        }
        
        throw new Error('Database file not found. The database may not have been created yet, or it may be in a location we cannot access. Please ensure you have created some data first.');
    } catch (error) {
        console.error('getDatabasePath error:', error);
        throw error;
    }
}

// Export database to a file
export async function exportDatabase() {
    try {
        // Find database file
        const dbPath = await getDatabasePath();
        console.log('Exporting database from:', dbPath);
        
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const exportFileName = `CategoLearn_backup_${dateStr}_${timestamp}.db`;
        
        let exportPath;
        
        if (Platform.OS === 'android') {
            // Android: Use SAF (Storage Access Framework) via share
            // First copy to cache, then share so user can save to any location
            exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;
        } else {
            // iOS: Use cache directory
            exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;
        }
        
        console.log('Exporting to:', exportPath);
        
        // Ensure directory exists
        const directory = exportPath.substring(0, exportPath.lastIndexOf('/'));
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
        
        // Copy database to export location
        await FileSystem.copyAsync({
            from: dbPath,
            to: exportPath
        });
        
        console.log('Database copied successfully to:', exportPath);
        
        // Share the file - this allows user to save to Downloads, CategoLearn folder, etc.
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(exportPath, {
                mimeType: 'application/x-sqlite3',
                dialogTitle: 'Save CategoLearn Backup',
                UTI: 'public.database'
            });
            
            // Note: On Android, the share sheet will let users choose:
            // - Save to Files (Downloads folder)
            // - Google Drive
            // - Any file manager app
            // They can then move it to a CategoLearn folder if desired
            
            // Clean up temp file after sharing
            setTimeout(async () => {
                try {
                    await FileSystem.deleteAsync(exportPath, { idempotent: true });
                } catch (err) {
                    console.log('Cleanup error:', err);
                }
            }, 10000);
            
            return { 
                success: true, 
                message: 'Use the share menu to save your backup to Downloads, Google Drive, or any location you prefer. You can create a CategoLearn folder if desired.'
            };
        } else {
            return { success: false, error: 'Sharing is not available on this device' };
        }
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, error: error.message };
    }
}

// Import database from a file
export async function importDatabase() {
    try {
        // Pick a file
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
            copyToCacheDirectory: true
        });
        
        if (result.canceled) {
            return { success: false, error: 'Import cancelled' };
        }
        
        const pickedFile = result.assets[0];
        
        // Find current database path
        const dbPath = await getDatabasePath();
        
        // Close all database connections
        try {
            await db.closeAsync();
        } catch (err) {
            console.log('DB close error (may already be closed):', err);
        }
        
        // Backup current database first
        const timestamp = Date.now();
        const backupPath = `${FileSystem.documentDirectory}database_backup_${timestamp}.db`;
        
        const dbInfo = await FileSystem.getInfoAsync(dbPath);
        if (dbInfo.exists) {
            await FileSystem.copyAsync({
                from: dbPath,
                to: backupPath
            });
        }
        
        // Copy imported file to database location
        await FileSystem.copyAsync({
            from: pickedFile.uri,
            to: dbPath
        });
        
        return { success: true, needsReload: true };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
    }
}