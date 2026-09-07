# Risks and priorities

The original eight-item checklist is complete. A detailed code audit on
2026-09-07 found the following additional work, ordered from highest to lowest
risk. The Android production bundle builds successfully, both locale files have
matching keys, and the emulator database passes `PRAGMA integrity_check`.

## Completed checklist

1. Fix selected-item edit crash. ✓
2. Lock system recovery items. ✓
3. Open exact search results, including scrolling to and expanding fields. ✓
4. Hide descendants of deleted ancestors from search. ✓
5. Check the complete ancestor path during restoration. ✓
6. Keep forms open when saving fails. ✓
7. Prevent cards from being dragged above folders. ✓
8. Support valid orphaned Trash items during import. ✓

Additional completed audit work:

- Explicitly enforce and verify the non-cascading SQLite connection policy used
  by CategoLearn's recoverable Trash behavior. ✓
- Finish system-container UI locking and make color changes explicitly
  cancellable and confirmable. ✓
- Prevent duplicate destructive actions and report database failures without
  discarding the user's selection or confirmation state. ✓

## 1. Fix custom-order save failure feedback

### Files involved

- Change `hooks/useCustomSort.js` to receive or return the actual error message
  rather than separately setting state and immediately opening a modal.
- Update `screens/HomeScreen.js`, `screens/FolderScreen.js`, and
  `screens/CardDetailScreen.js` to pass a stable error callback.
- Use translations from `language/locales/en.json` and
  `language/locales/tr.json` instead of hard-coded English strings.

### Why

The hook sets `errorMessages` and then immediately invokes callbacks that read the
previous React state. A failed reorder can therefore open an empty or stale error
modal instead of the intended message. The reorder itself remains available for
retry, but the failure feedback is unreliable.

## Accepted design decisions

- Preserve the current soft deletion, permanent deletion, and independently
  deleted-child recovery behavior.
- Do not add broad transaction refactors to ordinary copy, move, delete, and
  reorder actions solely because they contain several small writes.
- Do not add saved field sets to database backup and import.
- Imported system recovery rows are harmless: Keep converts them to ordinary
  imported content, while Replace preserves them as protected system rows.
