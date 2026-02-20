import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Components
import HeaderBar from "../components/HeaderBar.js";
import ListButton from "../components/ListButton.js";
import ConfirmationModal from "../components/ConfirmationModal.js";

// Database Queries
import { getDeletedItems, restoreMultipleItems, permanentlyDeleteFolder, permanentlyDeleteCard, permanentlyDeleteField } from "../database/queries.js";

// Hooks
import { useSelection } from "../hooks/useSelection.js";

// Utils
import { handleSort } from "../utils/handleSort.js";

// Storage
import { loadSortMode } from "../storage/sortPreference.js";

export default function DeletedScreen({ navigation }) {
    const insets = useSafeAreaInsets();            // For placing elements
    const [deletedItems, setDeletedItems] = useState([]);         // All deleted Items
    const [confirmVisible, setConfirmVisible] = useState(false);  // Show/Hide Confirmation Modal
    const [confirmAction, setConfirmAction] = useState(null);     // Confirm deletion or restore

    const { selectedItems, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();

    // Bring all deleted items on mount
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadDeletedItems);
        return unsubscribe;
    }, [navigation]);

    const loadDeletedItems = async () => {
        const items = await getDeletedItems();
        const lastMode = await loadSortMode();
        handleSort(items, setDeletedItems, lastMode, true);  // Pass true for "isDeletedScreen"
    };

    // Restore items
    const handleRestore = useCallback(async () => {
        if (selectedItems.length === 0) return;
        await restoreMultipleItems(selectedItems);
        clearSelection();
        await loadDeletedItems();
    }, [selectedItems, clearSelection]);

    // Permanently delete selected items
    const handlePermanentDelete = useCallback(async () => {
        if (selectedItems.length === 0) return;
        
        for (const item of selectedItems) {
            if (item.type === "Category") await permanentlyDeleteFolder(item.id);
            else if (item.type === "Card") await permanentlyDeleteCard(item.id);
            else if (item.type === "Field") await permanentlyDeleteField(item.id);
        }

        clearSelection();
        setConfirmVisible(false);
        await loadDeletedItems();
    }, [selectedItems, clearSelection]);

    // Permanently delete everything
    const handleEmptyTrash = useCallback(async () => {
        for (const item of deletedItems) {
            if (item.type === "Category") await permanentlyDeleteFolder(item.id);
            else if (item.type === "Card") await permanentlyDeleteCard(item.id);
            else if (item.type === "Field") await permanentlyDeleteField(item.id);
        }

        setConfirmVisible(false);
        await loadDeletedItems();
    }, [deletedItems]);

    // Handle all actions
    const handleAction = (action) => {
        switch (action) {
            case "restore":
                handleRestore();
                break;
            case "permanentDelete":
                setConfirmAction("delete");
                setConfirmVisible(true);
                break;
            case "emptyTrash":
                setConfirmAction("empty");
                setConfirmVisible(true);
                break;
            default:
                break;
        }
    };

    // Give icons to items
    const getIcon = (type) => {
        if (type === "Category") return "folder";
        if (type === "Card") return "file-text-o";
        return "align-left";
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={deletedItems.length}
                onSort={handleSort}
                items={deletedItems}
                setItems={setDeletedItems}
                onCancelSelection={clearSelection}
                onSelectAll={() => selectAll(deletedItems)}
                isDeletedScreen={true}
            />

            <View style={[styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.bigText, { color: colors.textPrimary }]}>Deleted Items</Text>
            </View>

            {deletedItems.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <FontAwesome name="trash-o" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, { color: colors.textSecondary, marginTop: 10 }]}>There are no deleted items</Text>
                </View>
            ) : (
                <FlatList
                    data={deletedItems}
                    keyExtractor={(item, index) => `${index}-${item.type}-${item.id}`}
                    style={{ marginTop: 8 }}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            deletedAt={item.deleted_at}
                            updatedAt={item.updated_at}
                            createdAt={item.created_at} 
                            color={item.color}
                            icon={getIcon(item.type)}
                            isSelected={isSelected(item)}
                            status={{}}
                            onPress={() => toggleSelection(item)}
                            onLongPress={() => toggleSelection(item)}
                        />
                    )}
                />
            )}

            <View style={{height: 10}}></View>

            <View style={[styles.rowCenter, styles.paddingHorizontal, {backgroundColor: colors.bgSecondary, gap: 10, paddingBottom: insets.bottom + 15, paddingTop: 15}]}>
                {selectedItems.length > 0 ? (
                    <>
                        <TouchableOpacity onPress={() => handleAction("restore")} style={[styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.success, flex: 1, gap: 10}]}>
                            <FontAwesome name="undo" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]}>Restore ({selectedItems.length})</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleAction("permanentDelete")} style={[styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.danger, flex: 1, gap: 10}]}>
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]}>Delete Forever ({selectedItems.length})</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    deletedItems.length > 0 && (
                        <TouchableOpacity onPress={() => handleAction("emptyTrash")} style={[styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.danger, flex: 1, gap: 10}]}>
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]}>Empty Trash</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmAction === "empty" ? handleEmptyTrash : handlePermanentDelete}
                title={confirmAction === "empty" ? "Delete Everything Permanently?" : "Delete Forever?"}
                message={
                    confirmAction === "empty"
                        ? "All items will be permanently deleted. This cannot be undone."
                        : `${selectedItems.length} item(s) will be permanently deleted. This cannot be undone.`
                }
                confirmText="Delete Forever"
                confirmColor={colors.danger}
            />
        </View>
    );
}
