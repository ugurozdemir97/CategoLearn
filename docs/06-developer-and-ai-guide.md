# Developer and AI guide

## Run locally

```bash
npm install
npm start
npx expo run:android
npm run ios
```

Windows cannot run a local iOS simulator. There is currently no web script and no
test, lint, format, or type-check script in `package.json`.

## Essential project facts

- A subject is just a root folder, not a separate database type.
- Folder rows use the type string `Category`.
- Field content is stored as HTML in the `context` column.
- Normal deletion usually marks only the selected row; descendants can remain
  active behind a deleted parent.
- Restore system items live in the normal tables and are distinguished by flags.
- Lists are read from SQLite and usually sorted in JavaScript.
- The clipboard is React state, not the operating-system clipboard.
- `android/` is locally generated and ignored by Git.
- Editing `CREATE TABLE IF NOT EXISTS` does not upgrade existing user databases.

## Before changing code

Read the relevant screen or component and the database function it calls. Check the
English and Turkish locale files if user-visible text is involved. For a database
change, consider existing data, deletion/restore, copy/move, and backup import—but
only the paths the change actually affects.

## While changing code

- Keep the change narrow and follow the existing style.
- Put critical data rules in the database/query path, not only in UI validation.
- Use a transaction when several writes must all succeed together.
- Do not trust route objects to be current when data correctness depends on them;
  query by ID in that case.
- Do not edit generated native files for a setting that belongs in Expo config.
- Preserve unrelated working-tree changes.
- Avoid unrelated refactors and speculative generalization.

## Proportionate verification

For a normal UI change:

1. Open the affected screen.
2. Exercise the changed action and its obvious cancel/error path.
3. Reopen the screen or app if persistence is involved.
4. Check both languages only when strings or layout changed.

For import, migration, restore, permanent deletion, or multi-step writes, also use a
copy of a populated database and verify the failure path leaves it intact. A few
focused automated database tests are worthwhile for these operations.

It is not necessary to test every theme, device size, sorting mode, and combination
for each small change. Expand verification only when the change touches those areas
or when a regression has occurred there before.

## Completion note

A useful handoff can be brief:

```text
Changed:
Why:
Checked:
Known risk or untested case:
```

Do not present suggestions as requirements. Clearly distinguish current behavior,
an observed bug, a data-safety risk, and an optional idea.
