import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";   // ✅ NEW
import HomeScreen from "./screens/HomeScreen.js";
import FolderScreen from "./screens/FolderScreen.js";
import CardDetailScreen from "./screens/CardDetailScreen.js";
import { setupDatabase } from "./database/schema.js";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    async function initDB() {
      try {
        await setupDatabase();
        console.log("Database setup complete ✅");
      } catch (error) {
        console.error("Database setup failed ❌", error);
      }
    }
    initDB();
  }, []);

  return (
    <SafeAreaProvider>   {/* ✅ Wrap everything */}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Folder" component={FolderScreen} />
          <Stack.Screen name="CardDetail" component={CardDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}