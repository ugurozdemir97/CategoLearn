import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";
import { useTranslation } from 'react-i18next';

// If there are any problem with the database show this screen
export default function DbErrorScreen({ error }) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <SafeAreaProvider>
            <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary, gap: 8 }]}>
                <Text style={[styles.title, styles.centeredText, {color: colors.danger}]}>
                    {t("errorTitles.dbFailed")}
                </Text>
                <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>
                    {t("errorMessages.dbFailed")}
                </Text>
                <Text style={[styles.smallText, styles.centeredText, {color: colors.textSecondary}]}>
                    {error?.message || t("errorMessages.dbFailedFallback")}
                </Text>
            </View>
        </SafeAreaProvider>
    );
}