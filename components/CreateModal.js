import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import ConfirmationModal from "./ConfirmationModal.js";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";

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
  card = null, // pass the entire card object when editing
}) {
  const [localTitle, setLocalTitle] = useState(value);
  const [localFields, setLocalFields] = useState(fields);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Sync title + fields only when modal opens
  useEffect(() => {
    if (visible) {
      setLocalTitle(value);
      setLocalFields(fields);
    }
  }, [visible, value, fields]);

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

  const confirmDeleteField = () => {
    if (deleteIndex !== null) {
      const updated = [...localFields];
      updated.splice(deleteIndex, 1);
      setLocalFields(updated);
    }
    setDeleteIndex(null);
    setConfirmVisible(false);
  };

  const handleAction = () => {
  if (isCard) {
    const cardData = {
      id: card?.id,        // pass card id if editing
      name: localTitle,    // ✅ updated title
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


  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: "90%" }]}>
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Card title input */}
<TextInput
  style={styles.input}
  placeholder={placeholder}
  placeholderTextColor="#888"
  value={localTitle}
  onChangeText={setLocalTitle}
  maxLength={60}
/>


            {/* Fields section for cards */}
            {isCard && (
              <ScrollView
                style={{ maxHeight: 200, marginBottom: 15, width: "100%" }}
              >
                {localFields.map((field, index) => (
                  <View key={index} style={{ marginVertical: 10 }}>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        style={styles.input}
                        placeholder="Field Name"
                        placeholderTextColor="#888"
                        value={field.field_name}
                        onChangeText={(text) =>
                          updateField(index, "field_name", text)
                        }
                      />
                      <TouchableOpacity
                        style={{ position: "absolute", right: 10, top: 10 }}
                        onPress={() => requestDeleteField(index)}
                      >
                        <FontAwesome name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>

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

                {/* Add Field Button */}
                <View style={{ flex: 1 }}>
                  <Button title="Add Field" onPress={addField} />
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
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

      <ConfirmationModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={confirmDeleteField}
        message="Are you sure you want to delete this field?"
        confirmText="Delete"
      />
    </>
  );
}