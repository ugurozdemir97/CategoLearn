import { useState, useEffect } from "react";
import { View, Text, Alert, FlatList } from "react-native";
import CircleButton from "../components/CircleButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import ListField from "../components/ListField.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";
import { getFields, addField, updateField, deleteField, updateCard } from "../database/queries.js";

export default function CardDetailScreen({ route }) {
    const { card } = route.params;
    const [fields, setFields] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [footerHeight, setFooterHeight] = useState(60);
    const [headerHeight, setHeaderHeight] = useState(50);
    const [expanded, setExpanded] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [cardTitle, setCardTitle] = useState(card.name);

    // Selection hook for fields
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, hasClipboard, isCut, isCopy, cut, copy, clearClipboard, getItemStatus } = useClipboard();

    useEffect(() => {
        loadFields();
    }, []);

const loadFields = async () => {
    const result = await getFields(card.id);
    setFields(result.map(f => ({ ...f, type: "Field" })));
};

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const confirmDelete = async () => {
        if (deleteTarget?.items) {
            for (const item of deleteTarget.items) {
                if (item.id) {
                    await deleteField(item.id);
                }
            }
            await loadFields();
        }
        clearSelection();
        setDeleteTarget(null);
        setConfirmVisible(false);
    };

    // Footer action handlers for delete, edit, cut, copy, paste
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for subjects
    const handleDeleteSelectedWrapper = () => handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, "fields");
    const handleEditSelectedWrapper = () =>   handleEditSelected(selectedItems, setModalVisible, setEditTarget, setCardTitle);
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = () =>          handlePaste(clipboard, isCut, isCopy, card, clearClipboard, loadFields);

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
            {/* Header */}
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

            <Text
                style={[
                    styles.title,
                    styles.centeredText,
                    { marginTop: headerHeight + 20, color: colors.textPrimary },
                ]}
            >
                {cardTitle}
            </Text>

            {/* Fields */}
            {fields.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text
                        style={[
                            styles.midText,
                            styles.centeredText,
                            { color: colors.textSecondary },
                        ]}
                    >
                        No fields yet. Tap the pencil to add some!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={fields}
                    keyExtractor={(item, index) =>
                        item.id ? item.id.toString() : `temp-${index}`
                    }
                    renderItem={({ item }) => (
                        <ListField
                            label={item.name}
                            context={item.context}
                            isSelected={isSelected(item)}
                            secondarySelect={secondarySelect}
                            status={getItemStatus(item.id, "Field")}
                            expanded={expanded[item.id]}
                            onPress={() => {
                                if (secondarySelect) {
                                    toggleSelection(item);
                                } else {
                                    toggleExpand(item.id);
                                }
                            }}
                            onLongPress={() => toggleSelection(item)}
                        />
                    )}
                />
            )}

            {/* Floating Add/Edit Button */}
            <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
                <CircleButton icon="pencil" onPress={() => setModalVisible(true)} />
            </View>

            {/* Footer */}
            <FooterBar
                selectedCount={selectedItems.length}
                hasClipboard={hasClipboard}
                onAction={handleAction}
                onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
            />

            {/* Modal for editing card title + fields */}
            <CreateModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    clearSelection();
                }}
                onCreate={async (updatedCard) => {
                    // Update card title
                    await updateCard(card.id, updatedCard.name);
                    setCardTitle(updatedCard.name);

                    // Find deleted fields by comparing old vs new
                    const oldFieldIds = fields.map((f) => f.id);
                    const newFieldIds = updatedCard.fields.map((f) => f.id).filter(Boolean);
                    const deletedIds = oldFieldIds.filter((id) => !newFieldIds.includes(id));

                    for (const id of deletedIds) {
                        await deleteField(id);
                    }

                    // Update or add fields
                    for (const f of updatedCard.fields) {
                        if (f.id) {
                            await updateField(f.id, f.name, f.context);
                        } else {
                            await addField(card.id, f.name, f.context);
                        }
                    }

                    setModalVisible(false);
                    await loadFields();
                }}
                title="Edit Card"
                placeholder="Card Title"
                value={cardTitle}
                setValue={setCardTitle}
                isCard={true}
                fields={fields}
                setFields={setFields}
                mode="edit"
                cardId={card.id}
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