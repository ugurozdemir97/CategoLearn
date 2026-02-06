import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import FolderScreen from "./screens/FolderScreen";
import CardDetailScreen from "./screens/CardDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Folder" component={FolderScreen} />
                <Stack.Screen name="CardDetail" component={CardDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}