import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, View, Text, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { useTheme } from "../../context/ThemeContext.js";
import { useTranslation } from 'react-i18next';
import styles from "../../styles/styles.js";

// A simple confirmation modal with customisable message and actions
export default function ConfirmationModal({ visible, onCancel, onConfirm, message, title, confirmText, confirmColor = null}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    useEffect(() => {
        if (!visible) {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [visible]);

    const requestClose = () => {
        if (!submittingRef.current) onCancel();
    };

    const handleConfirm = async () => {
        if (submittingRef.current) return;

        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            await onConfirm();
        } catch (error) {
            // The caller owns user-facing failure feedback and modal state.
            console.error("Confirmation action failed:", error);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={requestClose}>
            <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                    <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>

                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>{title || t("titles.confirm")}</Text>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, marginBottom: 15 }]}>{message}</Text>

                        <View style={[ styles.rowCenter, styles.spaceBetween, {gap: 10} ]}>
                            <TouchableOpacity disabled={isSubmitting} onPress={requestClose} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.bgSecondary, flex: 1, opacity: isSubmitting ? 0.55 : 1 }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.cancel")}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity disabled={isSubmitting} onPress={handleConfirm} style={[styles.underShadow, styles.normalButton, {backgroundColor: confirmColor ? confirmColor : colors.accent, flex: 1, opacity: isSubmitting ? 0.55 : 1 }]}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={colors.textPrimary}/>
                                ) : (
                                    <Text style={[styles.midText, { color: colors.textPrimary }]}>{confirmText || t("buttons.confirmAction")}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
