import { useState, useEffect } from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from "react-native-safe-area-context";

// Contexts
import { ClipboardProvider } from "./context/ClipboardContext.js";
import { SortModeProvider } from "./context/SortModeContext.js";
import { LanguageProvider } from "./context/LanguageContext.js";
import { ThemeProvider } from "./context/ThemeContext.js";

// Navigation and Screens
import StackNavigator from "./navigation/StackNavigator";
import DbErrorScreen from   "./screens/ErrorScreens/DatabaseErrorScreen.js";
import DbLoadingScreen from "./screens/ErrorScreens/DatabaseLoadingScreen.js";
import WhatsNewModal from "./components/Modals/WhatsNewModal.js";

// Database Setup
import { setupDatabase } from "./database/schema.js";

// Language
import "./language/i18n.js";

// Disable font scaling globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

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

    if (dbError)  return <ThemeProvider><DbErrorScreen error={dbError}/></ThemeProvider>;   // Show error message if DB initialization fails
    if (!dbReady) return <ThemeProvider><DbLoadingScreen/></ThemeProvider>;                 // Show loading spinner until DB is ready

    // Render app only when DB is ready
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <LanguageProvider>
                    <SafeAreaProvider>
                        <SortModeProvider>
                            <ClipboardProvider>
                                <StackNavigator/>
                            </ClipboardProvider>
                        </SortModeProvider>
                        <WhatsNewModal/>
                    </SafeAreaProvider>
                </LanguageProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
