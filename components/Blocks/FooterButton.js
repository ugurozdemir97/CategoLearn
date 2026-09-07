import { TouchableOpacity, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles"; 

// Buttons on the footer
export default function FooterButton({ name, onPress, label, color = null, disabled = false }) {
    const { colors } = useTheme();
    const contentColor = disabled ? colors.textHalfOpacity : (color || colors.textPrimary);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            accessibilityState={{ disabled }}
            style={[styles.centered, { gap: 3, opacity: disabled ? 0.55 : 1 }]}
        >
            <FontAwesome name={name} size={22} color={contentColor}/>
            <Text style={[styles.tinyText, { color: contentColor }]}>{label}</Text>
        </TouchableOpacity>
    );
}
