import AsyncStorage from "@react-native-async-storage/async-storage";

const FIELD_SETS_KEY = "savedFieldSets";

// Clean saved data and support older field sets that only stored title strings.
const cleanFieldSet = (fieldSet) => ({
    id: String(fieldSet.id),
    name: String(fieldSet.name || "").trim(),
    fields: Array.isArray(fieldSet.fields)
        ? fieldSet.fields
            .map((field) => typeof field === "string"
                ? { name: field.trim(), color: null }
                : { name: String(field?.name || "").trim(), color: field?.color || null })
            .filter((field) => field.name)
        : [],
    createdAt: fieldSet.createdAt || new Date().toISOString(),
});

// Load field sets from device storage instead of the card database.
export async function loadFieldSets() {
    try {
        const saved = await AsyncStorage.getItem(FIELD_SETS_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(cleanFieldSet)
            .filter((fieldSet) => fieldSet.name && fieldSet.fields.length > 0);
    } catch (error) {
        console.error("Failed to load field sets", error);
        return [];
    }
}

// Save field titles and colors only. Field contexts are intentionally excluded.
export async function saveFieldSet(name, fields) {
    const fieldSets = await loadFieldSets();
    const fieldSet = cleanFieldSet({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        fields,
    });

    await AsyncStorage.setItem(FIELD_SETS_KEY, JSON.stringify([...fieldSets, fieldSet]));
    return fieldSet;
}

// Replace an existing set while keeping its original storage identity.
export async function updateFieldSet(id, name, fields) {
    const fieldSets = await loadFieldSets();
    const existing = fieldSets.find((fieldSet) => fieldSet.id === id);
    if (!existing) throw new Error("Field set not found");

    const updatedFieldSet = cleanFieldSet({
        ...existing,
        name,
        fields,
    });
    const updated = fieldSets.map((fieldSet) => fieldSet.id === id ? updatedFieldSet : fieldSet);

    await AsyncStorage.setItem(FIELD_SETS_KEY, JSON.stringify(updated));
    return updatedFieldSet;
}

// Remove a single field set without affecting cards that already used it.
export async function deleteFieldSet(id) {
    const fieldSets = await loadFieldSets();
    const updated = fieldSets.filter((fieldSet) => fieldSet.id !== id);
    await AsyncStorage.setItem(FIELD_SETS_KEY, JSON.stringify(updated));
    return updated;
}
