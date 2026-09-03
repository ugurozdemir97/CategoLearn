# Data model and lifecycle

## SQLite model

The database has three main tables: `folders`, `cards`, and `fields`.

| Column | Meaning |
|---|---|
| `id` | Auto-incrementing primary key |
| `parent_id` | Parent folder or card ID |
| `name` | Required name, 1–50 characters |
| `color` | Hex color or `NULL` |
| `type` | `Category`, `Card`, or `Field` |
| `sort_index` | Optional custom-order value |
| `created_at`, `updated_at` | Local SQLite date/time text |
| `deleted_at` | `NULL` when active; set when soft-deleted |

Additional columns:

- folders may have another folder as parent and have `is_system_folder`;
- cards require a folder parent and have `is_system_card`;
- fields require a card parent and store rich-text HTML in `context`.

```text
folders.id  → folders.parent_id
folders.id  → cards.parent_id
cards.id    → fields.parent_id
```

Foreign keys declare cascading deletion, but the connection does not explicitly
enable `PRAGMA foreign_keys = ON`. Do not rely on cascades until this is enabled and
verified.

## Names

Partial unique indexes prevent duplicate active, non-system siblings. Two details
matter:

- SQLite allows duplicate root folder names through an index when `parent_id` is
  `NULL`, so the UI currently provides the main protection there.
- Deleted names are reusable. Restore adds suffixes such as `(1)` when an active
  sibling already has the original name.

## System restore items

Startup ensures that a hidden system folder named `Restored Items ` and a system
card named `Restored Fields ` exist. The trailing spaces are part of their current
stored names. Orphaned restored content is placed there. Empty system items are
hidden from normal lists and search.

## Deletion and restore

Normal deletion sets `deleted_at` on the selected row. Descendants may remain
active in the database but disappear from normal hierarchy views with their parent.
Restoring a selected parent makes those active descendants visible again.

If the original parent is missing or deleted, restored folders/cards go under the
system restore folder and restored fields go under the system restore card.

Permanent folder and card deletion recursively removes descendants, but the current
implementation can miss descendants that were independently soft-deleted, and the
operation is not transactional. Treat this as a data-integrity area, not a reason
to redesign unrelated code.

## Copy and move

Move changes `parent_id`. Folder copy recursively copies active subfolders, cards,
and fields; card copy includes its active fields. Multi-item and recursive copies
currently run as separate writes, so interruption can leave a partial copy.

## Sorting and dates

Most sorting happens in JavaScript. Folders and cards are sorted as separate groups,
with folders displayed first. Custom order uses `sort_index`.

Dates are stored as local-time text without a timezone marker. Child edits do not
automatically update parent timestamps. This is adequate unless the UI begins to
promise a precise hierarchy-wide “last modified” value.

## Backup export and import

Export copies the database file to a temporary location and opens the system share
sheet. The consistency of copying an open SQLite database, including WAL behavior,
should be checked on the target device.

Import currently:

1. lets the user choose a file;
2. closes the database;
3. saves a copy of the current database in the app documents directory;
4. overwrites the main database;
5. asks the user to restart the app.

The selected file is not validated first, and failure does not automatically roll
back and reopen the old database. Improving this flow is the clearest data-safety
priority in the project.
