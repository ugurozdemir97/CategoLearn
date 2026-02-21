import { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";

// Components
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ColorModal from "../components/ColorModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import InformationModal from "../components/InformationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";

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
//import db from "../database/db.js";
import { addFolder, getFolders, updateFolder, deleteFolder } from "../database/queries.js";

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
        handleSort(result, setSubjects, sortMode);

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
                                    else navigation.navigate("Folder", {folder: item, path: [{ id: null, name: "Subjects", type: "Category" }, { id: item.id, name: item.name, type: item.type }]});
                                }}

                            />
                        )}
                    />
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