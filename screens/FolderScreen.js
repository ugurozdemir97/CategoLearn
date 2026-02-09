import { useState, useEffect } from "react";
import { View, Text, FlatList, Alert } from "react-native";

// Components
import CircleButton from "../components/CircleButton.js";
import ListButton from "../components/ListButton.js";
import CreateModal from "../components/CreateModal.js";
import ConfirmationModal from "../components/ConfirmationModal.js";
import HeaderBar from "../components/HeaderBar.js";
import FooterBar from "../components/FooterBar.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Context and Hooks
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { validateWithAlert } from "../utils/validation.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleDeleteSelected, handleEditSelected, handleCutSelected, handleCopySelected, handlePaste } from "../utils/handleFooterActions.js";

// Database queries
import { getFolders, getCards, addFolder, addCard, updateFolder, updateCard, deleteFolder, deleteCard, addField, getFields, deleteField } from "../database/queries.js";

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
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, isSelected, selectAll } = useSelection();
    const { clipboard, hasClipboard, isCut, isCopy, cut, copy, clearClipboard, getItemStatus } = useClipboard();

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadChildren()});
        return unsubscribe;
    }, [navigation]);

    const loadChildren = async () => {
        const folders = await getFolders(node.id);
        const cards = await getCards(node.id);

        setChildren([
            ...folders.map((f) => ({ ...f, type: "Category", name: f.name })),
            ...cards.map((c) => ({ ...c, type: "Card", name: c.name })),
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
                    await addField(cardId, f.name, f.context);
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
                    await addField(editTarget.id, f.name, f.context);
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

    // Footer action handlers for delete, edit, cut, copy, paste
    // These call the respective functions from utils/handleFooterActions.js with the right parameters for subjects
    const handleDeleteSelectedWrapper = () => handleDeleteSelected(selectedItems, setDeleteTarget, setConfirmVisible, "items");
    const handleEditSelectedWrapper = () =>   handleEditSelected(selectedItems, setModalVisible, setEditTarget, setNewName);
    const handleCutSelectedWrapper = () =>    handleCutSelected(selectedItems, cut, clearSelection);
    const handleCopySelectedWrapper = () =>   handleCopySelected(selectedItems, copy, clearSelection);
    const handlePasteWrapper = () =>          handlePaste(clipboard, isCut, isCopy, node, clearClipboard, loadChildren);

    // Call the right handler based on action from FooterBar
    const handleAction = (action) => {
        switch (action) {
            case "delete": handleDeleteSelectedWrapper(); break;
            case "edit": handleEditSelectedWrapper(); break;
            case "cut": handleCutSelectedWrapper(); break;
            case "copy": handleCopySelectedWrapper(); break;
            case "paste": handlePasteWrapper(); break;
            case "clearClipboard": clearClipboard(); break;
            default: break;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={children.length}
                onSort={handleSort}
                items={children}
                setItems={setChildren}
                onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
                onCancelSelection={() => clearSelection()}
                onSelectAll={() => selectAll(children)}
            />

            <Text
                style={[
                    styles.title,
                    styles.centeredText,
                    { marginTop: headerHeight + 20, color: colors.textPrimary }
                ]}
            >
                {node.name}
            </Text>

            {children.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, { color: colors.textSecondary }]}>
                        No Items Yet
                    </Text>
                </View>
                ) : (
                <FlatList
                    data={children}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            icon={item.type === "Category" ? "folder" : "file"}
                            isSelected={isSelected(item)}
                            secondarySelect={secondarySelect}
                            onPress={() => {
                                if (secondarySelect) {
                                    toggleSelection(item);                         // Toggle selection if in secondary select mode
                                } else {
                                    if (item.type === "Category") {
                                        navigation.push("Folder", { node: item }); // Navigate to Folder screen on press
                                    } else {
                                        navigation.navigate("CardDetail", { card: item }); // Navigate to CardDetail screen on press
                                    }
                                }
                            }}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, item.type)}
                        />
                    )}
                />
            )}

            {/* Create Buttons */}
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

            {/* Confirmation Modal */}
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