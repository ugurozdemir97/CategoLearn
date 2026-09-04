import { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Components
import SectionBlock from "../components/Blocks/SettingsTitle.js";
import RadioButton from "../components/Buttons/RadioButton.js";
import DraggableListButton from "../components/Buttons/DraggableListButton.js"
import InformationModal from "../components/Modals/InformationModal.js";
import ImportDatabaseModal from "../components/Modals/ImportDatabaseModal.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Database Queries and Storage
import { saveColorOrder, loadColorOrder, saveColorSortPreference, loadColorSortPreference } from "../storage/sortPreference.js";
import {
    discardPreparedImport,
    exportDatabase,
    importPreparedDatabase,
    prepareDatabaseImport
} from "../database/exportDb.js";

// Language
import { useTranslation } from 'react-i18next';
import { useLanguage } from "../context/LanguageContext.js";

// Settings - Preferences and Synchronisation
export default function SettingsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { currentTheme, colors, changeTheme, availableThemes } = useTheme();
    const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
    const { t } = useTranslation();
    const [colorOrder, setColorOrder] = useState([]);
    const [colorSortMode, setColorSortMode] = useState("alphabetical");
    const [infoVisible, setInfoVisible] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ title: "", message: "" });
    const [importOptionsVisible, setImportOptionsVisible] = useState(false);
    const [preparedImport, setPreparedImport] = useState(null);
    const [busyMessage, setBusyMessage] = useState(null);
    const [resetAfterInfo, setResetAfterInfo] = useState(false);

    // Load saved preferences on mount
    useEffect(() => {
        const loadSettings = async () => {
            const savedOrder = await loadColorOrder();
            const savedSortPref = await loadColorSortPreference();
            setColorOrder(savedOrder);
            if (savedSortPref) setColorSortMode(savedSortPref);
        };

        loadSettings();

    }, []);

    // Update color order in state and save to storage
    const updateColorOrder = (order) => {
        setColorOrder(order);
        saveColorOrder(order);
    };

    // Update sort mode in state and save to storage
    const updateColorSortMode = (mode) => {
        setColorSortMode(mode);
        saveColorSortPreference(mode);
    };

    // Move colors by pressing the arrow buttons
    const moveColor = (item, direction) => {
        setColorOrder((prev) => {
          const currentIndex = prev.indexOf(item);
          const targetIndex = currentIndex + direction;

          // If item is already the first one and we try to move it up 
          // or it is the last item and we try to move it down
          // Just return the current color order
          if (targetIndex < 0 || targetIndex >= prev.length) return prev;

          // Swap 2 elements, the item you move goes to target place and swap places with the item there
          const newOrder = [...prev];
          newOrder[currentIndex] = newOrder[targetIndex];
          newOrder[targetIndex] = item;
          saveColorOrder(newOrder);
          return newOrder;
        });
    };

    // Handle export
    const handleExport = async () => {
        if (busyMessage) return;
        setBusyMessage(t("infoMessages.exporting"));
        const result = await exportDatabase();
        setBusyMessage(null);

        if (result.success) {
            setInfoMessage({
                title: result.saveUnconfirmed ? t("titles.exportReady") : t("titles.exportSuccess"),
                message: result.saveUnconfirmed
                    ? t("infoMessages.exportSaveUnconfirmed")
                    : t("infoMessages.exportSuccess")
            });
            setInfoVisible(true);
        } else if (!result.cancelled) {
            setInfoMessage({
                title: t("titles.exportFail"),
                message: t(`infoMessages.${result.errorCode || "exportFailed"}`)
            });
            setInfoVisible(true);
        }
    };

    const handleImportStart = async () => {
        if (busyMessage) return;
        const result = await prepareDatabaseImport(() => {
            setBusyMessage(t("infoMessages.validatingImport"));
        });
        setBusyMessage(null);

        if (result.success) {
            setPreparedImport(result.preparedImport);
            setImportOptionsVisible(true);
        } else if (!result.cancelled) {
            setInfoMessage({
                title: t("titles.importFail"),
                message: t(`infoMessages.${result.errorCode || "invalidDatabase"}`)
            });
            setInfoVisible(true);
        }
    };

    const handleImportCancel = async () => {
        const importToDiscard = preparedImport;
        setImportOptionsVisible(false);
        setPreparedImport(null);
        if (importToDiscard) await discardPreparedImport(importToDiscard);
    };

    const handleImport = async (mode) => {
        const importToApply = preparedImport;
        setImportOptionsVisible(false);
        setBusyMessage(t("infoMessages.importing"));
        const result = await importPreparedDatabase(importToApply, mode);
        setPreparedImport(null);
        setBusyMessage(null);

        if (result.success) {
            setInfoMessage({
                title: t("titles.importSuccess"),
                message: t(result.mode === "replace" ? "infoMessages.importReplaceSuccess" : "infoMessages.importKeepSuccess")
            });
            setResetAfterInfo(true);
            setInfoVisible(true);
        } else {
            setInfoMessage({
                title: t("titles.importFail"),
                message: t(`infoMessages.${result.errorCode || "importFailed"}`)
            });
            setInfoVisible(true);
        }
    };

    const handleCloseInfo = () => {
        setInfoVisible(false);
        setInfoMessage({ title: "", message: "" });
        if (resetAfterInfo) {
            setResetAfterInfo(false);
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        }
    };

    // Dragging items will change the color order too.
    const handleDragEnd = useCallback(({ data }) => { updateColorOrder(data); }, []);

    // Names of the colors
    const COLOR_NAMES = { 
        null: "None", 
        "#000000": t("colors.black") , 
        "#FFFFFF": t("colors.white") , 
        "#bb0000": t("colors.red") , 
        "#00b700": t("colors.green") , 
        "#0000da": t("colors.blue") , 
        "#ffdd00": t("colors.yellow") , 
        "#980081": t("colors.purple") , 
        "#00e19d": t("colors.mint")
    }; 

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>

                {/* Screen Title */}
                <Text style={[styles.bigText, styles.paddingHorizontal, { color: colors.textPrimary }]}>{t("titles.settings")}</Text>

                {/* Color Settings */}
                <SectionBlock title={t("titles.colors")} description={t("infoMessages.colorPick")}/>

                {/* Color drag list */}
                <DraggableFlatList
                    data={colorOrder}
                    keyExtractor={(item) => item ?? "none"}  // ?? is like || this one. But for "null" or "undefined", while || is for "false"
                    onDragEnd={handleDragEnd}
                    activationDistance={8}
                    scrollEnabled={false}
                    style={[styles.paddingHorizontal, {paddingBottom: 10}]}
                    renderItem={({ item, index, drag, isActive }) => (
                        <ScaleDecorator activeScale={1.03}>
                            <DraggableListButton
                                item={item}
                                index={index}
                                totalItems={colorOrder.length}
                                drag={drag}
                                isActive={isActive}
                                onMoveUp={() => moveColor(item, -1)}
                                onMoveDown={() => moveColor(item, 1)}
                                colorNames={COLOR_NAMES}
                            />
                        </ScaleDecorator>
                    )}
                />

                {/* Sort order radio buttons */}
                <SectionBlock title={null} description={t("infoMessages.sortColorsBy")}/>

                <View style={[styles.paddingHorizontal, {flex: 1, marginBottom: 10, gap: 10}]}>
                    <RadioButton
                        label={t("sort.name")}
                        selected={colorSortMode === "alphabetical"}
                        onPress={() => updateColorSortMode("alphabetical")}
                    />
                    <RadioButton
                        label={t("sort.lastEdit")}
                        selected={colorSortMode === "editTime"}
                        onPress={() => updateColorSortMode("editTime")}
                    />
                </View>

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />


                {/* Theme Settings */}
                <SectionBlock title={t("titles.themes")} description={t("infoMessages.prefferedTheme")}/>

                <View style={[styles.paddingHorizontal, {flex: 1, marginBottom: 10, gap: 10}]}>
                    {availableThemes.map((themeName) => (
                        <RadioButton key={themeName} label={t(`themes.${themeName}`)} selected={currentTheme === themeName} onPress={() => changeTheme(themeName)}/>
                    ))}
                </View>

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Language Settings */}
                <SectionBlock title={t("titles.languages")} description={t("infoMessages.language")}/>

                <View style={[styles.paddingHorizontal, {flex: 1, marginBottom: 10, gap: 10}]}>
                    {availableLanguages.map((lang) => (
                        <RadioButton key={lang.code} label={lang.name} selected={currentLanguage === lang.code} onPress={() => changeLanguage(lang.code)}/>
                    ))}
                </View>

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Synchronisation Settings */}
                <SectionBlock title={t("titles.backup")} description={t("infoMessages.export")}/>

                <View style={[styles.paddingHorizontal, { gap: 10, marginBottom: 20 }]}>

                    {/* Export Button */}
                    <TouchableOpacity disabled={Boolean(busyMessage)} onPress={handleExport} style={[styles.underShadow, styles.normalButton,  styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
                        <FontAwesome name="upload" size={18} color={colors.accentLight} />
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.export")}</Text>
                    </TouchableOpacity>

                    {/* Import Button */}
                    <TouchableOpacity disabled={Boolean(busyMessage)} onPress={handleImportStart} style={[styles.underShadow, styles.normalButton, styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
                        <FontAwesome name="download" size={18} color={colors.accentLight} />
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.importDB")}</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Information Modal */}
            <InformationModal
                visible={infoVisible}
                onClose={handleCloseInfo}
                title={infoMessage.title}
                message={infoMessage.message}
            />

            {/* Import is offered only after the selected database passes validation. */}
            <ImportDatabaseModal
                visible={importOptionsVisible}
                onCancel={handleImportCancel}
                onReplace={() => handleImport("replace")}
                onKeep={() => handleImport("keep")}
            />

            {/* This modal blocks every app interaction while a backup operation is active. */}
            <Modal visible={Boolean(busyMessage)} transparent={true} animationType="fade" onRequestClose={() => {}}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }]}>
                    <View style={[styles.underShadow, styles.modalContent, styles.centered, { backgroundColor: colors.bgModal, gap: 12 }]}>
                        <ActivityIndicator size="large" color={colors.accentLight} />
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary }]}>{busyMessage}</Text>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
