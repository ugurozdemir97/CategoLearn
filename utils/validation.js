export function validateName(name, type) {
    const trimmed = name?.trim() || "";

    if (!trimmed) {
        let errorMessage = 
            type === "Field" || type === "Card" 
                ? `${type} Title cannot be empty.` 
                : `${type} Name cannot be empty.`
        return {valid: false, error: errorMessage}
    };
    if (trimmed.length > 50) {
        let errorMessage = 
            type === "Field" || type === "Card" 
                ? `${type} Title cannot exceed 50 characters.` 
                : `${type} Name cannot exceed 50 characters.`
        return {valid: false, error: errorMessage}
    };
    
    return { valid: true, trimmed };
}
