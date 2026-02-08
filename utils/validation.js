import { Alert } from "react-native";

/**
 * Validate a name input
 * @param {string} name - The name to validate
 * @param {number} maxLength - Maximum allowed length (default: 60)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name, maxLength = 60) {
    const trimmed = name?.trim() || "";

    if (!trimmed) {
        return { valid: false, error: "Name cannot be empty." };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `Name cannot exceed ${maxLength} characters.` };
    }

    return { valid: true, trimmed };
}

/**
 * Validate and show alert if invalid
 * @param {string} name - The name to validate
 * @param {string} type - Type of item (for alert title)
 * @param {number} maxLength - Maximum allowed length
 * @returns {string|null} - Trimmed name if valid, null if invalid
 */
export function validateWithAlert(name, type = "Item", maxLength = 60) {
    const result = validateName(name, maxLength);

    if (!result.valid) {
        Alert.alert(`Invalid ${type}`, result.error);
        return null;
    }

    return result.trimmed;
}
