import { createContext, useContext, useState, useEffect } from "react";
import { loadSortMode, loadDeletedSortMode } from "../storage/sortPreference.js";

const SortModeContext = createContext();

export function SortModeProvider({ children }) {
    const [sortMode, setSortMode] = useState("Order by edit time");
    const [deletedSortMode, setDeletedSortMode] = useState("Order by deletion time");

    // Load initial sort modes
    useEffect(() => {
        (async () => {
            const normalMode = await loadSortMode();
            const deletedMode = await loadDeletedSortMode();
            setSortMode(normalMode);
            setDeletedSortMode(deletedMode);
        })();
    }, []);

    return (
        <SortModeContext.Provider value={{ 
            sortMode, 
            setSortMode,
            deletedSortMode,
            setDeletedSortMode
        }}>
            {children}
        </SortModeContext.Provider>
    );
}

export function useSortMode() {
    const context = useContext(SortModeContext);
    if (!context) {
        throw new Error("useSortMode must be used within SortModeProvider");
    }
    return context;
}