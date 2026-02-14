import { useState, useCallback } from "react";

// Select and Unselect items
export function useSelection() {

    // Store selected items
    const [selectedItems, setSelectedItems] = useState([]);

    // If true, we can select other items just by tapping on them once
    const secondarySelect = selectedItems.length > 0;

    // Select if not selected, unselect if already selected
    const toggleSelection = useCallback((item) => {
        setSelectedItems((prev) => {
            const exists = prev.some((i) => i.id === item.id && i.type === item.type);
            if (exists) return prev.filter((i) => !(i.id === item.id && i.type === item.type));
            return [...prev, item];
        });
    }, []);

    // Check if item is selected
    const isSelected = useCallback(
        (item) => selectedItems.some((i) => i.id === item.id && i.type === item.type),
        [selectedItems]
    );

    // Unselect all
    const clearSelection = useCallback(() => {
        setSelectedItems([]);
    }, []);

    // Select all
    const selectAll = useCallback((items) => {
        setSelectedItems([...items]);
    }, []);

    return { selectedItems, secondarySelect, toggleSelection, isSelected, clearSelection, selectAll };

}
