import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// Reusable circular button for creating and editing items
export default function CircleButton({ icon, onPress, disabled = false }) {
    const { colors } = useTheme();

    const iconName = { plus: "plus", folder: "folder", file: "file-text-o", pencil: "pencil" } [icon] || "plus";

    return (
        <TouchableOpacity disabled={disabled} accessibilityState={{ disabled }} style={[ styles.underShadow, styles.circleButton, styles.centered, {backgroundColor: colors.accent, borderColor: colors.accentLight, opacity: disabled ? 0.4 : 1} ]} onPress={onPress} >
            <FontAwesome name={iconName} size={24} color="#ffffff"/>
        </TouchableOpacity>
    );
}
