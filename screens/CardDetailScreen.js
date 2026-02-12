import { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";

// Components
import CircleButton from "../components/CircleButton.js";
import ListField from "../components/ListField.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Context and Hooks
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { validateWithAlert } from "../utils/validation.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database queries
import { getFields, addField, updateField, deleteField } from "../database/queries.js";

// CardDetailScreen: Displays contents of a card (fields). Create or edit them. 
export default function CardDetailScreen({ route, navigation }) {
    const { card } = route.params;                                // Card is the parent card of the fields we see here
    const [fields, setFields] = useState([]);                     // Fields are the fields inside this card
    const [fieldTitle, setFieldTitle] = useState("");             // Name of the field being edited
    const [fieldContext, setFieldContext] = useState("");         // Context of the field being edited
    const [editTarget, setEditTarget] = useState(null);           // Edited Field
    const [deleteTarget, setDeleteTarget] = useState(null);       // The field(s) being deleted. 
    const [modalVisible, setModalVisible] = useState(false);      // Show or Hide modal for creating/editing fields
    const [confirmVisible, setConfirmVisible] = useState(false);  // Show or Hide confirmation modal for deletions
    const [expanded, setExpanded] = useState({});                 // Which fields are expanded to show their context

    const [footerHeight, setFooterHeight] = useState(60);         // These are used to adjust placing of elements based on header/footer size
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
        setFields(result.map(f => ({ ...f, type: "Field" })));
    };

    // Handle creating or editing a card
    const handleField = async (editedField, mode) => {

        // I will change this later, I don't want alerts
        const trimmed = validateWithAlert(editedField.name, editedField.type);
        if (!trimmed) return;

        // Add or Update Field
        if (mode === "create") await addField(card.id, editedField.name, editedField.context)
        else                   await updateField(editTarget?.id, editedField.name, editedField.context);

        // Reset modal and reload fields
        setFieldTitle("");
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
    const handleEditSelectedWrapper = () =>   handleEditSelected(selectedItems, setEditTarget, setModalVisible, setFieldTitle, null, null, setFieldContext);
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = () =>          handlePaste(clipboard, clipboardMode, card, clearClipboard, loadFields);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

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

            {/* Card Title */}
            <Text style={[ styles.title, styles.centeredText, { marginTop: headerHeight + 20, color: colors.textPrimary }]}>
                {card.name}
            </Text>

            {/* Fields */}
            {fields.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[ styles.midText, styles.centeredText, { color: colors.textSecondary } ]}>
                        No fields yet. Tap the pencil to add context!
                    </Text>
                </View>
            ) : (

                <FlatList
                    data={fields}
                    keyExtractor={(item, index) =>item.id ? item.id.toString() : `temp-${index}`}
                    style={{ marginTop: 10 }}
                    renderItem={({ item }) => (
                        <ListField
                            label={item.name}
                            context={item.context}
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
                value={fieldTitle}
                mode={editTarget ? "edit" : "create"}
                isField={true}
                context={fieldContext}
                onClose={() => {
                    setModalVisible(false);
                    clearSelection();
                }}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmDelete}
                message={deleteTarget?.message || ""}
                confirmText="Delete"
                confirmColor={colors.danger}
            />
        </View>
    );
}