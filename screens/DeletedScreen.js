import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Components
import HeaderBar from "../components/Navigation/HeaderBar.js";
import ListButton from "../components/Buttons/ListButton.js";
import ConfirmationModal from "../components/Modals/ConfirmationModal.js";
import InformationModal from "../components/Modals/InformationModal.js";
import ListLoadingIndicator from "../components/Blocks/ListLoadingIndicator.js";

// Database Queries
import { getDeletedItems, restoreMultipleItems, permanentlyDeleteFolder, permanentlyDeleteCard, permanentlyDeleteField } from "../database/queries.js";

// Hooks
import { useSelection } from "../hooks/useSelection.js";
import { useModalStates } from "../hooks/useModalStates.js";
import { useSortMode } from "../context/SortModeContext.js";

// Utils
import { handleSort } from "../utils/handleSort.js";

// Language
import { useTranslation } from 'react-i18next';

export default function DeletedScreen({ navigation }) {
    const insets = useSafeAreaInsets();  // For placing elements
    const [deletedItems, setDeletedItems] = useState([]);  // All deleted Items
    const [isLoading, setIsLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState(null);  // Confirm deletion or restore

    const modals = useModalStates();
    const { selectedItems, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { colors } = useTheme();
    const { deletedSortMode } = useSortMode();
    const { t } = useTranslation();

    // Bring all deleted items on mount
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadDeletedItems);
        return unsubscribe;
    }, [navigation, deletedSortMode]);

    const loadDeletedItems = async () => {
        setIsLoading(true);
        try {
            const items = await getDeletedItems();
            await handleSort(items, setDeletedItems, deletedSortMode, true);
        } finally {
            setIsLoading(false);
        }
    };

    // Restore items
    const handleRestore = useCallback(async () => {
        if (selectedItems.length === 0) return;
        
        const anyRenamed = await restoreMultipleItems(selectedItems);
        
        if (anyRenamed) modals.openInfoModal({type: t("titles.restored"), message: t("infoMessages.itemsRenamed")});

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
        modals.closeDeleteModal();
        await loadDeletedItems();
    }, [selectedItems, clearSelection]);

    // Permanently delete everything
    const handleEmptyTrash = useCallback(async () => {
        for (const item of deletedItems) {
            if (item.type === "Category") await permanentlyDeleteFolder(item.id);
            else if (item.type === "Card") await permanentlyDeleteCard(item.id);
            else if (item.type === "Field") await permanentlyDeleteField(item.id);
        }

        modals.closeDeleteModal();
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
                modals.openDeleteModal();
                break;
            case "emptyTrash":
                setConfirmAction("empty");
                modals.openDeleteModal();
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

            <View style={[styles.underShadow, styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.bigText, { color: colors.textPrimary }]}>{t("titles.deleted")}</Text>
            </View>

            {isLoading ? (
                <ListLoadingIndicator />
            ) : deletedItems.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <FontAwesome name="trash-o" size={60} color={colors.textHalfOpacity} />
                    <Text style={[styles.midText, { color: colors.textSecondary, marginTop: 10 }]}>{t("screenMessages.deleted")}</Text>
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
                        <TouchableOpacity onPress={() => handleAction("restore")} style={[styles.underShadow, styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.success, flex: 1, gap: 5, paddingHorizontal: 10 }]}>
                            <FontAwesome name="undo" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>{t("buttons.restore", {length: `(${selectedItems.length})`})}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleAction("permanentDelete")} style={[styles.underShadow, styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.danger, flex: 1, gap: 5, paddingHorizontal: 10 }]}>
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>{t("buttons.deleteForever", {length: `(${selectedItems.length})`})}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    deletedItems.length > 0 && (
                        <TouchableOpacity onPress={() => handleAction("emptyTrash")} style={[styles.underShadow, styles.normalButton, styles.rowCenter, styles.centered, { backgroundColor: colors.danger, flex: 1, gap: 10}]}>
                            <FontAwesome name="trash" size={16} color={colors.textPrimary} />
                            <Text style={[styles.smallText, { color: colors.textPrimary }]}>{t("buttons.emptyTrash")}</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={modals.confirmVisible}
                onCancel={modals.closeDeleteModal}
                onConfirm={confirmAction === "empty" ? handleEmptyTrash : handlePermanentDelete}
                title={confirmAction === "empty" ? t("titles.deleteEverything") : `${t("titles.deleteForever")}?`}
                message={
                    confirmAction === "empty"
                        ? t("infoMessages.confirmDeleteAll")
                        : `${selectedItems.length} ${t("infoMessages.confirmDelete")}`
                }
                confirmText={t("titles.deleteForever")}
                confirmColor={colors.danger}
            />

            {/* Information Modal */}
            <InformationModal
                visible={modals.infoVisible}
                onClose={modals.closeInfoModal}
                title={modals.errorMessages[0]?.type}
                message={modals.errorMessages[0]?.message}
            />

        </View>
    );
}
