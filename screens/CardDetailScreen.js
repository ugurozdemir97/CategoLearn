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
import { getFields, addField, updateField, deleteField, updateCard } from "../database/queries.js";

// CardDetailScreen: Displays contents of a card (fields). Create or edit them. 
export default function CardDetailScreen({ route, navigation }) {
    const { card } = route.params;                                // Card is the parent card of the fields we see here
    const [fields, setFields] = useState([]);                     // Fields are the fields inside this card
    const [cardTitle, setCardTitle] = useState(card.name);        // Name of the card being edited
    const [editTarget, setEditTarget] = useState(null);           // Edited card and its fields
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
    const handleCard = async (editedCard) => {

        // I will change this later, I don't want alerts
        const trimmed = validateWithAlert(editedCard.name, editedCard.type);
        if (!trimmed) return;

        // Update card title
        await updateCard(card.id, editedCard.name);
        setCardTitle(editedCard.name);

        // Find deleted fields by comparing old vs new
        const oldFieldIds = fields.map((f) => f.id);                               // IDs of fields before editing
        const newFieldIds = editedCard.fields.map((f) => f.id).filter(Boolean);    // IDs of fields after editing
        const deletedIds = oldFieldIds.filter((id) => !newFieldIds.includes(id));  // These are the fields that were deleted in the edit
        for (const id of deletedIds) await deleteField(id);                        // Delete fields that were removed in the edit

        // Update or add fields
        for (const f of editedCard.fields) {
            if (f.id) await updateField(f.id, f.name, f.context);
            else      await addField(card.id, f.name, f.context);
        }

        // Reset modal and reload fields
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
    const handleEditSelectedWrapper = () =>   handleEditSelected(selectedItems, setModalVisible, setEditTarget, setCardTitle);
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = () =>          handlePaste(clipboard, clipboardMode, card, clearClipboard, loadFields);

    // Call the right handler based on action from FooterBar
    const handleAction = (action) => {
        switch (action) {
            case "delete": handleDeleteSelectedWrapper(); break;
            case "edit": handleEditSelectedWrapper(); break;
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
                {cardTitle}
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
                <CircleButton icon="pencil" onPress={() => setModalVisible(true)} />
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
                onCreate={handleCard}
                title="Edit Card"
                placeholder="Card Title"
                value={cardTitle}
                mode="edit"
                isCard={true}
                fields={fields}
                setFields={setFields}
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