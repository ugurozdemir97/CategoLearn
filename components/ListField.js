import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Fields inside cards
export default function ListField({
    label,
    context,
    onPress,
    onLongPress,
    isSelected,
    secondarySelect,
    status = {},
    expanded = false,
}) {
    // Apply styles based on cut/copy status
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.item,
                    styles.rowSpaceBetween,
                    isSelected && styles.itemSelected,
                    dynamicStyle,
                ]}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* Left side: field name */}
                <Text
                    style={[styles.smallText, { flex: 1, color: colors.textSecondary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {label || "(Untitled)"}
                </Text>

                {/* Right side: status icons + expand/collapse */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {status.isCut && (
                        <FontAwesome name="scissors" size={16} color={colors.danger} />
                    )}
                    {status.isCopied && (
                        <FontAwesome name="copy" size={16} color={colors.accentLight} />
                    )}
                    {secondarySelect ? (
                        isSelected && (
                            <FontAwesome
                                name="check-circle"
                                size={18}
                                color={colors.accentLight}
                            />
                        )
                    ) : (
                        <FontAwesome
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={colors.textSecondary}
                        />
                    )}
                </View>
            </TouchableOpacity>

            {/* Expanded context */}
            {expanded && !secondarySelect && (
                <View style={[styles.field, { paddingLeft: 20, paddingRight: 16 }]}>
                    <Text style={styles.fieldContext}>{context}</Text>
                </View>
            )}
        </View>
    );
}