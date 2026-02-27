import { createContext, useContext, useState, useEffect } from "react";
import { loadSortMode, loadDeletedSortMode } from "../storage/sortPreference.js";

const SortModeContext = createContext();

// Update Sort Mode Across Screens
export function SortModeProvider({ children }) {
    const [sortMode, setSortMode] = useState("editTime");                    // Default sort mode
    const [deletedSortMode, setDeletedSortMode] = useState("deletionTime");  // Default DeletedScreen Sort mode

    // Load last preferred sort modes
    useEffect(() => {
        (async () => {
            const normalMode =  await loadSortMode();
            const deletedMode = await loadDeletedSortMode();
            setSortMode(normalMode);
            setDeletedSortMode(deletedMode);
        })();
    }, []);

    return (
        <SortModeContext.Provider value={{ sortMode, setSortMode, deletedSortMode, setDeletedSortMode }}>
            {children}
        </SortModeContext.Provider>
    );
}

export function useSortMode() {
    const context = useContext(SortModeContext);
    if (!context) throw new Error("useSortMode must be used within SortModeProvider");
    return context;
}