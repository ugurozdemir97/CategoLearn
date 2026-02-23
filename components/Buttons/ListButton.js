import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";
import { useSortMode } from "../../context/SortModeContext.js";
import RichTextDisplay from "../Editor/RichTextDisplay.js";
import ScrollingText from "../Blocks/ScrollingText.js";
import DateDisplay from "../Blocks/DateDisplay.js";

// Items (Categories, Cards, and Fields)
export default function ListButton({ label, updatedAt, deletedAt, createdAt, icon, onPress, onLongPress, isSelected, color = null, status = {}, context = null, expanded = false}) {

    const { sortMode } = useSortMode();

    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    // Show dates only if item is not selected, cut, or copied
    const showDates = !isSelected && !status.isCut && !status.isCopied;

    // Determine if this is a field with context that can be expanded
    const hasContext = context && context.length > 0;

    // Determine which date and icon to show based on sort mode
    let displayDate = updatedAt;
    let dateIcon = "pencil";
    if (sortMode === "Order by deletion time" && deletedAt) {
        displayDate = deletedAt;
        dateIcon = "trash-o";
    } else if (sortMode === "Order by creation date" && createdAt) {
        displayDate = createdAt;
        dateIcon = "plus-circle";
    } else if (sortMode === "Order by edit time" && updatedAt) {
        displayDate = updatedAt;
        dateIcon = "pencil";
    } else {
        if (deletedAt) {
            displayDate = deletedAt;
            dateIcon = "trash-o";
        } 
    }

    return (
        <View style={{alignItems: "center"}}>
            <TouchableOpacity
                style={[ styles.paddingHorizontal, styles.paddingVertical, styles.rowCenter, styles.spaceBetween, dynamicStyle, {marginTop: 8, gap: 10}]}
                onPress={onPress}
                onLongPress={onLongPress}
            >

                {/* Left color stripe */}
                <View key={color} style={[styles.itemColorDisplay, styles.dashedBorder, {backgroundColor: color || "transparent", borderColor: !color ? colors.bgPrimary : "transparent"}]}/>

                {/* Label with folder icon and auto-scroll for long text */}
                <View style={[styles.rowCenter, { flex: 1, marginLeft: 10 }]}>
                    <FontAwesome name={icon} size={18} color={colors.accentLight} style={{ marginRight: 14 }}/>
                    <ScrollingText text={label}/>
                </View>

                {/* Right side: status icons (cut/copy) and selection checkmark or expand arrow */}
                <View style={[styles.rowCenter, { gap: 8, marginLeft: 10 }]}>
                    {showDates && (
                        <DateDisplay date={displayDate} icon={dateIcon} />
                    )}
                    {status.isCut && (
                        <FontAwesome name="scissors" size={18} color={colors.accentLight} />
                    )}
                    {status.isCopied && (
                        <FontAwesome name="copy" size={18} color={colors.accentLight} />
                    )}
                    {isSelected ? (
                        <FontAwesome name="check-circle" size={18} color={colors.accentLight}/>
                    ) : ( 
                        hasContext && (
                            <FontAwesome name={expanded ? "chevron-down" : "chevron-up"} size={18} color={colors.textSecondary}/>
                        )
                    )}
                </View>

            </TouchableOpacity>

            {/* Expanded context with rich text support */}
            {expanded && hasContext && (
                <View style={[styles.contextArea, styles.paddingVertical, styles.paddingHorizontal, { backgroundColor: colors.bgSecondary }]}>
                    <RichTextDisplay content={context}/>
                </View>
            )}
        </View>
    );
}