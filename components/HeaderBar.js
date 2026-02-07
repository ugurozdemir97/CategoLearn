import { View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";   // ✅ NEW
import styles from "../styles/styles.js";

export default function HeaderBar({ selectedCount, onSort }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {selectedCount > 0 ? (
        <FontAwesome name="check-square" size={20} color="#fff" />
      ) : (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => onSort("alphabetical")}>
            <FontAwesome name="sort-alpha-asc" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSort("created")}>
            <FontAwesome name="calendar-plus-o" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSort("edited")}>
            <FontAwesome name="calendar-check-o" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSort("color")}>
            <FontAwesome name="paint-brush" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}