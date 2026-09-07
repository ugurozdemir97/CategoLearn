import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
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
import BreadCrumb from "../components/Navigation/BreadCrumb.js";
import FieldSetActions from "../components/FieldSets/FieldSetActions.js";
import CollapsibleActionTray from "../components/Buttons/CollapsibleActionTray.js";
import ListLoadingIndicator from "../components/Blocks/ListLoadingIndicator.js";

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
import { formatDate } from "../utils/formatTime.js";
import { handleSort } from "../utils/handleSort.js";
import { handleEditSelected } from "../utils/handleFooterActions.js";
import { getSharedItemColor } from "../utils/colorSelection.js";

// Database Queries and Storage
import db from "../database/db.js";
import { getFields, addField, updateField, deleteField } from "../database/queries.js";

// Language
import { useTranslation } from 'react-i18next';

// CardDetailScreen: Displays contents of a card (fields). Create or edit them. 
export default function CardDetailScreen({ route, navigation }) {
    const { card, path, targetFieldId = null } = route.params;
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fieldContext, setFieldContext] = useState("");
    const [expanded, setExpanded] = useState({});
    const [cardDate, setCardDate] = useState(null);
    const [footerHeight, setFooterHeight] = useState(60);
    const fieldListRef = useRef(null);
    const targetScrollRetriesRef = useRef(0);

    // Custom hooks for state management
    const modals = useModalStates();
    const { selectedItems, secondarySelect, toggleSelection, clearSelection, selectAll, isSelected } = useSelection();
    const { clipboard, clipboardMode, cut, copy, clearClipboard, getItemStatus } = useClipboard();
    const { sortMode } = useSortMode();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const isSystemContainer = card.is_system_card === 1;

    // Load all fields inside this card from the database
    const loadFields = async () => {
        setIsLoading(true);
        try {
            const result = await getFields(card.id);
            await handleSort(result, setFields, sortMode);
            if (sortMode === "creationDate") setCardDate(card.created_at);
            else setCardDate(card.updated_at);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom sort functions for custom sort mode
    const customSort = useCustomSort(fields, setFields, loadFields, modals.setErrorMessages, () => modals.openInfoModal(modals.errorMessages));

    // Load fields when screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            loadFields();
        });
        return unsubscribe;
    }, [navigation, sortMode]);

    // Focus a field opened from search after the sorted field list is available.
    useEffect(() => {
        if (isLoading || targetFieldId === null) return;

        const targetIndex = fields.findIndex((field) => String(field.id) === String(targetFieldId));
        if (targetIndex === -1) return;

        const targetField = fields[targetIndex];
        targetScrollRetriesRef.current = 0;

        if (targetField.context?.length > 0) {
            setExpanded((current) => ({ ...current, [targetField.id]: true }));
        }

        requestAnimationFrame(() => {
            fieldListRef.current?.scrollToIndex({
                index: targetIndex,
                animated: true,
                viewPosition: 0.35
            });
        });

        // Treat search focus as a one-time request so selecting the same field later works again.
        navigation.setParams({ targetFieldId: null });
    }, [fields, isLoading, navigation, targetFieldId]);

    // FlatList cannot calculate every off-screen position until enough rows render.
    const handleTargetScrollFailure = ({ index, averageItemLength }) => {
        if (targetScrollRetriesRef.current >= 2) return;
        targetScrollRetriesRef.current += 1;

        fieldListRef.current?.scrollToOffset({
            offset: Math.max(0, averageItemLength * index),
            animated: true
        });

        setTimeout(() => {
            fieldListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
        }, 150);
    };

    // Handle creating or editing a field
    const handleField = async (editedField, mode) => {
        if (mode === "create") await addField(card.id, editedField.name, editedField.context, editedField.color);
        else                   await updateField(modals.editTarget?.id, editedField.name, editedField.context, editedField.color);

        await loadFields();
    };

    // Delete selected field(s) after confirmation
    const confirmDelete = async () => {
        try {
            if (modals.deleteTarget?.items) {
                for (const item of modals.deleteTarget.items) {
                    if (item.id) await deleteField(item.id);
                }
            }

            await loadFields();
            modals.closeDeleteModal();
            clearSelection();
        } catch (error) {
            console.error("Failed to delete fields:", error);
            modals.openInfoModal({ type: t("errorTitles.error"), message: t("errorMessages.actionFailed") });
        }
    };

    // Toggle expand/collapse of field to show/hide context
    const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    // Edit handler
    const handleEditSelectedWrapper = async () => {
        const result = await handleEditSelected(selectedItems, modals.setEditTarget, modals.openCreateModal, t, null, null, setFieldContext);
        if (result.length > 0) modals.openInfoModal(result);
    };

    // Change colors of selected items
    const applyColorToSelected = async (color) => {
        for (const item of selectedItems) await updateField(item.id, item.name, item.context, color);
        await loadFields();
        clearSelection();
    };

    // Load saved titles and colors directly into the database as empty fields.
    const loadFieldSetIntoCard = async (savedFields) => {
        // Read the database again so existing fields always win over loaded fields.
        const currentFields = await getFields(card.id);
        const existingNames = new Set(currentFields.map((field) => String(field.name || "").trim()));
        for (const field of savedFields) {
            if (!existingNames.has(field.name)) {
                await addField(card.id, field.name, "", field.color || null);
                existingNames.add(field.name);
            }
        }
        await loadFields();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>

            {/* HeaderBar */}
            <HeaderBar
                selectedCount={selectedItems.length}
                totalCount={fields.length}
                onSort={handleSort}
                items={fields}
                setItems={setFields}
                onCancelSelection={clearSelection}
                onSelectAll={() => selectAll(fields)}
                customSortMode={customSort.customSortMode}
                onEnterCustomSort={customSort.enterCustomSort}
                onSaveCustomSort={customSort.handleSaveCustomOrder}
                onCancelCustomSort={customSort.handleCancelCustomOrder}
            />

            <BreadCrumb
                path={path}
                onNavigate={async (node) => {
                    const targetIndex = path.findIndex(p => p.id === node.id);
                    if (targetIndex === 0) { navigation.navigate("Home"); return; }
                    const targetFolder = await db.getFirstAsync("SELECT * FROM folders WHERE id = ?", [node.id]);
                    navigation.navigate("Folder", { folder: targetFolder, path: path.slice(0, targetIndex + 1) });
                }}
            />

            {/* Card Title */}
            <View style={[styles.underShadow, styles.paddingHorizontal, styles.paddingVertical, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.bigText, { color: colors.textPrimary, marginBottom: 3 }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>{card.name}</Text>

                {/* Date display pinned bottom-right */}
                <View style={[styles.rowCenter, { gap: 4, position: "absolute", right: 10, bottom: 4 }]}>
                    <FontAwesome name={sortMode === "creationDate" ? "plus-circle" : "pencil"} size={10} color={colors.textHalfOpacity} />
                    <Text style={[styles.tinyText, { color: colors.textHalfOpacity }]}>
                        {formatDate(cardDate, t)}
                    </Text>
                </View>
            </View>

            {/* Fields */}
            {isLoading ? (
                <ListLoadingIndicator />
            ) : fields.length === 0 ? (
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary }]}>
                        {t("screenMessages.fields")}
                    </Text>
                </View>
            ) : customSort.customSortMode ? (
                // Custom sort mode - draggable list
                <DraggableFlatList
                    data={fields}
                    keyExtractor={(item, index) => item.id ? `Field-${item.id}-Card-${card.id}` : `temp-${index}`}
                    onDragEnd={customSort.handleDragEnd}
                    activationDistance={8}
                    style={{ marginTop: 8 }}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 15 }}
                    renderItem={({ item, index, drag, isActive }) => (
                        <ScaleDecorator activeScale={1.03}>
                            <DraggableListButton
                                item={item}
                                index={index}
                                totalItems={fields.length}
                                drag={drag}
                                isActive={isActive}
                                onMoveUp={() => customSort.moveItem(item, -1)}
                                onMoveDown={() => customSort.moveItem(item, 1)}
                            />
                        </ScaleDecorator>
                    )}
                />
            ) : (
                // Normal mode - regular list
                <FlatList
                    ref={fieldListRef}
                    data={fields}
                    keyExtractor={(item, index) => item.id ? `Field-${item.id}-Card-${card.id}` : `temp-${index}`}
                    style={{ marginTop: 8, paddingBottom: 15 }}
                    onScrollToIndexFailed={handleTargetScrollFailure}
                    renderItem={({ item }) => (
                        <ListButton
                            label={item.name}
                            updatedAt={item.updated_at}
                            createdAt={item.created_at}
                            context={item.context}
                            color={item.color}
                            icon="align-left"
                            isSelected={isSelected(item)}
                            onLongPress={() => toggleSelection(item)}
                            status={getItemStatus(item.id, "Field")}
                            expanded={expanded[item.id]}
                            onPress={() => {
                                if (secondarySelect) toggleSelection(item);
                                else toggleExpand(item.id);
                            }}
                        />
                    )}
                />
            )}

            {/* Collapsible field actions */}
            {!customSort.customSortMode && (
                <CollapsibleActionTray footerHeight={footerHeight}>
                    <FieldSetActions
                        fields={fields}
                        onLoad={loadFieldSetIntoCard}
                        canLoad={!isSystemContainer}
                    />
                    <CircleButton
                        icon={selectedItems.length === 1 ? "pencil" : "plus"}
                        disabled={selectedItems.length === 0 && isSystemContainer}
                        onPress={() => {
                            if (selectedItems.length === 1) handleEditSelectedWrapper();
                            else                            modals.openCreateModal();
                        }}
                    />
                </CollapsibleActionTray>
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
                    reloadItems={loadFields}
                    parent={card}
                    itemLabel="fields"
                    navigation={navigation}
                    onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                />
            )}

            {/* Modal for editing field */}
            <CreateModal
                visible={modals.modalVisible}
                onCreate={handleField}
                title={modals.editTarget ? t("titles.editField") : t("titles.createField")}
                placeholder={t("placeholders.fieldTitle")}
                value={modals.editTarget ? modals.editTarget.name : ""}
                color={modals.editTarget ? modals.editTarget.color : null}
                mode={modals.editTarget ? "edit" : "create"}
                isField={true}
                context={fieldContext}
                parentId={card.id}
                editTarget={modals.editTarget}
                onClose={() => {setFieldContext(""); modals.closeCreateModal(); clearSelection()}}
            />

            {/* Color Picker Modal */}
            <ColorModal
                visible={modals.colorModalVisible}
                onCancel={modals.closeColorModal}
                onConfirm={applyColorToSelected}
                selectedColor={getSharedItemColor(selectedItems)}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={modals.confirmVisible}
                onCancel={modals.closeDeleteModal}
                onConfirm={confirmDelete}
                title={t("titles.confirmDelete")}
                message={modals.deleteTarget?.message || ""}
                confirmText={t("buttons.delete")}
                confirmColor={colors.danger}
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
