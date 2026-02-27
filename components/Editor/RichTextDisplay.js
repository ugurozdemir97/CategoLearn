import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useTheme } from "../../context/ThemeContext.js";

// Display contexts with rich texts
export default function RichTextDisplay({ content }) {
    const { width } = useWindowDimensions();
    const { colors } = useTheme();

    const tagsStyles = {
        body:   {color: colors.textSecondary, fontSize: 14 },
        b:      {fontWeight: 'bold'},
        i:      {fontStyle: 'italic'},
        u:      {textDecorationLine: 'underline'},
        hr:     {width: "100%", borderTopWidth: 1, borderColor: colors.accentLight, height: 1, marginVertical: 10 },
        span:   {backgroundColor: 'inherit'},
        ul:     {marginLeft: 16},
        ol:     {marginLeft: 16}
    };

    return (
        <RenderHtml 
            contentWidth={width} 
            source={{ html: content }} 
            tagsStyles={tagsStyles}
            enableExperimentalMarginCollapsing={true}
            enableCSSInlineProcessing={true}
            enderersProps={{span: {enableUserAgentStyles: true}}}
        />
    );
}