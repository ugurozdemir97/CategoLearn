import { Modal, View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from "../styles/styles.js";
import { colors } from "../styles/colors.js";

const AVAILABLE_COLORS = [ null, "#000000", "#FFFFFF", "#bb0000", "#00b700", "#0000da", "#ffdd00", "#980081", "#00e19d" ];

// A modal for changing colors of the items
export default function ColorModal({ visible, onClose, onSelect, selectedColor }) {
    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={[styles.centered, { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.bgModal }]}>
                    
                    {/* Title */}
                    <Text style={[styles.midText, styles.centeredText, { color: colors.textPrimary, marginBottom: 10}]}>
                        Select Color
                    </Text>

                    {/* Color Grid */}
                    <View style={styles.colorPicker}>
                        {AVAILABLE_COLORS.map((c, index) => (
                            <TouchableOpacity key={index} onPress={() => onSelect(c)}
                                style={[styles.colorButton, styles.centered, {
                                        backgroundColor: c || colors.bgSecondary,
                                        transform: selectedColor === c ? [{ scale: 1.13 }] : [{ scale: 1 }]
                                    }
                                ]}
                            >
                                {c === null && (
                                    <FontAwesome name="times" size={50} color={colors.textPrimary} />
                                )}
                            </TouchableOpacity>
                        ))}

                    </View>

                    {/* Confirm Button */}
                    <View style={[styles.rowSpaceBetween, { marginTop: 15 }]}>
                        <TouchableOpacity onPress={onClose} style={[styles.normalButton, { backgroundColor: colors.accent, flex: 1 }]}>
                            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Okay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}