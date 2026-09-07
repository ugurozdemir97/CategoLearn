import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, View, Text, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext.js";
import { useTranslation } from 'react-i18next';
import styles from "../../styles/styles.js";

const AVAILABLE_COLORS = [ "#000000", "#FFFFFF", "#bb0000", "#00b700", "#0000da", "#ffdd00", "#980081", "#00e19d", null ];

// A modal for previewing and confirming color changes
export default function ColorModal({ visible, onCancel, onConfirm, selectedColor }) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [pendingColor, setPendingColor] = useState(selectedColor);
    const [hasPendingSelection, setHasPendingSelection] = useState(selectedColor !== undefined);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    useEffect(() => {
        if (!visible) return;
        setPendingColor(selectedColor);
        setHasPendingSelection(selectedColor !== undefined);
        setErrorMessage("");
        setIsSubmitting(false);
        submittingRef.current = false;
    }, [selectedColor, visible]);

    const requestClose = () => {
        if (!submittingRef.current) onCancel();
    };

    const handleConfirm = async () => {
        if (submittingRef.current) return;

        // A mixed selection remains unchanged until the user explicitly chooses a color.
        if (!hasPendingSelection || pendingColor === selectedColor) {
            onCancel();
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            await onConfirm(pendingColor);
            onCancel();
        } catch (error) {
            console.error("Color save failed:", error);
            setErrorMessage(t("errorMessages.saveFailed"));
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={requestClose}>
            <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                    <View style={[styles.underShadow, styles.modalContent, styles.centered, { backgroundColor: colors.bgModal }]}>
                        
                        {/* Title */}
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 10 }]}>
                            {t("titles.selectColor")}
                        </Text>

                        {/* Color Grid */}
                        <View style={styles.colorPicker}>
                            {AVAILABLE_COLORS.map((c, index) => (
                                <TouchableOpacity key={index} disabled={isSubmitting} onPress={() => { setPendingColor(c); setHasPendingSelection(true); }}
                                    style={[styles.underShadow, styles.colorButton, styles.centered, {
                                        backgroundColor: c || colors.bgSecondary,
                                            transform: hasPendingSelection && pendingColor === c ? [{ scale: 1.13 }] : [{ scale: 1 }]
                                        }
                                    ]}
                                >
                                    {c === null && (
                                        <FontAwesome name="times" size={50} color={colors.textPrimary} />
                                    )}
                                </TouchableOpacity>
                            ))}

                        </View>

                        {errorMessage ? (
                            <Text style={[styles.smallText, styles.centeredText, { color: colors.danger, marginBottom: 10 }]}>
                                {errorMessage}
                            </Text>
                        ) : null}

                        {/* Android Back closes the modal; confirm applies a changed selection. */}
                        <View style={styles.rowCenter}>
                            <TouchableOpacity disabled={isSubmitting} onPress={handleConfirm} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.accent, flex: 1, opacity: isSubmitting ? 0.55 : 1 }]}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={colors.textPrimary}/>
                                ) : (
                                    <Text style={[styles.midText, { color: colors.textPrimary }]}>{t("buttons.confirmAction")}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
