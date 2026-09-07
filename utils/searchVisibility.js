import { hasActiveFolderPath, hasActiveCardPath } from "./hierarchyVisibility.js";

// Keep search results aligned with the hierarchy visible on normal app screens.
export function getVisibleSearchItems(folders, cards, fields) {
    const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
    const cardsById = new Map(cards.map((card) => [card.id, card]));

    const visibleFolders = folders.filter((folder) => (
        folder.deleted_at === null
        && folder.is_system_folder !== 1
        && hasActiveFolderPath(folder.id, foldersById)
    ));

    const visibleCards = cards.filter((card) => (
        card.deleted_at === null
        && card.is_system_card !== 1
        && hasActiveFolderPath(card.parent_id, foldersById)
    ));

    const visibleFields = fields.filter((field) => {
        if (field.deleted_at !== null) return false;

        return hasActiveCardPath(field.parent_id, cardsById, foldersById);
    });

    return [...visibleFolders, ...visibleCards, ...visibleFields];
}
