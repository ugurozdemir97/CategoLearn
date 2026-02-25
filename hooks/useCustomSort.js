import { useState, useCallback } from "react";
import db from "../database/db.js";

/**
 * Custom hook for handling drag-and-drop custom sorting
 * Works for folders, cards, and fields
 * 
 * @param {Array} items - Current items array
 * @param {Function} setItems - State setter for items
 * @param {Function} reloadItems - Function to reload items from database
 * @param {Function} setErrorMessages - Function to set error messages
 * @param {Function} setInfoVisible - Function to show info modal
 */
export function useCustomSort(items, setItems, reloadItems, setErrorMessages, setInfoVisible) {
    const [customSortMode, setCustomSortMode] = useState(false);

    // Handle drag end
    const handleDragEnd = useCallback(({ data }) => {
        setItems(data);
    }, [setItems]);

    // Save custom order to database
    const handleSaveCustomOrder = async () => {
        try {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const newIndex = i * 100;
                
                // Determine table based on item type
                let table;
                if (item.type === "Category") table = "folders";
                else if (item.type === "Card") table = "cards";
                else if (item.type === "Field") table = "fields";
                else continue; // Skip unknown types
                
                await db.runAsync(
                    `UPDATE ${table} SET sort_index = ? WHERE id = ?`,
                    [newIndex, item.id]
                );
            }
            
            setCustomSortMode(false);
            await reloadItems();
        } catch (error) {
            console.error("Error saving custom order:", error);
            setErrorMessages([{
                type: "Save Failed",
                message: "Failed to save custom order. Please try again."
            }]);
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

    // Move item up/down manually (for arrow buttons)
    const moveItemUp = (index) => {
        if (index <= 0) return;
        const newItems = [...items];
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        setItems(newItems);
    };

    const moveItemDown = (index) => {
        if (index >= items.length - 1) return;
        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setItems(newItems);
    };

    return {
        customSortMode,
        handleDragEnd,
        handleSaveCustomOrder,
        handleCancelCustomOrder,
        enterCustomSort,
        moveItemUp,
        moveItemDown,
    };
}