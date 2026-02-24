import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// If there are any problem with the database show this screen
export default function DbErrorScreen({ error }) {
    return (
        <SafeAreaProvider>
            <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary, gap: 8 }]}>
                <Text style={[styles.title, styles.centeredText, {color: colors.danger}]}>
                    Database initialization failed!
                </Text>
                <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>
                    Please restart the app or contact support.
                </Text>
                <Text style={[styles.smallText, styles.centeredText, {color: colors.textSecondary}]}>
                    {error?.message || "Database Error"}
                </Text>
            </View>
        </SafeAreaProvider>
    );
}