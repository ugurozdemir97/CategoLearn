import AsyncStorage from "@react-native-async-storage/async-storage";

const SORT_MODE_KEY =         "lastSortMode";             // Last sort mode preference
const DELETED_SORT_MODE_KEY = "lastDeletedSortMode";      // Last sort mode preference for DeletedScreen
const COLOR_ORDER_KEY =       "lastColorOrder";           // Prefered Color Order
const COLOR_SORT_PREF_KEY =   "lastColorSortPreference";  // Prefered order (last edit time / alphabetically) between the same color items
const DEFAULT_COLOR_ORDER = [ "#000000", "#FFFFFF", "#bb0000", "#00b700", "#0000da", "#ffdd00", "#980081", "#00e19d", null ];

// Save last sort mode (for normal screens: Home, Folder, CardDetail)
export async function saveSortMode(mode) {
    try       {await AsyncStorage.setItem(SORT_MODE_KEY, mode)} 
    catch (e) {console.error("Failed to save sort mode", e)}
}

// Load last sort mode (for normal screens)
export async function loadSortMode() {
    try {
        const mode = await AsyncStorage.getItem(SORT_MODE_KEY);
        return mode || "Order by edit time"; // Default: edit time
    } catch (e) {
        console.error("Failed to load sort mode", e);
        return "Order by edit time";
    }
}

// Save last sort mode for deleted screen
export async function saveDeletedSortMode(mode) {
    try {await AsyncStorage.setItem(DELETED_SORT_MODE_KEY, mode)} 
    catch (e) {console.error("Failed to save deleted sort mode", e)}
}

// Load last sort mode for deleted screen
export async function loadDeletedSortMode() {
    try {
        const mode = await AsyncStorage.getItem(DELETED_SORT_MODE_KEY);
        return mode || "Order by deletion time"; // Default: deletion time
    } catch (e) {
        console.error("Failed to load deleted sort mode", e);
        return "Order by deletion time";
    }
}

// Save preferred color order
export async function saveColorOrder(order) {
    try {await AsyncStorage.setItem(COLOR_ORDER_KEY, JSON.stringify(order))} 
    catch (e) {console.error("Failed to save color order", e)}
}

// Load preferred color order
export async function loadColorOrder() {
    try {
        const saved = await AsyncStorage.getItem(COLOR_ORDER_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_COLOR_ORDER;
    } catch (e) {
        console.error("Failed to load color order", e);
        return DEFAULT_COLOR_ORDER;
    }
}

// Save color sort preference (Last edit time or alphabetically)
export async function saveColorSortPreference(pref) {
    try {await AsyncStorage.setItem(COLOR_SORT_PREF_KEY, pref)} 
    catch (e) {console.error("Failed to save color sort preference", e)}
}

// Load color sort preference
export async function loadColorSortPreference() {
    try {
        const pref = await AsyncStorage.getItem(COLOR_SORT_PREF_KEY);
        return pref || "Order alphabetically";
    } catch (e) {
        console.error("Failed to load color sort preference", e);
        return "Order alphabetically";
    }
}