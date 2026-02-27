// Format date as "Just Now", "X minutes ago", "21:38", "Yesterday at 21:38" or "02/24/2026"
export const formatDate = (date, t) => {

    if (!date) return "";

    const d =   new Date(date);
    const now = new Date();

    if (isNaN(d.getTime())) return "";  // Check if date is valid

    // Get time difference in milliseconds
    const diffMs =    now - d;
    const diffMins =  Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays =  Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return t("date.now");                                                            // If less than 1 minute ago
    if (diffHours < 1) return t("date.yesterday", {minutes: diffMins});                                // If less than 1 hour ago
    if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });  // If today
    if (diffDays === 1) {                                                                              // If yesterday
        const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        return t("date.yesterday", {time: timeStr});
    }

    // Otherwise show date
    return d.toLocaleDateString("en-GB");

};