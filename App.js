import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClipboardProvider } from "./context/ClipboardContext.js";
import HomeScreen from "./screens/HomeScreen.js";
import FolderScreen from "./screens/FolderScreen.js";
import CardDetailScreen from "./screens/CardDetailScreen.js";
import { setupDatabase } from "./database/schema.js";
import styles from "./styles/styles.js";
import { colors } from "./styles/colors.js";

const Stack = createNativeStackNavigator();

// Main App
export default function App() {
    const [dbReady, setDbReady] = useState(false);
    const [dbError, setDbError] = useState(null);

    // Initialize database on app start
    useEffect(() => {
        async function initDB() {
            try {
                await setupDatabase();
                setDbReady(true);
            } catch (error) {
                console.error("Database setup failed", error);
                setDbError(error);
            }
        }
        initDB();
    }, []);

    // Show error message if DB initialization fails
    if (dbError) {
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
                        {dbError.message}
                    </Text>
                </View>
            </SafeAreaProvider>
        );
    }

    // Show loading spinner until DB is ready
    if (!dbReady) { 
        return (
            <SafeAreaProvider>
                <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary, gap: 8 }]}>
                    <ActivityIndicator size="large" color={colors.textSecondary} />
                    <Text style={[styles.midText, styles.centeredText, {color: colors.textPrimary}]}>Initializing database...</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    // Render app only when DB is ready
    return (
        <SafeAreaProvider>
            <ClipboardProvider>
                <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Folder" component={FolderScreen} />
                        <Stack.Screen name="CardDetail" component={CardDetailScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </ClipboardProvider>
        </SafeAreaProvider>
    );
}