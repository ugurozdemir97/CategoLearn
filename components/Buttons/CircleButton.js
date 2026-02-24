import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Reusable circular button for creating and editing items
export default function CircleButton({ icon, onPress }) {

    const iconName = { plus: "plus", folder: "folder", file: "file-text-o", pencil: "pencil" } [icon] || "plus";

    return (
        <TouchableOpacity style={[ styles.circleButton, styles.centered, {backgroundColor: colors.accent, borderColor: colors.accentLight} ]} onPress={onPress} >
            <FontAwesome name={iconName} size={24} color={colors.textPrimary}/>
        </TouchableOpacity>
    );
}