export function handleSort(items, setItems, mode) {
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
                sorted.sort((a, b) => (a.color || "").localeCompare(b.color || ""));
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