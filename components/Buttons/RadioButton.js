import { TouchableOpacity, View, Text } from "react-native";
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Custom radio buttons used in settings screen
export default function RadioButton({ label, selected, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.rowCenter, {gap: 10}]} activeOpacity={0.7}>
            <View style={[styles.radioCircle, styles.centered, { borderColor: selected ? colors.accentLight : colors.textPrimary }]}>
                {selected && <View style={[styles.radioInner, {backgroundColor: colors.accentLight}]} />}
            </View>
            <Text style={[styles.smallText, {color: selected ? colors.accentLight : colors.textPrimary}]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}