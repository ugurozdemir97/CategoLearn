import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import FooterButton from "../Blocks/FooterButton.js"

// Styles
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Footer is for search, settings, deleted items, and paste items when clipboard has content. 
// When items are selected, it switches to actions like delete, edit, cut, copy, and color.
export default function FooterBar({ selectedCount, hasClipboard, onAction, onLayout }) {

  const insets = useSafeAreaInsets();  // Safe area insets for preventing overlap with navigation buttons/status bar

  return (
    <View style={[ styles.paddingHorizontal, styles.rowCenter, styles.spaceBetween, { paddingBottom: insets.bottom + 15, paddingTop: 15, backgroundColor: colors.bgSecondary }]} onLayout={onLayout}>
      
        {/* Delete - Cut - Copy - Color - Edit */}
        {selectedCount > 0 ? (
            <View style={[styles.rowCenter, styles.spaceAround, { flex: 1 }]}>
                <FooterButton name="trash" label="Delete" color={colors.danger} onPress={() => onAction("delete")} />
                <FooterButton name="scissors" label="Cut" onPress={() => onAction("cut")} />
                <FooterButton name="copy" label="Copy" onPress={() => onAction("copy")} />
                <FooterButton name="paint-brush" label="Color" onPress={() => onAction("color")} />
            </View>
        ) : (
            
            // Search - Settings - Deleted Items - (Paste)
            <View style={[styles.rowCenter, styles.spaceAround, { flex: 1 }]}>
                <FooterButton name="search" label="Search" onPress={() => onAction("search")} />
                <FooterButton name="cog" label="Settings" onPress={() => onAction("settings")} />
                <FooterButton name="trash-o" label="Deleted" onPress={() => onAction("deleted")} />
                {hasClipboard && (
                    <>
                        <FooterButton name="times-circle" label="Clear" onPress={() => onAction("clearClipboard")} />
                        <FooterButton name="clipboard" label="Paste" onPress={() => onAction("paste")} />
                    </>
                )}
            </View>
        )}
        </View>
    );
}