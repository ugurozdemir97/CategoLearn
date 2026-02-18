import { useRef, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../styles/colors.js";
import styles from "../styles/styles.js";

export default function BreadCrumb({ path, onNavigate }) {
    const scrollViewRef = useRef(null);

    // Auto-scroll to the end whenever path changes
    useEffect(() => {
        if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true });
    }, [path]);

    return (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paddingHorizontal}
            style={{backgroundColor: colors.bgBreadCurmb, maxHeight: 30}}
        >
            {path.map((node, index) => (
                <View key={node.id} style={styles.rowCenter}>
                    <TouchableOpacity onPress={() => onNavigate(node)} activeOpacity={0.7} style={styles.crumbButton}>
                        <Text style={[ styles.tinyText, {color: index === path.length - 1 ? colors.accentLight : colors.textSecondary}]}>
                            {node.name}
                        </Text>
                    </TouchableOpacity>
                    
                    {index < path.length - 1 && (
                        <Text style={[styles.tinyText, {color: colors.textHalfOpacity, marginHorizontal: 8}]}>/</Text>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}
