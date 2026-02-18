import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import db from "../database/db.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const runSearch = async (searchQuery) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }

        const searchTerm = `%${trimmed.toLowerCase()}%`;

        // Optimized SQL queries with LIKE - searches only what matches
        const folders = await db.getAllAsync(
            "SELECT *, 'Category' as type FROM folders WHERE LOWER(name) LIKE ?",
            [searchTerm]
        );

        const cards = await db.getAllAsync(
            "SELECT *, 'Card' as type FROM cards WHERE LOWER(name) LIKE ?",
            [searchTerm]
        );

        const fields = await db.getAllAsync(
            "SELECT *, 'Field' as type FROM fields WHERE LOWER(name) LIKE ? OR LOWER(context) LIKE ?",
            [searchTerm, searchTerm]
        );

        // Combine results: folders first, then cards, then fields
        setResults([...folders, ...cards, ...fields]);
    };

    // Build navigation path for an item
    const buildPath = async (item) => {
        const path = [{ id: null, name: "Subjects" }];

        if (item.type === "Category") {
            // Folder: traverse up to root
            let currentId = item.parent_id;
            while (currentId !== null) {
                const parent = await db.getFirstAsync(
                    "SELECT * FROM folders WHERE id = ?",
                    [currentId]
                );
                if (!parent) break;
                path.push({ id: parent.id, name: parent.name });
                currentId = parent.parent_id;
            }
        } else if (item.type === "Card") {
            // Card: get its folder, then traverse up
            const folder = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [item.folder_id]
            );
            if (folder) {
                path.push({ id: folder.id, name: folder.name });
                let currentId = folder.parent_id;
                while (currentId !== null) {
                    const parent = await db.getFirstAsync(
                        "SELECT * FROM folders WHERE id = ?",
                        [currentId]
                    );
                    if (!parent) break;
                    path.splice(1, 0, { id: parent.id, name: parent.name });
                    currentId = parent.parent_id;
                }
            }
        } else if (item.type === "Field") {
            // Field: get its card, then card's folder, then traverse up
            const card = await db.getFirstAsync(
                "SELECT * FROM cards WHERE id = ?",
                [item.card_id]
            );
            if (card) {
                const folder = await db.getFirstAsync(
                    "SELECT * FROM folders WHERE id = ?",
                    [card.folder_id]
                );
                if (folder) {
                    path.push({ id: folder.id, name: folder.name });
                    let currentId = folder.parent_id;
                    while (currentId !== null) {
                        const parent = await db.getFirstAsync(
                            "SELECT * FROM folders WHERE id = ?",
                            [currentId]
                        );
                        if (!parent) break;
                        path.splice(1, 0, { id: parent.id, name: parent.name });
                        currentId = parent.parent_id;
                    }
                }
            }
        }

        return path;
    };

    // Navigate to the correct screen based on item type
    const handleItemPress = async (item) => {
        const path = await buildPath(item);

        if (item.type === "Category") {
            // Navigate to folder
            if (item.parent_id === null) {
                // Root folder - go to Home
                navigation.navigate("Home");
            } else {
                // Navigate to Folder screen
                navigation.navigate("Folder", {
                    folder: item,
                    path: [...path, { id: item.id, name: item.name }]
                });
            }
        } else if (item.type === "Card") {
            // Navigate to parent folder of the card
            const folder = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [item.folder_id]
            );
            if (folder) {
                navigation.navigate("Folder", {
                    folder: folder,
                    path: path
                });
            }
        } else if (item.type === "Field") {
            // Navigate to CardDetail (parent card)
            const card = await db.getFirstAsync(
                "SELECT * FROM cards WHERE id = ?",
                [item.card_id]
            );
            if (card) {
                navigation.navigate("CardDetail", {
                    card: card,
                    path: [...path, { id: card.id, name: card.name }]
                });
            }
        }
    };

    const getIcon = (type) => {
        if (type === "Category") return "folder";
        if (type === "Card") return "file-text-o";
        return "align-left";
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            {/* Search Bar */}
            <View style={localStyles.searchContainer}>
                <FontAwesome name="search" size={18} color={colors.textSecondary} style={localStyles.searchIcon} />
                <TextInput
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        runSearch(text);
                    }}
                    placeholder="Search folders, cards, fields..."
                    placeholderTextColor={colors.textSecondary}
                    style={localStyles.searchInput}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }}>
                        <FontAwesome name="times-circle" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            {query.trim().length > 0 && results.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, { color: colors.textSecondary }]}>
                        No results found for "{query}"
                    </Text>
                </View>
            ) : results.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <FontAwesome name="search" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, { color: colors.textSecondary, marginTop: 20 }]}>
                        Start typing to search
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
                    style={{ marginTop: 10 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleItemPress(item)}
                            style={localStyles.resultItem}
                            activeOpacity={0.7}
                        >
                            <View style={[localStyles.iconContainer, { backgroundColor: item.color || colors.bgCard }]}>
                                <FontAwesome name={getIcon(item.type)} size={18} color={colors.textPrimary} />
                            </View>
                            <View style={localStyles.resultContent}>
                                <Text style={localStyles.resultName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <View style={localStyles.resultMeta}>
                                    <Text style={localStyles.resultType}>{item.type}</Text>
                                    {item.context && (
                                        <Text style={localStyles.resultContext} numberOfLines={1}>
                                            • {item.context}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color={colors.textHalfOpacity} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        margin: 16,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    resultMeta: {
        flexDirection: "row",
        alignItems: "center",
    },
    resultType: {
        fontSize: 12,
        color: colors.accentLight,
        fontWeight: "500",
    },
    resultContext: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 4,
        flex: 1,
    },
});