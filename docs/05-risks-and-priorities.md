# Risks and priorities

This is the remaining confirmed work, ordered from easiest to implement to most
difficult. Each item names the relevant files and explains why they are involved.
Database migrations are implemented. Existing deletion and recovery behavior is
intentional and must remain unchanged.

## Progress tracker

1. Fix selected-item edit crash. ✓
2. Lock system recovery items. ✓
3. Open exact search results, including scrolling to and expanding fields. ✓
4. Hide descendants of deleted ancestors from search. ✓
5. Check the complete ancestor path during restoration. ✓
6. Keep forms open when saving fails. ✓
7. Prevent cards from being dragged above folders.
8. Support valid orphaned Trash items during import.

Additional completed refinements:

- Reuse one hierarchy-path check for both search visibility and restoration. ✓
- Allow recovered items to be copied or cut out of system recovery folders while
  still preventing users from pasting items into them. ✓

## 1. Prevent cards from being dragged above folders

### Files to change

- Change `hooks/useCustomSort.js` so drag completion and arrow movement respect a
  caller-provided type-group boundary.
- Change `screens/FolderScreen.js` to enable the folders-first boundary for its
  mixed folder/card list.
- Change `components/Buttons/DraggableListButton.js` only if its arrow buttons
  need disabled-state support at the top or bottom of a type group.

Home contains only folders and Card Detail contains only fields, so their existing
custom ordering should remain unchanged.

### Why

Normal rendering always groups folders above cards. Custom sorting currently lets
a card cross into the folder section, saves the indexes, and then displays a
different order after reload. Folders should move only among folders and cards
only among cards.

## 2. Make import support the existing Trash behavior

### Files to change

- Change `database/exportDb.js`, especially `validateHierarchy`, the
  `PRAGMA foreign_key_check` handling, and `keepCurrentDatabase`.
- Keep `database/migrations.js` responsible only for upgrading an older valid
  schema before the current-version validation runs.

### Required behavior

- Deleting a folder continues to soft-delete the folder and hide its descendant
  tree.
- Permanently deleting that folder continues to delete descendants that still
  belong to it.
- A child separately deleted before its parent is permanently deleted remains
  independently recoverable.
- Restoring that child after its parent is gone continues to place it in
  `Restored Items` or `Restored Fields`.

The importer must accept that valid deleted-orphan state while continuing to
reject active orphans, invalid schemas, damaged files, and other broken
relationships. Both Replace and Keep must preserve the recoverable item.

### Why

A genuine CategoLearn backup can legally contain a deleted item whose parent no
longer exists. Import currently treats every missing parent as corruption, and
Keep assumes every imported parent can be mapped. This can reject a valid backup.

## Accepted design decisions

- Do not change the current soft deletion, permanent deletion, or independently
  deleted-child recovery behavior.
- Do not add a broad transaction refactor to ordinary copy, move, delete, and
  reorder actions solely because they contain several small writes.
- Do not add saved field sets to database backup and import.
- Imported system recovery rows are not harmful by themselves; they become normal
  imported content in Keep mode and remain protected system rows in Replace mode.

## Focused verification

- Confirm cards cannot cross above folders through dragging or arrow controls.
- Export and import a valid database containing an independently deleted orphan
  with both Replace and Keep, then restore that item.
- Confirm an active orphan and a damaged or unrelated database are still rejected.
