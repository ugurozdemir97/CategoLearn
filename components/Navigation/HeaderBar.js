import { useState, useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";
import { saveSortMode, saveDeletedSortMode } from "../../storage/sortPreference.js";
import { useSortMode } from "../../context/SortModeContext.js";

const sortModes = [
    "Order by edit time",
    "Order alphabetically",
    "Order by creation date",
    "Order by color",
    "Custom order",
];

const deletedSortModes = [
    "Order by deletion time",
    "Order alphabetically",
    "Order by creation date",
    "Order by edit time",
    "Order by color"
];

// HeaderBar component with sort button and selection info
export default function HeaderBar({ 
    selectedCount, 
    totalCount = 0, 
    onSort, 
    items, 
    setItems, 
    onCancelSelection, 
    onSelectAll, 
    isDeletedScreen = false, 
    customSortMode = false, 
    onEnterCustomSort, 
    onSaveCustomSort, 
    onCancelCustomSort 
}) {

    const insets = useSafeAreaInsets();
    const [sortIndex, setSortIndex] = useState(0);
    const { sortMode, setSortMode, deletedSortMode, setDeletedSortMode } = useSortMode();
    
    // Choose sort modes based on screen type
    const modes = isDeletedScreen ? deletedSortModes : sortModes;
    const currentMode = isDeletedScreen ? deletedSortMode : sortMode;
    const setCurrentMode = isDeletedScreen ? setDeletedSortMode : setSortMode;

    // Load last sort mode when component mounts
    useEffect(() => {
        const index = modes.indexOf(currentMode);
        if (index !== -1) {
            setSortIndex(index);
            if (isDeletedScreen) {
                setDeletedSortMode(currentMode);
            } else {
                setSortMode(currentMode);
            }
        } else {
            setSortIndex(0);
            const defaultMode = modes[0];
            setCurrentMode(defaultMode);
            if (isDeletedScreen) {
                saveDeletedSortMode(defaultMode);
            } else {
                saveSortMode(defaultMode);
            }
        }
    }, [isDeletedScreen, currentMode]);

    // Cycle through sort modes on button press
    const cycleSort = async () => {
        const nextIndex = (sortIndex + 1) % modes.length;
        setSortIndex(nextIndex);
        const mode = modes[nextIndex];
        setCurrentMode(mode);
        onSort(items, setItems, mode, isDeletedScreen);
        
        // Save to correct storage based on screen type
        if (isDeletedScreen) {
            await saveDeletedSortMode(mode);
        } else {
            await saveSortMode(mode);
        }
    };

    return (
        <View style={[styles.paddingHorizontal, styles.spaceBetween, styles.rowCenter,  { paddingTop: insets.top + 10, paddingBottom: 10, backgroundColor: colors.bgPrimary }]}>
            
            {customSortMode ? (
                // Custom sort mode - show Cancel and Save buttons
                <View style={[styles.rowCenter, styles.spaceBetween, {flex: 1}]}>
                    <Text style={[styles.smallText, { color: colors.textPrimary }]}>Reorder Items</Text>
                    <View style={[styles.centered, {flexDirection: "row", gap: 15, height: 20}]}>
                        <TouchableOpacity onPress={onCancelCustomSort}>
                            <FontAwesome name="times" size={23} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSaveCustomSort}>
                            <FontAwesome name="check" size={23} color={colors.accent} />
                        </TouchableOpacity>
                    </View>
                </View>

            ) : selectedCount > 0 ? (
                // Selection mode
                <View style={[styles.rowCenter, styles.spaceBetween, {flex: 1}]}>
                    <Text style={[styles.smallText, { color: colors.textPrimary }]}>
                       {selectedCount}/{totalCount} selected
                    </Text>
                    <View style={[styles.centered, {flexDirection: "row", gap: 15, height: 20}]}>
                        <TouchableOpacity onPress={onCancelSelection}>
                            <FontAwesome name="times" size={23} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSelectAll}>
                            <FontAwesome name="check-square" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

            ) : (
                // Normal mode
                <View style={[styles.rowCenter, styles.spaceBetween, {flex: 1}]}>
                    <TouchableOpacity onPress={cycleSort} style={[styles.rowCenter, {gap: 10, height: 20}]}>
                        <Text style={[styles.smallText, { color: colors.textPrimary}]}>{modes[sortIndex]}</Text>
                        <FontAwesome name="caret-down" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Edit Custom Order Button - only for normal screens with Custom order */}
                    {!isDeletedScreen && currentMode === "Custom order" && onEnterCustomSort && (
                        <TouchableOpacity onPress={onEnterCustomSort} style={[styles.rowCenter, {gap: 8}]}>
                            <FontAwesome name="edit" size={18} color={colors.accent} />
                            <Text style={[styles.smallText, { color: colors.accent }]}>Edit Order</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}