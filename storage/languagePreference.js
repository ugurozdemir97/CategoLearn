import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "app_language";

// Save language preference
export async function saveLanguage(languageCode) {
    try {await AsyncStorage.setItem(LANGUAGE_KEY, languageCode)} 
    catch (error) {console.error("Error saving language:", error)}
}

// Load language preference
export async function loadLanguage() {
    try {
        const language = await AsyncStorage.getItem(LANGUAGE_KEY);
        return language || null; 
    } catch (error) {
        console.error("Error loading language:", error);
        return null;
    }
}