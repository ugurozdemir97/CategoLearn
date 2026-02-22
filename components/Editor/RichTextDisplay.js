import { View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { colors } from '../../styles/colors.js';

// Display contexts with rich texts
export default function RichTextDisplay({ content }) {
    const { width } = useWindowDimensions();
    return <RenderHtml contentWidth={width} source={{ html: content }} tagsStyles={tagsStyles}/>;
}

const tagsStyles = {
    body:   {color: colors.textSecondary, fontSize: 14 },
    b:      {fontWeight: 'bold'},
    i:      {fontStyle: 'italic'},
    u:      {textDecorationLine: 'underline'},
    hr:     {width: "100%", borderTopWidth: 1, borderColor: colors.accentLight, height: 1, marginVertical: 10 }
};