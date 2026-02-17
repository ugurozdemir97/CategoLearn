import AsyncStorage from "@react-native-async-storage/async-storage";

const SORT_MODE_KEY = "lastSortMode";

export async function saveSortMode(mode) {
    try {
        await AsyncStorage.setItem(SORT_MODE_KEY, mode);
    } catch (e) {
        console.error("Failed to save sort mode", e);
    }
}

export async function loadSortMode() {
    try {
        const mode = await AsyncStorage.getItem(SORT_MODE_KEY);
        return mode || "Order alphabetically";
    } catch (e) {
        console.error("Failed to load sort mode", e);
        return "Order alphabetically";
    }
}