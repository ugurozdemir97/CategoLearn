export const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const now = new Date();

    // Check if date is valid
    if (isNaN(d.getTime())) return "";

    // Get time difference in milliseconds
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // If less than 1 minute ago
    if (diffMins < 1) return "Just now";
    
    // If less than 1 hour ago
    if (diffHours < 1) return `${diffMins}m ago`;
    
    // If today (less than 24 hours AND same calendar day)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    if (targetStart.getTime() === todayStart.getTime()) {
        return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    
    // If yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    
    if (targetStart.getTime() === yesterdayStart.getTime()) {
        const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        return `Yesterday at ${timeStr}`;
    }
    
    // Otherwise show date
    return d.toLocaleDateString("en-GB");
};