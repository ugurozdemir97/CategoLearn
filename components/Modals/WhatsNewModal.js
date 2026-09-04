import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { getUnseenWhatsNew, markWhatsNewAsSeen } from "../../utils/whatsNew/whatsNewService.js";
import styles from "../../styles/styles.js";

export default function WhatsNewModal() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { currentLanguage, isLanguageReady } = useLanguage();
    const [content, setContent] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    // Resolve the text only after the user's saved language has loaded.
    useEffect(() => {
        if (!isLanguageReady) return;

        let isCurrent = true;

        const loadWhatsNew = async () => {
            const unseenContent = await getUnseenWhatsNew();
            if (isCurrent) setContent(unseenContent);
        };

        loadWhatsNew();

        return () => {
            isCurrent = false;
        };
    }, [currentLanguage, isLanguageReady]);

    const handleClose = async () => {
        if (!content || isClosing) return;

        setIsClosing(true);
        await markWhatsNewAsSeen(content.version);
        setContent(null);
        setIsClosing(false);
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={content !== null}
            onRequestClose={handleClose}
        >
            <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>
                    <Text
                        style={[
                            styles.bigText,
                            styles.centeredText,
                            { color: colors.textPrimary, marginBottom: 10 },
                        ]}
                    >
                        {content?.title}
                    </Text>

                    <Text
                        style={[
                            styles.midText,
                            styles.centeredText,
                            { color: colors.textSecondary, marginBottom: content?.bottomText ? 10 : 20 },
                        ]}
                    >
                        {content?.middleText}
                    </Text>

                    {content?.bottomText ? (
                        <Text
                            style={[
                                styles.smallText,
                                styles.centeredText,
                                { color: colors.textSecondary, marginBottom: 20 },
                            ]}
                        >
                            {content.bottomText}
                        </Text>
                    ) : null}

                    <TouchableOpacity
                        accessibilityRole="button"
                        disabled={isClosing}
                        onPress={handleClose}
                        style={[
                            styles.underShadow,
                            styles.normalButton,
                            { backgroundColor: colors.accent, opacity: isClosing ? 0.6 : 1 },
                        ]}
                    >
                        <Text style={[styles.midText, { color: colors.textPrimary }]}>
                            {t("buttons.okay")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
