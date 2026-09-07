# Risks and priorities

All confirmed priority work is complete. Database migrations are implemented,
and the intentional deletion and recovery behavior remains unchanged.

## Progress tracker

1. Fix selected-item edit crash. ✓
2. Lock system recovery items. ✓
3. Open exact search results, including scrolling to and expanding fields. ✓
4. Hide descendants of deleted ancestors from search. ✓
5. Check the complete ancestor path during restoration. ✓
6. Keep forms open when saving fails. ✓
7. Prevent cards from being dragged above folders. ✓
8. Support valid orphaned Trash items during import. ✓

Additional completed refinements:

- Reuse one hierarchy-path check for both search visibility and restoration. ✓
- Allow recovered items to be copied or cut out of system recovery folders while
  still preventing users from pasting items into them. ✓

## Completed import behavior

### Required behavior

- Deleting a folder continues to soft-delete the folder and hide its descendant
  tree.
- Permanently deleting that folder continues to delete descendants that still
  belong to it.
- A child separately deleted before its parent is permanently deleted remains
  independently recoverable.
- Restoring that child after its parent is gone continues to place it in
  `Restored Items` or `Restored Fields`.

The importer accepts that valid deleted-orphan state while continuing to reject
active orphans, invalid schemas, damaged files, and other broken relationships.
Replace preserves the original recoverable rows. Keep attaches orphaned Trash
roots to the appropriate system recovery container so they can be restored
safely; descendants retain their relationship to that imported root.

## Accepted design decisions

- Do not change the current soft deletion, permanent deletion, or independently
  deleted-child recovery behavior.
- Do not add a broad transaction refactor to ordinary copy, move, delete, and
  reorder actions solely because they contain several small writes.
- Do not add saved field sets to database backup and import.
- Imported system recovery rows are not harmful by themselves; they become normal
  imported content in Keep mode and remain protected system rows in Replace mode.

## Focused verification

- Export and import a valid database containing an independently deleted orphan
  with both Replace and Keep, then restore that item.
- Confirm an active orphan and a damaged or unrelated database are still rejected.
