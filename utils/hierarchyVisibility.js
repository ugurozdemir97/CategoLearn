// Return true only when the folder and every parent folder form an active path to the root.
export function hasActiveFolderPath(folderId, foldersById) {
    const visited = new Set();
    let currentId = folderId;

    while (currentId !== null) {
        if (visited.has(currentId)) return false;
        visited.add(currentId);

        const folder = foldersById.get(currentId);
        if (!folder || folder.deleted_at !== null) return false;
        currentId = folder.parent_id;
    }

    return true;
}

// Return true only when the card and its complete folder path are active.
export function hasActiveCardPath(cardId, cardsById, foldersById) {
    const card = cardsById.get(cardId);
    return Boolean(
        card
        && card.deleted_at === null
        && hasActiveFolderPath(card.parent_id, foldersById)
    );
}
