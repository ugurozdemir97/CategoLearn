// Horizontal rules are stored without presentation details so they can follow the active theme.
export function normalizeHorizontalRules(html = "") {
    return String(html).replace(/<hr\b[^>]*\/?\s*>/gi, "<hr />");
}

// Rich-text editors can emit markup such as <p><br></p> for a visually empty value.
// Count text and deliberately inserted non-text elements, but ignore placeholder markup.
export function hasRichTextContent(html = "") {
    const value = String(html);

    if (/<(?:img|video|audio|iframe|object|embed|svg|canvas|hr)\b/i.test(value)) {
        return true;
    }

    return value
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;|&#160;|&#x0*a0;/gi, "")
        .replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, "")
        .length > 0;
}
