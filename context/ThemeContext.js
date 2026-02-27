import { createContext, useContext, useState, useEffect } from "react";
import { loadTheme, saveTheme } from "../storage/themePreference.js";
import themes from "../styles/colors.js";

// Theme context
const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState("Midnight");          // Default is Midnight
    const [colors, setColors] =             useState(themes["Midnight"]);

    // Load saved theme on mount
    useEffect(() => {
        const loadSavedTheme = async () => {
            const savedTheme = await loadTheme();
            if (savedTheme && themes[savedTheme]) {
                setCurrentTheme(savedTheme);
                setColors(themes[savedTheme]);
            }
        };
        loadSavedTheme();
    }, []);

    // Change theme and save preference
    const changeTheme = async (themeName) => {
        if (themes[themeName]) {
            setCurrentTheme(themeName);
            setColors(themes[themeName]);
            await saveTheme(themeName);
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, colors, changeTheme, availableThemes: Object.keys(themes) }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook to use theme
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {throw new Error("useTheme must be used within ThemeProvider")}
    return context;
}