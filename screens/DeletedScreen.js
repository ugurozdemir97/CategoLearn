import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Components
import HeaderBar from "../components/HeaderBar.js";
import ConfirmationModal from "../components/ConfirmationModal.js";

// Database Queries
import { getDeletedItems, restoreMultipleItems, permanentlyDeleteFolder, permanentlyDeleteCard, permanentlyDeleteField } from "../database/queries.js";

// Hooks
import { useSelection } from "../hooks/useSelection.js";

export default function DeletedScreen({ navigation }) {
    const [deletedItems, setDeletedItems] = useState([]);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const { selectedItems, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadDeletedItems);
        return unsubscribe;
    }, [navigation]);

    const loadDeletedItems = async () => {
        const items = await getDeletedItems();
        setDeletedItems(items);
    };

    const handleRestore = useCallback(async () => {
        if (selectedItems.length === 0) return;
        await restoreMultipleItems(selectedItems);
        clearSelection();
        await loadDeletedItems();
    }, [selectedItems, clearSelection]);

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
    }, [selectedItems, deletedItems.length, clearSelection]);

    const handleEmptyTrash = useCallback(async () => {
        for (const item of deletedItems) {
            if (item.type === "Category") await permanentlyDeleteFolder(item.id);
            else if (item.type === "Card") await permanentlyDeleteCard(item.id);
            else if (item.type === "Field") await permanentlyDeleteField(item.id);
        }

        setConfirmVisible(false);
        await loadDeletedItems();
    }, [deletedItems]);

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
                onLayout={(event) => {}}
                onCancelSelection={clearSelection}
                onSelectAll={() => selectAll(deletedItems)}
            />

            <View style={[styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.bigText, { color: colors.textPrimary }]}>Trash</Text>
            </View>

            {deletedItems.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <FontAwesome name="trash-o" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, { color: colors.textSecondary, marginTop: 20 }]}>
                        Trash is empty
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={deletedItems}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    style={{ marginTop: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => toggleSelection(item)}
                            onLongPress={() => toggleSelection(item)}
                            style={[
                                localStyles.trashItem,
                                isSelected(item) && localStyles.trashItemSelected
                            ]}
                            activeOpacity={0.7}
                        >
                            <View style={[localStyles.iconContainer, { backgroundColor: item.color || colors.bgCard }]}>
                                <FontAwesome name={getIcon(item.type)} size={18} color={colors.textPrimary} />
                            </View>
                            
                            <View style={localStyles.itemContent}>
                                <Text style={localStyles.itemName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={localStyles.itemMeta}>
                                    {item.type} • Deleted {new Date(item.deleted_at).toLocaleDateString("en-GB")}
                                </Text>
                            </View>

                            {isSelected(item) && (
                                <FontAwesome name="check-circle" size={20} color={colors.accentLight} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}

            <View style={{ height: 15 }} />

            <View style={localStyles.trashFooter}>
                {selectedItems.length > 0 ? (
                    <>
                        <TouchableOpacity
                            onPress={() => handleAction("restore")}
                            style={[localStyles.footerButton, { backgroundColor: colors.success }]}
                        >
                            <FontAwesome name="undo" size={16} color={colors.textPrimary} />
                            <Text style={localStyles.footerButtonText}>Restore ({selectedItems.length})</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleAction("permanentDelete")}
                            style={[localStyles.footerButton, { backgroundColor: colors.danger }]}
                        >
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={localStyles.footerButtonText}>Delete Forever</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    deletedItems.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleAction("emptyTrash")}
                            style={[localStyles.footerButton, { backgroundColor: colors.danger, flex: 1 }]}
                        >
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={localStyles.footerButtonText}>Empty Trash</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmAction === "empty" ? handleEmptyTrash : handlePermanentDelete}
                title={confirmAction === "empty" ? "Empty Trash?" : "Delete Forever?"}
                message={
                    confirmAction === "empty"
                        ? "All items in trash will be permanently deleted. This cannot be undone."
                        : `${selectedItems.length} item(s) will be permanently deleted. This cannot be undone.`
                }
                confirmText="Delete Forever"
                confirmColor={colors.danger}
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    trashItem: {
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
    trashItemSelected: {
        borderColor: colors.accentLight,
        backgroundColor: colors.bgCardCopied,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    trashFooter: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.bgSecondary,
        borderTopWidth: 1,
        borderTopColor: colors.accent,
    },
    footerButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
    },
    footerButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
});