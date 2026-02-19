import { createContext, useContext, useState, useEffect } from "react";
import { loadSortMode } from "../storage/sortPreference.js";

const SortModeContext = createContext();

export function SortModeProvider({ children }) {
    const [sortMode, setSortMode] = useState("Order alphabetically");

    // Load initial sort mode
    useEffect(() => {
        (async () => {
            const mode = await loadSortMode();
            setSortMode(mode);
        })();
    }, []);

    return (
        <SortModeContext.Provider value={{ sortMode, setSortMode }}>
            {children}
        </SortModeContext.Provider>
    );
}

export function useSortMode() {
    const context = useContext(SortModeContext);
    if (!context) {throw new Error("useSortMode must be used within SortModeProvider")}
    return context;
}