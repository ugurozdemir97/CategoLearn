import { TouchableOpacity, Text, View } from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";
import ScrollingText from "../Blocks/ScrollingText.js";

// Draggable version of ListButton for custom sorting
export default function DraggableListButton({ item, index, totalItems, drag, isActive, onMoveUp, onMoveDown }) {
    
    const getIcon = (type) => {
        if (type === "Category") return "folder";
        if (type === "Card") return "file-text-o";
        return "align-left";
    };

    return (
        <View style={[ styles.paddingHorizontal, styles.paddingVertical, styles.rowCenter, styles.spaceBetween, { marginTop: 8, gap: 10, backgroundColor: isActive ? colors.bgCardCopied : colors.bgCard, borderWidth: 1, borderColor: isActive ? colors.accentLight : "transparent", }]}>

            {/* Left: Color stripe + Icon + Drag handle + Name */}
            <TouchableOpacity onLongPress={drag} delayLongPress={150} activeOpacity={1} style={[styles.rowCenter, { flex: 1, gap: 10 }]}>

                {/* Color stripe */}
                <View style={[styles.itemColorDisplay, styles.dashedBorder, {backgroundColor: item.color || "transparent", borderColor: ! item.color ? colors.bgPrimary : "transparent"}]}/>

                {/* Icon */}
                <FontAwesome name={getIcon(item.type)} size={18} color={colors.accentLight}/>

                {/* Drag dots */}
                <View style={styles.dragDots}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={[styles.dragDot, { backgroundColor: colors.textHalfOpacity }]}/>
                    ))}
                </View>

                {/* Name with auto-scroll */}
                <ScrollingText text={item.name} />

            </TouchableOpacity>

            {/* Right: Arrow buttons */}
            <View style={[styles.rowCenter, { gap: 4 }]}>
                <GHPressable onPress={onMoveUp} disabled={index === 0} style={({ pressed }) => [ styles.arrowButton, styles.centered, {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary}]}>
                    <FontAwesome name="arrow-up" size={15} color={index === 0 ? colors.textHalfOpacity : colors.textPrimary} />
                </GHPressable>
                <GHPressable onPress={onMoveDown} disabled={index === totalItems - 1} style={({ pressed }) => [ styles.arrowButton, styles.centered, {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary}]}>
                    <FontAwesome name="arrow-down" size={15} color={index === totalItems - 1 ? colors.textHalfOpacity : colors.textPrimary} />
                </GHPressable>
            </View>
        </View>
    );
}