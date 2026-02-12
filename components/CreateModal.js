import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ConfirmationModal from "./ConfirmationModal.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { deleteField } from "../database/queries.js";

// For creating/editing both cards and folders, with dynamic fields for cards
export default function CreateModal({ visible, onClose, onCreate, title, placeholder, value, isCard = false, isField = false, fields = [], context = "", mode = "create"}) {
    
    const [localTitle, setLocalTitle] = useState(value);            // Local state for title input
    const [localFields, setLocalFields] = useState(fields);         // Local state for fields (cards only)
    const [localContext, setLocalContext] = useState(context);      // Local state for context (fields only)
    const [confirmVisible, setConfirmVisible] = useState(false);    // For confirming field deletion
    const [deleteIndex, setDeleteIndex] = useState(null);

    // Place name and fields if editing a card when modal opens
    useEffect(() => {
        if (visible) {
            setLocalTitle(value || "");
            setLocalFields([...fields]);
            setLocalContext(context || "");
        }
    }, [visible]);

    // Handle Create or Edit action
    // You can create cards (with/without fields) or folders
    // You can edit cards (with/without their fields) or folder names
    const handleAction = () => {

        // Add/Edit Cards
        if (isCard) {

            const cardData = {
                type: "Card",
                name: localTitle,     // What we wrote in the input
                fields: localFields,  // The fields we added/edited in the modal
            };
            onCreate(cardData, mode);
        
        // Add/Edit Fields
        } else if (isField) {
            const fieldData = {
                type: "Field",
                name: localTitle,      // What we wrote in the input
                context: localContext, // The context we wrote in the context input
            };
            onCreate(fieldData, mode);
        // Add/Edit Folders (Subjects or Categories)
        } else {
            const folderData = {
                type: "Category",
                name: localTitle
            }
            onCreate(folderData, mode);
        }
        

        // Clear local state and close modal
        setLocalTitle("");
        setLocalFields([]);
        setLocalContext("");
        onClose();
    };

    // Card Creating Modal
    // Add field area
    const addField = () => setLocalFields([...localFields, { name: "", context: "" }]);

    // Update fields area in the modal
    const updateField = (index, key, val) => {
        const updated = [...localFields];
        updated[index][key] = val;
        setLocalFields(updated);
    };

    // Open delete field confirmation modal
    const requestDeleteField = (index) => {
        setDeleteIndex(index);
        setConfirmVisible(true);
    };

    const confirmDeleteField = async () => {
        if (deleteIndex !== null) {
            const updated = [...localFields];
            const fieldToDelete = updated[deleteIndex];

            // If field has an ID (it is being edited), delete from database
            if (fieldToDelete?.id) await deleteField(fieldToDelete.id);

            // Remove from local state
            updated.splice(deleteIndex, 1);
            setLocalFields(updated);

        }

        // Reset Variables and Close Modal
        setDeleteIndex(null);
        setConfirmVisible(false);
    };

    return (
        <>
            <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>

                        {/* Edit/Create Card/Folder */}
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary, marginBottom: 10 }]}>
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
                            <ScrollView style={{ maxHeight: 500, width: "100%" }}>

                                {localFields.map((field, index) => (
                                    <View key={index} style={[styles.input, { backgroundColor: colors.bgSecondary, marginTop: 10, paddingHorizontal: 0}]}>
                                        <View style={[styles.centered, { flexDirection: "row"}]}>
                                            <TextInput
                                                style={[styles.input, styles.smallText, { color: colors.textSecondary, flex: 1}]}
                                                placeholder="Field Name"
                                                placeholderTextColor={colors.textAccent}
                                                value={field.name}
                                                onChangeText={(text) => updateField(index, "name", text)}
                                                maxLength={50}
                                            />
                                            <TouchableOpacity onPress={() => requestDeleteField(index)} style={{marginRight: 14}}>
                                                <FontAwesome name="trash" size={18} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.centered}>
                                            <View style={[styles.dashedBorder, {borderColor: colors.accentLight, width: "92%"}]} />
                                        </View>

                                        <TextInput
                                            style={[styles.input, styles.fieldInput, styles.smallText, { color: colors.textSecondary, borderColor: colors.accentLight }]}
                                            placeholder="Context (optional)"
                                            placeholderTextColor={colors.textAccent}
                                            value={field.context}
                                            onChangeText={(text) => updateField(index, "context", text)}
                                            multiline={true}
                                        />
                                    </View>
                                ))}

                                {/* Add Field Button */}
                                <TouchableOpacity onPress={addField} style={[styles.normalButton, styles.dashedBorder, styles.centered, { borderColor: "black", marginTop: 10, flexDirection: "row" }]}>
                                    <FontAwesome name="plus" size={14} color={colors.accentLight} style={{ marginRight: 8 }} />
                                    <Text style={{ color: colors.accentLight, fontWeight: "bold" }}>Add Field</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                        
                        {isField && (
                            <TextInput
                                style={[styles.input, styles.fieldInput, styles.smallText, { color: colors.textSecondary, backgroundColor: colors.bgSecondary, marginTop: 10 }]}
                                placeholder="Context (optional)"
                                placeholderTextColor={colors.textAccent}
                                value={localContext}
                                onChangeText={setLocalContext}
                                multiline={true}
                            />
                        )}

                        {/* Action Buttons */}
                        <View style={[styles.rowSpaceBetween, { marginTop: 10, gap: 10 }]}>

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