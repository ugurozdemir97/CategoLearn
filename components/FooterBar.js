import { View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";   // ✅ NEW
import styles from "../styles/styles.js";

export default function FooterBar({ selectedCount, hasClipboard, onAction }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
      {selectedCount > 0 ? (
        <View style={{ flexDirection: "row", justifyContent: "space-around", flex: 1 }}>
          <TouchableOpacity onPress={() => onAction("delete")}>
            <FontAwesome name="trash" size={22} color="#fff" />
          </TouchableOpacity>
          {selectedCount === 1 && (
            <TouchableOpacity onPress={() => onAction("edit")}>
              <FontAwesome name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onAction("cut")}>
            <FontAwesome name="scissors" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAction("copy")}>
            <FontAwesome name="copy" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAction("color")}>
            <FontAwesome name="paint-brush" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: "row", justifyContent: "space-around", flex: 1 }}>
          <TouchableOpacity onPress={() => onAction("search")}>
            <FontAwesome name="search" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAction("settings")}>
            <FontAwesome name="cog" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAction("deleted")}>
            <FontAwesome name="trash-o" size={22} color="#fff" />
          </TouchableOpacity>
          {hasClipboard && (
            <TouchableOpacity onPress={() => onAction("paste")}>
              <FontAwesome name="clipboard" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}