import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { formatDate } from "../utils/formatTime.js";

// Items (Categories, Cards, and Fields)
export default function ListButton({ label, updatedAt, deletedAt, icon, onPress, onLongPress, isSelected, color = null, status = {}, context = null, expanded = false}) {

    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    // Show dates only if item is not selected, cut, or copied
    const showDates = !isSelected && !status.isCut && !status.isCopied;

    // Determine if this is a field with context that can be expanded
    const hasContext = context && context.length > 0;

    // Use deletedAt if provided, otherwise use updatedAt
    const displayDate = deletedAt || updatedAt;

    return (
        <View style={{alignItems: "center"}}>
            <TouchableOpacity
                style={[ styles.paddingHorizontal, styles.paddingVertical, styles.rowCenter, styles.spaceBetween, dynamicStyle, {marginTop: 8}]}
                onPress={onPress}
                onLongPress={onLongPress}
            >

                {/* Left color stripe */}
                <View key={color} style={[styles.itemColorDisplay, styles.dashedBorder, {backgroundColor: color || "transparent", borderColor: !color ? colors.bgPrimary : "transparent"}]}/>

                <View style={[styles.rowCenter, { flex: 1, marginLeft: 10 }]}>
                    <FontAwesome name={icon} size={18} color={colors.accentLight} style={{ marginRight: 14 }}/>

                    {/* Label */}
                    <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                        {label}
                    </Text>
                </View>

                {/* Right side: status icons (cut/copy) and selection checkmark or expand arrow */}
                <View style={[styles.rowCenter, { gap: 8 }]}>
                    {showDates && (
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.tinyText, { color: colors.textHalfOpacity }]}>
                                {formatDate(displayDate)}
                            </Text>
                        </View>
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

            {/* Expanded context (only for fields with context) */}
            {expanded && hasContext && (
                <View style={[styles.contextArea, styles.paddingVertical, styles.paddingHorizontal, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.smallText, { color: colors.textSecondary }]}>{context}</Text>
                </View>
            )}
        </View>
    );
}