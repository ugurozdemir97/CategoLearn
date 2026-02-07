import { useState, useEffect } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";
import styles from "../styles/styles.js";
import { addFolder, getFolders, updateFolder, deleteFolder } from "../database/queries.js";

export default function HomeScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  const [selectedItems, setSelectedItems] = useState([]);
  const selectionMode = selectedItems.length > 0;

  const [footerHeight, setFooterHeight] = useState(60);
  const [headerHeight, setHeaderHeight] = useState(50);

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [clipboard, setClipboard] = useState([]);
  const [cutItems, setCutItems] = useState([]);   // ✅ track cut items
  const [copiedItems, setCopiedItems] = useState([]); // ✅ track copied items

  // Load subjects (root folders)
  useEffect(() => {
    loadSubjects();
    return () => {
      // ✅ clear clipboard when leaving screen
      setClipboard([]);
      setCutItems([]);
      setCopiedItems([]);
    };
  }, []);

  const loadSubjects = async () => {
    const result = await getFolders();
    setSubjects(result.filter((f) => f.is_root === 1));
  };

  // Handle create/edit
  const handleSubject = async (_, mode) => {
    const trimmed = newSubject.trim();

    if (!trimmed) {
      Alert.alert("Invalid Name", "Subject name cannot be empty.");
      return;
    }
    if (trimmed.length > 60) {
      Alert.alert("Too Long", "Subject name cannot exceed 60 characters.");
      return;
    }

    if (mode === "create") {
      await addFolder(null, trimmed, null, 1);
    } else if (mode === "edit" && editTarget) {
      await updateFolder(editTarget.id, trimmed, editTarget.color);
    }

    setNewSubject("");
    setEditTarget(null);
    setSelectedItems([]);
    setModalVisible(false);
    await loadSubjects();
  };

  // Delete selected
  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    const message =
      selectedItems.length === 1
        ? `Are you sure you want to delete "${selectedItems[0].name}"?`
        : `Are you sure you want to delete these ${selectedItems.length} subjects?`;
    setDeleteTarget({ items: [...selectedItems], message });
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget?.items) {
      for (const item of deleteTarget.items) {
        await deleteFolder(item.id);
      }
      await loadSubjects();
    }
    setSelectedItems([]);
    setDeleteTarget(null);
    setConfirmVisible(false);
  };

  // Edit selected
  const handleEditSelected = () => {
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      setNewSubject(item.name);
      setEditTarget(item);
      setModalVisible(true);
    } else {
      Alert.alert("Edit Error", "You can only edit one subject at a time.");
    }
  };

  // Cut / Copy / Paste
  const handleCutSelected = () => {
    setClipboard([...selectedItems]);
    setCutItems(selectedItems.map((i) => i.id));   // ✅ mark cut items
    setCopiedItems([]);                            // ✅ clear copied state
    setSelectedItems([]);
  };

  const handleCopySelected = () => {
    setClipboard([...selectedItems]);
    setCopiedItems(selectedItems.map((i) => i.id)); // ✅ mark copied items
    setCutItems([]);                                // ✅ clear cut state
    setSelectedItems([]);
  };

  const handlePaste = async () => {
    if (clipboard.length > 0) {
      // If cut → delete originals then re-add
      if (cutItems.length > 0) {
        for (const item of clipboard) {
          await deleteFolder(item.id);
          await addFolder(null, item.name, item.color, 1);
        }
      }
      // If copy → just add duplicates
      else if (copiedItems.length > 0) {
        for (const item of clipboard) {
          await addFolder(null, item.name, item.color, 1);
        }
      }

      setClipboard([]);
      setCutItems([]);
      setCopiedItems([]);
      await loadSubjects();
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        selectedCount={selectedItems.length}
        onSort={(type) => console.log("Sort by", type)}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      />

      {subjects.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noItem}>What Do You Want To Learn About?</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.title, styles.bold, { marginTop: headerHeight + 20 }]}>
            Subjects
          </Text>
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ListButton
                label={item.name}
                icon="folder"
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
                    navigation.navigate("Folder", { node: item });
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
                  opacity: cutItems.includes(item.id) ? 0.5 : 1, // ✅ half transparent if cut
                  backgroundColor: copiedItems.includes(item.id) ? "#444" : "transparent", // ✅ highlight if copied
                }}
              />
            )}
          />
        </>
      )}

      <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
        <CircleButton icon="plus" onPress={() => setModalVisible(true)} />
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
        onCreate={handleSubject}
        title={editTarget ? "Edit Subject" : "Create Subject"}
        placeholder="Enter Subject Name"
        value={newSubject}
        setValue={setNewSubject}
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