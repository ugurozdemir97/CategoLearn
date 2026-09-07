import React, { useState } from "react";
import { View, Text, FlatList, BackHandler } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { NestableDraggableFlatList, NestableScrollContainer, ScaleDecorator } from "react-native-draggable-flatlist";

// Components
import CircleButton from "../components/Buttons/CircleButton.js";
import ListButton from "../components/Buttons/ListButton.js";
import DraggableListButton from "../components/Buttons/DraggableListButton.js";
import CreateModal from "../components/Modals/CreateModal.js";
import ColorModal from "../components/Modals/ColorModal.js";
import ConfirmationModal from "../components/Modals/ConfirmationModal.js";
import InformationModal from "../components/Modals/InformationModal.js";
import HeaderBar from "../components/Navigation/HeaderBar.js";
import FooterBar from "../components/Navigation/FooterBar.js";
import BreadCrumb from "../components/Navigation/BreadCrumb.js";
import DateDisplay from "../components/Blocks/DateDisplay.js";
import ListLoadingIndicator from "../components/Blocks/ListLoadingIndicator.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Context and Hooks
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { useSortMode } from "../context/SortModeContext.js";
import { useModalStates } from "../hooks/useModalStates.js";
import { useCustomSort } from "../hooks/useCustomSort.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleEditSelected, isSystemRecoveryItem } from "../utils/handleFooterActions.js";
import { getSharedItemColor } from "../utils/colorSelection.js";

// Database Queries and Storage
import db from "../database/db.js";
import { getFolders, getCards, addFolder, addCard, updateFolder, updateCard, deleteFolder, deleteCard, addField, updateField, getFields, deleteField } from "../database/queries.js";

// Language
import { useTranslation } from 'react-i18next';

// FolderScreen: Displays contents of a folder (subfolders and cards). Create or edit them. 
export default function FolderScreen({ route, navigation }) {
    const { folder, path } = route.params;
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createType, setCreateType] = useState(null);
    const [fields, setFields] = useState([]);
    const [folderDate, setFolderDate] = useState(null);
    const [footerHeight, setFooterHeight] = useState(60);

    // Custom hooks for state management
    const modals = useModalStates();
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();
    const { sortMode } = useSortMode();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const sortModeRef = React.useRef(sortMode);
    sortModeRef.current = sortMode;
    const folderItems = items.filter((item) => item.type === "Category");
    const cardItems = items.filter((item) => item.type === "Card");
    const isSystemContainer = isSystemRecoveryItem(folder);
    const hasSelectedSystemItem = selectedItems.some(isSystemRecoveryItem);

    // When go back arrow on the phone is clicked, prevent going back to HomeScreen and go to the parent
    useFocusEffect(
        React.useCallback(() => {
            let isScreenFocused = true;
            const onBackPress = () => {
                if (!isScreenFocused) return false;

                // Go back to parent folder instead of root
                if (path.length > 2) {
                    const parent = path[path.length - 2];
                    navigation.setParams({ folder: parent, path: path.slice(0, path.length - 1) });
                    return true;
                }

                return false;
            };

            const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
            return () => {
                isScreenFocused = false;
                subscription.remove();
            };
        }, [path, navigation])
    );

    // Load once on focus, and reload when navigation changes the current folder.
    useFocusEffect(
        React.useCallback(() => {
            loadItems(folder.id, sortModeRef.current);
        }, [folder.id])
    );

    // Load all subfolders and cards inside this folder from the database
    const loadItems = async (folderId = folder.id, selectedSortMode = sortMode) => {
        setIsLoading(true);
        try {
            const [folders, cards] = await Promise.all([
                getFolders(folderId),
                getCards(folderId),
            ]);
            await handleSort([...folders, ...cards], setItems, selectedSortMode);
            const currentFolder = route.params?.folder || folder;
            if (selectedSortMode === "creationDate") setFolderDate(currentFolder.created_at);
            else setFolderDate(currentFolder.updated_at);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom sort functions for custom sort mode
    const customSort = useCustomSort(
        items,
        setItems,
        loadItems,
        () => modals.openInfoModal({ type: t("errorTitles.error"), message: t("errorMessages.customOrderSaveFailed") }),
        { groupBy: (item) => item.type }
    );

    // Handle Create or Edit for both cards and folders
    const handleItem = async (itemData, mode) => {
        if (mode === "create") {
            if (itemData.type === "Category") {
                await addFolder(folder.id, itemData.name, itemData.color);
            } else if (itemData.type === "Card") {
                const cardId = await addCard(folder.id, itemData.name, itemData.color);
                for (const f of itemData.fields) await addField(cardId, f.name, f.context, f.color || null);
            }
        } else if (mode === "edit" && modals.editTarget) {
            if (modals.editTarget.type === "Category") {
                await updateFolder(modals.editTarget.id, itemData.name, itemData.color);
            } else {
                await updateCard(modals.editTarget.id, itemData.name, itemData.color);

                // Smart field sync: update, add, or delete as needed
                const oldFields = await getFields(modals.editTarget.id);
                const newFields = itemData.fields || [];
                const processedOldFieldIds = new Set();

                for (const newField of newFields) {
                    if (newField.id) {
                        processedOldFieldIds.add(newField.id);
                        const oldField = oldFields.find(f => f.id === newField.id);

                        if (oldField) {
                            const nameChanged = oldField.name !== newField.name;
                            const contextChanged = (oldField.context || '') !== (newField.context || '');
                            const colorChanged = (oldField.color || null) !== (newField.color || null);

                            if (nameChanged || contextChanged || colorChanged) {
                                await updateField(newField.id, newField.name, newField.context || null, newField.color || null);
                            }
                        }
                    } else {
                        await addField(modals.editTarget.id, newField.name, newField.context || null, newField.color || null);
                    }
                }

                for (const oldField of oldFields) {
                    if (!processedOldFieldIds.has(oldField.id)) {
                        await deleteField(oldField.id);
                    }
                }
            }
        }

        await loadItems();
    };

    // Delete selected items after confirmation
    const confirmDelete = async () => {
        try {
            if (modals.deleteTarget?.items) {
                for (const item of modals.deleteTarget.items) {
                    if (item.type === "Category") await deleteFolder(item.id);
                    else await deleteCard(item.id);
                }
            }

            await loadItems();
            modals.closeDeleteModal();
            clearSelection();
        } catch (error) {
            console.error("Failed to delete folder items:", error);
            modals.openInfoModal({ type: t("errorTitles.error"), message: t("errorMessages.actionFailed") });
        }
    };

    // Edit handler
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, modals.setEditTarget, modals.openCreateModal, t, setCreateType, setFields);
        if (result.length > 0) modals.openInfoModal(result);
    };

    // Change colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) {
            if (item.type === "Category") await updateFolder(item.id, item.name, color);
            else await updateCard(item.id, item.name, color);
        }

        await loadItems();
        clearSelection();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={items.length}
                onSort={handleSort}
                items={items}
                setItems={setItems}
                onCancelSelection={clearSelection}
                onSelectAll={() => selectAll(items)}
                customSortMode={customSort.customSortMode}
                onEnterCustomSort={customSort.enterCustomSort}
                onSaveCustomSort={customSort.handleSaveCustomOrder}
                onCancelCustomSort={customSort.handleCancelCustomOrder}
            />

            <BreadCrumb
                path={path}
                onNavigate={async (node) => {
                    const targetIndex = path.findIndex(p => p.id === node.id);
                    if (targetIndex === 0) { navigation.navigate("Home"); return; }
                    const targetFolder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [node.id]);
                    navigation.setParams({ folder: targetFolder, path: path.slice(0, targetIndex + 1) });
                }}
            />

            {/* Category Title */}
            <View style={[styles.underShadow, styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.bigText, { color: colors.textPrimary, marginBottom: 3  }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>{folder.name}</Text>

                {/* Date display pinned bottom-right */}
                <View style={{ position: "absolute", right: 10, bottom: 4 }}>
                    {folderDate && (
                        <DateDisplay date={folderDate} icon={sortMode === "creationDate" ? "plus-circle" : "pencil"} />
                    )}
                </View>
            </View>

            {/* Items */}
            {isLoading ? (
                <ListLoadingIndicator />
            ) : items.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary }]}>
                        {t("screenMessages.items")}
                    </Text>
                </View>
            ) : customSort.customSortMode ? (
                // Separate drag lists keep cards physically below folders
                <NestableScrollContainer style={{ flex: 1, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 15 }}>
                    <NestableDraggableFlatList
                        data={folderItems}
                        keyExtractor={(item, index) => item.id ? `Category-${item.id}` : `folder-${index}`}
                        onDragEnd={(params) => customSort.handleGroupDragEnd("Category", params)}
                        activationDistance={8}
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                        renderItem={({ item, index, drag, isActive }) => (
                            <ScaleDecorator activeScale={1.03}>
                                <DraggableListButton
                                    item={item}
                                    index={index}
                                    totalItems={folderItems.length}
                                    drag={drag}
                                    isActive={isActive}
                                    canMoveUp={customSort.canMoveItem(item, -1)}
                                    canMoveDown={customSort.canMoveItem(item, 1)}
                                    onMoveUp={() => customSort.moveItem(item, -1)}
                                    onMoveDown={() => customSort.moveItem(item, 1)}
                                />
                            </ScaleDecorator>
                        )}
                    />
                    <NestableDraggableFlatList
                        data={cardItems}
                        keyExtractor={(item, index) => item.id ? `Card-${item.id}` : `card-${index}`}
                        onDragEnd={(params) => customSort.handleGroupDragEnd("Card", params)}
                        activationDistance={8}
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                        renderItem={({ item, index, drag, isActive }) => (
                            <ScaleDecorator activeScale={1.03}>
                                <DraggableListButton
                                    item={item}
                                    index={index}
                                    totalItems={cardItems.length}
                                    drag={drag}
                                    isActive={isActive}
                                    canMoveUp={customSort.canMoveItem(item, -1)}
                                    canMoveDown={customSort.canMoveItem(item, 1)}
                                    onMoveUp={() => customSort.moveItem(item, -1)}
                                    onMoveDown={() => customSort.moveItem(item, 1)}
                                />
                            </ScaleDecorator>
                        )}
                    />
                </NestableScrollContainer>
            ) : (
                // Normal mode - regular list
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                    style={{ marginTop: 8, paddingBottom: 15 }}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            updatedAt={item.updated_at}
                            createdAt={item.created_at}
                            color={item.color}
                            icon={item.type === "Category" ? "folder" : "file-text-o"}
                            isSelected={isSelected(item)}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, item.type)}
                            onPress={() => {
                                if (secondarySelect) {
                                    toggleSelection(item);
                                } else {
                                    if (item.type === "Category") navigation.setParams({folder: item, path: [...path, { id: item.id, name: item.name, type: item.type, created_at: item.created_at, updated_at: item.updated_at }]});
                                    else                          navigation.navigate("CardDetail", {card: item, path: [...path, { id: item.id, name: item.name, type: item.type }]});
                                    
                                }
                            }}
                        />
                    )}
                />
            )}

            {/* Create Buttons */}
            {!customSort.customSortMode && (
                <View style={[styles.buttonContainer, { bottom: footerHeight + 10, paddingBottom: 15 }]}>
                    {selectedItems.length === 1 && selectedItems[0].type === "Category" ? (
                        <CircleButton icon="pencil" disabled={hasSelectedSystemItem} onPress={() => handleEditSelectedWrapper()} />
                    ) : (
                        <CircleButton icon="folder" disabled={isSystemContainer} onPress={() => { setCreateType("Category"); modals.openCreateModal(); }} />
                    )}

                    {selectedItems.length === 1 && selectedItems[0].type === "Card" ? (
                        <CircleButton icon="pencil" disabled={hasSelectedSystemItem} onPress={() => handleEditSelectedWrapper()} />
                    ) : (
                        <CircleButton icon="file" disabled={isSystemContainer} onPress={() => { setCreateType("Card"); modals.openCreateModal(); }} />
                    )}
                </View>
            )}

            {/* Empty Spacing */}
            <View style={{ backgroundColor: colors.bgPrimary, height: 15 }} />

            {/* Footer */}
            {!customSort.customSortMode && (
                <FooterBar
                    selectedItems={selectedItems}
                    clipboard={clipboard}
                    clipboardMode={clipboardMode}
                    clearSelection={clearSelection}
                    openDeleteModal={modals.openDeleteModal}
                    openColorModal={modals.openColorModal}
                    openInfoModal={modals.openInfoModal}
                    cut={cut}
                    copy={copy}
                    clearClipboard={clearClipboard}
                    reloadItems={loadItems}
                    parent={folder}
                    itemLabel="items"
                    navigation={navigation}
                    onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                />
            )}

            {/* Create/Edit Modal */}
            <CreateModal
                visible={modals.modalVisible}
                onCreate={handleItem}
                title={modals.editTarget ? t("titles.editItem", {item: t(`itemType.${createType}`)}) : t("titles.createItem", {item: t(`itemType.${createType}`)})}
                placeholder={t("placeholders.itemName", {item: t(`itemType.${createType}`)})}
                value={modals.editTarget ? modals.editTarget.name : ""}
                color={modals.editTarget ? modals.editTarget.color : null}
                mode={modals.editTarget ? "edit" : "create"}
                isCard={createType === "Card"}
                fields={fields}
                parentId={folder.id}
                editTarget={modals.editTarget}
                onClose={() => {setFields([]); modals.closeCreateModal(); clearSelection()}}
            />

            {/* Color Picker Modal */}
            <ColorModal
                visible={modals.colorModalVisible}
                onCancel={modals.closeColorModal}
                onConfirm={applyColorToSelected}
                selectedColor={getSharedItemColor(selectedItems)}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={modals.confirmVisible}
                onCancel={modals.closeDeleteModal}
                onConfirm={confirmDelete}
                title={t("titles.confirmDelete")}
                message={modals.deleteTarget?.message || ""}
                confirmText={t("buttons.delete")}
                confirmColor={colors.danger}
            />

            {/* Information Modal For Errors */}
            <InformationModal
                visible={modals.infoVisible}
                onClose={modals.closeInfoModal}
                title={modals.errorMessages[0]?.type}
                message={modals.errorMessages[0]?.message}
            />

        </View>
    );
}
