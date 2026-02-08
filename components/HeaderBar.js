import { useState, useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

const sortModes = [
    "Order by creation date",
    "Order by edit time",
    "Order alphabetically",
    "Order by color",
];

// HeaderBar component with sort button and selection info
export default function HeaderBar({ selectedCount, totalCount = 0, onSort, onLayout, onCancelSelection, onSelectAll}) {

    // Safe area insets for preventing overlap with navigation buttons/status bar
    const insets = useSafeAreaInsets();
    const [sortIndex, setSortIndex] = useState(0);

    // Cycle through sort modes on button press
    const cycleSort = () => {
        const nextIndex = (sortIndex + 1) % sortModes.length;
        setSortIndex(nextIndex);
        onSort(sortModes[nextIndex]); 
    };

    return (
        <View style={[styles.headerAndFooter, styles.header, { paddingTop: insets.top, height: insets.top + 50, backgroundColor: colors.bgSecondary }]} onLayout={onLayout}>
            {selectedCount > 0 ? (
                <View style={[styles.rowSpaceBetween, { flex: 1 }]}>

                    {/* Selected Count */}
                    <Text style={[styles.smallText, { color: colors.textPrimary }]}>
                      {selectedCount}/{totalCount} selected
                    </Text>

                    <View style={[styles.centered, {flexDirection: "row", gap: 15}]}>

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
                <TouchableOpacity onPress={cycleSort} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={[styles.smallText, { color: colors.textPrimary}]}>
                        {sortModes[sortIndex]}
                    </Text>
                    <FontAwesome name="caret-down" size={23} color={colors.textPrimary} />
                </TouchableOpacity>
            )}
        </View>
    );
}