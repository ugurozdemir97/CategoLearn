import { useState, useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

// Components
import HeaderMode from "../Blocks/HeaderMode.js";

// Styles
import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";

// Context and Hooks
import { saveSortMode, saveDeletedSortMode } from "../../storage/sortPreference.js";
import { useSortMode } from "../../context/SortModeContext.js";

// Available sort modes
const sortModes = [
    "Order by edit time",
    "Order alphabetically",
    "Order by creation date",
    "Order by color",
    "Custom order",
];

// Available sort modes for deleted screen
const deletedSortModes = [
    "Order by deletion time",
    "Order alphabetically",
    "Order by creation date",
    "Order by edit time",
    "Order by color"
];

// HeaderBar component with sort button and selection info
export default function HeaderBar({ selectedCount, totalCount = 0, onSort, items, setItems, onCancelSelection, onSelectAll, isDeletedScreen = false, customSortMode = false, onEnterCustomSort, onSaveCustomSort, onCancelCustomSort }) {

    const insets = useSafeAreaInsets();             // Used to move header down, below any device bar or camera
    const [sortIndex, setSortIndex] = useState(0);  // In which sort modes we are in
    const { sortMode, setSortMode, deletedSortMode, setDeletedSortMode } = useSortMode();
    
    // Choose sort modes based on screen type
    const modes =          isDeletedScreen ? deletedSortModes   : sortModes;
    const currentMode =    isDeletedScreen ? deletedSortMode    : sortMode;
    const setCurrentMode = isDeletedScreen ? setDeletedSortMode : setSortMode;

    // Set sort mode when component mounts or sort mode changes
    useEffect(() => {

        const index = modes.indexOf(currentMode);  // Get the index of last used sort mode

        // ıf everything works as espected, set sortIndex value which will be used to switch sort modes.
        // And update the sort mode through context
        if (index !== -1) {
            setSortIndex(index);
            if (isDeletedScreen) setDeletedSortMode(currentMode);
            else                 setSortMode(currentMode);
        
        // If by chance there is no sort mode, set the default ones (first items) as sort mode
        } else {
            setSortIndex(0);
            setCurrentMode(modes[0]);
            if (isDeletedScreen) saveDeletedSortMode(modes[0]);
            else                 saveSortMode(modes[0]);
        }

    }, [isDeletedScreen, currentMode]);

    // Cycle through sort modes on button press
    const cycleSort = async () => {
        const nextIndex = (sortIndex + 1) % modes.length;
        const mode = modes[nextIndex];
        setSortIndex(nextIndex);
        setCurrentMode(mode);
        onSort(items, setItems, mode, isDeletedScreen);
        
        // Save to correct storage based on screen type
        if (isDeletedScreen) await saveDeletedSortMode(mode);
        else                 await saveSortMode(mode);
    };

    return (
        <View style={[styles.paddingHorizontal, styles.spaceBetween, styles.rowCenter,  { paddingTop: insets.top + 10, paddingBottom: 10, backgroundColor: colors.bgPrimary, minHeight: 70 }]}>
            
            {/* This is custom sort mode, when we enable drag and sort items, show cancel and save buttons */}
            {customSortMode ? (
                <HeaderMode label="Reorder Items" onCancel={onCancelCustomSort} onConfirm={onSaveCustomSort}/>

            // This is selection mode, if we have any selected items, show cancel and select all buttons
            ) : selectedCount > 0 ? (
                <HeaderMode label={`${selectedCount}/${totalCount} selected`} onCancel={onCancelSelection} onConfirm={onSelectAll}/>

            // Normal header, show "Order by x" button
            ) : (           
                <View style={[styles.rowCenter, styles.spaceBetween, {flex: 1}]}>
                    <TouchableOpacity onPress={cycleSort} style={[styles.rowCenter, {gap: 10}]}>
                        <Text style={[styles.smallText, { color: colors.textPrimary}]}>{modes[sortIndex]}</Text>
                        <FontAwesome name="caret-down" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Edit Custom Order Button - only for normal screens with Custom order mode is selected */}
                    {!isDeletedScreen && currentMode === "Custom order" && onEnterCustomSort && (
                        <TouchableOpacity onPress={onEnterCustomSort} style={[styles.rowCenter, {gap: 10}]}>
                            <FontAwesome name="edit" size={16} color={colors.textPrimary} style={{marginTop: 3}}/>
                            <Text style={[styles.smallText, { color: colors.textPrimary}]}>Edit order</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}