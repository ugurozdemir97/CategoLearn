import { TouchableOpacity, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors } from "../../styles/colors";
import styles from "../../styles/styles"; 

// Buttons on the footer
export default function FooterButton({ name, onPress, label, color = colors.textPrimary }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.centered, { gap: 3 }]}>
            <FontAwesome name={name} size={22} color={color} />
            <Text style={[styles.tinyText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}