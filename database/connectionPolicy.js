// CategoLearn intentionally keeps separately deleted children recoverable after
// their original parent is permanently removed. Cascading foreign-key deletes
// must therefore stay disabled on every database connection used by the app.
export async function enforceDatabaseConnectionPolicy(database) {
    await database.execAsync('PRAGMA foreign_keys = OFF');

    const result = await database.getFirstAsync('PRAGMA foreign_keys');
    if (Number(result?.foreign_keys) !== 0) {
        throw new Error('CategoLearn could not establish its required database deletion policy.');
    }
}
