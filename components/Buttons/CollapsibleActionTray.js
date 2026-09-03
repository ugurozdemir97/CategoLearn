import { useRef, useState } from "react";
import { Animated, Easing, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// Displays floating actions above the footer and hides them behind a caret tab.
export default function CollapsibleActionTray({ footerHeight, children }) {
    const [actionsVisible, setActionsVisible] = useState(true);
    const actionTrayProgress = useRef(new Animated.Value(0)).current;
    const { colors } = useTheme();
    const { t } = useTranslation();

    // Slide the actions behind the footer while leaving the caret available.
    const toggleActionTray = () => {
        const nextVisible = !actionsVisible;
        setActionsVisible(nextVisible);
        Animated.timing(actionTrayProgress, {
            toValue: nextVisible ? 0 : 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    return (
        <View
            style={[styles.cardActionTray, { bottom: footerHeight - 1 }]}
            pointerEvents="box-none"
        >
            
            {/* Clip the animated controls at the footer edge while hiding. */}
            <View style={styles.cardActionClip} pointerEvents="box-none">
                <Animated.View
                    pointerEvents={actionsVisible ? "auto" : "none"}
                    style={[
                        styles.cardActionButtons,
                        {
                            transform: [{
                                translateY: actionTrayProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 112],
                                }),
                            }],
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </View>

            {/* Raised caret tab for showing and hiding the field actions. */}
            <TouchableOpacity
                onPress={toggleActionTray}
                style={[styles.cardActionCaretButton, { backgroundColor: colors.bgSecondary, borderColor: colors.bgPrimary }]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t(actionsVisible ? "buttons.hideActions" : "buttons.showActions")}
            >
                <FontAwesome
                    name={actionsVisible ? "caret-up" : "caret-down"}
                    size={18}
                    color={colors.textPrimary}
                />
            </TouchableOpacity>
        </View>
    );
}
