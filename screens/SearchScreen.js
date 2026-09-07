import { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Components
import ListButton from "../components/Buttons/ListButton.js";
import ListLoadingIndicator from "../components/Blocks/ListLoadingIndicator.js";

// Database Queries
import db from "../database/db.js";

// Utils
import { getVisibleSearchItems } from "../utils/searchVisibility.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Language
import { useTranslation } from 'react-i18next';

// Searching Screen
export default function SearchScreen({ navigation }) {
    const insets = useSafeAreaInsets();            // For placing elements
    const [query, setQuery] = useState("");        // Searched text
    const [allItems, setAllItems] = useState([]);  // Items whose complete hierarchy is active
    const [isLoading, setIsLoading] = useState(true);
    const { colors } = useTheme();
    const { t } = useTranslation();

    // Load all data once when screen mounts
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadAllData);
        return unsubscribe;
    }, [navigation]);

    // Bring all folders, cards, fields except deleted ones
    // Load parent metadata too so descendants of deleted ancestors can be excluded.
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [folders, cards, fields] = await Promise.all([
                db.getAllAsync("SELECT *, 'Category' as type FROM folders"),
                db.getAllAsync("SELECT *, 'Card' as type FROM cards"),
                db.getAllAsync("SELECT *, 'Field' as type FROM fields WHERE deleted_at IS NULL"),
            ]);
            setAllItems(getVisibleSearchItems(folders, cards, fields));
        } finally {
            setIsLoading(false);
        }
    };

    // Filter loaded items without keeping a second, temporarily stale result state.
    const results = useMemo(() => {
        const trimmed = query.trim();
        if (!trimmed) return [];

        const searchTerm = trimmed.toLowerCase();
        return allItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm);
            const contextMatch = item.context && item.context.toLowerCase().includes(searchTerm);
            return nameMatch || contextMatch;
        });
    }, [allItems, query]);

    // Helper: Build folder ancestry path
    const buildFolderPath = async (folderId) => {
        const parents = [];
        let currentId = folderId;
        
        // As long as parent exist, add each folder to the parents array recursively
        while (currentId !== null) {
            const parent = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [currentId]);
            if (!parent) break;
            parents.unshift({ id: parent.id, name: parent.name, type: parent.type }); // Add to beginning
            currentId = parent.parent_id;
        }
        
        return parents;
    };

    // Build navigation path for an item
    const buildPath = async (item) => {

        // Add Subjects to the path, first element should always be Subjects root
        const path = [{ id: null, name: "Subjects", type: "Category" }];  

        // For folders, build path from parent up to root, if its parent is the root skip this
        if (item.type === "Category") {
            if (item.parent_id !== null) {
                const parents = await buildFolderPath(item.parent_id); 
                path.push(...parents)
            }

        // For cards, build path from card's parent folder up to root
        } else if (item.type === "Card") {
            const folder =  await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [item.parent_id]);
            const parents = await buildFolderPath(folder.parent_id);
            path.push(...parents, { id: folder.id, name: folder.name, type: folder.type });
            
        // For fields, get parent card, then card's parent folder, build path
        } else if (item.type === "Field") {
            const card =    await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [item.parent_id]);
            const folder =  await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [card.parent_id]);
            const parents = await buildFolderPath(folder.parent_id);
            path.push(...parents, { id: folder.id, name: folder.name, type: folder.type });
        }

        return path;  
    };

    // Navigate to the correct screen based on item type
    const handleItemPress = async (item) => {

        // Create the path
        const path = await buildPath(item);

        // Open the selected folder itself, including folders stored at the root.
        if (item.type === "Category") {
            navigation.navigate("Folder", {
                folder: item,
                path: [...path, { id: item.id, name: item.name, type: item.type }]
            });

        // Open the selected card itself.
        } else if (item.type === "Card") {
            navigation.navigate("CardDetail", {
                card: item,
                path: [...path, { id: item.id, name: item.name, type: item.type }]
            });
        
        // Fields have no separate screen, so open their card and focus the field.
        } else if (item.type === "Field") {
            const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [item.parent_id]);
            navigation.navigate("CardDetail", {
                card,
                path: [...path, { id: card.id, name: card.name, type: card.type }],
                targetFieldId: item.id
            });
        }
    };

    // Display different icons depend on the item type
    const getIcon = (type) => {
        if (type === "Category") return "folder";
        if (type === "Card") return "file-text-o";
        return "align-left";
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>

            {/* Search Bar */}
            <View style={[styles.underShadow, styles.rowCenter, styles.paddingHorizontal, {gap: 10, backgroundColor: colors.bgSecondary, paddingVertical: 5}]}>
                <FontAwesome name="search" size={20} color={colors.textSecondary}/>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t("titles.search")}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, styles.midText, { color: colors.textSecondary }]}
                    returnKeyType="search"
                    maxLength={100}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")}>
                        <FontAwesome name="times-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            {/* If something is typed and no result found */}
            {isLoading ? (
                <ListLoadingIndicator />
            ) : query.trim().length > 0 && results.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textSecondary}]}>
                        {t("screenMessages.noResult", {query: `"${query}"`})}
                    </Text>
                </View>
            
            // If nothing is typed
            ) : results.length === 0 ? (
                <View style={[styles.container, styles.centered, {gap: 10}]}>
                    <FontAwesome name="search" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textHalfOpacity}]}>
                        {t("screenMessages.typeToSearch")}
                    </Text>
                </View>

            // If something is searched and found
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
                    style={{ marginTop: 10 }}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            updatedAt={item.updated_at}
                            createdAt={item.created_at} 
                            color={item.color}
                            icon={getIcon(item.type)}
                            context={item.context}
                            isSelected={false}
                            status={{}}
                            onPress={() => handleItemPress(item)}
                            onLongPress={() => {}}
                        />
                    )}
                />
            )}
        </View>
    );
}
