import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, BackHandler } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";

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
import BreadCrumb from "../components/Navigation/BreadCrumb.js"
import DateDisplay from "../components/Blocks/DateDisplay.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Context and Hooks
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { useSortMode } from "../context/SortModeContext.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database Queries and Storage
import db from "../database/db.js";
import { getFolders, getCards, addFolder, addCard, updateFolder, updateCard, deleteFolder, deleteCard, addField, updateField, getFields, deleteField } from "../database/queries.js";

// FolderScreen: Displays contents of a folder (subfolders and cards). Create or edit them. 
export default function FolderScreen({ route, navigation }) {
    const { folder, path } = route.params;                              // Folder is the parent folder of the contents we see here
    const [items, setItems] = useState([]);                             // Items are the subfolders and cards inside this folder
    const [editTarget, setEditTarget] = useState(null);                 // The item being edited (null if creating new)
    const [deleteTarget, setDeleteTarget] = useState(null);             // The item(s) being deleted
    const [errorMessages, setErrorMessages] = useState([]);             // Error messages to display
    const [modalVisible, setModalVisible] = useState(false);            // Show or Hide modal for creating/editing items
    const [confirmVisible, setConfirmVisible] = useState(false);        // Show or Hide confirmation modal for deletions
    const [infoVisible, setInfoVisible] = useState(false);              // Show or Hide information modal for alerts
    const [colorModalVisible, setColorModalVisible] = useState(false);  // Show or Hide color modal for alerts
    const [createType, setCreateType] = useState(null);                 // Whether we are creating/editing a card or folder
    const [fields, setFields] = useState([]);                           // The fields of the card being created/edited
    const [selectedColor, setSelectedColor] = useState(null);           // The color we want when we are editing colors
    const [folderDate, setFolderDate] = useState(null);                 // Parent folder's creation/last edit date
    const [customSortMode, setCustomSortMode] = useState(false);        // If we are in custom sort mode or not

    const [footerHeight, setFooterHeight] = useState(60);               // These are used to adjust placing of elements based on footer size

    // Handle selection and clipboard using custom hooks/context
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();
    const { sortMode } = useSortMode(); 

    // When go back arrow on the phone is clicked, prevent going back to HomeScreen and go to the parent
    useFocusEffect(
        React.useCallback(() => {
            let isScreenFocused = true;
            const onBackPress = () => {
                if (!isScreenFocused) return false;

                // Go back to parent folder instead of root
                if (path.length > 2) {
                    const parent = path[path.length - 2]; 
                    navigation.setParams({folder: parent, path: path.slice(0, path.length - 1)});
                    return true; // Prevent default back action
                }

                return false; // Allow default (exit to Home)

            };

            const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);  // Subscribe
            return () => {
                isScreenFocused = false;
                subscription.remove();
            };                                    
        }, [path, navigation])
    );

    // Reload items when folder or path changes
    useEffect(() => {
        loadItems();
    }, [folder.id]); // Re-run when folder.id changes

    // Also reload on focus (when coming back from other screens)
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            // Always derive the current folder from route.params
            const currentFolder = route.params?.folder;
            if (currentFolder) {
                loadItems(currentFolder.id);
            }
        });

        return unsubscribe;
    }, [navigation, route.params, sortMode]);

    // Load all subfolders and cards inside this folder from the database
    const loadItems = async (folderId = folder.id) => {
        const folders = await getFolders(folderId);
        const cards = await getCards(folderId);
        const result = [...folders, ...cards];
        handleSort(result, setItems, sortMode);
        const currentFolder = route.params?.folder || folder;
        if (sortMode === "Order by creation date") setFolderDate(currentFolder.created_at);
        else setFolderDate(currentFolder.updated_at);
    };

    // Handle Create or Edit for both cards and folders
    const handleItem = async (itemData, mode) => {

        // Default mode is create, if editTarget is set (pressing edit button sets it) then we are editing instead
        if (mode === "create") {
            if (itemData.type === "Category") {
                await addFolder(folder.id, itemData.name, itemData.color);
            } else if (itemData.type === "Card") {
                const cardId =                   await addCard(folder.id, itemData.name, itemData.color);
                for (const f of itemData.fields) await addField(cardId, f.name, f.context);
            }
        } else if (mode === "edit" && editTarget) {
            if (editTarget.type === "Category") {
                await updateFolder(editTarget.id, itemData.name, itemData.color);
            } else {
                // Update card name, delete old fields and add new fields
                await updateCard(editTarget.id, itemData.name, itemData.color);

                // Smart field sync: update, add, or delete as needed
                const oldFields = await getFields(editTarget.id);
                const newFields = itemData.fields || [];
                
                // Track which old fields are still present
                const processedOldFieldIds = new Set();
                
                // Process each new field
                for (const newField of newFields) {
                    if (newField.id) {

                        // Existing field - check if it changed
                        processedOldFieldIds.add(newField.id);
                        const oldField = oldFields.find(f => f.id === newField.id);
                        
                        if (oldField) {

                            // Check if anything actually changed
                            const nameChanged = oldField.name !== newField.name;
                            const contextChanged = (oldField.context || '') !== (newField.context || '');
                            const colorChanged = (oldField.color || null) !== (newField.color || null);
                            
                            // Update only if something changed
                            if (nameChanged || contextChanged || colorChanged) {
                                await updateField(newField.id, newField.name, newField.context || null, newField.color || null);
                            }
                        }
                    } else {

                        // New field (no id) - create it
                        await addField(editTarget.id, newField.name, newField.context || null, newField.color || null);
                    }
                }
                
                // Delete fields that were removed (exist in old but not in new)
                for (const oldField of oldFields) {
                    if (!processedOldFieldIds.has(oldField.id)) {
                        // Field was removed - soft delete it
                        await deleteField(oldField.id);
                    }
                }
            }
        }

        // After creating/editing, reset states and reload items
        setFields([]);
        setEditTarget(null);
        clearSelection();
        setModalVisible(false);
        await loadItems();
    };

    // Delete selected items (and everything inside them) after confirmation
    const confirmDelete = async () => {
        if (deleteTarget?.items) {
            for (const item of deleteTarget.items) {
                if (item.type === "Category") await deleteFolder(item.id);
                else                          await deleteCard(item.id);
            }
        }

        // After deletion, reset states
        setDeleteTarget(null);
        clearSelection();
        setConfirmVisible(false);
        await loadItems();
    };

    // Footer action handlers for delete, edit, cut, copy, paste
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for items
    const handleDeleteSelectedWrapper = () => handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, "items");
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = async () => {
        const result = await handlePaste(clipboard, clipboardMode, folder, clearClipboard, loadItems);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    };
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, setEditTarget, setModalVisible, setCreateType, setFields);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    }  

    // Change the colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) {
            if (item.type === "Category") await updateFolder(item.id, item.name, color);
            else                          await updateCard(item.id, item.name, color);
        }

        await loadItems(); 
        clearSelection();
    };

    // Call the right handler based on action from FooterBar
    const handleAction = (action) => {
        switch (action) {
            case "delete": handleDeleteSelectedWrapper(); break;
            case "cut": handleCutSelectedWrapper(); break;
            case "copy": handleCopySelectedWrapper(); break;
            case "paste": handlePasteWrapper(); break;
            case "clearClipboard": clearClipboard(); break;
            case "color": if (selectedItems.length === 0) return; setColorModalVisible(true); break;
            case "settings": navigation.navigate("Settings"); break;
            case "search": navigation.navigate("Search"); break;
            case "deleted": navigation.navigate("Deleted"); break;
            default: break;
        }
    };

    // Show error messages
    const handleCloseInfo = () => {
        const remaining = [...errorMessages];
        remaining.shift();
        setErrorMessages(remaining);
        if (remaining.length === 0) setInfoVisible(false);
    };

// ********************** CUSTOM SORT *************************** //
    // 3. Add move functions (same as SettingsScreen):
const moveItem = (direction) => {
    setItems((prev) => {
        const currentItems = [...prev];
        // Find the index of the item to move
        const targetIndex = currentIndex + direction;

        if (targetIndex < 0 || targetIndex >= currentItems.length) return prev;

        // Swap elements
        [currentItems[currentIndex], currentItems[targetIndex]] = 
        [currentItems[targetIndex], currentItems[currentIndex]];
        
        return currentItems;
    });
};

// 4. Add drag end handler:
const handleDragEnd = useCallback(({ data }) => {
    setItems(data);
}, []);

// 5. Add save/cancel handlers:
const handleSaveCustomOrder = async () => {
    try {
        // Save sort_index to database
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const newIndex = i * 100;
            
            // All items in HomeScreen are folders (type: "Category")
            if (item.type === "Category") {
                await db.runAsync(
                    "UPDATE folders SET sort_index = ? WHERE id = ?",
                    [newIndex, item.id]
                );
            } else if (item.type === "Card") {
                await db.runAsync(
                    "UPDATE cards SET sort_index = ? WHERE id = ?",
                    [newIndex, item.id]
                );
            }
        }
        
        setCustomSortMode(false);
        await loadItems(); // Reload with new order
    } catch (error) {
        console.error("Error saving custom order:", error);
        setErrorMessages([{
            type: "Save Failed",
            message: "Failed to save custom order. Please try again."
        }]);
        setInfoVisible(true);
    }
};

const handleCancelCustomOrder = () => {
    setCustomSortMode(false);
    loadItems(); // Reset to saved order
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
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(items)}
                customSortMode={customSortMode}
                onEnterCustomSort={() => setCustomSortMode(true)}
                onSaveCustomSort={handleSaveCustomOrder}
                onCancelCustomSort={handleCancelCustomOrder}
            />

            <BreadCrumb
                path={path}
                onNavigate={async (node) => {
                    const targetIndex = path.findIndex(p => p.id === node.id);
                    if (targetIndex === 0) {navigation.navigate("Home"); return;}                                 // If clicking the root folder (index 0), go to Home
                    const targetFolder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [node.id]); // Get the folder data
                    navigation.setParams({folder: targetFolder, path: path.slice(0, targetIndex + 1)});           // Update the current screen's params
                }}
            />
        
            {/* Category Title */}
            <View style={[styles.paddingHorizontal, styles.paddingVertical, {backgroundColor: colors.bgSecondary}]}>
                
                {/* Folder name centered */}
                <Text style={[styles.bigText, { color: colors.textPrimary }]}>{folder.name}</Text>

                {/* Date display pinned bottom-right */}
                <View style={{ position: "absolute", right: 10, bottom: 5 }}>
                    {folderDate && (
                        <DateDisplay date={folderDate} icon={sortMode === "Order by creation date" ? "plus-circle" : "pencil"}/>
                    )}
                </View>  
            </View>

            {/* Items */}
            {items.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textSecondary}]}>
                        No Items Yet.{"\n"}
                        Create Cards to Store Information{"\n"}
                        or Folders to Organize Your Learning!
                    </Text>
                </View>
            ) : customSortMode ? (
                // Custom sort mode - draggable list
                <DraggableFlatList
                    data={items}
                    keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                    onDragEnd={handleDragEnd}
                    activationDistance={8}
                    style={{ marginTop: 8 }}
                    renderItem={({ item, index, drag, isActive }) => (
                        <ScaleDecorator activeScale={1.03}>
                            <DraggableListButton
                                item={item}
                                index={index}
                                totalItems={items.length}
                                drag={drag}
                                isActive={isActive}
                                onMoveUp={() => {
                                    const newItems = [...items];
                                    if (index > 0) {
                                        [newItems[index], newItems[index - 1]] = 
                                        [newItems[index - 1], newItems[index]];
                                        setItems(newItems);
                                    }
                                }}
                                onMoveDown={() => {
                                    const newItems = [...items];
                                    if (index < items.length - 1) {
                                        [newItems[index], newItems[index + 1]] = 
                                        [newItems[index + 1], newItems[index]];
                                        setItems(newItems);
                                    }
                                }}
                            />
                        </ScaleDecorator>
                    )}
                />
            ) : (
                // Normal mode - regular list
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                    style={{ marginTop: 8 }}
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
                                if (secondarySelect) toggleSelection(item);  
                                else {
                                    if (item.type === "Category") {
                                        navigation.setParams({
                                            folder: item,
                                            path: [...path, { id: item.id, name: item.name, type: item.type, created_at: item.created_at, updated_at: item.updated_at }]
                                        });
                                    } else {
                                        navigation.navigate("CardDetail", {
                                            card: item,
                                            path: [...path, { id: item.id, name: item.name, type: item.type }],
                                        });
                                    }
                                }  
                            }}
                        />
                    )}
                />
            )}

            {/* Create Buttons */}
            <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
                {selectedItems.length === 1 && selectedItems[0].type === "Category" ? (
                    <CircleButton icon="pencil" onPress={() => handleEditSelectedWrapper()}/>
                ) : (
                    <CircleButton icon="folder" onPress={() => { setCreateType("Category"); setModalVisible(true)}}/>
                )}

                {selectedItems.length === 1 && selectedItems[0].type === "Card" ? (
                    <CircleButton icon="pencil" onPress={() => handleEditSelectedWrapper()}/>
                ) : (
                    <CircleButton icon="file" onPress={() => {setCreateType("Card"); setModalVisible(true)}}/>
                )}

            </View>

            {/* Empty Spacing */}
            <View style={{backgroundColor: colors.bgPrimary, height: 15}}></View>

            {/* Footer */}
            <FooterBar
                selectedCount={selectedItems.length}
                hasClipboard={clipboard.length > 0}
                onAction={handleAction}
                onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
            />

            <CreateModal
                visible={modalVisible}
                onCreate={handleItem}
                title={editTarget ? `Edit ${createType}` : `Create ${createType}`}
                placeholder={`Enter ${createType} Name`}
                value={editTarget ? editTarget.name : ""}
                color={editTarget ? editTarget.color : null}
                mode={editTarget ? "edit" : "create"}
                isCard={createType === "Card"}
                fields={fields}
                parentId={folder.id}
                editTarget={editTarget}
                onClose={() => {
                    setFields([]);
                    setEditTarget(null);
                    clearSelection();
                    setModalVisible(false);
                }}
            />

            {/* Color Picker Modal For Changing Color of Items */}
            <ColorModal
                visible={colorModalVisible}
                onClose={() => {applyColorToSelected(selectedColor); setColorModalVisible(false)}}
                onSelect={(c) => setSelectedColor(c)}
                selectedColor={selectedColor}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message={deleteTarget?.message || ""}
                confirmText="Delete"
                confirmColor={colors.danger}
            />

            {/* Information Modal For Errors */}
            <InformationModal
                visible={infoVisible}
                onClose={handleCloseInfo}
                title={errorMessages[0]?.type}
                message={errorMessages[0]?.message}
            />

        </View>
    );
}