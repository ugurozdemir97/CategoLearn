import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Components
import ConfirmationModal from "./ConfirmationModal.js";
import ColorModal from "./ColorModal.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Utils
import { validateName } from "../utils/validation.js";

// Database Queries
import { getFolders, getCards, getFields } from "../database/queries.js";

// For creating/editing both cards and folders, with dynamic fields for cards
export default function CreateModal({ visible, onClose, onCreate, title, placeholder, value, color, isCard = false, isField = false, fields = [], context = "", mode = "create", parentId = null, editTarget = null}) {
    
    const [localTitle, setLocalTitle] = useState(value);                // Local state for title input
    const [localFields, setLocalFields] = useState(fields);             // Local state for fields (cards only)
    const [localContext, setLocalContext] = useState(context);          // Local state for context (fields only)
    const [confirmVisible, setConfirmVisible] = useState(false);        // For confirming field deletion
    const [colorModalVisible, setColorModalVisible] = useState(false);  // For selecting color
    const [deleteIndex, setDeleteIndex] = useState(null);               // For deleting the fields in Create Card modal
    const [errorMessage, setErrorMessage] = useState("");               // For displaying error messages
    const [selectedColor, setSelectedColor] = useState(color);          // Color of the item

    // Place name and fields if editing a card when modal opens
    useEffect(() => {
        if (visible) {
            setLocalTitle(value || "");
            setLocalFields([...fields]);
            setLocalContext(context || "");
            setErrorMessage("");
            setSelectedColor(color);
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
            const fieldNames = localFields.map(f => f.name);
            let duplicatePair = null;

             // Validate each field name
            for (const f of fieldNames) {
                const fieldValidation = validateName(f, "Field");
                if (!fieldValidation.valid) {
                    setErrorMessage(fieldValidation.error);
                    return;
                }
            }

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

            const cardData = { type: "Card", name: validation.trimmed, fields: localFields, color: selectedColor };
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

            const fieldData = { type: "Field", name: validation.trimmed, context: localContext, color: selectedColor };
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

            const folderData = { type: "Category", name: validation.trimmed, color: selectedColor };
            onCreate(folderData, mode);
        }

        // Close Modal
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
                <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                    <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                        <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>

                            {/* Edit/Create Card/Folder */}
                            <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary }]}>{title}</Text>

                            {errorMessage ? (
                                <Text style={[styles.midText, styles.centeredText, { color: colors.danger, marginTop: 5 }]}>{errorMessage}</Text>
                            ) : null}

                            {/* Card/Folder title input */}
                            <View style={[styles.rowCenter, {gap: 10, marginVertical: 10}]}>
                                <TextInput
                                    style={[styles.input, styles.smallText, styles.paddingHorizontal, { color: colors.textSecondary, backgroundColor: colors.bgSecondary }]}
                                    placeholder={placeholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={localTitle}
                                    onChangeText={setLocalTitle}
                                    maxLength={50}
                                />
                                <TouchableOpacity onPress={() => setColorModalVisible(true)} style={[styles.smallInputButton, {backgroundColor: selectedColor || colors.bgModal, borderColor: colors.accentLight}]}>
                                    <FontAwesome name="paint-brush" size={20} color={
                                        selectedColor === "#FFFFFF" || selectedColor === "#ffdd00" || selectedColor === "#00e19d"
                                            ? "#000000"
                                            : colors.textPrimary
                                        } 
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Fields section for cards */}
                            {isCard && (
                                <View>
                                    {localFields.length > 0 && (
                                        <ScrollView style={{ maxHeight: 370, width: "100%", marginBottom: 10  }}>
                                            {localFields.map((field, index) => {
                                                const isLast = index === localFields.length - 1;
                                                return (
                                                    <View key={index} style={[ styles.input, {backgroundColor: colors.bgSecondary, paddingHorizontal: 0, marginBottom: isLast ? 0 : 10 }]}>
                                                        <View style={[styles.centered, { flexDirection: "row" }]}>
                                                            <TextInput
                                                                style={[ styles.input, styles.smallText, styles.paddingHorizontal, { color: colors.textSecondary, flex: 1 }]}
                                                                placeholder="Field Name"
                                                                placeholderTextColor={colors.textSecondary}
                                                                value={field.name}
                                                                onChangeText={(text) => updateField(index, "name", text)}
                                                                maxLength={50}
                                                            />
                                                            <TouchableOpacity onPress={() => requestDeleteField(index)} style={[ styles.smallInputButton, { borderWidth: 0, marginRight: 5 }]}>
                                                                <FontAwesome name="trash" size={18} color={colors.danger} />
                                                            </TouchableOpacity>
                                                        </View>

                                                        <View style={styles.centered}>
                                                            <View style={[styles.dashedBorder, { borderColor: colors.accentLight, width: "100%", borderBottomWidth: 0 } ]}/>
                                                        </View>

                                                        <TextInput
                                                            style={[ styles.input, styles.fieldInput, styles.smallText, styles.paddingHorizontal, { color: colors.textSecondary } ]}
                                                            placeholder="Context (optional)"
                                                            placeholderTextColor={colors.textSecondary}
                                                            value={field.context}
                                                            onChangeText={(text) => updateField(index, "context", text)}
                                                            multiline={true}
                                                        />
                                                    </View>
                                                );
                                            })}
                                        </ScrollView>
                                    )}

                                    {/* Add Field Button */}
                                    <TouchableOpacity onPress={addField} style={[styles.normalButton, styles.dashedBorder, styles.centered, { borderColor: colors.bgPrimary, flexDirection: "row", gap: 10 }]}>
                                        <FontAwesome name="plus" size={14} color={colors.accentLight}/>
                                        <Text style={[styles.midText, { color: colors.accentLight }]}>Add Field</Text>
                                    </TouchableOpacity> 
                                </View>
                            )}
                            
                            {isField && (
                                <TextInput
                                    style={[ styles.input, styles.fieldInput, styles.smallText, styles.paddingHorizontal, { backgroundColor: colors.bgSecondary, color: colors.textSecondary } ]}
                                    placeholder="Context (optional)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={localContext}
                                    onChangeText={setLocalContext}
                                    multiline={true}
                                />
                            )}

                            {/* Action Buttons */}
                            <View style={[styles.rowCenter, styles.spaceBetween, { marginTop: 10, gap: 10 }]}>

                                <TouchableOpacity onPress={onClose} style={[styles.normalButton, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                                    <Text style={[styles.midText, { color: colors.textPrimary }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAction} style={[styles.normalButton, { backgroundColor: colors.accent, flex: 1 }]}>
                                    <Text style={[styles.midText, { color: colors.textPrimary }]}>{mode === "create" ? "Create" : "Save"}</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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

            {/* Select Color Modal */}
            <ColorModal
                visible={colorModalVisible}
                onClose={() => setColorModalVisible(false)}
                onSelect={(c) => setSelectedColor(c)}
                selectedColor={selectedColor}
            />

        </>
    );
}