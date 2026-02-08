import { Modal, View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// A simple confirmation modal with customizable message and actions
export default function ConfirmationModal({ visible, onCancel, onConfirm, message, confirmText = "Confirm", confirmColor = colors.danger}) {
    
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
            <View style={[styles.centered, {flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)"}]}>
                <View style={[styles.modalContent, {backgroundColor: colors.bgModal}]}>
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>{message}</Text>

                    <View style={[styles.rowSpaceBetween, { marginTop: 15, gap: 10 }]}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.bgSecondary, alignItems: "center"}}
                        >
                            <Text style={[styles.midText,{ color: colors.textPrimary}]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: confirmColor, alignItems: "center"}}
                        >
                            <Text style={[styles.midText,{ color: colors.textPrimary}]}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}