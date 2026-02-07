import { Modal, View, Text, Button } from "react-native";
import styles from "../styles/styles.js";

export default function ConfirmationModal({ visible, onCancel, onConfirm, message = "Are you sure?", confirmText = "Delete"}) {
  
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { width: "80%" }]}>
                <Text style={styles.modalTitle}>{message}</Text>
                <View style={styles.modalButtons}>
                    <Button title="Cancel" onPress={onCancel} />
                    <Button title={confirmText} color="red" onPress={onConfirm} />
                </View>
                </View>
            </View>
        </Modal>
    );
}