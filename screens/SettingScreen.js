import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

const COLOR_ORDER = [
  null,
  "#000000",
  "#FFFFFF",
  "#bb0000",
  "#00b700",
  "#0000da",
  "#ffdd00",
  "#980081",
  "#00e19d",
];

const COLOR_NAMES = {
  null: "None",
  "#000000": "Black",
  "#FFFFFF": "White",
  "#bb0000": "Red",
  "#00b700": "Green",
  "#0000da": "Blue",
  "#ffdd00": "Yellow",
  "#980081": "Purple",
  "#00e19d": "Mint",
};

function SectionHeader({ title }) {
  return (
    <View style={localStyles.sectionHeaderRow}>
      <View style={localStyles.sectionAccentBar} />
      <Text style={localStyles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function RadioOption({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={localStyles.radioButton} activeOpacity={0.7}>
      <View style={[localStyles.radioCircle, selected && localStyles.radioCircleSelected]}>
        {selected && <View style={localStyles.radioInner} />}
      </View>
      <Text style={[localStyles.radioLabel, selected && localStyles.radioLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [colorOrder, setColorOrder] = useState(COLOR_ORDER);
  const [colorSortMode, setColorSortMode] = useState("alphabetical");

  // FIX: Use a key-based approach so indices are always accurate after drag
  // Arrow buttons swap by value, avoiding stale-index bugs
  const moveColor = (item, direction) => {
    setColorOrder((prev) => {
      const currentIndex = prev.indexOf(item);
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newOrder = [...prev];
      newOrder[currentIndex] = newOrder[targetIndex];
      newOrder[targetIndex] = item;
      return newOrder;
    });
  };

  const handleDragEnd = useCallback(({ data }) => {
    setColorOrder(data);
  }, []);

  const renderItem = ({ item, index, drag, isActive }) => (
      <ScaleDecorator activeScale={1.02}>
        <View
          style={[
            localStyles.colorRow,
            isActive && localStyles.colorRowActive,
          ]}
        >
          {/* Color swatch + drag handle */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={150}
            activeOpacity={0.8}
            style={localStyles.dragHandle}
          >
            <View
              style={[
                localStyles.colorBox,
                {
                  backgroundColor: item || "transparent",
                  borderColor: item === "#FFFFFF" ? "#ccc" : item ? item : colors.textHalfOpacity,
                },
                !item && styles.dashedBorder,
              ]}
            />
            <View style={localStyles.dragDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={localStyles.dragDot} />
              ))}
              {[0, 1, 2].map((i) => (
                <View key={`b${i}`} style={localStyles.dragDot} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Label */}
          <Text style={[styles.smallText, localStyles.colorLabel]}>
            {COLOR_NAMES[item] ?? item ?? "None"}
          </Text>

          {item && (
            <Text style={localStyles.colorHex}>{item}</Text>
          )}

          {/* Arrow buttons */}
          <View style={[styles.rowCenter, { gap: 4 }]}>
            <GHPressable
              onPress={() => moveColor(item, -1)}
              disabled={index === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                localStyles.arrowButton,
                index === 0 && localStyles.arrowButtonDisabled,
                pressed && localStyles.arrowButtonPressed,
              ]}
            >
              <Text style={[localStyles.arrow, index === 0 && localStyles.arrowDisabled]}>↑</Text>
            </GHPressable>
            <GHPressable
              onPress={() => moveColor(item, 1)}
              disabled={index === colorOrder.length - 1}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                localStyles.arrowButton,
                index === colorOrder.length - 1 && localStyles.arrowButtonDisabled,
                pressed && localStyles.arrowButtonPressed,
              ]}
            >
              <Text style={[localStyles.arrow, index === colorOrder.length - 1 && localStyles.arrowDisabled]}>↓</Text>
            </GHPressable>
          </View>
        </View>
      </ScaleDecorator>
  );

  const ListHeader = (
    <>
      <Text style={[styles.bigText, localStyles.screenTitle]}>Settings</Text>

      <SectionHeader title="Colors" />
      <Text style={[styles.smallText, localStyles.sectionDesc]}>
        Drag or use arrows to reorder colors
      </Text>

      <View style={localStyles.divider} />
    </>
  );

  const ListFooter = (
    <>
      <View style={localStyles.divider} />

      <Text style={[styles.smallText, localStyles.sectionSubtitle]}>Sort colors by</Text>
      <View style={localStyles.radioGroup}>
        <RadioOption
          label="Alphabetically"
          selected={colorSortMode === "alphabetical"}
          onPress={() => setColorSortMode("alphabetical")}
        />
        <RadioOption
          label="Last Edit Time"
          selected={colorSortMode === "editTime"}
          onPress={() => setColorSortMode("editTime")}
        />
      </View>

      <SectionHeader title="Theme" />
      <Text style={[styles.smallText, localStyles.sectionDesc]}>
        Theme options will appear here
      </Text>

      <SectionHeader title="Language" />
      <Text style={[styles.smallText, localStyles.sectionDesc]}>
        Language settings (coming soon)
      </Text>

      <SectionHeader title="Synchronisation" />
      <Text style={[styles.smallText, localStyles.sectionDesc]}>
        Google account sync (coming soon)
      </Text>

      <View style={{ height: 40 }} />
    </>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.bgPrimary,
        },
      ]}
    >
      <DraggableFlatList
        data={colorOrder}
        keyExtractor={(item) => item ?? "none"}
        onDragEnd={handleDragEnd}
        activationDistance={8}
        contentContainerStyle={[localStyles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        renderItem={renderItem}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
  },

  screenTitle: {
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 24,
    letterSpacing: 0.5,
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 4,
    gap: 10,
  },
  sectionAccentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.accentLight,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionDesc: {
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 19,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    marginTop: 14,
    marginBottom: 4,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: colors.textHalfOpacity,
    marginVertical: 12,
    borderRadius: 1,
  },

  // Color rows
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 3,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 10,
  },
  colorRowActive: {
    backgroundColor: colors.bgCardCopied,
    borderColor: colors.accentLight,
    shadowColor: colors.accentLight,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },

  dragHandle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dragDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 10,
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textHalfOpacity,
  },

  colorBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
  },

  colorLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  colorHex: {
    fontSize: 11,
    color: colors.textHalfOpacity,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginRight: 4,
  },

  // Arrow buttons
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButtonDisabled: {
    borderColor: "transparent",
    backgroundColor: colors.bgSecondary,
    opacity: 0.3,
  },
  arrowButtonPressed: {
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
  },
  arrow: {
    fontSize: 14,
    color: colors.accentLight,
    lineHeight: 16,
  },
  arrowDisabled: {
    color: colors.textHalfOpacity,
  },

  // Radio group
  radioGroup: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.accentLight,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentLight,
  },
  radioLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  radioLabelSelected: {
    color: colors.accentLight,
    fontWeight: "600",
  },
});