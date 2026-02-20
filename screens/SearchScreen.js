import { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Components
import ListButton from "../components/ListButton.js";

// Database Queries
import db from "../database/db.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Searching Screen
export default function SearchScreen({ navigation }) {
    const insets = useSafeAreaInsets();            // For placing elements
    const [query, setQuery] = useState("");        // Searched text
    const [allItems, setAllItems] = useState([]);  // All items we have in database, except deleted ones
    const [results, setResults] = useState([]);    // Filtered items

    // Load all data once when screen mounts
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadAllData);
        return unsubscribe;
    }, [navigation]);

    // Bring all folders, cards, fields except deleted ones
    const loadAllData = async () => {
        const folders = await db.getAllAsync("SELECT *, 'Category' as type FROM folders WHERE deleted_at IS NULL AND is_system_folder = 0");
        const cards =   await db.getAllAsync("SELECT *, 'Card' as type FROM cards WHERE deleted_at IS NULL AND is_system_card = 0");
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

        // If Category and parent is null, go to HomeScreen, if parent exist go to FolderScreen
        if (item.type === "Category") {
            if (item.parent_id === null) navigation.navigate("Home");
            else navigation.navigate("Folder", {folder: item, path: [...path, { id: item.id, name: item.name, type: item.type }]});

        // If Card, navigate to parent folder of the card
        } else if (item.type === "Card") {
            const folder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [item.parent_id]);
            navigation.navigate("Folder", {folder: folder, path: path});
        
        // If Card, navigate to the parent card
        } else if (item.type === "Field") {
            const card = await db.getFirstAsync("SELECT * FROM cards WHERE id = ?", [item.parent_id]);
            navigation.navigate("CardDetail", {card: card, path: [...path, { id: card.id, name: card.name, type: card.type }]});
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
            <View style={[styles.rowCenter, styles.paddingHorizontal, {gap: 10, backgroundColor: colors.bgSecondary, paddingVertical: 5}]}>
                <FontAwesome name="search" size={20} color={colors.textSecondary}/>
                <TextInput
                    value={query}
                    onChangeText={(text) => {setQuery(text); runSearch(text)}}
                    placeholder="Search folders, cards, fields..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, styles.midText, { color: colors.textSecondary }]}
                    returnKeyType="search"
                    maxLength={100}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }}>
                        <FontAwesome name="times-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            {/* If something is typed and no result found */}
            {query.trim().length > 0 && results.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textSecondary}]}>
                        No results found for "{query}"
                    </Text>
                </View>
            
            // If nothing is typed
            ) : results.length === 0 ? (
                <View style={[styles.container, styles.centered, {gap: 10}]}>
                    <FontAwesome name="search" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textHalfOpacity}]}>
                        Start typing to search
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
