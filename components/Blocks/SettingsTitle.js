import { View, Text } from "react-native";
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Just a block that repeats a lot in the SettingsScreen, used to display titles
export default function SectionBlock({ title, description }) {
    return (
        <>
            {title && (
                <View style={[styles.rowCenter, styles.paddingHorizontal, styles.paddingVertical, {backgroundColor: colors.bgSecondary, marginTop: 10}]}>
                    <View style={[styles.itemColorDisplay, {backgroundColor: colors.accentLight}]} />
                    <Text style={[styles.midText, {color: colors.textPrimary, marginLeft: 10}]}>{title}</Text>
                </View>
            )}
            {description && (
                <Text style={[styles.tinyText, styles.paddingHorizontal, {color: colors.textHalfOpacity, marginVertical: 10}]}>
                    {description}
                </Text>
            )}
        </>
    );
}