import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from "../../context/ThemeContext.js";
import { normalizeHorizontalRules } from "../../utils/richText.js";

// Rich text editor
export default function RichTextEditor({ initialContent, onChange, onFocus, onBlur, placeholder = "Context (optional)" }) {
    const editorRef = useRef(null);
    const editorScrollRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const isInitializing = useRef(false);
    const { colors } = useTheme();

    // Only call onChange if editor is ready and not initializing
    const handleChange = (html) => {
        if (isInitializing.current) return;
        onChange(html);
    };

    // Get editor for toolbar
    const getEditor = () => editorRef.current;

    // Custom action to insert horizontal line
    const insertHorizontalLine = () => {
        editorRef.current?.insertHTML("<hr/><br/>");
    };

    // We only show the toolbar when the text editor is focused
    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };
    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };
    const handleCursorPosition = (scrollY) => {
        editorScrollRef.current?.scrollTo({ y: Math.max(0, scrollY - 30), animated: true });
    };

    // Custom action to highlight text
    const highlightText = () => {
        if (isHighlighted) {
            setIsHighlighted(false);
            editorRef.current?.setHiliteColor("inherit");      
        } else {
            editorRef.current?.setHiliteColor('#f37900');
            setIsHighlighted(true);
        }
    };

    // Nest the current list item under its previous sibling, up to five levels deep.
    const indentListOnce = () => {
        editorRef.current?.commandDOM(`
            const MAX_LIST_DEPTH = 5;
            const selection = document.getSelection();
            const anchor = selection && selection.anchorNode;
            const element = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
            const listItem = element && element.closest('li');
            const parentList = listItem && listItem.parentElement;
            const previousItem = listItem && listItem.previousElementSibling;
            let currentDepth = 0;
            let ancestor = parentList;

            while (ancestor) {
                if (ancestor.tagName === 'OL' || ancestor.tagName === 'UL') currentDepth += 1;
                ancestor = ancestor.parentElement;
            }

            if (currentDepth < MAX_LIST_DEPTH && previousItem && previousItem.tagName === 'LI') {
                let nestedList = null;
                for (const child of previousItem.children) {
                    if (child.tagName === parentList.tagName) nestedList = child;
                }

                if (!nestedList) {
                    nestedList = document.createElement(parentList.tagName.toLowerCase());
                    previousItem.appendChild(nestedList);
                }

                nestedList.appendChild(listItem);
                if (!parentList.children.length) parentList.remove();
                listItem.dispatchEvent(new Event('input', { bubbles: true }));
            }
        `);
    };

    // Custom button icons
    const hrIcon = ({tintColor}) => <FontAwesome name="minus" size={18} color={tintColor} />
    const hlIcon = ({tintColor}) => <FontAwesome5 name="highlighter" size={18} color={isHighlighted ? colors.accent : tintColor} />
    const indentIcon = ({tintColor}) => <FontAwesome name="indent" size={18} color={tintColor} />

    return (
        <View style={{minHeight: 50, maxHeight: isFocused ? 240 : 200}}>

            {/* Keep the toolbar container mounted so focusing does not remount the editor. */}
            <View style={{ flexDirection: 'row', alignItems: "center", height: isReady && isFocused ? 40 : 0, overflow: 'hidden', borderBottomWidth: isReady && isFocused ? 1 : 0, borderBottomColor: colors.accentLight + '30' }}>
                {isReady && (
                    <RichToolbar 
                        getEditor={getEditor}
                        iconTint={colors.textSecondary} 
                        selectedIconTint={colors.accent} 
                        disabledIconTint={colors.textHalfOpacity} 
                        style={{
                            backgroundColor: colors.bgPrimary, 
                            height: 40,
                            flex: 1,
                            borderWidth: 0,
                            borderTopLeftRadius: 6, 
                            borderTopRightRadius: 6, 
                        }}
                        actions={[
                            actions.setBold,
                            actions.setItalic,
                            actions.setUnderline,
                            "highlight",
                            actions.insertBulletsList,
                            actions.insertOrderedList,
                            "indentOnce",
                            actions.undo,
                            actions.redo,
                            "addHR"
                        ]} 
                        iconMap={{ ["addHR"]: hrIcon, ["highlight"]: hlIcon, ["indentOnce"]: indentIcon }}
                        addHR={insertHorizontalLine}
                        highlight={highlightText}
                        indentOnce={indentListOnce}
                    />
                )}
            </View>
            
            {/* Rich Text Editor */}
            <ScrollView ref={editorScrollRef} style={{ minHeight: 50, maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="always">
                <RichEditor
                    ref={editorRef}
                    initialContentHTML={normalizeHorizontalRules(initialContent)}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onCursorPosition={handleCursorPosition}
                    placeholder={placeholder}
                    editorInitializedCallback={() => setIsReady(true)}
                    style={{
                        minHeight: 50,
                        borderBottomLeftRadius: 6,
                        borderBottomRightRadius: 6,
                        borderTopLeftRadius: isFocused ? 0 : 6,
                        borderTopRightRadius: isFocused ? 0 : 6,
                        overflow: "hidden",
                    }}
                    editorStyle={{
                        backgroundColor: colors.bgSecondary,
                        color: colors.textSecondary,
                        placeholderColor: colors.textHalfOpacity,
                        cssText: `hr { border-top: 1px solid ${colors.accentLight} !important; }`,
                        contentCSSText: `
                            color: ${colors.textSecondary};
                            padding: 10px;
                            position: absolute;
                            top: 5; right: 10; bottom: 5; left: 10;
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                            word-break: break-word;
                            white-space: pre-wrap;
                            width: 100%;
                        `,
                    }}
                />
            </ScrollView>
        </View>
    );
}
