import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import db from './db.js';

// Get the correct database path
async function getDatabasePath() {
    try {

        const dbName = 'app.db';

        // On Android, expo-sqlite stores in: /data/data/[package]/databases/
        // On iOS, it's in: documentDirectory/SQLite/
        // Most common locations for expo-sqlite:
        const possiblePaths = [
            `${FileSystem.documentDirectory}SQLite/${dbName}`,
            `/data/data/com.ugur97.CategoLearn/databases/${dbName}`,
            `${FileSystem.documentDirectory}../databases/${dbName}`,
            `${FileSystem.documentDirectory}${dbName}`,
        ];
        
        // Return the path of database
        for (const path of possiblePaths) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(path);
                if (fileInfo.exists) {return path}
            } catch (err) {
                console.log('Could not access:', path);
            }
        }
        
        // Database couldn't found
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
        
        // Export file name
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const exportFileName = `CategoLearn_backup_${dateStr}_${timestamp}.db`;
        
        // Use SAF (Storage Access Framework) via share
        // First copy to cache, then share so user can save to any location
        let exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;
        
        // Ensure export directory exists, if not, create it
        const directory =    exportPath.substring(0, exportPath.lastIndexOf('/'));
        const dirInfo =      await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        
        // Copy database to export location
        await FileSystem.copyAsync({ from: dbPath, to: exportPath });
        
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
            
            // Clean up temp file after 10 seconds
            setTimeout(async () => {
                try         {await FileSystem.deleteAsync(exportPath, { idempotent: true })} 
                catch (err) {console.log('Cleanup error:', err)}
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
        
        // If canceled return false else store the picked file
        if (result.canceled) {return { success: false, error: 'Import cancelled' }}
        const pickedFile = result.assets[0];
        
        // Find current database path
        const dbPath = await getDatabasePath();
        
        // Close all database connections
        try         {await db.closeAsync()} 
        catch (err) {console.log('DB close error (may already be closed):', err)}
        
        // Backup current database first just in case
        const timestamp =   Date.now();
        const backupPath = `${FileSystem.documentDirectory}database_backup_${timestamp}.db`;
        const dbInfo =      await FileSystem.getInfoAsync(dbPath);
        if (dbInfo.exists)  await FileSystem.copyAsync({ from: dbPath, to: backupPath });

        // Copy imported file to database location
        await FileSystem.copyAsync({ from: pickedFile.uri, to: dbPath });
        return { success: true, needsReload: true };

    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
    }
}