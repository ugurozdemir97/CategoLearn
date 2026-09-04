# Updating the app

For every new app version:

1. Update the version in `app.json` and `package.json`.
2. Add the matching `whats_new` translations to `language/locales/en.json` and
   `language/locales/tr.json`. Replace dots with underscores in the key, such as
   `v1_0_1`. Add `title` and `middle`; `bottom` is optional.
3. Open the app. The What's New modal appears automatically once for the new
   version.

## Database schema changes

Database versions are separate from app versions. Change the database version
only when a table, column, index, or stored value needs to change.

1. Add the next numbered entry to `MIGRATIONS` in `database/migrations.js`. Never
   edit a migration that has already been released.
2. Write the SQL needed to move the previous schema forward. For example, a new
   migration can run `ALTER TABLE folders ADD COLUMN new_column TEXT DEFAULT NULL`.
3. Update `CURRENT_SCHEMA_COLUMNS` in the same file. Also update app queries that
   read or write the changed column.
4. For a simple removable column that is not used by a constraint or index, use
   `ALTER TABLE table_name DROP COLUMN column_name`. More complex removals require
   creating a replacement table, copying the wanted data, and renaming it.
5. Test both an app update using a copy of the previous database and importing an
   exported database from the previous version.

Example migration:

```js
{
    version: 2,
    name: 'Add folder color update time',
    up: async (database) => {
        await database.execAsync(`
            ALTER TABLE folders
            ADD COLUMN last_color_update_time DATETIME DEFAULT NULL;
        `);
    }
}
```

For that example, the current folder definition becomes:

```js
folders: [...VERSION_ONE_COLUMNS.folders, 'last_color_update_time']
```

Do not change `VERSION_ONE_SCHEMA`; it is the permanent description of database
version 1. Fresh installations create version 1 first and then run every newer
migration, using the same path as an older installation.

New required columns should have a safe default or be populated by the migration
before they become required. Remember that changing a database column may also
require changes to create, edit, copy, import, validation, and display code.
When an index changes, update both its migration SQL and `CURRENT_INDEXES`.

Do not manually change `PRAGMA user_version`. On startup, CategoLearn applies all
missing migrations in order and records each completed database version. Import
does the same work on a temporary copy before it validates or changes the active
database. A failed migration is rolled back.
