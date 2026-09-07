import { useState, useCallback } from "react";
import db from "../database/db.js";

// Custom sort functions repeat themselves across screens
// This hook handles sorting related functions and save the last order of items
export function useCustomSort(items, setItems, reloadItems, setErrorMessages, setInfoVisible, options = {}) {
    const [customSortMode, setCustomSortMode] = useState(false);  // If we are in custom sort mode or not
    const groupBy = options.groupBy;

    // When dragging ends set items to keep the items in the same order
    const handleDragEnd = useCallback(({ data, from, to }) => {
        const crossedGroupBoundary = groupBy
            && from !== to
            && items[from]
            && items[to]
            && groupBy(items[from]) !== groupBy(items[to]);

        if (crossedGroupBoundary) {
            setItems([...items]);
            return;
        }

        setItems(data);
    }, [groupBy, items, setItems]);

    // Update one independently draggable group without moving the other groups
    const handleGroupDragEnd = useCallback((groupKey, { data }) => {
        if (!groupBy) {
            setItems(data);
            return;
        }

        setItems((prev) => {
            let groupIndex = 0;
            return prev.map((item) => groupBy(item) === groupKey ? data[groupIndex++] : item);
        });
    }, [groupBy, setItems]);

    // Save custom to database
    const handleSaveCustomOrder = async () => {
        try {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const newIndex = i * 100;
                
                // Determine table based on item type
                let table;
                if      (item.type === "Category") table = "folders";
                else if (item.type === "Card")     table = "cards";
                else if (item.type === "Field")    table = "fields";
                else continue; 
                
                await db.runAsync(`UPDATE ${table} SET sort_index = ? WHERE id = ?`, [newIndex, item.id]);
            }
            
            setCustomSortMode(false);  // Quit sort mode after saving the order to database and reload items
            await reloadItems();

        } catch (error) {
            console.error("Error saving custom:", error);
            setErrorMessages([{type: "Save Failed", message: "Failed to save custom. Please try again."}]);
            setInfoVisible(true);
        }
    };

    // Cancel custom sort
    const handleCancelCustomOrder = () => {
        setCustomSortMode(false);
        reloadItems();
    };

    // Enter custom sort mode
    const enterCustomSort = () => setCustomSortMode(true);

    // Grouped lists can move items only within their own section
    const canMoveItem = (item, direction) => {
        const currentIndex = items.indexOf(item);
        const targetIndex = currentIndex + direction;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return false;
        return !groupBy || groupBy(item) === groupBy(items[targetIndex]);
    };

    // Move items by pressing the arrow buttons
    const moveItem = (item, direction) => {
        setItems((prev) => {
            const currentIndex = prev.indexOf(item);
            const targetIndex = currentIndex + direction;

            // If item is already the first one and we try to move it up 
            // or it is the last item and we try to move it down
            // Just return the current color order
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            if (groupBy && groupBy(item) !== groupBy(prev[targetIndex])) return prev;

            // Swap 2 elements, the item you move goes to target place and swap places with the item there
            const newOrder = [...prev];
            newOrder[currentIndex] = newOrder[targetIndex];
            newOrder[targetIndex] = item;
            return newOrder;
        });
    };

    return { customSortMode, handleDragEnd, handleGroupDragEnd, handleSaveCustomOrder, handleCancelCustomOrder, enterCustomSort, canMoveItem, moveItem };

}
