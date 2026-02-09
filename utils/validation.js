import { Alert } from "react-native";

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

export function validateWithAlert(name, type = "Item", maxLength = 60) {
    const result = validateName(name, maxLength);

    if (!result.valid) {
        Alert.alert(`Invalid ${type}`, result.error);
        return null;
    }

    return result.trimmed;
}
