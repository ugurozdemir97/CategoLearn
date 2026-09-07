import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import ConfirmationModal from "../Modals/ConfirmationModal.js";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";
import { deleteFieldSet, loadFieldSets, saveFieldSet, updateFieldSet } from "../../storage/fieldSets.js";

const ACTIONS = [
    { mode: "save", icon: "floppy-o", labelKey: "buttons.save" },
    { mode: "load", icon: "folder-open-o", labelKey: "buttons.load" },
];

export default function FieldSetActions({ fields = [], onLoad, canLoad = true }) {
    // Modal and locally saved field-set state
    const [mode, setMode] = useState(null);
    const [fieldSets, setFieldSets] = useState([]);
    const [setName, setSetName] = useState("");
    const [message, setMessage] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [pendingUpdate, setPendingUpdate] = useState(null);
    const { colors } = useTheme();
    const { t } = useTranslation();

    // Refresh saved sets when the controls first appear or a modal opens.
    const refreshFieldSets = async () => setFieldSets(await loadFieldSets());

    useEffect(() => {
        refreshFieldSets();
    }, []);

    // A set needs at least one field, and every field must have a title.
    const hasFields = fields.length > 0;
    const allFieldsNamed = hasFields && fields.every((field) => String(field?.name || "").trim());
    const canSave = hasFields && allFieldsNamed;

    // Context is deliberately omitted; only a clean title and its color are saved.
    const validFields = fields
        .map((field) => ({ name: String(field?.name || "").trim(), color: field?.color || null }))
        .filter((field) => field.name);

    const openMode = async (nextMode) => {
        if (nextMode === "load" && !canLoad) return;
        setMessage("");
        setSetName("");
        await refreshFieldSets();
        setMode(nextMode);
    };

    const close = () => {
        setMode(null);
        setMessage("");
        setSetName("");
    };

    // Validate the current fields and save them under the entered set name.
    const handleSave = async () => {
        const trimmedName = setName.trim();
        if (!hasFields) {
            setMessage(t("fieldSets.fieldsRequired"));
            return;
        }
        if (!allFieldsNamed) {
            setMessage(t("fieldSets.unnamedField"));
            return;
        }
        if (!trimmedName) {
            setMessage(t("fieldSets.nameRequired"));
            return;
        }
        if (new Set(validFields.map((field) => field.name)).size !== validFields.length) {
            setMessage(t("fieldSets.duplicateFields"));
            return;
        }
        const existingSet = fieldSets.find((fieldSet) => fieldSet.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase());
        if (existingSet) {
            setPendingUpdate(existingSet);
            return;
        }

        try {
            await saveFieldSet(trimmedName, validFields);
            await refreshFieldSets();
            close();
        } catch (error) {
            console.error("Failed to save field set", error);
            setMessage(t("fieldSets.storageError"));
        }
    };

    // Replace a same-named set after the user confirms the overwrite.
    const confirmUpdate = async () => {
        try {
            await updateFieldSet(pendingUpdate.id, setName.trim(), validFields);
            await refreshFieldSets();
            setPendingUpdate(null);
            close();
        } catch (error) {
            console.error("Failed to update field set", error);
            setPendingUpdate(null);
            setMessage(t("fieldSets.storageError"));
        }
    };

    // Load the selected set into the current card or card creation modal.
    const handleLoad = async (fieldSet) => {
        try {
            await onLoad(fieldSet.fields);
            close();
        } catch (error) {
            console.error("Failed to load field set", error);
            setMessage(t("fieldSets.loadError"));
        }
    };

    // Delete only the saved shortcut; existing card fields are not changed.
    const confirmDelete = async () => {
        try {
            const updated = await deleteFieldSet(pendingDelete.id);
            setFieldSets(updated);
            setPendingDelete(null);
        } catch (error) {
            console.error("Failed to delete field set", error);
            setPendingDelete(null);
            setMessage(t("fieldSets.storageError"));
        }
    };

    const title = mode === "save" ? t("fieldSets.saveTitle") : t("fieldSets.loadTitle");

    return (
        <>
            <View style={styles.fieldSetActions}>
                {ACTIONS.map((action) => (
                    <TouchableOpacity
                        key={action.mode}
                        onPress={() => openMode(action.mode)}
                        disabled={(action.mode === "save" && !canSave) || (action.mode === "load" && !canLoad)}
                        style={[
                            styles.fieldSetActionButton,
                            { backgroundColor: colors.bgCard, borderColor: colors.textHalfOpacity },
                            (action.mode === "save" && !canSave) || (action.mode === "load" && !canLoad) ? { opacity: 0.35 } : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t(action.labelKey)}
                        accessibilityState={{ disabled: (action.mode === "save" && !canSave) || (action.mode === "load" && !canLoad) }}
                    >
                        <FontAwesome
                            name={action.icon}
                            size={13}
                            color={action.mode === "delete" ? colors.danger : colors.accentLight}
                        />
                        <Text
                            numberOfLines={1}
                            style={{ color: colors.textSecondary, fontSize: 9 }}
                        >
                            {t(action.labelKey)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Modal animationType="fade" transparent visible={mode !== null} onRequestClose={close}>
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                    <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                        <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>
                            {title}
                        </Text>
                        <Text style={[styles.smallText, styles.centeredText, { color: colors.textSecondary, marginBottom: 5 }]}>
                            {mode === "save" ? t("fieldSets.saveDescription") : t("fieldSets.pickDescription")}
                        </Text>

                        {message ? (
                            <Text style={[styles.smallText, styles.centeredText, { color: colors.danger, marginBottom: 10 }]}>
                                {message}
                            </Text>
                        ) : null}

                        {mode === "save" ? (
                            <>
                                {/* Use the same title input structure as the other create modals. */}
                                <View style={[styles.rowCenter, { gap: 10, marginVertical: 10 }]}>
                                    <TextInput
                                        autoFocus
                                        maxLength={50}
                                        value={setName}
                                        onChangeText={setSetName}
                                        onSubmitEditing={handleSave}
                                        placeholder={t("fieldSets.namePlaceholder")}
                                        placeholderTextColor={colors.textSecondary}
                                        style={[styles.underShadow, styles.input, styles.smallText, styles.paddingHorizontal, { color: colors.textSecondary, backgroundColor: colors.bgSecondary }]}
                                    />
                                </View>
                                <View style={[styles.rowCenter, { gap: 10 }]}>
                                    <TouchableOpacity onPress={close} style={[styles.normalButton, { flex: 1, backgroundColor: colors.bgSecondary }]}>
                                        <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.cancel")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        disabled={!canSave}
                                        style={[styles.normalButton, { flex: 1, backgroundColor: colors.accent }, !canSave ? { opacity: 0.35 } : null]}
                                    >
                                        <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.save")}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
                                    {fieldSets.length === 0 ? (
                                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, paddingVertical: 18 }]}>
                                            {t("fieldSets.empty")}
                                        </Text>
                                    ) : fieldSets.map((fieldSet) => (
                                        <View
                                            key={fieldSet.id}
                                            style={[styles.rowCenter, styles.spaceBetween, { padding: 12, borderRadius: 6, backgroundColor: colors.bgSecondary }]}
                                        >
                                            <View style={{ flex: 1, marginRight: 10 }}>
                                                <Text numberOfLines={1} style={[styles.midText, { color: colors.textPrimary }]}>{fieldSet.name}</Text>
                                                <Text numberOfLines={1} style={[styles.tinyText, { color: colors.textHalfOpacity, marginTop: 2 }]}>
                                                    {fieldSet.fields.map((field) => field.name).join(" · ")}
                                                </Text>
                                            </View>
                                            {/* Each saved set can be loaded or deleted from this single list. */}
                                            <View style={[styles.rowCenter, { gap: 6 }]}>
                                                <TouchableOpacity
                                                    onPress={() => handleLoad(fieldSet)}
                                                    style={[styles.fieldSetRowButton, { borderColor: colors.accentLight }]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={t("buttons.load")}
                                                >
                                                    <FontAwesome name="plus" size={14} color={colors.accentLight} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => setPendingDelete(fieldSet)}
                                                    style={[styles.fieldSetRowButton, { borderColor: colors.danger }]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={t("buttons.delete")}
                                                >
                                                    <FontAwesome name="trash-o" size={14} color={colors.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={close} style={[styles.normalButton, { backgroundColor: colors.bgSecondary, marginTop: 12 }]}>
                                    <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.cancel")}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <ConfirmationModal
                visible={pendingUpdate !== null}
                onCancel={() => setPendingUpdate(null)}
                onConfirm={confirmUpdate}
                title={t("fieldSets.updateConfirmTitle")}
                message={t("fieldSets.updateConfirmMessage", { name: pendingUpdate?.name || "" })}
                confirmText={t("buttons.update")}
            />

            <ConfirmationModal
                visible={pendingDelete !== null}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={t("fieldSets.deleteConfirmTitle")}
                message={t("fieldSets.deleteConfirmMessage", { name: pendingDelete?.name || "" })}
                confirmText={t("buttons.delete")}
                confirmColor={colors.danger}
            />
        </>
    );
}
