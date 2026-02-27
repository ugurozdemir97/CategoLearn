import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// A simple information modal with customizable message, generally for Alerts
export default function InformationModal({ visible, onClose, message, title = "Error" }) {
    const { colors } = useTheme();
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                    <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>
                        
                        {/* Messages */}
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>{title}</Text>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, marginBottom: 15 }]}>{message}</Text>

                        {/* Single button row */}
                        <View style={[ styles.rowCenter, styles.spaceBetween ]}>
                            <TouchableOpacity onPress={onClose} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.accent, flex: 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>Okay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}