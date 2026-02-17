export const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const now = new Date();

    // Normalize to midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    // If today: Show hour, if yesterday: Show "Yesterday", otherwise show date (DD/MM/YYYY)
    if (target.getTime() === today.getTime()) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });  
    else if (target.getTime() === yesterday.getTime()) return "Yesterday";  
    else return d.toLocaleDateString("en-GB");             
                      
};