import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("app.db");

export async function executeSql(sql, params = []) {
  try {
    const result = await db.runAsync(sql, params);
    return result;
  } catch (error) {
    console.error("SQL Error:", error, sql, params);
    throw error;
  }
}

export default db;