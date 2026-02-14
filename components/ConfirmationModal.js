import { Modal, View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// A simple confirmation modal with customizable message and actions
export default function ConfirmationModal({ visible, onCancel, onConfirm, message, title = "Confirm Action", confirmText = "Confirm", confirmColor = colors.danger}) {
    
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
            <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>

                    <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary, marginBottom: 10 }]}>{title}</Text>
                    <Text style={[styles.smallText, styles.centeredText, {color: colors.textSecondary, marginBottom: 10 }]}>{message}</Text>

                    <View style={[styles.rowSpaceBetween, { marginTop: 10, gap: 10 }]}>
                        <TouchableOpacity onPress={onCancel} style={[styles.normalButton, {backgroundColor: colors.bgSecondary}]}>
                            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onConfirm} style={[styles.normalButton, {backgroundColor: confirmColor}]}>
                            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}