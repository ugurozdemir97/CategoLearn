// Predetermined color order (later this will be customizable in settings)
const COLOR_ORDER = [ null, "#000000", "#FFFFFF", "#bb0000", "#00b700", "#0000da", "#ffdd00", "#980081", "#00e19d" ];

// Helper: get index of a color in COLOR_ORDER
function getColorIndex(color) {
    const idx = COLOR_ORDER.indexOf(color);
    return idx === -1 ? COLOR_ORDER.length : idx; // unknown colors go last
}

// Main sort function
export function handleSort(items, setItems, mode, colorSortMode = "alphabetical") {
    const folders = items.filter(i => i.type === "Category" || i.type === "Subject");
    const cards   = items.filter(i => i.type === "Card");
    const fields  = items.filter(i => i.type === "Field");

    const sortGroup = (group) => {
        let sorted = [...group];
        switch (mode) {
            case "Order by creation date":
                sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;

            case "Order by edit time":
                sorted.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
                break;

            case "Order alphabetically":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;

            case "Order by color":
                sorted.sort((a, b) => {
                    const colorDiff = getColorIndex(a.color) - getColorIndex(b.color);
                    if (colorDiff !== 0) return colorDiff;

                    // Secondary sort inside same color group
                    if (colorSortMode === "alphabetical") {
                        return (a.name || "").localeCompare(b.name || "");
                    } else if (colorSortMode === "editTime") {
                        return new Date(a.updated_at) - new Date(b.updated_at);
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