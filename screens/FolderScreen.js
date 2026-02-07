import { useState, useEffect } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";
import styles from "../styles/styles.js";
import {
  getFolders,
  getCards,
  addFolder,
  addCard,
  updateFolder,
  updateCard,
  deleteFolder,
  deleteCard,
  addField,
  getFields,
  deleteField,
} from "../database/queries.js";

export default function FolderScreen({ route, navigation }) {
  const { node } = route.params;
  const [children, setChildren] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [createType, setCreateType] = useState(null);
  const [fields, setFields] = useState([]);

  const [footerHeight, setFooterHeight] = useState(60);
  const [headerHeight, setHeaderHeight] = useState(50);

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [selectedItems, setSelectedItems] = useState([]);
  const selectionMode = selectedItems.length > 0;

  const [clipboard, setClipboard] = useState([]);
  const [cutItems, setCutItems] = useState([]);
  const [copiedItems, setCopiedItems] = useState([]);

  useEffect(() => {
    loadChildren();
    return () => {
      setClipboard([]);
      setCutItems([]);
      setCopiedItems([]);
    };
  }, []);

  const loadChildren = async () => {
    const folders = await getFolders(node.id);
    const cards = await getCards(node.id);

    setChildren([
      ...folders.map((f) => ({ ...f, type: "Category", displayName: f.name })),
      ...cards.map((c) => ({ ...c, type: "Card", displayName: c.title })),
    ]);
  };

  const handleItem = async (cardData, mode) => {
    const trimmed = cardData.name.trim();
    if (!trimmed) {
      Alert.alert("Invalid Name", "Name cannot be empty.");
      return;
    }
    if (trimmed.length > 60) {
      Alert.alert("Too Long", "Name cannot exceed 60 characters.");
      return;
    }

    if (mode === "create") {
      if (cardData.type === "Category") {
        await addFolder(node.id, trimmed, null, 0);
      } else if (cardData.type === "Card") {
        const cardId = await addCard(node.id, trimmed);
        for (const f of cardData.fields) {
          await addField(cardId, f.field_name, f.context);
        }
      }
    } else if (mode === "edit" && editTarget) {
      if (editTarget.type === "Category") {
        await updateFolder(editTarget.id, trimmed, editTarget.color);
      } else {
        await updateCard(editTarget.id, trimmed);
        const oldFields = await getFields(editTarget.id);
        for (const of of oldFields) {
          await deleteField(of.id);
        }
        for (const f of cardData.fields) {
          await addField(editTarget.id, f.field_name, f.context);
        }
      }
    }

    setNewName("");
    setFields([]);
    setEditTarget(null);
    setSelectedItems([]);
    setModalVisible(false);
    await loadChildren();
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    const message =
      selectedItems.length === 1
        ? `Are you sure you want to delete "${selectedItems[0].displayName}"?`
        : `Are you sure you want to delete these ${selectedItems.length} items?`;
    setDeleteTarget({ items: [...selectedItems], message });
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget?.items) {
      for (const item of deleteTarget.items) {
        if (item.type === "Category") await deleteFolder(item.id);
        else await deleteCard(item.id);
      }
      await loadChildren();
    }
    setSelectedItems([]);
    setDeleteTarget(null);
    setConfirmVisible(false);
  };

  const handleEditSelected = () => {
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      setNewName(item.displayName);
      setCreateType(item.type);
      setEditTarget(item);
      setModalVisible(true);
    } else {
      Alert.alert("Edit Error", "You can only edit one item at a time.");
    }
  };

  const handleCutSelected = () => {
    setClipboard([...selectedItems]);
    setCutItems(selectedItems.map((i) => i.id));
    setCopiedItems([]);
    setSelectedItems([]);
  };

  const handleCopySelected = () => {
    setClipboard([...selectedItems]);
    setCopiedItems(selectedItems.map((i) => i.id));
    setCutItems([]);
    setSelectedItems([]);
  };

  const handlePaste = async () => {
    if (clipboard.length === 0) return;

    if (cutItems.length > 0) {
      for (const item of clipboard) {
        if (item.type === "Category") {
          await deleteFolder(item.id);
          await addFolder(node.id, item.displayName, item.color, 0);
        } else {
          await deleteCard(item.id);
          const cardId = await addCard(node.id, item.displayName);
          const oldFields = await getFields(item.id);
          for (const f of oldFields) {
            await addField(cardId, f.field_name, f.context);
          }
        }
      }
    } else if (copiedItems.length > 0) {
      for (const item of clipboard) {
        if (item.type === "Category") {
          await addFolder(node.id, item.displayName, item.color, 0);
        } else {
          const cardId = await addCard(node.id, item.displayName);
          const oldFields = await getFields(item.id);
          for (const f of oldFields) {
            await addField(cardId, f.field_name, f.context);
          }
        }
      }
    }

    setClipboard([]);
    setCutItems([]);
    setCopiedItems([]);
    await loadChildren();
  };
    return (
    <View style={styles.container}>
      <HeaderBar
        selectedCount={selectedItems.length}
        onSort={(type) => console.log("Sort by", type)}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      />

      <View style={[styles.paddingContainer, { marginTop: headerHeight + 20 }]}>
        <Text style={[styles.title, styles.bold]}>{node.name}</Text>
      </View>

      {children.length === 0 ? (
        <View style={[styles.centered, { marginTop: headerHeight }]}>
          <Text style={styles.noItem}>No Items Yet</Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListButton
              label={item.displayName}
              icon={item.type === "Category" ? "folder" : "file"}
              isSelected={selectedItems.includes(item)}
              selectionMode={selectionMode}
              onPress={() => {
                if (selectionMode) {
                  if (selectedItems.includes(item)) {
                    setSelectedItems(selectedItems.filter((i) => i !== item));
                  } else {
                    setSelectedItems([...selectedItems, item]);
                  }
                } else {
                  if (item.type === "Category") {
                    navigation.push("Folder", { node: item });
                  } else {
                    navigation.navigate("CardDetail", { card: item });
                  }
                }
              }}
              onLongPress={() => {
                if (selectedItems.includes(item)) {
                  setSelectedItems(selectedItems.filter((i) => i !== item));
                } else {
                  setSelectedItems([...selectedItems, item]);
                }
              }}
              style={{
                opacity: cutItems.includes(item.id) ? 0.5 : 1, // ghosted if cut
                backgroundColor: copiedItems.includes(item.id)
                  ? "#444" // highlighted if copied
                  : "transparent",
              }}
            />
          )}
        />
      )}

      <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
        <CircleButton
          icon="folder"
          onPress={() => {
            setCreateType("Category");
            setModalVisible(true);
          }}
        />
        <CircleButton
          icon="file"
          onPress={() => {
            setCreateType("Card");
            setModalVisible(true);
          }}
        />
      </View>

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

      <CreateModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditTarget(null);
        }}
        onCreate={handleItem}
        title={editTarget ? `Edit ${createType}` : `Create ${createType}`}
        placeholder={`Enter ${createType} Name`}
        value={newName}
        setValue={setNewName}
        isCard={createType === "Card"}
        fields={fields}
        setFields={setFields}
        mode={editTarget ? "edit" : "create"}
      />

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