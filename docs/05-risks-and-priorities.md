# Risks and priorities

This is a practical list for a personal app, not an enterprise backlog. Fix items
when they threaten data, cause real crashes, or interfere with normal use. Cosmetic
cleanup and hypothetical scaling work can wait.

## Priority 1: protect personal data

### Validate and safely replace imported databases

Import overwrites the main database before checking that the selected file is a
healthy, compatible CategoLearn database. If replacement fails, the code does not
restore and reopen the previous database automatically.

A proportionate fix is a small, explicit flow: copy to a temporary path, check
SQLite integrity and required tables/columns, keep the existing backup, replace the
main file only after validation, and restore the old file on failure.

### Make destructive multi-step operations atomic

Deep copy, multi-item actions, card-and-field updates, restore, and recursive
permanent deletion perform several independent writes. An error or app shutdown can
leave partial results. Add transactions to these specific operations. There is no
need to build a general transaction framework first.

### Enable and verify foreign keys

The schema declares cascades but does not explicitly enable SQLite foreign-key
enforcement. Enable it when opening the database and verify the expected behavior
with one focused database check.

### Add migrations only when the schema changes

There is no upgrade mechanism for existing databases. Before the next schema
change, add a simple ordered migration using `PRAGMA user_version`. A large
migration library is unnecessary.

## Priority 2: prevent broken everyday behavior

- Catch expected database failures around create/edit/import actions and keep the
  UI usable instead of closing a modal as if the operation succeeded.
- Ensure permanent deletion also handles descendants that were already separately
  soft-deleted.
- Exclude items whose parents are deleted from search results.
- Prevent invalid operations on system restore items in the UI.
- Reopen or deliberately stop database-backed interaction after an import until
  restart; do not leave a closed connection behind active screens.
- Fix misleading search navigation and sorting behavior when they get in the way of
  actual use.

## Lower priority

The following are reasonable improvements only when a real problem appears:

- search optimization, FTS, pagination, and extra indexes;
- reorganizing UI/database code into more architectural layers;
- TypeScript conversion or a new state-management library;
- broad accessibility and responsive-layout work beyond the devices in use;
- CI pipelines, coverage targets, large UI test suites, or performance benchmarks;
- analytics, crash-reporting services, and production-scale observability.

Small bugs, unused imports, and awkward strings can be fixed while touching nearby
code. They do not need their own roadmap.

## Sensible verification

For data-safety changes, test a few high-value cases:

- a valid backup imports and survives restart;
- an invalid backup leaves the current database unchanged;
- interrupted or failed multi-step writes roll back;
- delete and restore preserve the expected hierarchy;
- an old database upgrades without losing its contents.

For ordinary UI changes, manually exercise the changed flow on the device or
emulator used for development. Add an automated test only when it is cheaper and
more reliable than repeatedly checking a risky rule by hand.
