import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList } from "react-native";
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

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Context and Hooks
import { useSortMode } from "../context/SortModeContext.js";
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database Queries and Storage
import db from "../database/db.js";
import { addFolder, getFolders, updateFolder, deleteFolder } from "../database/queries.js";

// Storage
import { loadSortMode } from "../storage/sortPreference.js";

// HomeScreen: Displays all root folders (Subjects). Create or edit them.
export default function HomeScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);                       // All the subjects (root folders) we have
    const [editTarget, setEditTarget] = useState(null);                 // The subject being edited (null if creating new)
    const [deleteTarget, setDeleteTarget] = useState(null);             // The subject(s) being deleted
    const [errorMessages, setErrorMessages] = useState([]);             // Error messages to display
    const [modalVisible, setModalVisible] = useState(false);            // Show or Hide modal for creating/editing subjects
    const [confirmVisible, setConfirmVisible] = useState(false);        // Show or Hide confirmation modal for deletions
    const [infoVisible, setInfoVisible] = useState(false);              // Show or Hide information modal for alerts
    const [colorModalVisible, setColorModalVisible] = useState(false);  // Show or Hide color modal for alerts
    const [selectedColor, setSelectedColor] = useState(null);           // The color we want when we are editing colors
    const [customSortMode, setCustomSortMode] = useState(false);        // If we are in custom sort mode or not

    const [footerHeight, setFooterHeight] = useState(70);           // These are used to adjust placing of elements based on footer size

    // Handle selection and clipboard using custom hooks/context
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();
    const { sortMode } = useSortMode(); 

    // Call loadSubjects when we are in this screen
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadSubjects()});
        return unsubscribe;
    }, [navigation, sortMode]);

    // Load all root folders (subjects) from the database
    const loadSubjects = async () => {
        const result = await getFolders(null); // already fetches parent_id IS NULL
        const lastMode = await loadSortMode();
        handleSort(result, setSubjects, lastMode);

        //const folders = await db.getAllAsync("SELECT *, 'Category' as type FROM folders WHERE deleted_at IS NULL");
        //const cards =   await db.getAllAsync("SELECT *, 'Card' as type FROM cards WHERE deleted_at IS NULL");
        //const fields =  await db.getAllAsync("SELECT *, 'Field' as type FROM fields WHERE deleted_at IS NULL");
        //console.log(folders.length, cards.length, fields.length);
    };

    // Handle Create or Edit
    const handleSubject = async (folderData, mode) => {

        // Default mode is create, if editTarget is set (pressing edit button sets it) then we are editing instead
        if (mode === "create") {
            await addFolder(null, folderData.name, folderData.color);
        } else if (mode === "edit" && editTarget) {
            await updateFolder(editTarget.id, folderData.name, folderData.color);
        }

        // After creating/editing, reset states and reload subjects
        setEditTarget(null);
        clearSelection();
        setModalVisible(false);
        await loadSubjects();
    };

    // Delete selected subjects (and everything inside them) after confirmation
    const confirmDelete = async () => {
        if (deleteTarget?.items) {
            for (const item of deleteTarget.items) await deleteFolder(item.id);
        }

        // After deletion, reset states
        setDeleteTarget(null);
        clearSelection();
        setConfirmVisible(false);
        await loadSubjects();
    };

    // Footer action handlers for delete, edit, cut, copy, paste
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for subjects
    const handleDeleteSelectedWrapper = () => handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, "subjects");
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = async () => {
        const result = await handlePaste(clipboard, clipboardMode, null, clearClipboard, loadSubjects);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    };
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, setEditTarget, setModalVisible);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    }  

    // Change the colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) await updateFolder(item.id, item.name, color);
        await loadSubjects();
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
    setSubjects((prev) => {
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
    setSubjects(data);
}, []);

// 5. Add save/cancel handlers:
const handleSaveCustomOrder = async () => {
    try {
        // Save sort_index to database
        for (let i = 0; i < subjects.length; i++) {
            const item = subjects[i];
            const newIndex = i * 100;
            
            // All items in HomeScreen are folders (type: "Category")
            await db.runAsync(
                "UPDATE folders SET sort_index = ? WHERE id = ?",
                [newIndex, item.id]
            );
        }
        
        setCustomSortMode(false);
        await loadSubjects(); // Reload with new order
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
    loadSubjects(); // Reset to saved order
};

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary}]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={subjects.length}
                onSort={handleSort}
                items={subjects}
                setItems={setSubjects}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(subjects)}
                customSortMode={customSortMode}
                onEnterCustomSort={() => setCustomSortMode(true)}
                onSaveCustomSort={handleSaveCustomOrder}
                onCancelCustomSort={handleCancelCustomOrder}
            />

            {/* Subjects */}
            {subjects.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textSecondary}]}>
                        What Do You Want To Learn About?
                    </Text>
                </View>
            ) : (
                <>
                    <View style={[styles.paddingHorizontal, styles.paddingVertical, {backgroundColor: colors.bgSecondary}]}>
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary }]}>
                            Subjects
                        </Text>
                    </View>

                    {customSortMode ? (

                        // Custom sort mode - draggable list
                        <DraggableFlatList
                            data={subjects}
                            keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                            onDragEnd={handleDragEnd}
                            activationDistance={8}
                            style={{ marginTop: 8, paddingHorizontal: 15 }}
                            renderItem={({ item, index, drag, isActive }) => (
                                <ScaleDecorator activeScale={1.03}>
                                    <DraggableListButton
                                    item={item}
                                    index={index}
                                    totalItems={subjects.length}
                                    drag={drag}
                                    isActive={isActive}
                                    onMoveUp={() => {
                                        const newItems = [...subjects];
                                        if (index > 0) {
                                        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
                                        setSubjects(newItems);
                                        }
                                    }}
                                    onMoveDown={() => {
                                        const newItems = [...subjects];
                                        if (index < subjects.length - 1) {
                                        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                                        setSubjects(newItems);
                                        }
                                    }}
                                    />
                                </ScaleDecorator>
                            )}
                        />
                    ) : (
                        <FlatList
                            data={subjects}
                            keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                            style={{ marginTop: 8 }}
                            renderItem={({ item }) => (
                                <ListButton
                                    label={item.name}
                                    updatedAt={item.updated_at}
                                    createdAt={item.created_at} 
                                    color={item.color}
                                    icon="folder"
                                    isSelected={isSelected(item)}
                                    onLongPress={() => toggleSelection(item)}
                                    status={getItemStatus(item.id, "Category")}  // Is the item currently cut or copied
                                    onPress={() => {

                                        // Toggle selection if in secondary select mode
                                        // Otherwise, navigate to Folder screen to see contents of the subject
                                        if (secondarySelect) toggleSelection(item);                         
                                        else navigation.navigate("Folder", {folder: item, path: [{ id: null, name: "Subjects", type: "Category" }, { id: item.id, name: item.name, type: item.type, created_at: item.created_at, updated_at: item.updated_at }]});
                                    }}

                                />
                            )}
                        />
                    )}
                </>
            )}

            {/* Create Subjects Button */}
            <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
                <CircleButton 
                    icon={selectedItems.length === 1 ? "pencil" : "plus"}
                    onPress={() => {if (selectedItems.length === 1) handleEditSelectedWrapper(); else setModalVisible(true)}}
                />
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
                onCreate={handleSubject}
                title={editTarget ? "Edit Subject" : "Create Subject"}
                placeholder="Enter Subject Name"
                value={editTarget ? editTarget.name : ""}
                color={editTarget ? editTarget.color : null}
                mode={editTarget ? "edit" : "create"}
                editTarget={editTarget}
                onClose={() => {
                    setEditTarget(null);
                    clearSelection();
                    setModalVisible(false);
                }}
            />

            {/* Confirmation Modal for Deletion */}
            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message={deleteTarget?.message || ""}
                confirmText="Delete"
                confirmColor={colors.danger}
            />

            {/* Color Picker Modal For Changing Color of Items */}
            <ColorModal
                visible={colorModalVisible}
                onClose={() => {applyColorToSelected(selectedColor); setColorModalVisible(false)}}
                onSelect={(c) => setSelectedColor(c)}
                selectedColor={selectedColor}
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