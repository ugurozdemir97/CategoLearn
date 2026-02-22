import { useRef, useState } from 'react';
import { View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../styles/colors.js';

// Rich text editor
export default function RichTextEditor({ initialContent, onChange, placeholder = "Context (optional)" }) {
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const isInitializing = useRef(false);

    // Only call onChange if editor is ready and not initializing
    const handleChange = (html) => {
        if (isInitializing.current) return;
        onChange(html);
    };

    // Get editor for toolbar
    const getEditor = () => editorRef.current;

    // Custom action to insert horizontal line
    const insertHorizontalLine = () => {
        editorRef.current?.insertHTML(`<hr style="border: 1px solid ${colors.accentLight}; width: 100%; display: block;"/><br/>`);
    };

    const highlightText = () => {
        if (isHighlighted) {
            setIsHighlighted(false);
            editorRef.current?.setHiliteColor("inherit");      

        } else {
            editorRef.current?.setHiliteColor('#f37900');
            setIsHighlighted(true);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const hrIcon = ({tintColor}) => <FontAwesome name="minus" size={18} color={tintColor} />
    const hlIcon = ({tintColor}) => <FontAwesome5 name="highlighter" size={18} color={isHighlighted ? colors.accent : tintColor} />

    return (
        <View style={{minHeight: 50, maxHeight: isFocused ? 240 : 200}}>

            {/* Toolbar - only show when ready AND focused */}
            {isReady && isFocused && (
                <View style={{ flexDirection: 'row', alignItems: "center", height: 40, borderBottomWidth: 1, borderBottomColor: colors.accentLight + '30' }}>
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
                            actions.undo,
                            actions.redo,
                            "addHR"
                        ]} 
                        iconMap={{ ["addHR"]: hrIcon, ["highlight"]: hlIcon }}
                        addHR={insertHorizontalLine}
                        highlight={highlightText}
                    />

                </View>
            )}
            
            {/* Rich Text Editor */}
            <RichEditor
                ref={editorRef}
                initialContentHTML={initialContent || ""}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                editorInitializedCallback={() => setIsReady(true)}
                style={{
                    minHeight: 50,
                    maxHeight: 200,
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
        </View>
    );
}