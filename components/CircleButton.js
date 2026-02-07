import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";

// Circular button component that can display different icons based on the "icon" prop
export default function CircleButton({ icon, onPress, isGoBack = false }) {

    return (
        <TouchableOpacity style={[styles.circleButton, isGoBack && styles.goBackButton]} onPress={onPress}>
            <FontAwesome name={icon} size={isGoBack ? 16 : 20} color="white"/>
        </TouchableOpacity>
    );
}