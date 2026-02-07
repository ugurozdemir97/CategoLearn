import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";

export default function ListButton({
  label,
  icon,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  isCut = false,       // ✅ new prop
  isCopied = false,    // ✅ new prop
}) {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isSelected ? "#333" : "transparent",
          opacity: isCut ? 0.5 : 1,                        // ghost if cut
          backgroundColor: isCopied ? "#444" : (isSelected ? "#333" : "transparent"), // highlight if copied
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {icon && (
          <FontAwesome
            name={icon}
            size={20}
            color={isSelected ? "#fff" : "#82c6f0"}
            style={{ marginRight: 15 }}
          />
        )}
        <Text style={[styles.itemText, { color: isSelected ? "#fff" : "#eee" }]}>
          {label}
        </Text>
      </View>

      {isSelected && <FontAwesome name="check-circle" size={20} color="#82c6f0" />}
    </TouchableOpacity>
  );
}