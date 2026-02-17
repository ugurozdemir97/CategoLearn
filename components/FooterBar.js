import { View, TouchableOpacity, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Footer is for search, settings, deleted items, and paste items when clipboard has content. 
// When items are selected, it switches to actions like delete, edit, cut, copy, and color.
export default function FooterBar({ selectedCount, hasClipboard, onAction, onLayout }) {

    // Safe area insets for preventing overlap with navigation buttons/status bar
    const insets = useSafeAreaInsets();

    // Reusable icon button component
    const IconButton = ({ name, action, label, color = colors.textPrimary }) => (
        <TouchableOpacity onPress={() => onAction(action)} style={[styles.centered, {gap: 3}]}>
            <FontAwesome name={name} size={22} color={color} />
            <Text style={[styles.tinyText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.paddingHorizontal, styles.rowCenter, styles.spaceBetween, { paddingBottom: insets.bottom + 15, paddingTop: 15, backgroundColor: colors.bgSecondary }]} onLayout={onLayout}>

            {/* Delete - Cut - Copy - Color - Edit */}
            {selectedCount > 0 ? (
                <View style={[styles.rowCenter, styles.spaceAround, {flex: 1}]}>
                    <IconButton name="trash" action="delete" color={colors.danger} label="Delete"/>
                    <IconButton name="scissors" action="cut" label="Cut"/>
                    <IconButton name="copy" action="copy" label="Copy"/>
                    <IconButton name="paint-brush" action="color" label="Color"/>
                </View>
            ) : (  

                // Search - Settings - Deleted Items - (Paste)
                <View style={[styles.rowCenter, styles.spaceAround, {flex: 1}]}>
                    <IconButton name="search" action="search" label="Search"/>
                    <IconButton name="cog" action="settings" label="Settings"/>
                    <IconButton name="trash-o" action="deleted" label="Deleted"/>
                    {hasClipboard && (
                        <>
                            <IconButton name="times-circle" action="clearClipboard" label="Clear"/>
                            <IconButton name="clipboard" action="paste" label="Paste"/>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}