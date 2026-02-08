import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ConfirmationModal from "./ConfirmationModal.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { deleteField } from "../database/queries.js"; // ✅ import deleteField

// For creating/editing both cards and folders, with dynamic fields for cards
export default function CreateModal({
    visible,
    onClose,
    onCreate,
    title,
    placeholder,
    value,
    isCard = false,
    fields = [],
    setFields = () => {},
    mode = "create",
    card = null
}) {
    const [localTitle, setLocalTitle] = useState(value);
    const [localFields, setLocalFields] = useState(fields);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    useEffect(() => {
        if (visible) {
            setLocalTitle(value || "");
            setLocalFields([...fields]);
        }
    }, [visible]);

    const addField = () => {
        setLocalFields([...localFields, { field_name: "", context: "" }]);
    };

    const updateField = (index, key, val) => {
        const updated = [...localFields];
        updated[index][key] = val;
        setLocalFields(updated);
    };

    const requestDeleteField = (index) => {
        setDeleteIndex(index);
        setConfirmVisible(true);
    };

    const confirmDeleteField = async () => {
        if (deleteIndex !== null) {
            const updated = [...localFields];
            const fieldToDelete = updated[deleteIndex];

            // ✅ If field has an ID, delete from database
            if (fieldToDelete?.id) {
                await deleteField(fieldToDelete.id);
            }

            // Remove from local state
            updated.splice(deleteIndex, 1);
            setLocalFields(updated);
            setFields(updated); // sync with parent
        }
        setDeleteIndex(null);
        setConfirmVisible(false);
    };

    const handleAction = () => {
        if (isCard) {
            const cardData = {
                id: card?.id,
                name: localTitle,
                type: "Card",
                fields: localFields,
            };
            onCreate(cardData, mode);
        } else {
            onCreate({ name: localTitle, type: "Category", children: [] }, mode);
        }

        setFields(localFields);

        if (mode === "create") {
            setLocalTitle("");
            setLocalFields([]);
        }

        onClose();
    };

    const ActionButton = ({ label, onPress, primary = false, danger = false }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: danger
                    ? colors.danger
                    : primary
                    ? colors.accent
                    : colors.bgSecondary,
                marginHorizontal: 4,
                alignItems: "center",
            }}
        >
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{label}</Text>
        </TouchableOpacity>
    );
        return (
        <>
            <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary }]}>
                            {title}
                        </Text>

                        {/* Card/Folder title input */}
                        <TextInput
                            style={[styles.input, styles.smallText, { color: colors.textSecondary, backgroundColor: colors.bgSecondary }]}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textAccent}
                            value={localTitle}
                            onChangeText={setLocalTitle}
                            maxLength={50}
                        />

                        {/* Fields section for cards */}
                        {isCard && (
                            <ScrollView style={{ maxHeight: 250, marginBottom: 15, width: "100%" }}>
                                {localFields.map((field, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            marginVertical: 8,
                                            backgroundColor: colors.bgSecondary,
                                            borderRadius: 10,
                                            padding: 12,
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginBottom: 8, marginRight: 10 }]}
                                                placeholder="Field Name"
                                                placeholderTextColor={colors.textSecondary}
                                                value={field.field_name}
                                                onChangeText={(text) => updateField(index, "field_name", text)}
                                            />
                                            <TouchableOpacity onPress={() => requestDeleteField(index)} style={{ padding: 8 }}>
                                                <FontAwesome name="trash" size={18} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>

                                        <TextInput
                                            style={[styles.input, { height: 80, textAlignVertical: "top", marginBottom: 0 }]}
                                            placeholder="Context (optional)"
                                            placeholderTextColor={colors.textSecondary}
                                            multiline
                                            value={field.context}
                                            onChangeText={(text) => updateField(index, "context", text)}
                                        />
                                    </View>
                                ))}

                                {/* Add Field Button */}
                                <TouchableOpacity
                                    onPress={addField}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 12,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        borderStyle: "dashed",
                                        marginTop: 8,
                                    }}
                                >
                                    <FontAwesome name="plus" size={14} color={colors.accentLight} style={{ marginRight: 8 }} />
                                    <Text style={{ color: colors.accentLight, fontWeight: "500" }}>Add Field</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}

                        {/* Action Buttons */}
                        <View style={[styles.rowSpaceBetween, { marginTop: 15, gap: 10 }]}>
                            <ActionButton label="Cancel" onPress={onClose} />
                            <ActionButton label={mode === "create" ? "Create" : "Save"} onPress={handleAction} primary />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Modal for deleting a field */}
            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={confirmDeleteField}
                message="Are you sure you want to delete this field?"
                confirmText="Delete"
                confirmColor={colors.danger}
            />
        </>
    );
}