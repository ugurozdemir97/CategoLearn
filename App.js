import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClipboardProvider } from "./context/ClipboardContext.js";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StackNavigator from "./navigation/StackNavigator";
import { setupDatabase } from "./database/schema.js";
import DbErrorScreen from   "./screens/ErrorScreens/DatabaseErrorScreen.js";
import DbLoadingScreen from "./screens/ErrorScreens/DatabaseLoadingScreen.js";

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

    if (dbError)  return <DbErrorScreen error={dbError}/>;   // Show error message if DB initialization fails
    if (!dbReady) return <DbLoadingScreen/>;                 // Show loading spinner until DB is ready


    // Render app only when DB is ready
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ClipboardProvider>
                    <StackNavigator />
                </ClipboardProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}