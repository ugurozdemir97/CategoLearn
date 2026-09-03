import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { appendChild } from 'domutils';
import { useTheme } from "../../context/ThemeContext.js";

const nestedListDomVisitors = {
    onElement(element) {
        if (element.name !== 'ol' && element.name !== 'ul') return;

        let previousListItem = null;
        for (const child of [...element.children]) {
            if (child.type !== 'tag') continue;

            if (child.name === 'li') {
                previousListItem = child;
            } else if ((child.name === 'ol' || child.name === 'ul') && previousListItem) {
                appendChild(previousListItem, child);
            }
        }
    },
};

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
        ul:     {marginLeft: 16, listStyleType: 'disc'},
        ol:     {marginLeft: 16, listStyleType: 'decimal'}
    };

    return (
        <RenderHtml 
            contentWidth={width} 
            source={{ html: content }} 
            tagsStyles={tagsStyles}
            domVisitors={nestedListDomVisitors}
            enableExperimentalMarginCollapsing={true}
            enableCSSInlineProcessing={true}
            enderersProps={{span: {enableUserAgentStyles: true}}}
        />
    );
}
