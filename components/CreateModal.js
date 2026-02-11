import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ConfirmationModal from "./ConfirmationModal.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { deleteField } from "../database/queries.js";

// For creating/editing both cards and folders, with dynamic fields for cards
export default function CreateModal({ visible, onClose, onCreate, title, placeholder, value, isCard = false, fields = [], setFields = () => {}, mode = "create", card = null}) {
    
    const [localTitle, setLocalTitle] = useState(value);            // Local state for title input
    const [localFields, setLocalFields] = useState(fields);         // Local state for fields (cards only)
    const [confirmVisible, setConfirmVisible] = useState(false);    // For confirming field deletion
    const [deleteIndex, setDeleteIndex] = useState(null);

    // Place name and fields if editing a card when modal opens
    useEffect(() => {
        if (visible) {
            setLocalTitle(value || "");
            setLocalFields([...fields]);
        }
    }, [visible]);

    // Handle Create or Edit action
    // You can create cards (with/without fields) or folders
    // You can edit cards (with/without their fields) or folder names
    const handleAction = () => {

        // Add/Edit Cards
        if (isCard) {

            setFields(localFields);   // Parent's setFields function

            const cardData = {
                id: card?.id,
                type: "Card",
                name: localTitle,     // What we wrote in the input
                fields: localFields,  // The fields we added/edited in the modal
            };
            onCreate(cardData, mode);
        
        // Add/Edit Folders (Subjects or Categories)
        } else onCreate({ name: localTitle, type: "Category"}, mode);

        // Clear local state and close modal
        setLocalTitle("");
        setLocalFields([]);
        onClose();
    };

    // FIELDS

    const addField = () => setLocalFields([...localFields, { name: "", context: "" }]);

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

    return (
        <>
            <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>

                        {/* Edit/Create Card/Folder */}
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
                                                value={field.name}
                                                onChangeText={(text) => updateField(index, "name", text)}
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

                            <TouchableOpacity onPress={onClose} style={[styles.normalButton, {backgroundColor: colors.bgSecondary}]}>
                                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAction} style={[styles.normalButton, {backgroundColor: colors.accent}]}>
                                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{mode === "create" ? "Create" : "Save"}</Text>
                            </TouchableOpacity>

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