import { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";

// Components
import CircleButton from "../components/Buttons/CircleButton.js";
import ListButton from "../components/Buttons/ListButton.js";
import DraggableListButton from "../components/Buttons/DraggableListButton.js";
import CreateModal from "../components/Modals/CreateModal.js";
import ColorModal from "../components/Modals/ColorModal.js";
import ConfirmationModal from "../components/Modals/ConfirmationModal.js";
import InformationModal from "../components/Modals/InformationModal.js";
import HeaderBar from "../components/Navigation/HeaderBar.js";
import FooterBar from "../components/Navigation/FooterBar.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Context and Hooks
import { useSortMode } from "../context/SortModeContext.js";
import { useClipboard } from "../context/ClipboardContext.js";
import { useSelection } from "../hooks/useSelection.js";
import { useModalStates } from "../hooks/useModalStates.js";
import { useCustomSort } from "../hooks/useCustomSort.js";

// Utils
import { handleSort } from "../utils/handleSort.js";
import { handleEditSelected } from "../utils/handleFooterActions.js";

// Database Queries and Storage
import { addFolder, getFolders, updateFolder, deleteFolder } from "../database/queries.js";
import { loadSortMode } from "../storage/sortPreference.js";

// Language
import { useTranslation } from 'react-i18next';

// HomeScreen: Displays all root folders (Subjects). Create or edit them.
export default function HomeScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);
    const [footerHeight, setFooterHeight] = useState(70);

    // Custom hooks for state management
    const modals = useModalStates();
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();
    const { sortMode } = useSortMode();
    const { colors } = useTheme();
    const { t } = useTranslation();

    // Load subjects when screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {loadSubjects()});
        return unsubscribe;
    }, [navigation, sortMode]);

    // Load all root folders (subjects) from the database
    const loadSubjects = async () => {
        const result = await getFolders(null);
        const lastMode = await loadSortMode();
        handleSort(result, setSubjects, lastMode);
    };

    // Custom sort functions for custom sort mode
    const customSort = useCustomSort(subjects, setSubjects, loadSubjects, modals.setErrorMessages, () => modals.openInfoModal(modals.errorMessages));

    // Handle Create or Edit
    const handleSubject = async (folderData, mode) => {
        if (mode === "create")                         await addFolder(null, folderData.name, folderData.color);
        else if (mode === "edit" && modals.editTarget) await updateFolder(modals.editTarget.id, folderData.name, folderData.color);

        modals.closeCreateModal();
        clearSelection();
        await loadSubjects();
    };

    // Delete selected subjects after confirmation
    const confirmDelete = async () => {
        if (modals.deleteTarget?.items) {
            for (const item of modals.deleteTarget.items) await deleteFolder(item.id);
        }

        modals.closeDeleteModal();
        clearSelection();
        await loadSubjects();
    };

    // Edit handler 
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, modals.setEditTarget, modals.openCreateModal, t);
        if (result.length > 0) modals.openInfoModal(result);
    };

    // Change colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) await updateFolder(item.id, item.name, color);
        await loadSubjects();
        clearSelection();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={subjects.length}
                onSort={handleSort}
                items={subjects}
                setItems={setSubjects}
                onCancelSelection={clearSelection}
                onSelectAll={() => selectAll(subjects)}
                customSortMode={customSort.customSortMode}
                onEnterCustomSort={customSort.enterCustomSort}
                onSaveCustomSort={customSort.handleSaveCustomOrder}
                onCancelCustomSort={customSort.handleCancelCustomOrder}
            />

            {/* Subjects */}
            {subjects.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary }]}>
                        {t("screenMessages.subjects")}
                    </Text>
                </View>
            ) : (
                <>
                    <View style={[styles.underShadow, styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary }]}>
                            {t("titles.subjects")}
                        </Text>
                    </View>

                    {customSort.customSortMode ? (
                        // Custom sort mode - draggable list
                        <DraggableFlatList
                            data={subjects}
                            keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                            onDragEnd={customSort.handleDragEnd}
                            activationDistance={8}
                            style={{ marginTop: 8, paddingHorizontal: 15, paddingBottom: 15 }}
                            renderItem={({ item, index, drag, isActive }) => (
                                <ScaleDecorator activeScale={1.03}>
                                    <DraggableListButton
                                        item={item}
                                        index={index}
                                        totalItems={subjects.length}
                                        drag={drag}
                                        isActive={isActive}
                                        onMoveUp={() => customSort.moveItemUp(index)}
                                        onMoveDown={() => customSort.moveItemDown(index)}
                                    />
                                </ScaleDecorator>
                            )}
                        />
                    ) : (
                        // Normal mode - regular list
                        <FlatList
                            data={subjects}
                            keyExtractor={(item, index) => item.id ? `${item.type}-${item.id}` : `temp-${index}`}
                            style={{ marginTop: 8, paddingBottom: 15 }}
                            renderItem={({ item }) => (
                                <ListButton
                                    label={item.name}
                                    updatedAt={item.updated_at}
                                    createdAt={item.created_at}
                                    color={item.color}
                                    icon="folder"
                                    isSelected={isSelected(item)}
                                    onLongPress={() => toggleSelection(item)}
                                    status={getItemStatus(item.id, "Category")}
                                    onPress={() => {
                                        if (secondarySelect) toggleSelection(item);
                                        else navigation.navigate("Folder", {folder: item, path: [{ id: null, name: "Subjects", type: "Category" }, { id: item.id, name: item.name, type: item.type, created_at: item.created_at, updated_at: item.updated_at }]});    
                                    }}
                                />
                            )}
                        />
                    )}
                </>
            )}

            {/* Create Subjects Button */}
            {!customSort.customSortMode && (
                <View style={[styles.buttonContainer, { bottom: footerHeight + 10, paddingBottom: 15 }]}>
                    <CircleButton
                        icon={selectedItems.length === 1 ? "pencil" : "plus"}
                        onPress={() => {
                            if (selectedItems.length === 1) handleEditSelectedWrapper();
                            else                            modals.openCreateModal();
                        }}
                    />
                </View>
            )}

            {/* Empty Spacing */}
            <View style={{ backgroundColor: colors.bgPrimary, height: 15 }} />

            {/* Footer */}
            {!customSort.customSortMode && (
                <FooterBar
                    selectedItems={selectedItems}
                    clipboard={clipboard}
                    clipboardMode={clipboardMode}
                    clearSelection={clearSelection}
                    openDeleteModal={modals.openDeleteModal}
                    openColorModal={modals.openColorModal}
                    openInfoModal={modals.openInfoModal}
                    cut={cut}
                    copy={copy}
                    clearClipboard={clearClipboard}
                    reloadItems={loadSubjects}
                    parent={null}
                    itemLabel="subjects"
                    navigation={navigation}
                    onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                />
            )}

            {/* Create/Edit Modal */}
            <CreateModal
                visible={modals.modalVisible}
                onCreate={handleSubject}
                title={modals.editTarget ? t("titles.editSubject") : t("titles.createSubject")}
                placeholder={t("placeholders.subjectName")}
                value={modals.editTarget ? modals.editTarget.name : ""}
                color={modals.editTarget ? modals.editTarget.color : null}
                mode={modals.editTarget ? "edit" : "create"}
                editTarget={modals.editTarget}
                onClose={() => {modals.closeCreateModal(); clearSelection()}}
            />

            {/* Confirmation Modal for Deletion */}
            <ConfirmationModal
                visible={modals.confirmVisible}
                onCancel={modals.closeDeleteModal}
                onConfirm={confirmDelete}
                title={t("titles.confirmDelete")}
                message={modals.deleteTarget?.message || ""}
                confirmText={t("buttons.delete")}
                confirmColor={colors.danger}
            />

            {/* Color Picker Modal */}
            <ColorModal
                visible={modals.colorModalVisible}
                onClose={() => {applyColorToSelected(modals.selectedColor); modals.closeColorModal()}}
                onSelect={(c) => modals.setSelectedColor(c)}
                selectedColor={modals.selectedColor}
            />

            {/* Information Modal For Errors */}
            <InformationModal
                visible={modals.infoVisible}
                onClose={modals.closeInfoModal}
                title={modals.errorMessages[0]?.type}
                message={modals.errorMessages[0]?.message}
            />

        </View>
    );
}