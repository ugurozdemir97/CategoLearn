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
    const [cardTitle, setCardTitle] = useState(card.title || card.name);

    // Selection hook for fields
    const {
        selectedItems,
        secondarySelect,
        toggleSelection,
        clear: clearSelection,
        selectAll,
        isSelected,
    } = useSelection();

    // Clipboard
    const {
        clipboard,
        hasClipboard,
        isCut,
        isCopy,
        cut,
        copy,
        clear: clearClipboard,
        getItemStatus,
    } = useClipboard();

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        const result = await getFields(card.id);
        setFields(result);
    };

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Delete selected
    const handleDeleteSelected = () => {
        if (selectedItems.length === 0) return;
        const message =
            selectedItems.length === 1
                ? `Are you sure you want to delete "${selectedItems[0].field_name}"?`
                : `Are you sure you want to delete these ${selectedItems.length} fields?`;
        setDeleteTarget({ items: [...selectedItems], message });
        setConfirmVisible(true);
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

    // Edit selected
    const handleEditSelected = () => {
        if (selectedItems.length === 1) {
            setModalVisible(true);
        } else {
            Alert.alert("Edit Error", "You can only edit one field at a time.");
        }
    };

    // Cut / Copy
    const handleCutSelected = () => {
        cut(selectedItems.map((f) => ({ ...f, type: "Field" })));
        clearSelection();
    };

    const handleCopySelected = () => {
        copy(selectedItems.map((f) => ({ ...f, type: "Field" })));
        clearSelection();
    };

    // Paste
const handlePaste = async () => {
    if (clipboard.length === 0) return;
    const fieldsToPaste = clipboard.filter((item) => item.type === "Field");
    if (fieldsToPaste.length === 0) {
        Alert.alert("Cannot Paste", "You can only paste fields here.");
        return;
    }

    if (isCut) {
        for (const f of fieldsToPaste) {
            if (f.id) {
                await deleteField(f.id); // remove from old card
            }
            await addField(card.id, f.field_name, f.context); // add to current card
        }
    } else if (isCopy) {
        for (const f of fieldsToPaste) {
            await addField(card.id, f.field_name, f.context);
        }
    }

    clearClipboard();
    await loadFields();
};

    const handleAction = (action) => {
        switch (action) {
            case "delete":
                handleDeleteSelected();
                break;
            case "edit":
                handleEditSelected();
                break;
            case "cut":
                handleCutSelected();
                break;
            case "copy":
                handleCopySelected();
                break;
            case "paste":
                handlePaste();
                break;
            case "clearClipboard":
                clearClipboard();
                break;
            case "search":
                console.log("Search pressed");
                break;
            case "settings":
                console.log("Settings pressed");
                break;
            case "deleted":
                console.log("Deleted items pressed");
                break;
            case "color":
                console.log("Color pressed");
                break;
            default:
                break;
        }
    };
        return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            {/* Header */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={fields.length}
                onSort={(mode) => console.log("Sort mode:", mode)}
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
                            label={item.field_name}
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
                            await updateField(f.id, f.field_name, f.context);
                        } else {
                            await addField(card.id, f.field_name, f.context);
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