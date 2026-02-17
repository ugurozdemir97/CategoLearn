import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Items (Subjects, Folders, etc.) 
export default function ListButton({ label, updatedAt, icon, onPress, onLongPress, isSelected, color = null, status = {}}) {

    // Apply styles based on status (is Cut or Copied)
    const dynamicStyle = {
        opacity: status.isCut ? 0.5 : 1,
        backgroundColor: status.isCopied ? colors.bgCardCopied : colors.bgCard,
    };

    // Format dates nicely
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-GB"); // e.g. 15/02/2026
    };

    // Show dates only if item is not selected, cut, or copied
    const showDates = !isSelected && !status.isCut && !status.isCopied;

    return (
        <TouchableOpacity
            style={[ styles.paddingHorizontal, styles.paddingVertical, styles.rowCenter, styles.spaceBetween, dynamicStyle, {marginTop: 8}]}
            onPress={onPress}
            onLongPress={onLongPress}
        >

            {/* Left color stripe */}
            <View key={color} style={[styles.itemColorDisplay, {backgroundColor: color || "transparent"}]}/>

            <View style={[styles.rowCenter, { flex: 1, marginLeft: 5 }]}>
                <FontAwesome name={icon} size={20} color={colors.accentLight} style={{ marginRight: 14 }}/>
                <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {label}
                </Text>
            </View>

            {/* Right side: status icons (cut/copy) and selection checkmark */}
            <View style={[styles.rowCenter, { gap: 8 }]}>
                {showDates && (
                    <View style={{ alignItems: "flex-end" }}>
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
                {isSelected && (
                    <FontAwesome name="check-circle" size={18} color={colors.accentLight} />
                )}
            </View>

        </TouchableOpacity>
    );
}