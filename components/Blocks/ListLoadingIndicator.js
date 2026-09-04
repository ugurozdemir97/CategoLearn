import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// Replaces empty-state text while a screen is still reading from the database.
export default function ListLoadingIndicator() {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
    );
}
