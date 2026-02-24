import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

// Styles
import { colors } from "../../styles/colors.js";
import styles from "../../styles/styles.js";

// Component that automatically scrolls long titles or just display them as they are
// Allows users to read whole title and prevent the title to have more than one line
export default function ScrollingText({ text }) {
    const [isLong, setIsLong] = useState(false);                    // Is the text long enough to scroll
    const [textWidth, setTextWidth] = useState(0);                  // Text's width
    const [containerWidth, setContainerWidth] = useState(0);        // The empty space for the text
    const scrollAnimation = useRef(new Animated.Value(0)).current;

    // Get container width
    const handleContainerLayout = (e) => setContainerWidth(e.nativeEvent.layout.width);

    // Get text width
    const handleTextLayout = (e) => {
        const width = e.nativeEvent.lines[0].width;
        setTextWidth(width);
    };

    // Decide if the text should be animated
    useEffect(() => {
        if (textWidth > 0 && containerWidth > 0) setIsLong(textWidth > containerWidth);
    }, [textWidth, containerWidth]);

    // Start scrolling animation if text is long
    useEffect(() => {
        if (isLong) {
            const scrollDistance = textWidth - containerWidth;  // Required scroll distance
            
            // Wait 3 second, scroll, wait 2 second, reset, repeat
            const animate = () => {
                Animated.sequence([
                    Animated.delay(3000),
                    Animated.timing(scrollAnimation, { toValue: -scrollDistance - 10, duration: scrollDistance * 20, useNativeDriver: true}), 
                    Animated.delay(2000),
                    Animated.timing(scrollAnimation, {toValue: 0, duration: 500, useNativeDriver: true}),
                ]).start(() => animate());
            };
            animate();
        } else {
            scrollAnimation.setValue(0);
        }

        return () => scrollAnimation.stopAnimation();

    }, [isLong, textWidth, containerWidth, scrollAnimation]);

    return (
        <View style={[{ flexDirection: "row", overflow: "scroll", flex: 1, width: "100%" }]} onLayout={handleContainerLayout}>
            <Animated.View style={{transform: [{ translateX: scrollAnimation }]}}>
                <Text style={[styles.smallText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1} onTextLayout={handleTextLayout}>
                    {text}
                </Text>
            </Animated.View>
        </View>
    );
}