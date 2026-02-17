// Storage
import { loadColorOrder, loadColorSortPreference } from "../storage/sortPreference.js";

// Helper: get index of a color in saved order
function getColorIndex(color, savedOrder) {
    const idx = savedOrder.indexOf(color);
    return idx === -1 ? savedOrder.length : idx; // unknown colors go last
}

// Main sort function
export async function handleSort(items, setItems, mode) {

    const savedOrder = await loadColorOrder();
    const savedSortPref = await loadColorSortPreference();
    console.log(savedOrder)

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