import { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Database Queries
import db from "../database/db.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Searching Screen
export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState("");        
    const [allItems, setAllItems] = useState([]);  // All items we have in database, except deleted ones
    const [results, setResults] = useState([]);    // Filtered items

    // Load all data once when screen mounts
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadAllData);
        return unsubscribe;
    }, [navigation]);

    // Bring all folders, cards, fields except deleted ones
    const loadAllData = async () => {
        const folders = await db.getAllAsync("SELECT *, 'Category' as type FROM folders WHERE deleted_at IS NULL");
        const cards =   await db.getAllAsync("SELECT *, 'Card' as type FROM cards WHERE deleted_at IS NULL");
        const fields =  await db.getAllAsync("SELECT *, 'Field' as type FROM fields WHERE deleted_at IS NULL");
        setAllItems([...folders, ...cards, ...fields]);  // Combine and store in state
    };

    // Filter Items as you write something in the search input
    const runSearch = (searchQuery) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) { setResults([]); return; }

        const searchTerm = trimmed.toLowerCase();

        // Filter items that match the search term
        const filtered = allItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm);
            const contextMatch = item.context && item.context.toLowerCase().includes(searchTerm);
            return nameMatch || contextMatch;
        });

        setResults(filtered);
    };

    // Helper: Build folder ancestry path (works for any starting folder ID)
    const buildFolderPath = async (folderId) => {
        const parents = [];
        let currentId = folderId;
        
        while (currentId !== null) {
            const parent = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [currentId]
            );
            if (!parent) break;
            parents.unshift({ id: parent.id, name: parent.name, type: parent.type }); // Add to beginning
            currentId = parent.parent_id;
        }
        
        return parents;
    };

    // Build navigation path for an item
    const buildPath = async (item) => {
        const path = [{ id: null, name: "Subjects", type: "Category" }];

        if (item.type === "Category") {
            // For folders, build path from parent up to root
            if (item.parent_id !== null) {
                const parents = await buildFolderPath(item.parent_id);
                path.push(...parents);
            }
            
        } else if (item.type === "Card") {
            // For cards, build path from card's parent folder up to root, then add the folder itself
            const folder = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [item.parent_id]
            );
            const parents = await buildFolderPath(folder.parent_id);
            path.push(...parents, { id: folder.id, name: folder.name, type: folder.type });
            
        } else if (item.type === "Field") {
            // For fields, get parent card, then card's parent folder, build path
            const card = await db.getFirstAsync(
                "SELECT * FROM cards WHERE id = ?",
                [item.parent_id]
            );
            const folder = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [card.parent_id]
            );
            const parents = await buildFolderPath(folder.parent_id);
            path.push(...parents, { id: folder.id, name: folder.name, type: folder.type });
        }
        return path;
    };

    // Navigate to the correct screen based on item type
    const handleItemPress = async (item) => {
        const path = await buildPath(item);

        if (item.type === "Category") {
            if (item.parent_id === null) {
                // Root folder - go to Home
                navigation.navigate("Home");
            } else {
                // Navigate directly to folder with full path
                navigation.navigate("Folder", {
                    folder: item,
                    path: [...path, { id: item.id, name: item.name, type: item.type }],
                });
            }
            
        } else if (item.type === "Card") {
            // Navigate to parent folder of the card
            const folder = await db.getFirstAsync(
                "SELECT * FROM folders WHERE id = ?",
                [item.parent_id]
            );
            navigation.navigate("Folder", {
                folder: folder,
                path: path,
            });
            
        } else if (item.type === "Field") {
            // Get parent card first
            const card = await db.getFirstAsync(
                "SELECT * FROM cards WHERE id = ?",
                [item.parent_id]
            );
            
            navigation.navigate("CardDetail", {
                card: card,
                path: [...path, { id: card.id, name: card.name, type: card.type }],
            });
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