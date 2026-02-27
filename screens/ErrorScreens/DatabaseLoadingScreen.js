import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext.js";
import { useTranslation } from 'react-i18next';
import styles from "../../styles/styles.js";

// Show this screen while database is loading
export default function DbLoadingScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <SafeAreaProvider>
            <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary, gap: 8 }]}>
                <ActivityIndicator size="large" color={colors.textSecondary} />
                <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>{t("screenMessages.dbLoading")}</Text>
            </View>
        </SafeAreaProvider>
    );
}