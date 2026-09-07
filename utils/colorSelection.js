// Returns the shared color for a selection, or undefined when its colors differ.
export function getSharedItemColor(items) {
    if (!items.length) return undefined;

    const sharedColor = items[0].color ?? null;
    return items.every((item) => (item.color ?? null) === sharedColor)
        ? sharedColor
        : undefined;
}
