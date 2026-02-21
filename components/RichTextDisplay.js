import { View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { colors } from '../styles/colors.js';

// Display contexts with rich texts
export default function RichTextDisplay({ content, style }) {
    const { width } = useWindowDimensions();

    // If no content or plain text (old format)
    if (!content || (typeof content === 'string' && !content.includes('<'))) {
        return (
            <View style={style}>
                <RenderHtml contentWidth={width} source={{ html: `<p>${content || ''}</p>` }} tagsStyles={tagsStyles}/>
            </View>
        );
    }

    // Rich HTML content
    return (
        <View style={style}>
            <RenderHtml contentWidth={width} source={{ html: content }} tagsStyles={tagsStyles}/>
        </View>
    );
}

const tagsStyles = {
    body:   {color: colors.textSecondary, fontSize: 14},
    strong: {fontWeight: 'bold'},
    em:     {fontStyle: 'italic'},
    u:      {textDecorationLine: 'underline'},
    s:      {textDecorationLine: 'line-through'}
};