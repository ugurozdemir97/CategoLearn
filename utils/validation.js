// Prevent empty or too long strings, and return the trimmed string
export function validateName(name, type, t) {
    const trimmed = name?.trim() || "";

    if (!trimmed) {
        let errorMessage = type === "Field" || type === "Card" ? t("errorMessages.titleNotEmpty", {type: t(`itemType.${type}`)}) : t("errorMessages.nameNotEmpty", {type: t(`itemType.${type}`)})
        return {valid: false, error: errorMessage}
    };

    if (trimmed.length > 50) {
        let errorMessage = type === "Field" || type === "Card" ? t("errorMessages.titleTooLong", {type: t(`itemType.${type}`)}) : t("errorMessages.nameTooLong", {type: t(`itemType.${type}`)})
        return {valid: false, error: errorMessage}
    };
    
    return { valid: true, trimmed };
}
