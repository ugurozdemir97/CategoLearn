import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Components
import ConfirmationModal from "./ConfirmationModal.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Utils
import { validateName } from "../utils/validation.js";

// Database Queries
import { getFolders, getCards, getFields } from "../database/queries.js";

// For creating/editing both cards and folders, with dynamic fields for cards
export default function CreateModal({ visible, onClose, onCreate, title, placeholder, value, isCard = false, isField = false, fields = [], context = "", mode = "create", parentId = null, editTarget = null}) {
    
    const [localTitle, setLocalTitle] = useState(value);            // Local state for title input
    const [localFields, setLocalFields] = useState(fields);         // Local state for fields (cards only)
    const [localContext, setLocalContext] = useState(context);      // Local state for context (fields only)
    const [confirmVisible, setConfirmVisible] = useState(false);    // For confirming field deletion
    const [deleteIndex, setDeleteIndex] = useState(null);           // For deleting the fields in Create Card modal
    const [errorMessage, setErrorMessage] = useState("");           // For displaying error messages

    // Place name and fields if editing a card when modal opens
    useEffect(() => {
        if (visible) {
            setLocalTitle(value || "");
            setLocalFields([...fields]);
            setLocalContext(context || "");
            setErrorMessage("");
        }
    }, [visible]);

    // Handle Create or Edit action
    // You can create cards (with/without fields) or folders
    // You can edit cards (with/without their fields) or folder names
    const handleAction = async () => {

        // Validate the title
        const validation = validateName(localTitle, isCard ? "Card" : isField ? "Field" : title.split(" ").pop());
        if (!validation.valid) {
            setErrorMessage(validation.error);
            return;
        }

        // Add Or Edit Cards
        if (isCard) {
            
            // Check duplicates in parent folder
            const existingCards = await getCards(parentId);
            if (existingCards.some(c => c.name === localTitle && c.id !== editTarget?.id)) {
                setErrorMessage(`A card named "${localTitle}" already exists in this folder.`);
                return;
            }

            // Check for field names and prevent creating a card with multiple fields sharing a same title
            const fieldNames = localFields.map(f => f.name.trim()).filter(Boolean);
            let duplicatePair = null;

            // Loop through names and find the first duplicate pair
            for (let i = 0; i < fieldNames.length; i++) {
                for (let j = i + 1; j < fieldNames.length; j++) {
                    if (fieldNames[i] === fieldNames[j]) {
                        duplicatePair = [fieldNames[i], fieldNames[j]];
                        break;
                    }
                }
                if (duplicatePair) break;
            }

            if (duplicatePair) {
                setErrorMessage(`Duplicate field names are not allowed: "${duplicatePair.join(", ")}".`);
                return;
            }

            const cardData = { type: "Card", name: validation.trimmed, fields: localFields };
            onCreate(cardData, mode);
        }

        // Add Or Edit Fields 
        else if (isField) {

            // Check duplicates in parent card
            const existingFields = await getFields(parentId);
            if (existingFields.some(f => f.name === localTitle && f.id !== editTarget?.id)) {
                setErrorMessage(`A field named "${localTitle}" already exists in this card.`);
                return;
            }

            const fieldData = { type: "Field", name: validation.trimmed, context: localContext };
            onCreate(fieldData, mode);
        }

        // Add Or Edit Folders
        else {

            // Check duplicates in parent folder (or root if parentId is null)
            const existingFolders = await getFolders(parentId);
            if (existingFolders.some(f => f.name === localTitle && f.id !== editTarget?.id)) {
                setErrorMessage(`A folder named "${localTitle}" already exists here.`);
                return;
            }

            const folderData = { type: "Category", name: validation.trimmed };
            onCreate(folderData, mode);
        }

        // Reset Variables And Close Modal
        setLocalTitle("");
        setLocalFields([]);
        setLocalContext("");
        setErrorMessage("");
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

            // Remove from local state
            const updated = [...localFields];
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

                        {errorMessage ? (
                            <Text style={[styles.smallText, styles.centeredText, { color: colors.danger, marginBottom: 10 }]}>{errorMessage}</Text>
                        ) : null}

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
                title="Confirm Delete"
                message="Are you sure you want to delete this field?"
                confirmText="Delete"
                confirmColor={colors.danger}
            />
        </>
    );
}