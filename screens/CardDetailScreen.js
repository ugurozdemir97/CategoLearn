import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import CircleButton from "../components/CircleButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";
import styles from "../styles/styles.js";
import {
  getFields,
  addField,
  updateField,
  deleteField,
  updateCard,
} from "../database/queries.js";

export default function CardDetailScreen({ route }) {
  const { card } = route.params;
  const [fields, setFields] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [footerHeight, setFooterHeight] = useState(60);
  const [headerHeight, setHeaderHeight] = useState(50);

  const [expanded, setExpanded] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const selectionMode = selectedItems.length > 0;

  const [clipboard, setClipboard] = useState([]);
  const [cutItems, setCutItems] = useState([]);       // ✅ track cut fields
  const [copiedItems, setCopiedItems] = useState([]); // ✅ track copied fields

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    loadFields();
    return () => {
      setClipboard([]);
      setCutItems([]);
      setCopiedItems([]);
    };
  }, []);

  const loadFields = async () => {
    const result = await getFields(card.id);
    setFields(result);
  };

  const toggleExpand = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Delete selected
  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    const message =
      selectedItems.length === 1
        ? `Are you sure you want to delete "${fields[selectedItems[0]].field_name}"?`
        : `Are you sure you want to delete these ${selectedItems.length} fields?`;
    setDeleteTarget({ items: [...selectedItems], message });
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget?.items) {
      for (const idx of deleteTarget.items) {
        await deleteField(fields[idx].id);
      }
      await loadFields();
    }
    setSelectedItems([]);
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

  // Cut / Copy / Paste
  const handleCutSelected = () => {
    setClipboard(selectedItems.map((idx) => fields[idx]));
    setCutItems(selectedItems.map((idx) => fields[idx].id));   // ✅ ghost cut fields
    setCopiedItems([]);
    setSelectedItems([]);
  };

  const handleCopySelected = () => {
    setClipboard(selectedItems.map((idx) => fields[idx]));
    setCopiedItems(selectedItems.map((idx) => fields[idx].id)); // ✅ highlight copied fields
    setCutItems([]);
    setSelectedItems([]);
  };

  const handlePaste = async () => {
    if (clipboard.length === 0) return;

    if (cutItems.length > 0) {
      // ✅ Cut: delete originals then re-add
      for (const f of clipboard) {
        await deleteField(f.id);
        await addField(card.id, f.field_name, f.context);
      }
    } else if (copiedItems.length > 0) {
      // ✅ Copy: just duplicate
      for (const f of clipboard) {
        await addField(card.id, f.field_name, f.context);
      }
    }

    setClipboard([]);
    setCutItems([]);
    setCopiedItems([]);
    await loadFields();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <HeaderBar
        selectedCount={selectedItems.length}
        onSort={(type) => console.log("Sort by", type)}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      />

      <View style={[styles.paddingContainer, { marginTop: headerHeight + 20 }]}>
        <Text style={[styles.title, styles.bold]}>{card.title || card.name}</Text>
      </View>

      {/* Fields */}
      <ScrollView style={{ flex: 1 }}>
        {fields.map((f, i) => {
          const isSelected = selectedItems.includes(i);
          return (
            <View
              key={f.id}
              style={{
                opacity: cutItems.includes(f.id) ? 0.5 : 1,
                backgroundColor: copiedItems.includes(f.id) ? "#444" : "transparent",
              }}
            >
              <TouchableOpacity
                style={[
                  styles.item,
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: isSelected ? "#333" : "transparent",
                  },
                ]}
                onPress={() => {
                  if (selectionMode) {
                    if (isSelected) {
                      setSelectedItems(selectedItems.filter((idx) => idx !== i));
                    } else {
                      setSelectedItems([...selectedItems, i]);
                    }
                  } else {
                    toggleExpand(i);
                  }
                }}
                onLongPress={() => {
                  if (isSelected) {
                    setSelectedItems(selectedItems.filter((idx) => idx !== i));
                  } else {
                    setSelectedItems([...selectedItems, i]);
                  }
                }}
              >
                <Text style={styles.itemText}>{f.field_name || "(Untitled)"}</Text>
                {selectionMode ? (
                  isSelected && (
                    <FontAwesome name="check-circle" size={18} color="#82c6f0" />
                  )
                ) : (
                  <FontAwesome
                    name={expanded[i] ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>

              {expanded[i] && !selectionMode && (
                <View style={[styles.field, { paddingLeft: 20 }]}>
                  <Text style={styles.itemText}>{f.context}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Add/Edit Button */}
      <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
        <CircleButton icon="pencil" onPress={() => setModalVisible(true)} />
      </View>

      {/* Footer */}
      <FooterBar
        selectedCount={selectedItems.length}
        hasClipboard={clipboard.length > 0}
        onAction={(action) => {
          if (action === "delete") handleDeleteSelected();
          if (action === "edit") handleEditSelected();
          if (action === "cut") handleCutSelected();
          if (action === "copy") handleCopySelected();
          if (action === "paste") handlePaste();
        }}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      />

      {/* Modal for editing card title + fields */}
      <CreateModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItems([]);
        }}
        onCreate={async (updatedCard) => {
          await updateCard(card.id, updatedCard.name);
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
        value={card.title}
        setValue={() => {}}
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
        confirmColor="red"
      />
    </View>
  );
}