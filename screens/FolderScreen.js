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
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database queries
import { getFolders, getCards, addFolder, addCard, updateFolder, updateCard, deleteFolder, deleteCard, addField, getFields, deleteField } from "../database/queries.js";

// FolderScreen: Displays contents of a folder (subfolders and cards). Create or edit them. 
export default function FolderScreen({ route, navigation }) {
    const { folder } = route.params;                                    // Folder is the parent folder of the contents we see here
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

    const [footerHeight, setFooterHeight] = useState(60);               // These are used to adjust placing of elements based on header/footer size
    const [headerHeight, setHeaderHeight] = useState(50);

    // Handle selection and clipboard using custom hooks/context
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();

    // Call loadItems when we are in this screen
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadItems()});
        return unsubscribe;
    }, [navigation]);

    // Load all subfolders and cards inside this folder from the database
    const loadItems = async () => {
        const folders = await getFolders(folder.id);
        const cards = await getCards(folder.id);

        // First folders, then cards
        setItems([
            ...folders.map((f) => ({ ...f, type: "Category"})),
            ...cards.map((c) => ({ ...c, type: "Card"})),
        ]);
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
                const oldFields =                await getFields(editTarget.id);
                for (const of of oldFields)      await deleteField(of.id);
                for (const f of itemData.fields) await addField(editTarget.id, f.name, f.context);
            }
        }

        // After creating/editing, reset states and reload items
        setFields([]);
        setEditTarget(null);
        clearSelection();
        setModalVisible(false);
        await loadItems();
    };

    // Delete selected subjects (and everything inside them) after confirmation
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
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for subjects
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
            if (item.type === "Subject" || item.type === "Category") await updateFolder(item.id, item.name, color);
            else                                                     await updateCard(item.id, item.name, color);
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
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={items.length}
                onSort={handleSort}
                items={items}
                setItems={setItems}
                onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(items)}
            />
        
            {/* Category Title */}
            <View style={[ styles.headerAndFooter, styles.titleArea, { top: headerHeight, backgroundColor: colors.bgSecondary }]}>
                
                {/* Folder name centered */}
                <Text style={[styles.title, { color: colors.textPrimary, textAlign: "center" }]}>
                    {folder.name}
                </Text>

                {/* Created At pinned bottom-right */}
                <Text style={[ styles.tinyText, {color: colors.textHalfOpacity, position: "absolute", right: 10, bottom: 5 }]}>
                    Created At: {new Date(folder.created_at).toLocaleDateString("en-GB")}
                </Text>
                
            </View>

            {/* Items */}
            {items.length === 0 ? (
                <View style={[styles.container, styles.centered, {marginTop: -(headerHeight + 20)}]}>
                    <Text style={[styles.midText, { color: colors.textSecondary }]}>
                        No Items Yet. You Can Create Cards or Folders to Organize Your Learning!
                    </Text>
                </View>
            ) : (

                <FlatList
                    data={items}
                    keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                    style={{ marginTop: headerHeight + 60 }}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            updatedAt={item.updated_at}
                            color={item.color}
                            icon={item.type === "Category" ? "folder" : "file-text-o"}
                            isSelected={isSelected(item)}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, item.type)}
                            onPress={() => {

                                // Toggle selection if in secondary select mode
                                // Navigate to Folder or CardDetail screen on press
                                if (secondarySelect) toggleSelection(item);                         
                                else {
                                    if (item.type === "Category") navigation.push("Folder", { folder: item }); 
                                    else                          navigation.navigate("CardDetail", { card: item }); 
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
                    setModalVisible(false);
                    setEditTarget(null);
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