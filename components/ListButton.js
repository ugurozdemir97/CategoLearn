import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Items (Subjects, Folders, etc.) 
export default function ListButton({ label, icon, onPress, onLongPress, isSelected, status = {}}) {

    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    return (
        <TouchableOpacity
            style={[ styles.item, styles.rowSpaceBetween, isSelected && styles.itemSelected, dynamicStyle]}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <FontAwesome name={icon} size={20} color={colors.accentLight} style={{ marginRight: 14 }}/>
                <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {label}
                </Text>
            </View>

            {/* Right side: status icons (cut/copy) and selection checkmark */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {status.isCut && (
                    <FontAwesome name="scissors" size={18} color={colors.accentLight} />
                )}
                {status.isCopied && (
                    <FontAwesome name="copy" size={18} color={colors.accentLight} />
                )}
                {isSelected && (
                    <FontAwesome name="check-circle" size={20} color={colors.accentLight} />
                )}
            </View>

        </TouchableOpacity>
    );
}