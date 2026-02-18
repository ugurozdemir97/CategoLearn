import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import HomeScreen from "../screens/HomeScreen";
import FolderScreen from "../screens/FolderScreen";
import CardDetailScreen from "../screens/CardDetailScreen";
import SettingScreen from "../screens/SettingScreen";
import SearchScreen from "../screens/SearchScreen";
import DeletedScreen from "../screens/DeletedScreen";

const Stack = createNativeStackNavigator();

function StackNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Folder" component={FolderScreen} />
                <Stack.Screen name="CardDetail" component={CardDetailScreen} />
                <Stack.Screen name="Settings" component={SettingScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Deleted" component={DeletedScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default StackNavigator;