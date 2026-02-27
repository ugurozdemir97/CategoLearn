import { View, TouchableOpacity, Text } from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import { FontAwesome } from "@expo/vector-icons";

// Components
import ScrollingText from "../Blocks/ScrollingText.js";

// Styles
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// Language
import { useTranslation } from 'react-i18next';

// Draggable version of List Button used for ordering colors in settings screen and ordering items in custom mode
export default function DraggableListButton({ drag, isActive, index, totalItems, onMoveUp, onMoveDown, item, colorNames }) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const getIcon = (t) => {
        if (t === "Category") return "folder";
        if (t === "Card") return "file-text-o";
        return "align-left";
    };

    // Is it color drag list or item drag list
    const isColorMode = !!colorNames;

    return (
        <View style={[styles.underShadow, styles.colorRow, styles.rowCenter, { backgroundColor: isActive ? colors.bgCardCopied : colors.bgCard, borderWidth: 1, borderColor: isActive ? colors.accentLight : "transparent" }]}>
        
            {/* Color Box, Drag Handle, Item/Color name, Hex Code in Color mode */}
            <TouchableOpacity onLongPress={drag} delayLongPress={150} activeOpacity={1} style={[styles.rowCenter, { gap: 10, flex: 1 }]}>
                
                {isColorMode ? (
                    // Color Box, Drag Handle, Color Name, Color Hex Code
                    <>
                        <View style={[styles.colorBox, !item && styles.dashedBorder, {backgroundColor: item || "transparent", borderColor: item ? "transparent" : colors.textHalfOpacity }]}/>
                        <View style={styles.dragDots}>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <View key={i} style={[styles.dragDot, { backgroundColor: colors.textHalfOpacity }]}/>
                            ))}
                        </View>
                        <Text style={[styles.smallText, { color: colors.textPrimary, flex: 1 }]}>{colorNames[item] ?? item ?? t("titles.none")}</Text>
                        {item && (<Text style={[styles.tinyText, { color: colors.textHalfOpacity }]}>{item}</Text>)}
                    </>
                ) : (
                    // Color Box, Drag Handle, Item Icon, Item Name
                    <>
                        <View style={[styles.colorBox, !item.color && styles.dashedBorder, {backgroundColor: item.color || "transparent", borderColor: item.color ? "transparent" : colors.textHalfOpacity }]}/>
                        <View style={styles.dragDots}>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <View key={i} style={[styles.dragDot, { backgroundColor: colors.textHalfOpacity }]}/>
                            ))}
                        </View>
                        <FontAwesome name={getIcon(item.type)} size={18} color={colors.accentLight}/>
                        <ScrollingText text={item.name}/>
                    </>
                )}

            </TouchableOpacity>

            {/* Arrow buttons */}
            <View style={[styles.rowCenter, { gap: 4 }]}>
                <GHPressable
                    onPress={onMoveUp}
                    disabled={index === 0}
                    style={({ pressed }) => [
                        styles.arrowButton, styles.centered, 
                        {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary}
                    ]}
                >
                    <FontAwesome name="arrow-up" size={15} color={index === 0 ? colors.textHalfOpacity : colors.textPrimary}/>
                </GHPressable>

                <GHPressable
                    onPress={onMoveDown}
                    disabled={index === totalItems - 1}
                    style={({ pressed }) => [
                        styles.arrowButton, styles.centered,
                        {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary}
                    ]}
                >
                    <FontAwesome name="arrow-down" size={15} color={index === totalItems - 1 ? colors.textHalfOpacity : colors.textPrimary}/>
                </GHPressable>
            </View>
        </View>
    );
}