import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";
import { formatDate } from "../utils/formatTime.js";

// Fields inside cards
export default function ListField({ label, updatedAt, context, onPress, onLongPress, isSelected, status = {}, color = null, expanded = false}) {
    
    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    // Show dates only if item is not selected, cut, or copied
    const showDates = !isSelected && !status.isCut && !status.isCopied;

    return (
        <View style={{alignItems: "center"}}>
            <TouchableOpacity
                style={[ styles.paddingHorizontal, styles.paddingVertical, styles.rowCenter, styles.spaceBetween, dynamicStyle, {marginTop: 8}]}
                onPress={onPress}
                onLongPress={onLongPress}
            >

                {/* Left color stripe */}
                <View key={color} style={[styles.itemColorDisplay, styles.dashedBorder, {backgroundColor: color || "transparent", borderColor: !color ? colors.bgPrimary : "transparent"}]}/>

                {/* Left side: field name */}
                <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary, marginLeft: 10 }]} numberOfLines={1} ellipsizeMode="tail">
                    {label}
                </Text>

                {/* Right side: status icons + expand/collapse */}
                <View style={[styles.rowCenter, { gap: 8 }]}>
                    {showDates && (
                        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
                            <Text style={[styles.tinyText, { color: colors.textHalfOpacity }]}>
                                {formatDate(updatedAt)}
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
                        context?.length > 0 && (
                            <FontAwesome name={expanded ? "chevron-down" : "chevron-up"} size={18} color={colors.textSecondary}/>
                        )
                    )}
                </View>
            </TouchableOpacity>

            {/* Expanded context */}
            {expanded && context?.length > 0 && (
                <View style={[styles.contextArea, styles.paddingVertical, styles.paddingHorizontal, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.smallText, { color: colors.textSecondary }]}>{context}</Text>
                </View>
            )}
        </View>
    );
}