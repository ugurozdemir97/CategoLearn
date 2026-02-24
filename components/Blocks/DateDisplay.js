import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Styles
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Utils
import { formatDate } from "../../utils/formatTime.js";

// Component that re-renders itself to update dates
export default function DateDisplay({ date, icon }) {
    const [, forceUpdate] = useState(0);

    // Update every minute to keep dates fresh
    useEffect(() => {
        const interval = setInterval(() => {forceUpdate(n => n + 1)}, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={[styles.rowCenter, { gap: 4 }]}>
            <FontAwesome name={icon} size={10} color={colors.textHalfOpacity} />
            <Text style={[styles.tinyText, { color: colors.textHalfOpacity }]}>
                {formatDate(date)}
            </Text>
        </View>
    );
}