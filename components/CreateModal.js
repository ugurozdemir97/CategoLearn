import React from "react";
import { Modal, View, Text, TextInput, Button, ScrollView } from "react-native";
import styles from "../styles/styles.js";

export default function CreateModal({
    visible,
    onClose,
    onCreate,
    title,
    placeholder,
    value,
    setValue,
    isCard = false,
    fields = [],
    setFields = () => {},
    mode = "create"
}) {
    const addField = () => {
        setFields([...fields, { name: "", context: "" }]);
    };

    const updateField = (index, key, val) => {
        const updated = [...fields];
        updated[index][key] = val;
        setFields(updated);
    };

    const handleAction = () => {
        if (isCard) {
            const cardData = { title: value, optionalAreas: fields };
            onCreate(cardData, mode);
        } else {
            onCreate(value, mode);
        }
        if (mode === "create") {
            setValue("");
            setFields([]);
        }
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { width: "90%"}]}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#888"
                        value={value}
                        onChangeText={setValue}
                        maxLength={60}
                    />

                    {isCard && (
                        <>
                            <ScrollView style={{ maxHeight: 200, marginBottom: 15, width: "100%" }}>
                                {fields.map((field, index) => (
                                    <View key={index} style={{ marginVertical: 10 }}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Field Name"
                                            placeholderTextColor="#888"
                                            value={field.name}
                                            onChangeText={(text) =>
                                                updateField(index, "name", text)
                                            }
                                        />
                                        <TextInput
                                            style={[styles.input, { height: 80 }]}
                                            placeholder="Context"
                                            placeholderTextColor="#888"
                                            multiline
                                            value={field.context}
                                            onChangeText={(text) =>
                                                updateField(index, "context", text)
                                            }
                                        />
                                    </View>
                                ))}

                                {/* Add Field button under scroll area */}
                                <View style={{ flex: 1 }}>
                                    <Button title="Add Field" onPress={addField} />
                                </View>

                            </ScrollView>

                        </>
                    )}

                    <View style={styles.modalButtons}>
                        <Button title="Cancel" onPress={onClose} />
                        <Button
                            title={mode === "create" ? "Create" : "Save"}
                            onPress={handleAction}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}