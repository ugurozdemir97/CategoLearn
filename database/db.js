import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("app.db");

export async function executeSql(sql, params = []) {
  try {
    const result = await db.runAsync(sql, params);
    // result looks like: { changes: 1, lastInsertRowid: 5 }
    return result;
  } catch (error) {
    console.error("SQL Error:", error, sql, params);
    throw error;
  }
}

export default db;