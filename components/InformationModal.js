import { Modal, View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// A simple information modal with customizable message, generally for Alerts
export default function InformationModal({ visible, onClose, message, title = "Error" }) {
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>
                    
                    {/* Messages */}
                    <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary, marginBottom: 10 }]}>{title}</Text>
                    <Text style={[styles.smallText, styles.centeredText, { color: colors.textSecondary, marginBottom: 10 }]}>{message}</Text>

                    {/* Single button row */}
                    <View style={[styles.rowSpaceBetween, { marginTop: 10 }]}>
                        <TouchableOpacity onPress={onClose} style={[styles.normalButton, { backgroundColor: colors.accent, flex: 1 }]}>
                            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Okay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}