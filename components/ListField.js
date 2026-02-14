import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Fields inside cards
export default function ListField({ label, context, onPress, onLongPress, isSelected, status = {}, expanded = false}) {
    
    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    return (
        <View style={{alignItems: "center"}}>
            <TouchableOpacity
                style={[ styles.item, styles.rowSpaceBetween, isSelected && styles.itemSelected, dynamicStyle]}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* Left side: field name */}
                <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {label}
                </Text>

                {/* Right side: status icons + expand/collapse */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                            <FontAwesome name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary}/>
                        )
                    )}
                </View>
            </TouchableOpacity>

            {/* Expanded context */}
            {expanded && context?.length > 0 && (
                <View style={[styles.contextArea, { borderColor: colors.accentLight }]}>
                    <Text style={[styles.smallText, { color: colors.textSecondary }]}>{context}</Text>
                </View>
            )}
        </View>
    );
}