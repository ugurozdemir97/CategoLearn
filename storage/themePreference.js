import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "app_theme";

// Save theme preference
export async function saveTheme(themeName) {
    try {
        await AsyncStorage.setItem(THEME_KEY, themeName);
    } catch (error) {
        console.error("Error saving theme:", error);
    }
}

// Load theme preference
export async function loadTheme() {
    try {
        const theme = await AsyncStorage.getItem(THEME_KEY);
        return theme || "Midnight";  // Default to Pastel if nothing saved
    } catch (error) {
        console.error("Error loading theme:", error);
        return "Midnight";
    }
}