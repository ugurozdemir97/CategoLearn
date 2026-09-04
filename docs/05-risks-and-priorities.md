# Risks and priorities

This list contains only important gaps confirmed in the current code. It is not a
general improvement backlog. Fix data-loss and data-integrity risks first, then
the small number of defects that can make normal actions fail or mislead the user.

## Priority 1: protect stored data

### Make multi-write data changes atomic

The following user actions still consist of independent writes:

- creating or editing a card together with its fields;
- loading several saved fields into a card;
- recursively copying a folder or card;
- pasting or recoloring several selected items;
- restoring several Trash items;
- recursively or multiply deleting items permanently;
- saving custom order values for a list.

A constraint failure or interruption can therefore leave only part of the action
applied. Wrap each logical operation in one transaction; a general repository or
transaction framework is not required.

### Enforce parent relationships and delete complete subtrees

The schema declares cascading foreign keys, but the connection never enables
`PRAGMA foreign_keys = ON`. The manual permanent-delete functions query only
children whose `deleted_at` is `NULL`, so permanently deleting a folder or card can
leave behind descendants that had already been soft-deleted separately.

Enable foreign-key enforcement when opening every connection and verify it on an
existing populated database. Permanent deletion must remove the complete subtree,
regardless of each descendant's deletion state, and the whole operation should be
transactional.

### Add a migration step before changing the schema

Startup only runs `CREATE TABLE IF NOT EXISTS` and creates indexes. Editing a table
definition will not update an existing installation. Before the next schema
change, add a small ordered migration based on `PRAGMA user_version` and test it
against a copy of an older database.

## Priority 2: prevent broken everyday behavior

### Fix the selected-item edit crash

`handleEditSelected` returns an error array only when the selection is invalid. On
a valid one-item selection it opens the edit modal and returns `undefined`, but all
three calling screens immediately read `result.length`. Editing a folder, card, or
field can therefore raise a `TypeError` during the normal edit path.

Return a consistent array from the helper, or test the result before reading its
length, in Home, Folder, and Card Detail.

### Keep create and edit forms open when a write fails

`CreateModal` calls the asynchronous `onCreate` callback without awaiting it and
then closes unconditionally. A database constraint or I/O failure can therefore
close the form as though the save succeeded and produce an unhandled rejection.

Await the write, disable duplicate submissions while it runs, close only on
success, and show a useful error in the still-open form. Apply the same principle
to destructive, restore, paste, color, and load actions where failures currently
escape their event handlers.

### Protect the remaining system restore invariants

The query layer already blocks some creates and edits involving the restore
folder/card, but the shared footer still offers normal actions for those rows and
the move functions do not reject system items or system destinations. A user can
attempt invalid edits/colors and can cut or move a system folder or card, breaking
the location assumptions used by restore.

Hide or disable invalid actions in the UI and enforce the same rules in the move
and write functions so stale UI state cannot bypass them.

### Account for the entire ancestor chain in search and restore

Search filters only each result row's own `deleted_at`. An active card or field
behind a deleted folder, or an active field behind a deleted card, can still appear
and navigate into content that the normal hierarchy hides.

Restore checks only the immediate parent. If that parent is active but one of its
ancestors is deleted, the operation can report success while the restored item
remains invisible. Search and restore should require a fully active path to the
root, otherwise restore into the system recovery location.

### Make search results open the item they describe

Search currently sends a root-folder result to Home and a card result to its
containing folder. Only non-root folders and fields open the selected content.
Make folder results open that folder and card results open that card, while still
building a valid breadcrumb path.

### Fix the confirmed sorting mismatches

Trash reloads using `loadSortMode`, the preference for normal lists, while its
header displays and saves `deletedSortMode`. The visible order can therefore
disagree with the selected label until the user cycles the sort button.

Home also reloads its preference from AsyncStorage instead of using the current
`sortMode` context like Folder and Card Detail. A sort change can race the
preference write or temporarily restore the previous order.

Custom reorder also permits dragging a card across the folder boundary even
though `handleSort` always regroups folders before cards after saving. Keep the
drag interaction within the order that can actually be persisted, or make the
saved order and normal rendering follow the same rule.

### Include saved field sets in the backup contract

Reusable field sets are stored in AsyncStorage, while export/import handles only
`app.db`. A database backup therefore does not preserve those user-created sets.
Either include them in backup/restore or clearly state in the UI that they are not
part of a backup.

## Focused verification

The high-value checks for these changes are:

- a forced failure in a multi-write action rolls back every write;
- permanent deletion removes active and already-deleted descendants;
- search and restore behave correctly when any ancestor is deleted;
- system restore rows cannot be moved or used as ordinary destinations;
- an older database migrates without losing its contents.

Use manual device checks for the navigation and sorting fixes. Focused automated
database tests are worthwhile for transactions, deletion, restore, and migrations.
