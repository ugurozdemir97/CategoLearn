// Horizontal rules are stored without presentation details so they can follow the active theme.
export function normalizeHorizontalRules(html = "") {
    return String(html).replace(/<hr\b[^>]*\/?\s*>/gi, "<hr />");
}
