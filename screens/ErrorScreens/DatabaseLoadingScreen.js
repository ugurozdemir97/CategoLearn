import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Show this screen while database is loading
export default function DbLoadingScreen() {
    return (
        <SafeAreaProvider>
            <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary, gap: 8 }]}>
                <ActivityIndicator size="large" color={colors.textSecondary} />
                <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>Initializing database...</Text>
            </View>
        </SafeAreaProvider>
    );
}