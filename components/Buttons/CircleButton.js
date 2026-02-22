import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";

// Reusable circular button
export default function CircleButton({ icon, onPress }) {

    const iconName = {
        plus: "plus",
        folder: "folder",
        file: "file-text-o",
        pencil: "pencil",
    } [icon] || "plus";

    return (
        <TouchableOpacity style={[ styles.circleButton, styles.centered, {backgroundColor: colors.accent, borderColor: colors.accentLight} ]} onPress={onPress} >
            <FontAwesome name={iconName} size={24} color={colors.textPrimary}/>
        </TouchableOpacity>
    );
}