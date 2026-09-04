import { KeyboardAvoidingView, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';
import styles from '../../styles/styles.js';

export default function ImportDatabaseModal({ visible, onReplace, onKeep, onCancel }) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={[styles.centered, { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <View style={[styles.underShadow, styles.modalContent, { backgroundColor: colors.bgModal }]}>
                        <Text style={[styles.bigText, styles.centeredText, { color: colors.textPrimary, marginBottom: 5 }]}>
                            {t('titles.importOptions')}
                        </Text>
                        <Text style={[styles.midText, styles.centeredText, { color: colors.textSecondary, marginBottom: 15 }]}>
                            {t('infoMessages.importOptions')}
                        </Text>

                        <View style={{ gap: 10 }}>
                            <TouchableOpacity onPress={onReplace} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.accent }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{t('buttons.replaceDatabase')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onKeep} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.bgSecondary }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{t('buttons.keepDatabase')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onCancel} style={[styles.underShadow, styles.normalButton, { backgroundColor: colors.bgSecondary }]}>
                                <Text style={[styles.midText, { color: colors.textPrimary }]}>{t('buttons.cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
