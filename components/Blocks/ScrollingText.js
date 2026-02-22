import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import styles from "../../styles/styles.js";
import { colors } from "../../styles/colors.js";

// Scroll through long texts
export default function ScrollingText({ text }) {
    const [isLong, setIsLong] = useState(false);
    const [textWidth, setTextWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
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
            const scrollDistance = textWidth - containerWidth;
            
            // Wait 1 second, scroll, wait 1 second, reset, repeat
            const animate = () => {
                Animated.sequence([
                    Animated.delay(2000),                  // Wait at start
                    Animated.timing(scrollAnimation, {
                        toValue: -scrollDistance - 10,     // Scroll left (with extra padding)
                        duration: scrollDistance * 20,     // Speed: 20ms per pixel
                        useNativeDriver: true,
                    }),
                    
                    Animated.delay(3000),                  // Wait at end
                    Animated.timing(scrollAnimation, {
                        toValue: 0,                        // Reset to start
                        duration: 500,                     // Restart in 300 ms
                        useNativeDriver: true,
                    }),
                ]).start(() => animate());                 // Loop
            };

            animate();
        } else {
            scrollAnimation.setValue(0);
        }

        return () => {
            scrollAnimation.stopAnimation();
        };
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