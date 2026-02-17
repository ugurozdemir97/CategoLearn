import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// A simple confirmation modal with customizable message and actions
export default function ConfirmationModal({ visible, onCancel, onConfirm, message, title = "Confirm Action", confirmText = "Confirm", confirmColor = colors.danger}) {
    
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
                <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>

                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>{title}</Text>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, marginBottom: 15 }]}>{message}</Text>

                        <View style={[ styles.rowCenter, styles.spaceBetween, {gap: 10} ]}>
                            <TouchableOpacity onPress={onCancel} style={[styles.normalButton, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onConfirm} style={[styles.normalButton, {backgroundColor: confirmColor, flex: 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}