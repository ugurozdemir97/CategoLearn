import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
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
import { colors } from "../styles/colors.js";

// Database Queries and Storage
import { saveColorOrder, loadColorOrder, saveColorSortPreference, loadColorSortPreference } from "../storage/sortPreference.js";
import { exportDatabase, importDatabase } from "../database/exportDb.js";

// Temporary, I will load these from AsyncStorage
const COLOR_NAMES = { null: "None", "#000000": "Black", "#FFFFFF": "White", "#bb0000": "Red", "#00b700": "Green", "#0000da": "Blue", "#ffdd00": "Yellow", "#980081": "Purple", "#00e19d": "Mint" };

// Settings - Preferences and Synchronisation
export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
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
                title: "Export Successful",
                message: "Your database has been exported successfully. Save the file in a safe location."
            });
            setInfoVisible(true);
        } else {
            setInfoMessage({
                title: "Export Failed",
                message: result.error || "Failed to export database. Please try again."
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
                title: "Import Successful",
                message: "Database imported successfully. Please restart the app to see your data."
            });
            setInfoVisible(true);
        } else if (result.error !== 'Import cancelled') {
            setInfoMessage({
                title: "Import Failed",
                message: result.error || "Failed to import database. Please try again."
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

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>

                {/* Screen Title */}
                <Text style={[styles.bigText, styles.paddingHorizontal, { color: colors.textPrimary }]}>Settings</Text>

                {/* Color Settings */}
                <SectionBlock title="Colors" description="Which color order would you like to use to sort the items? Click and drag the colors or use the arrow buttons to reorder them."/>

                {/* Color drag list */}
                <DraggableFlatList
                    data={colorOrder}
                    keyExtractor={(item) => item ?? "none"}  // ?? is like || this one. But for "null" or "undefined", while || is for "false"
                    onDragEnd={handleDragEnd}
                    activationDistance={8}
                    scrollEnabled={false}
                    style={styles.paddingHorizontal}
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
                <SectionBlock title={null} description="Sort colors by"/>

                <View style={[styles.paddingHorizontal, {flex: 1, marginBottom: 10, gap: 10}]}>
                    <RadioButton
                        label="Name"
                        selected={colorSortMode === "Order alphabetically"}
                        onPress={() => updateColorSortMode("Order alphabetically")}
                    />
                    <RadioButton
                        label="Last Edit Time"
                        selected={colorSortMode === "Order by edit time"}
                        onPress={() => updateColorSortMode("Order by edit time")}
                    />
                </View>

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />


                {/* Theme Settings */}
                <SectionBlock title="Themes" description="Coming soon..." />

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Language Settings */}
                <SectionBlock title="Languages" description="Coming soon..." />

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Synchronisation Settings */}
                <SectionBlock title="Backup & Restore" description="Export your database to backup your data, or import a previously exported database to restore it."/>

                <View style={[styles.paddingHorizontal, { gap: 10, marginBottom: 20 }]}>

                    {/* Export Button */}
                    <TouchableOpacity onPress={handleExport} style={[ styles.normalButton,  styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
                        <FontAwesome name="upload" size={18} color={colors.accentLight} />
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>Export Database</Text>
                    </TouchableOpacity>

                    {/* Import Button */}
                    <TouchableOpacity onPress={handleImportConfirm} style={[ styles.normalButton, styles.rowCenter, styles.centered, {backgroundColor: colors.bgCard, gap: 10 }]}>
                        <FontAwesome name="download" size={18} color={colors.accentLight} />
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>Import Database</Text>
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
                title="Import Database"
                message="Importing will replace your current database. Your current data will be backed up. Continue?"
                confirmText="Import"
                confirmColor={colors.accent}
            />

        </View>
    );
}