import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors } from "../../styles/colors"; 
import styles from "../../styles/styles";    

// When we are selecting or sorting items customarily show cancel and check buttons to save/select
export default function HeaderMode({ label, onCancel, onConfirm}) {
    return (
        <View style={[styles.rowCenter, styles.spaceBetween, { flex: 1 }]}>
            <Text style={[styles.smallText, { color: colors.textPrimary }]}>{label}</Text>
            <View style={[styles.rowCenter, { gap: 15 }]}>
                <TouchableOpacity onPress={onCancel}>
                    <FontAwesome name="times" size={23} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm}>
                    <FontAwesome name="check-square" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}