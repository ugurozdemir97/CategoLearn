import React from "react";
import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";

// Map string names to FontAwesome icon names
const iconMap = {
    folder: "folder",
    plus: "plus",
    card: "file",
    back: "chevron-left"
};

// Circular button component that can display different icons based on the "icon" prop
export default function CircleButton({ icon, onPress, isGoBack = false }) {
    let iconName = iconMap[icon];
    if (!iconName) iconName = "question";

    return (
        <TouchableOpacity style={[styles.circleButton, isGoBack && styles.goBackButton]} onPress={onPress}>
            <FontAwesome name={iconName} size={isGoBack ? 16 : 20} color="white"/>
        </TouchableOpacity>
    );
}