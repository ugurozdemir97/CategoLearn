import { useRef, useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { colors } from '../styles/colors.js';
import styles from '../styles/styles.js';

// Rich text editor
export default function RichTextEditor({ initialContent, onChange, placeholder = "Context (optional)" }) {
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const hasSetInitialContent = useRef(false);
    const isInitializing = useRef(false);

    // Only set initial content once when editor is ready
    useEffect(() => {
        if (isReady && !hasSetInitialContent.current && !isInitializing.current && initialContent) {
            isInitializing.current = true;
            setTimeout(() => {
                editorRef.current?.setContentHTML(initialContent);
                hasSetInitialContent.current = true;
                isInitializing.current = false;
            }, 50);
        }
    }, [isReady, initialContent]);

    // Only call onChange if editor is ready and not initializing
    const handleChange = (html) => {
        if (isReady && !isInitializing.current && hasSetInitialContent.current) {
            onChange(html);
        }
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
        <View style={[styles.toolBarContainer]}>

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
                        borderBottomColor: colors.accentLight + '30'
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
            <ScrollView style={{maxHeight: 300}}>
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
                    initialHeight={150}
                    editorInitializedCallback={() => setIsReady(true)}
                    style={{minHeight: 150, backgroundColor: colors.bgSecondary}}
                    editorStyle={{
                        backgroundColor: colors.bgSecondary,
                        color: colors.textSecondary,
                        placeholderColor: colors.textHalfOpacity,
                        contentCSSText: `
                            font-family: system-ui; 
                            color: ${colors.textSecondary}; 
                            padding: 10px;
                        `,
                    }}
                />
            </ScrollView>
        </View>
    );
}