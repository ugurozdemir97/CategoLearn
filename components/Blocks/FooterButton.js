import { TouchableOpacity, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles"; 

// Buttons on the footer
export default function FooterButton({ name, onPress, label, color =  null}) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={[styles.centered, { gap: 3 }]}>
            <FontAwesome name={name} size={22} color={color || colors.textPrimary}/>
            <Text style={[styles.tinyText, {color: color ? color :  colors.textPrimary}]}>{label}</Text>
        </TouchableOpacity>
    );
}