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
import { getFolders, getCards, addFolder, addCard, updateFolder, updateCard, deleteFolder, isDescendant, deleteCard, moveFolder, moveCard, addField, getFields, copyFolderRecursive, deleteField} from "../database/queries.js";

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

  // Use shared hooks
  const { selectedItems, secondarySelect, toggleSelection, clear: clearSelection, isSelected, selectAll } = useSelection();
  const { clipboard, hasClipboard, isCut, isCopy, cut, copy, clear: clearClipboard, getItemStatus } = useClipboard();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadChildren();
    });
    return unsubscribe;
  }, [navigation]);

  const loadChildren = async () => {
    const folders = await getFolders(node.id);
    const cards = await getCards(node.id);

    setChildren([
      ...folders.map((f) => ({ ...f, type: "Category", displayName: f.name })),
      ...cards.map((c) => ({ ...c, type: "Card", displayName: c.title })),
    ]);
  };

  const handleItem = async (cardData, mode) => {
    const trimmed = validateWithAlert(cardData.name, cardData.type);
    if (!trimmed) return;

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
    clearSelection();
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
    clearSelection();
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

  // Cut / Copy using global clipboard
  const handleCutSelected = () => {
    cut(selectedItems);
    clearSelection();
  };

  const handleCopySelected = () => {
    copy(selectedItems);
    clearSelection();
  };

  // Paste with optimization: use moveFolder/moveCard for cut operations
const handlePaste = async () => {
    if (clipboard.length === 0) return;

    for (const item of clipboard) {

        if (await isDescendant(item.id, node.id)) {
            Alert.alert("Not Allowed", "You cannot paste a folder into its own descendant.");
            continue;
        }

        if (isCut) {
            // Move folder or card
            if (item.type === "Category" || item.type === "Subject") {
                await moveFolder(item.id, node.id);
            } else if (item.type === "Card") {
                await moveCard(item.id, node.id);
            } else {
                Alert.alert("Not Allowed", "You can paste fields only inside cards.");
            }
        } else if (isCopy) {
            // Duplicate folder (deep copy)
            if (item.type === "Category" || item.type === "Subject") {
                await copyFolderRecursive(item.id, node.id);
            }
            // Duplicate card
            else if (item.type === "Card") {
                const newCardId = await addCard(node.id, item.displayName || item.title);
                const oldFields = await getFields(item.id);
                for (const f of oldFields) {
                    await addField(newCardId, f.field_name, f.context);
                }
            }
            // Duplicate field (only allowed inside cards)
            else if (item.type === "Field") {
                Alert.alert("Not Allowed", "You can paste fields only inside cards.");
            }
        }
    }

    clearClipboard();
    await loadChildren();
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
    case "paste":
      handlePaste();
      break;
    case "clearClipboard":
      clearClipboard();   // ✅ new feature
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

            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={children.length}
                onSort={(mode) => console.log("Sort mode:", mode)}
                onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(children)}
            />

            <Text style={[styles.title, styles.centeredText, { marginTop: headerHeight + 20, color: colors.textPrimary }]}>{node.name}</Text>

            {children.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, {color: colors.textSecondary}]}>No Items Yet</Text>
                </View>
            ) : (
                <FlatList
                    data={children}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ListButton
                          label={item.displayName}
                          icon={item.type === "Category" ? "folder" : "file"}
                          isSelected={isSelected(item)}
                          secondarySelect={secondarySelect}
                          onPress={() => {
                              if (secondarySelect) {
                                  toggleSelection(item);
                              } else {
                                  if (item.type === "Category") {
                                      navigation.push("Folder", { node: item });
                                  } else {
                                      navigation.navigate("CardDetail", { card: item });
                                  }
                              }
                          }}
                          onLongPress={() => toggleSelection(item)}
                          status={getItemStatus(item.id, item.type)}
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
                confirmColor={colors.danger}
            />

        </View>
    );
}