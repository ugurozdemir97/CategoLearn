import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import FooterButton from "../Blocks/FooterButton.js";

// Styles
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Utils
import { handleDeleteSelected, handleCutSelected, handleCopySelected, handlePaste } from "../../utils/handleFooterActions.js";

// Footer is for search, settings, deleted items, and paste items when clipboard has content. 
// When items are selected, it switches to actions like delete, edit, cut, copy, and color.
export default function FooterBar({ selectedItems, clipboard, clipboardMode, clearSelection, openDeleteModal, openColorModal, openInfoModal, cut, copy, clearClipboard, reloadItems, parent, itemLabel, navigation, onLayout }) {

    const insets = useSafeAreaInsets();  // Safe area insets for preventing overlap with navigation buttons/status bar

    const handleDelete =     () => {handleDeleteSelected(selectedItems, openDeleteModal, itemLabel)};
    const handleCutAction =  () => {handleCutSelected(selectedItems, cut, clearSelection)};
    const handleCopyAction = () => {handleCopySelected(selectedItems, copy, clearSelection)};
    const handleColor =      () => {if (selectedItems.length === 0) return; openColorModal()};
    const handlePasteAction = async () => {
        const result = await handlePaste(clipboard, clipboardMode, parent, clearClipboard, reloadItems);
        if (result && result.length > 0) openInfoModal(result);
    };
    
    return (
        <View 
            style={[styles.paddingHorizontal, styles.rowCenter, styles.spaceBetween, { paddingBottom: insets.bottom + 15, paddingTop: 15, backgroundColor: colors.bgSecondary }]} onLayout={onLayout}>
            
            {/* Delete - Cut - Copy - Color */}
            {selectedItems.length > 0 ? (
                <View style={[styles.rowCenter, styles.spaceAround, { flex: 1 }]}>
                    <FooterButton name="trash" label="Delete" color={colors.danger} onPress={handleDelete}/>
                    <FooterButton name="scissors" label="Cut" onPress={handleCutAction}/>
                    <FooterButton name="copy" label="Copy" onPress={handleCopyAction}/>
                    <FooterButton name="paint-brush" label="Color" onPress={handleColor}/>
                </View>
            ) : (
                
                // Search - Settings - Deleted Items - (Paste)
                <View style={[styles.rowCenter, styles.spaceAround, { flex: 1 }]}>
                    <FooterButton name="search" label="Search" onPress={() => navigation.navigate("Search")}/>
                    <FooterButton name="cog" label="Settings" onPress={() => navigation.navigate("Settings")}/>
                    <FooterButton name="trash-o" label="Deleted" onPress={() => navigation.navigate("Deleted")}/>
                    {clipboard.length > 0 && (
                        <>
                            <FooterButton name="times-circle" label="Clear" onPress={clearClipboard}/>
                            <FooterButton name="clipboard" label="Paste" onPress={handlePasteAction}/>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}