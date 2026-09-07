# Risks and priorities

This is the remaining confirmed work, ordered from easiest to implement to most
difficult. Database migrations are implemented. The existing deletion and recovery
behavior is intentional and must remain unchanged.

## 1. Hide descendants of deleted ancestors from search

Search currently checks only a result row's own `deleted_at`. If folder A is
deleted while one of its children remains active internally, that hidden child
can still appear in search.

Include a result only when the item and every folder or card in its path to the
root are active. This changes search visibility only; it must not modify deletion
or restoration data.

## 2. Check the complete ancestor path when restoring

Restore currently checks only the immediate parent. A deleted item can have an
active immediate parent whose parent or higher ancestor is deleted. Restoring the
item to that path reports success but leaves it invisible.

Use the original location only when the complete path to the root is active.
Otherwise restore the item into `Restored Items` or `Restored Fields`.

## 3. Keep create and edit forms open when saving fails

`CreateModal` starts the asynchronous save without awaiting it and then closes
unconditionally. If the database write fails, the form can disappear, discard
the typed draft, and produce an unhandled rejection.

Await the save, prevent repeated submission while it is running, close only after
success, and show the error while keeping the form and its content open.

## 4. Prevent cards from being dragged above folders

The normal list design always keeps folders above cards, but custom sorting allows
a card to be dragged into the folder section. Reloading then moves it below the
folders again, so the displayed drag result cannot be preserved.

Keep folders and cards as separate drag groups. Folders may be reordered among
folders and cards among cards, but neither type may cross the boundary. Apply the
same restriction to drag gestures and arrow-based movement.

## 5. Make import support the existing Trash behavior

Keep the current behavior exactly as it is:

- deleting a folder soft-deletes the folder and hides its descendant tree;
- permanently deleting that folder removes descendants that still belong to it;
- a child separately deleted before its parent is permanently deleted remains
  independently recoverable;
- restoring that child after its parent is gone places it in `Restored Items` or
  `Restored Fields`.

The required change is only in import. That valid final state contains a deleted
item whose parent no longer exists, but the importer currently rejects every
missing parent. Accept recoverable deleted orphans while continuing to reject
active orphans, invalid schemas, damaged files, and other broken relationships.
Both Replace and Keep must preserve the recoverable item.

## Accepted design decisions

- Do not change the current soft deletion, permanent deletion, or independently
  deleted-child recovery behavior.
- Do not add a broad transaction refactor to ordinary copy, move, delete, and
  reorder actions solely because they contain several small writes.
- Do not add saved field sets to database backup and import.
- Imported system recovery rows are not harmful by themselves; they become normal
  imported content in Keep mode and remain protected system rows in Replace mode.

## Focused verification

- Delete an ancestor and confirm all of its descendants disappear from search.
- Restore an item whose higher ancestor is deleted and confirm it appears in the
  correct system recovery location.
- Force a create/edit save failure and confirm the modal and typed content remain.
- Confirm cards cannot cross above folders through dragging or arrow controls.
- Export and import a valid database containing an independently deleted orphan
  with both Replace and Keep, then restore that item.
- Confirm an active orphan and a damaged or unrelated database are still rejected.
