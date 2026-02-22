import { useRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { colors } from '../../styles/colors.js';

// Rich text editor
export default function RichTextEditor({ initialContent, onChange, placeholder = "Context (optional)" }) {
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const hasSetInitialContent = useRef(false);
    const isInitializing = useRef(false);

    // Only set initial content once when editor is ready
    useEffect(() => {
        if (isReady && !hasSetInitialContent.current && initialContent) {
            isInitializing.current = true;
            editorRef.current?.setContentHTML(initialContent);
            hasSetInitialContent.current = true;
            setTimeout(() => {isInitializing.current = false}, 50);
        }
    }, [isReady, initialContent]);

    // Only call onChange if editor is ready and not initializing
    const handleChange = (html) => {
        if (isInitializing.current) return;
        onChange(html);
    };

    // Get editor for toolbar
    const getEditor = () => editorRef.current;

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <View style={{minHeight: 50, maxHeight: isFocused ? 240 : 200}}>

            {/* Toolbar - only show when ready AND focused */}
            {isReady && isFocused && (
                <RichToolbar 
                    getEditor={getEditor}
                    iconTint={colors.textSecondary} 
                    selectedIconTint={colors.accent} 
                    disabledIconTint={colors.textHalfOpacity} 
                    style={{
                        backgroundColor: colors.bgPrimary, 
                        borderBottomWidth: 1, 
                        borderBottomColor: colors.accentLight + '30',
                        height: 40,
                        borderBottomLeftRadius: 0,   
                        borderBottomRightRadius: 0,  
                        borderTopLeftRadius: 6,       
                        borderTopRightRadius: 6,  
                        overflow: 'hidden',
                    }}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.setStrikethrough,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.undo,
                        actions.redo,
                    ]} 
                />
            )}
            
            {/* Rich Text Editor */}
            <RichEditor
                ref={editorRef}
                initialContentHTML={initialContent || ''}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onCursorPosition={() => {}}
                placeholder={placeholder}
                androidHardwareAccelerationDisabled={true}
                useContainer={true}
                initialHeight={50}
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
                        font-family: system-ui; 
                        color: ${colors.textSecondary}; 
                        padding: 10px;
                        position: absolute; 
                        top: 5; right: 10; bottom: 5; left: 10;
                    `,
                }}
            />
        </View>
    );
}