import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { FontAwesome } from "@expo/vector-icons";

// Components
import SectionBlock from "../components/SettingsTitle.js";
import RadioButton from "../components/RadioButton.js";

// Styles and Colors
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

// Database Queries and Storage
import { saveColorOrder, loadColorOrder, saveColorSortPreference, loadColorSortPreference } from "../storage/sortPreference.js";

// Temporary, I will load these from AsyncStorage
const COLOR_NAMES = { null: "None", "#000000": "Black", "#FFFFFF": "White", "#bb0000": "Red", "#00b700": "Green", "#0000da": "Blue", "#ffdd00": "Yellow", "#980081": "Purple", "#00e19d": "Mint" };

// Settings - Preferences and Synchronisation
export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [colorOrder, setColorOrder] = useState([]);
    const [colorSortMode, setColorSortMode] = useState("");

    // Load saved preferences on mount
    useEffect(() => {
        const loadSettings = async () => {
            const savedOrder = await loadColorOrder();
            const savedSortPref = await loadColorSortPreference();
            setColorOrder(savedOrder);
            setColorSortMode(savedSortPref);
        };

        loadSettings();

    }, []);

    // Update color order in state and save to storage
    const updateColorOrder = (order) => {
        setColorOrder(order);
        saveColorOrder(order);
    };

    // Update sort mode in state and save to storage
    const updateColorSortMode = (mode) => {
        setColorSortMode(mode);
        saveColorSortPreference(mode);
    };

    // Move colors by pressing the arrow buttons
    const moveColor = (item, direction) => {
        setColorOrder((prev) => {
          const currentIndex = prev.indexOf(item);
          const targetIndex = currentIndex + direction;

          // If item is already the first one and we try to move it up 
          // or it is the last item and we try to move it down
          // Just return the current color order
          if (targetIndex < 0 || targetIndex >= prev.length) return prev;

          // Swap 2 elements, the item you move goes to target place and swap places with the item there
          const newOrder = [...prev];
          newOrder[currentIndex] = newOrder[targetIndex];
          newOrder[targetIndex] = item;
          saveColorOrder(newOrder);
          return newOrder;
        });
    };

    // Dragging items will change the color order too.
    const handleDragEnd = useCallback(({ data }) => { updateColorOrder(data); }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>

                {/* Screen Title */}
                <Text style={[styles.bigText, styles.paddingHorizontal, { color: colors.textPrimary }]}>Settings</Text>

                {/* Color Settings */}
                <SectionBlock
                    title="Colors"
                    description="Which color order would you like to use to sort the items? Click and drag the colors or use the arrow buttons to reorder them."
                />

                {/* Color drag list */}
                <DraggableFlatList
                    data={colorOrder}
                    keyExtractor={(item) => item ?? "none"}  // ?? is like || this one. But for "null" or "undefined", while || is for "false"
                    onDragEnd={handleDragEnd}
                    activationDistance={8}
                    scrollEnabled={false}
                    style={styles.paddingHorizontal}
                    renderItem={({ item, index, drag, isActive }) => (
                        <ScaleDecorator activeScale={1.03}>
                            <View style={[styles.colorRow, styles.rowCenter, { 
                                backgroundColor: isActive ? colors.bgCardCopied : colors.bgCard,
                                borderColor: isActive ? colors.accentLight : "transparent"
                            }]}>

                                {/* Drag handle + color swatch */}
                                <TouchableOpacity onLongPress={drag} delayLongPress={150} activeOpacity={1} style={[styles.rowCenter, {gap: 10, flex: 1}]}>
                                    <View style={[ styles.colorBox, !item && styles.dashedBorder, 
                                        {backgroundColor: item || "transparent", 
                                        borderColor: item ? "transparent" : colors.textHalfOpacity} 
                                    ]}/>
                                  
                                    <View style={styles.dragDots}>
                                        {[0,1,2,3,4,5].map((i) => (
                                          <View key={i} style={[styles.dragDot, {backgroundColor: colors.textHalfOpacity}]} />
                                        ))}
                                    </View>

                                    <Text style={[styles.smallText, {color: colors.textPrimary, flex: 1}]}>
                                        {COLOR_NAMES[item] ?? item ?? "None"}
                                    </Text>

                                    {item && (
                                        <Text style={[styles.tinyText, {color: colors.textHalfOpacity}]}>{item}</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Arrow buttons */}
                                <View style={[styles.rowCenter, { gap: 4 }]}>
                                    <GHPressable
                                      onPress={() => moveColor(item, -1)}
                                      disabled={index === 0}
                                      style={({ pressed }) => [ styles.arrowButton, styles.centered, {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary} ]}
                                    >
                                          <FontAwesome name="arrow-up" size={15} color={colors.textPrimary} />
                                    </GHPressable>
                                    
                                    <GHPressable
                                      onPress={() => moveColor(item, 1)}
                                      disabled={index === colorOrder.length - 1}
                                      style={({ pressed }) => [ styles.arrowButton, styles.centered, {backgroundColor: pressed ? colors.accent : colors.bgPrimary, borderColor: pressed ? colors.accentLight : colors.bgSecondary} ]}
                                    >
                                          <FontAwesome name="arrow-down" size={15} color={colors.textPrimary} />
                                    </GHPressable>
                              </View>
                          </View>
                        </ScaleDecorator>
                    )}
                />

                {/* Sort order radio buttons */}
                <SectionBlock title={null} description="Sort colors by"/>

                <View style={[styles.paddingHorizontal, {flex: 1, marginBottom: 10, gap: 10}]}>
                    <RadioButton
                        label="Name"
                        selected={colorSortMode === "Order alphabetically"}
                        onPress={() => updateColorSortMode("Order alphabetically")}
                    />
                    <RadioButton
                        label="Last Edit Time"
                        selected={colorSortMode === "Order by edit time"}
                        onPress={() => updateColorSortMode("Order by edit time")}
                    />
                </View>

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />


                {/* Theme Settings */}
                <SectionBlock title="Themes" description="Coming soon..." />

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Language Settings */}
                <SectionBlock title="Languages" description="Coming soon..." />

                {/* Divider */}
                <View style={{height: 2, backgroundColor: colors.textHalfOpacity, marginVertical: 5}} />

                {/* Synchronisation Settings */}
                <SectionBlock title="Synchronisation" description="Coming soon..." />

            </ScrollView>
        </View>
    );
}