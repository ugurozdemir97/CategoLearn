import { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";

// Components
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import InformationModal from "../components/InformationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Context and Hooks
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database queries
import { addFolder, getFolders, updateFolder, deleteFolder } from "../database/queries.js";

// HomeScreen: Displays all root folders (Subjects). Create or edit them.
export default function HomeScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);                   // All the subjects (root folders) we have
    const [newSubjectName, setNewSubjectName] = useState("");       // Name of the subject being created/edited
    const [editTarget, setEditTarget] = useState(null);             // The subject being edited (null if creating new)
    const [deleteTarget, setDeleteTarget] = useState(null);         // The subject(s) being deleted
    const [errorMessages, setErrorMessages] = useState([]);         // Error messages to display
    const [modalVisible, setModalVisible] = useState(false);        // Show or Hide modal for creating/editing subjects
    const [confirmVisible, setConfirmVisible] = useState(false);    // Show or Hide confirmation modal for deletions
    const [infoVisible, setInfoVisible] = useState(false);          // Show or Hide information modal for alerts

    const [footerHeight, setFooterHeight] = useState(70);           // These are used to adjust placing of elements based on header/footer size
    const [headerHeight, setHeaderHeight] = useState(50);

    // Handle selection and clipboard using custom hooks/context
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();

    // Call loadSubjects when we are in this screen
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadSubjects()});
        return unsubscribe;
    }, [navigation]);

    // Load all root folders (subjects) from the database
    const loadSubjects = async () => {
        const result = await getFolders(null); // already fetches parent_id IS NULL
        setSubjects(
            result.map((f) => ({ ...f, type: "Subject", name: f.name }))     // Bring only root folders, add type for sorting
        );
    };

    // Handle Create or Edit
    const handleSubject = async (folderData, mode) => {

        // Default mode is create, if editTarget is set (pressing edit button sets it) then we are editing instead
        if (mode === "create") {
            await addFolder(null, folderData.name, null, 1);
        } else if (mode === "edit" && editTarget) {
            await updateFolder(editTarget.id, folderData.name, editTarget.color);
        }

        // After creating/editing, reset states and reload subjects
        setNewSubjectName("");
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
        const result = await handleEditSelected(selectedItems, setEditTarget, setModalVisible, setNewSubjectName);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    }  


    // Call the right handler based on action from FooterBar
    const handleAction = (action) => {
        switch (action) {
            case "delete": handleDeleteSelectedWrapper(); break;
            case "cut": handleCutSelectedWrapper(); break;
            case "copy": handleCopySelectedWrapper(); break;
            case "paste": handlePasteWrapper(); break;
            case "clearClipboard": clearClipboard(); break;
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
                onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(subjects)}
            />

            {/* Subjects */}
            {subjects.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, {color: colors.textSecondary}]}>What Do You Want To Learn About?</Text>
                </View>
            ) : (
                <>
                    <Text style={[styles.title, styles.centeredText, { marginTop: headerHeight + 20, color: colors.textPrimary }]}>
                        Subjects
                    </Text>

                    <FlatList
                        data={subjects}
                        keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                        style={{ marginTop: 10 }}
                        renderItem={({ item }) => (
                            <ListButton
                                label={item.name}
                                icon="folder"
                                isSelected={isSelected(item)}
                                onLongPress={() => toggleSelection(item)}
                                status={getItemStatus(item.id, "Subject")}  // Is the item currently cut or copied
                                onPress={() => {

                                    // Toggle selection if in secondary select mode
                                    // Otherwise, navigate to Folder screen to see contents of the subject
                                    if (secondarySelect) toggleSelection(item);                         
                                    else navigation.navigate("Folder", { folder: item }); 

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
                value={newSubjectName}
                mode={editTarget ? "edit" : "create"}
                editTarget={editTarget}
                onClose={() => {
                    setModalVisible(false);
                    setEditTarget(null);
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