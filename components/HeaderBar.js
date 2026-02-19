import { useState, useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { saveSortMode, loadSortMode } from "../storage/sortPreference.js";
import { useSortMode } from "../context/SortModeContext.js";

const sortModes = [
    "Order alphabetically",
    "Order by creation date",
    "Order by edit time",
    "Order by color",
];

const deletedSortModes = [
    "Order alphabetically",
    "Order by creation date",
    "Order by edit time",
    "Order by deletion time",
    "Order by color",
];

// HeaderBar component with sort button and selection info
export default function HeaderBar({ selectedCount, totalCount = 0, onSort, items, setItems, onLayout, onCancelSelection, onSelectAll, isDeletedScreen = false}) {

    // Safe area insets for preventing overlap with navigation buttons/status bar
    const insets = useSafeAreaInsets();
    const [sortIndex, setSortIndex] = useState(0);
    const { setSortMode } = useSortMode();
    
    // Choose sort modes based on screen type
    const modes = isDeletedScreen ? deletedSortModes : sortModes;

    // Load last sort mode when component mounts
    useEffect(() => {
        (async () => {
            const savedMode = await loadSortMode();
            const index = modes.indexOf(savedMode);

            if (index !== -1) {
                setSortIndex(index);
                setSortMode(savedMode);
            } else {
                setSortIndex(0);
                setSortMode(modes[0]);
                await saveSortMode(modes[0]);
            }
        })();
    }, [isDeletedScreen]);

    // Cycle through sort modes on button press
    const cycleSort = async () => {
        const nextIndex = (sortIndex + 1) % modes.length;
        setSortIndex(nextIndex);
        const mode = modes[nextIndex];
        setSortMode(mode); // Update global context
        onSort(items, setItems, mode, isDeletedScreen);
        await saveSortMode(mode);
    };

    return (
        <View style={[styles.paddingHorizontal, styles.spaceBetween, styles.rowCenter,  { paddingTop: insets.top + 10, paddingBottom: 10, backgroundColor: colors.bgPrimary }]} onLayout={onLayout}>
            
            {selectedCount > 0 ? (
                <View style={[styles.rowCenter, styles.spaceBetween, {flex: 1}]}>

                    {/* Selected Count */}
                    <Text style={[styles.smallText, { color: colors.textPrimary }]}>
                       {selectedCount}/{totalCount} selected
                    </Text>

                    <View style={[styles.centered, {flexDirection: "row", gap: 15, height: 20}]}>

                        {/* Cancel Selection */}
                        <TouchableOpacity onPress={onCancelSelection}>
                            <FontAwesome name="times" size={23} color={colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Select All */}
                        <TouchableOpacity onPress={onSelectAll}>
                            <FontAwesome name="check-square" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                      
                    </View>
                </View>

            ) : (

                // Change Sort Mode
                <TouchableOpacity onPress={cycleSort} style={[styles.rowCenter, {gap: 10, height: 20}]}>
                    <Text style={[styles.smallText, { color: colors.textPrimary}]}>{modes[sortIndex]}</Text>
                    <FontAwesome name="caret-down" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
            )}
        </View>
    );
}