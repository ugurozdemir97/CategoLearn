// Storage
import { loadColorOrder, loadColorSortPreference } from "../storage/sortPreference.js";

// Helper: get index of a color in saved order
function getColorIndex(color, savedOrder) {
    const idx = savedOrder.indexOf(color);
    return idx === -1 ? savedOrder.length : idx; // unknown colors go last
}

// Main sort function
export async function handleSort(items, setItems, mode, isDeletedScreen = false) {

    const savedOrder = await loadColorOrder();
    const savedSortPref = await loadColorSortPreference();

    const folders = items.filter(i => i.type === "Category");
    const cards   = items.filter(i => i.type === "Card");
    const fields  = items.filter(i => i.type === "Field");

    const sortGroup = (group) => {
        let sorted = [...group];
        switch (mode) {
            case "Order by creation date":
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;

            case "Order by edit time":
                sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                break;

            case "Order by deletion time":
                // Only available in deleted screen
                if (isDeletedScreen) {
                    sorted.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
                }
                break;

            case "Order alphabetically":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;

            case "Order by color":
                sorted.sort((a, b) => {
                    const colorDiff = getColorIndex(a.color, savedOrder) - getColorIndex(b.color, savedOrder);
                    if (colorDiff !== 0) return colorDiff;

                    // Secondary sort inside same color group
                    if (savedSortPref === "Order alphabetically") {
                        return (a.name || "").localeCompare(b.name || "");
                    } else if (savedSortPref === "Order by edit time") {
                        return new Date(b.updated_at) - new Date(a.updated_at);
                    }
                    return 0;
                });
                break;
                
            case "Custom order":

                // Sort by sort_index (nulls items at the end)
                // If both of them are null use creation date to sort
                sorted.sort((a, b) => {
                    if (a.sort_index !== null && b.sort_index !== null) return a.sort_index - b.sort_index;
                    if (a.sort_index !== null) return -1;
                    if (b.sort_index !== null) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);  
                });
            break;

            default:
                break;
        }
        
        return sorted;
    };

    const sortedFolders = sortGroup(folders);
    const sortedCards   = sortGroup(cards);
    const sortedFields  = sortGroup(fields);

    // Merge: folders first, then cards, then fields
    setItems([...sortedFolders, ...sortedCards, ...sortedFields]);
}