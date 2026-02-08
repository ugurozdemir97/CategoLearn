import { useState, useEffect } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { validateWithAlert } from "../utils/validation.js";
import { addFolder, getFolders, updateFolder, deleteFolder, moveFolder, copyFolderRecursive, isDescendant } from "../database/queries.js";

export default function HomeScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [footerHeight, setFooterHeight] = useState(70);
  const [headerHeight, setHeaderHeight] = useState(50);

  // Use shared hooks
  const { selectedItems, selectAll, secondarySelect, toggleSelection, clear: clearSelection, isSelected } = useSelection();
  const { clipboard, hasClipboard, isCut, isCopy, cut, copy, clear: clearClipboard, getItemStatus } = useClipboard();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadSubjects();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSubjects = async () => {
    const result = await getFolders();
    setSubjects(result.filter((f) => f.is_root === 1));
  };

  const handleSort = (mode) => {
  let sorted = [...subjects];

  switch (mode) {
    case "Order by creation date":
      // Assuming your DB rows have a created_at field
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;

    case "Order by edit time":
      // Assuming your DB rows have an updated_at field
      sorted.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
      break;

    case "Order alphabetically":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "Order by color": 
      sorted.sort((a, b) => (a.color || "").localeCompare(b.color || ""));
      break;
  }

  setSubjects(sorted);
};

  // Handle create/edit
const handleSubject = async (cardData, mode) => {
  const trimmed = validateWithAlert(cardData.name, "Subject");
  if (!trimmed) return;

  if (mode === "create") {
    await addFolder(null, trimmed, null, 1);
  } else if (mode === "edit" && editTarget) {
    await updateFolder(editTarget.id, trimmed, editTarget.color);
  }

  setEditTarget(null);
  clearSelection();
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
    clearSelection();
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

  // Cut / Copy handlers using global clipboard
  const handleCutSelected = () => {
    cut(selectedItems.map((item) => ({ ...item, type: "Subject" })));
    clearSelection();
  };

  const handleCopySelected = () => {
    copy(selectedItems.map((item) => ({ ...item, type: "Subject" })));
    clearSelection();
  };

  // No paste in HomeScreen - subjects can't be pasted here
const handlePaste = async () => {
    if (clipboard.length === 0) return;

    for (const item of clipboard) {

        if (await isDescendant(item.id, node.id)) {
            Alert.alert("Not Allowed", "You cannot paste a folder into its own descendant.");
            continue;
        }

        if (isCut) {
            // Move subject/category to root
            if (item.type === "Subject" || item.type === "Category") {
                await moveFolder(item.id, null); // move to root
            } else {
                Alert.alert("Not Allowed", "You can only paste folders at Home.");
            }
        } else if (isCopy) {
            // Deep copy subject/category into root
            if (item.type === "Subject" || item.type === "Category") {
                await copyFolderRecursive(item.id, null);
            } else {
                Alert.alert("Not Allowed", "You can only paste folders at Home.");
            }
        }
    }

    clearClipboard();
    await loadSubjects();
};
                                           
  const handleAction = (action) => {
    switch (action) {
      case "delete":
        handleDeleteSelected();
        break;
      case "edit":
        handleEditSelected();
        break;
      case "cut":
        handleCutSelected();
        break;
      case "copy":
        handleCopySelected();
        break;
      case "clearClipboard":
        clearClipboard();
        break;
      case "paste":
        handlePaste();
        break;
      case "search":
        console.log("Search pressed");
        break;
      case "settings":
        console.log("Settings pressed");
        break;
      case "deleted":
        console.log("Deleted items pressed");
        break;
      case "color":
        console.log("Color pressed");
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary}]}>

        {/* HeaderBar */}
        <HeaderBar
            selectedCount={selectedItems.length}
            totalCount={subjects.length}
            onSort={handleSort}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
            onCancelSelection={() => clearSelection()}
            onSelectAll={() => selectAll(subjects)}
        />

        {/* Subjects */}
        {subjects.length === 0 ? (
            <View style={[styles.container, styles.centered]}>
                <Text style={[styles.midText, {color: colors.textSecondary}]}>What Do You Want To Learn About?</Text>
            </View>
        ) : (
            <>
                <Text style={[styles.title, styles.centeredText, { marginTop: headerHeight + 20, color: colors.textPrimary }]}>
                    Subjects
                </Text>

                <FlatList
                    data={subjects}
                    keyExtractor={(item) => item.id.toString()}
                    style={{ marginTop: 10 }}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            icon="folder"
                            isSelected={isSelected(item)}
                            secondarySelect={secondarySelect}
                            onPress={() => {
                                if (secondarySelect) {
                                    toggleSelection(item);                         // Toggle selection if in secondary select mode
                                } else {
                                    navigation.navigate("Folder", { node: item }); // Navigate to Folder screen on press
                                }
                            }}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, "Subject")}

                        />
                    )}
                />
            </>
        )}

        {/* Create Subjects Button */}
        <View style={[styles.buttonContainer, { bottom: footerHeight + 20 }]}>
            <CircleButton icon="plus" onPress={() => setModalVisible(true)} />
        </View>

        {/* Footer */}
        <FooterBar
            selectedCount={selectedItems.length}
            hasClipboard={hasClipboard}
            onAction={handleAction}
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

        {/* Confirmation Modal for Deletion */}
        <ConfirmationModal
            visible={confirmVisible}
            onCancel={() => setConfirmVisible(false)}
            onConfirm={confirmDelete}
            message={deleteTarget?.message || ""}
            confirmText="Delete"
            confirmColor={colors.danger}
        />

      </View>
    );
}