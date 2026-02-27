import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { useTheme } from "../../context/ThemeContext.js";
import { useTranslation } from 'react-i18next';
import styles from "../../styles/styles.js";

// A simple confirmation modal with customisable message and actions
export default function ConfirmationModal({ visible, onCancel, onConfirm, message, title, confirmText, confirmColor = null}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
            <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                    <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>

                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>{title || t("titles.confirm")}</Text>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, marginBottom: 15 }]}>{message}</Text>

                        <View style={[ styles.rowCenter, styles.spaceBetween, {gap: 10} ]}>
                            <TouchableOpacity onPress={onCancel} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.cancel")}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onConfirm} style={[styles.underShadow, styles.normalButton, {backgroundColor: confirmColor ? confirmColor : colors.accent, flex: 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{confirmText || t("buttons.confirmAction")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}