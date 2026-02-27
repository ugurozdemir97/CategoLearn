import { useRef, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext.js";
import styles from "../../styles/styles.js";

// Bread crumb links are the the link you generally see on navbars. 
// For example "Roots > Folder A > Parent B > Current Folder"
export default function BreadCrumb({ path, onNavigate }) {
    const { colors } = useTheme();

    // Auto-scroll to the end whenever path changes
    const scrollViewRef = useRef(null); 
    useEffect(() => {if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true })}, [path]);

    // Make current folder different color, and add "/" between folders except the last one
    return (
        <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paddingHorizontal} style={[styles.underShadow, {backgroundColor: colors.bgBreadCrumb, minHeight: 30, maxHeight: 30}]}>
            {path.map((node, index) => (
                <View key={`${node.type}-${node.id}`} style={styles.rowCenter}>
                    <TouchableOpacity onPress={() => onNavigate(node)} activeOpacity={0.7} style={styles.crumbButton}>
                        <Text style={[ styles.tinyText, {color: index === path.length - 1 ? colors.accentLight : colors.textSecondary}]}>
                            {node.name}
                        </Text>
                    </TouchableOpacity>
                    
                    {index < path.length - 1 && (
                        <Text style={[styles.tinyText, {color: colors.textHalfOpacity, marginHorizontal: 1}]}>/</Text>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}
