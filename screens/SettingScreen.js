import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Components
import SectionBlock from "../components/Blocks/SettingsTitle.js";
import RadioButton from "../components/Buttons/RadioButton.js";
import DraggableListButton from "../components/Buttons/DraggableListButton.js"
import InformationModal from "../components/Modals/InformationModal.js";
import ConfirmationModal from "../components/Modals/ConfirmationModal.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { useTheme } from "../context/ThemeContext.js";

// Database Queries and Storage
import { saveColorOrder, loadColorOrder, saveColorSortPreference, loadColorSortPreference } from "../storage/sortPreference.js";
import { exportDatabase, importDatabase } from "../database/exportDb.js";

// Language
import { useTranslation } from 'react-i18next';
import { useLanguage } from "../context/LanguageContext.js";

// Settings - Preferences and Synchronisation
export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { currentTheme, colors, changeTheme, availableThemes } = useTheme();
    const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
    const { t } = useTranslation();
    const [colorOrder, setColorOrder] = useState([]);
    const [colorSortMode, setColorSortMode] = useState("");
    const [infoVisible, setInfoVisible] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ title: "", message: "" });
    const [confirmVisible, setConfirmVisible] = useState(false);

    // Load saved preferences on mount
    useEffect(() => {
        const loadSettings = async () => {
            const savedOrder = await loadColorOrder();
            const savedSortPref = await loadColorSortPreference();
            setColorOrder(savedOrder);
            setColorSortMode(savedSortPref);
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
        const result = await exportDatabase();
        if (result.success) {
            setInfoMessage({
                title: t("titles.exportSuccess"),
                message: t("infoMessages.exportSuccess")
            });
            setInfoVisible(true);
        } else {
            setInfoMessage({
                title: t("titles.exportFail"),
                message: result.error || t("infoMessages.exportFail")
            });
            setInfoVisible(true);
        }
    };

    const handleImportConfirm = () => {setConfirmVisible(true)};

    const handleImport = async () => {
        setConfirmVisible(false);
        
        const result = await importDatabase();
        if (result.success) {
            setInfoMessage({
                title: t("titles.exportSuccess"),
                message: t("infoMessages.exportSuccess")
            });
            setInfoVisible(true);
        } else if (result.error !== 'Import cancelled') {
            setInfoMessage({
                title: t("titles.exportFail"),
                message: result.error || t("infoMessages.exportFail")
            });
            setInfoVisible(true);
        }
    };

    const handleCloseInfo = () => {
        setInfoVisible(false);
        setInfoMessage({ title: "", message: "" });
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
                        <RadioButton key={themeName} label={themeName} selected={currentTheme === themeName} onPress={() => changeTheme(themeName)}/>
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
                    <TouchableOpacity onPress={handleExport} style={[styles.underShadow, styles.normalButton,  styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
                        <FontAwesome name="upload" size={18} color={colors.accentLight} />
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.export")}</Text>
                    </TouchableOpacity>

                    {/* Import Button */}
                    <TouchableOpacity onPress={handleImportConfirm} style={[styles.underShadow, styles.normalButton, styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
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

            {/* Confirmation Modal for Import */}
            <ConfirmationModal
                visible={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                onConfirm={handleImport}
                title={t("buttons.importDB")}
                message={t("infoMessages.import")}
                confirmText={t("buttons.import")}
                confirmColor={colors.accent}
            />

        </View>
    );
}