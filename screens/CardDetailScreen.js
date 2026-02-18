import { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";

// Components
import CircleButton from "../components/CircleButton.js";
import ListField from "../components/ListField.js";
import CreateModal from "../components/CreateModal.js";
import ColorModal from "../components/ColorModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import InformationModal from "../components/InformationModal.js";
import BreadCrumb from "../components/BreadCrumb.js"
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

// Database Queries and Storage
import { getFields, addField, updateField, deleteField } from "../database/queries.js";
import { loadSortMode } from "../storage/sortPreference.js";

// CardDetailScreen: Displays contents of a card (fields). Create or edit them. 
export default function CardDetailScreen({ route, navigation }) {
    const { card, path } = route.params;                                // Card is the parent card of the fields we see here
    const [fields, setFields] = useState([]);                           // Fields are the fields inside this card
    const [fieldContext, setFieldContext] = useState("");               // Context of the field being edited
    const [editTarget, setEditTarget] = useState(null);                 // Edited Field
    const [deleteTarget, setDeleteTarget] = useState(null);             // The field(s) being deleted. 
    const [errorMessages, setErrorMessages] = useState([]);             // Error messages to display
    const [modalVisible, setModalVisible] = useState(false);            // Show or Hide modal for creating/editing fields
    const [confirmVisible, setConfirmVisible] = useState(false);        // Show or Hide confirmation modal for deletions
    const [infoVisible, setInfoVisible] = useState(false);              // Show or Hide information modal for alerts
    const [colorModalVisible, setColorModalVisible] = useState(false);  // Show or Hide color modal for alerts
    const [expanded, setExpanded] = useState({});                       // Which fields are expanded to show their context
    const [selectedColor, setSelectedColor] = useState(null);           // The color we want when we are editing colors

    const [footerHeight, setFooterHeight] = useState(60);               // These are used to adjust placing of elements based on header/footer size
    const [headerHeight, setHeaderHeight] = useState(50);

    // Handle selection and clipboard using custom hooks/context
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();

    // Load all fields inside this card when we are in this screen
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadFields()});
        return unsubscribe;
    }, [navigation]);

    // Load all fields inside this card from the database
    const loadFields = async () => {
        const result = await getFields(card.id);
        const lastMode = await loadSortMode();
        handleSort(result, setFields, lastMode);
    };

    // Handle creating or editing a card
    const handleField = async (editedField, mode) => {

        // Add or Update Field
        if (mode === "create") await addField(card.id, editedField.name, editedField.context, editedField.color)
        else                   await updateField(editTarget?.id, editedField.name, editedField.context, editedField.color);

        // Reset modal and reload fields
        setFieldContext("");
        setEditTarget(null);
        clearSelection();
        setModalVisible(false);
        await loadFields();
    };

    // Delete selected field(s) after confirmation
    const confirmDelete = async () => {
        if (deleteTarget?.items) {
            for (const item of deleteTarget.items) if (item.id) await deleteField(item.id);
            await loadFields();
        }

        // After deletion, reset states
        clearSelection();
        setDeleteTarget(null);
        setConfirmVisible(false);
    };

    // Toggle expand/collapse of field to show/hide context
    const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    // Footer action handlers for delete, edit, cut, copy, paste
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for subjects
    const handleDeleteSelectedWrapper = () => handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, "fields");
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = async () => {
        const result = await handlePaste(clipboard, clipboardMode, card, clearClipboard, loadFields);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    };
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, setEditTarget, setModalVisible, null, null, setFieldContext);
        if (result.length > 0) {
            setErrorMessages(result);
            setInfoVisible(true);
        }
    }  

    // Change the colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) await updateField(item.id, item.name, item.context, color);
        await loadFields();
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
                totalCount={fields.length}
                onSort={handleSort}
                items={fields}
                setItems={setFields}
                onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(fields)}
            />

            <BreadCrumb
                path={path}
                onNavigate={(node) => {
                    const targetIndex = path.findIndex(p => p.id === node.id);   // Find the index of where we want to go
                    const currentIndex = path.length - 1;                        // Where we are right now
                    if (targetIndex === 0) {navigation.navigate("Home"); return} // If clicking the root folder (index 0), go to Home
                    const stepsBack = currentIndex - targetIndex;                // How many steps we have to go back
                    if (stepsBack > 0) navigation.pop(stepsBack)                 // Removes x screens from the stack
                }}
            />

            {/* Card Title */}
            <View style={[styles.paddingHorizontal, styles.paddingVertical, {backgroundColor: colors.bgSecondary}]}>
                
                {/* Folder name centered */}
                <Text style={[styles.bigText, { color: colors.textPrimary }]}>
                    {card.name}
                </Text>

                {/* Created At pinned bottom-right */}
                <Text style={[ styles.tinyText, {color: colors.textHalfOpacity, position: "absolute", right: 10, bottom: 5 }]}>
                    Created At: {new Date(card.created_at).toLocaleDateString("en-GB")}
                </Text>
                
            </View>

            {/* Fields */}
            {fields.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textSecondary}]}>
                        No fields yet. Tap the plus button to add context!
                    </Text>
                </View>
            ) : (

                <FlatList
                    data={fields}
                    keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                    style={{ marginTop: 8 }}
                    renderItem={({ item }) => (
                        <ListField
                            label={item.name}
                            updatedAt={item.updated_at}
                            context={item.context}
                            color={item.color}
                            isSelected={isSelected(item)}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, "Field")}
                            expanded={expanded[item.id]}
                            onPress={() => {

                                // Toggle selection if in secondary select mode
                                // Toggle Context expand/collapse on press
                                if (secondarySelect) toggleSelection(item);
                                else toggleExpand(item.id);

                            }}
                            
                        />
                    )}
                />
            )}

            {/* Edit Button */}
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

            {/* Modal for editing card title + fields */}
            <CreateModal
                visible={modalVisible}
                onCreate={handleField}
                title={editTarget ? "Edit Field" : "Create Field"}
                placeholder="Field Title"
                value={editTarget ? editTarget.name : ""}
                color={editTarget ? editTarget.color : null}
                mode={editTarget ? "edit" : "create"}
                isField={true}
                context={fieldContext}
                parentId={card.id}
                editTarget={editTarget}
                onClose={() => {
                    setModalVisible(false);
                    clearSelection();
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