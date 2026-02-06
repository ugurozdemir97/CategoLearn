import { useState } from "react";
import { View, Text } from "react-native";
import CircleButton from "../components/CircleButton.js";
import CreateModal from "../components/CreateModal.js";
import styles from "../styles/styles.js";

export default function CardDetailScreen({ route, navigation }) {
    const { card } = route.params;
    const [fields, setFields] = useState(card.fields || []);
    const [modalVisible, setModalVisible] = useState(false);

    // Update card fields when modal "Create" is pressed
    const updateCardFields = (updatedCard) => {
        setFields(updatedCard.optionalAreas || []);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <CircleButton icon="back" isGoBack={true} onPress={() => navigation.goBack()} />

            <View style={styles.paddingContainer}>
                <Text style={[styles.title, styles.bold]}>{card.name}</Text>
            </View>

            {/* Show existing fields */}
            {fields.map((f, i) => (
                <View key={i} style={styles.field}>
                    <Text style={styles.itemText}>{f.name}</Text>
                    <Text style={styles.itemText}>{f.context}</Text>
                </View>
            ))}

            {/* Floating Plus Button */}
            <View style={styles.buttonContainer}>
                <CircleButton icon="plus" onPress={() => setModalVisible(true)} />
            </View>

            {/* Modal for editing/adding fields */}
            <CreateModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={(updatedCard) => {
                    setFields(updatedCard.optionalAreas || []);
                }}
                title="Edit Card Fields"
                placeholder="Card Title"
                value={card.name}
                setValue={() => {}} 
                isCard={true}
                fields={fields}
                setFields={setFields}
                mode="edit"
            />
        </View>
    );
}