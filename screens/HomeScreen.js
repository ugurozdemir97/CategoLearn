import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import CircleButton from "../components/CircleButton.js";
import CreateModal from "../components/CreateModal.js";
import styles from "../styles/styles.js";

// Here you will create main topics about what you want to learn. 
// For example "Math", "Biology", "Russian"...
export default function HomeScreen({ navigation }) {

    const [subjects, setSubjects] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newSubject, setNewSubject] = useState("");

    // Add new subjects to learn
    const addSubject = () => {
        const trimmed = newSubject.trim();

        // Prevent empty or duplicate subjects
        if (!trimmed) {
            Alert.alert("Invalid Name", "Subject name cannot be empty.");
            return;
        }
        if (subjects.includes(trimmed)) {
            Alert.alert("Duplicate Subject", "This subject already exists.");
            return;
        }
        if (trimmed.length > 60) {
            Alert.alert("Too Long", "Subject name cannot exceed 60 characters.");
            return;
        }

        setSubjects([...subjects, trimmed]);
        setNewSubject("");
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>

            {subjects.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.noItem}>What Do You Want To Learn About?</Text>
                </View>
            ) : (
                <>
                    <Text style={[styles.title, styles.bold]}>Subjects</Text>
                    <FlatList
                        data={subjects}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => navigation.navigate("Folder", { node: { name: item, type: "subject", children: [] }})}
                            >
                                <Text style={styles.itemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}

            {/* Floating Plus Button */}

            <View style={styles.buttonContainer}>
                <CircleButton icon="plus" onPress={() => setModalVisible(true)} />
            </View>

            {/* Modal for Subject Input */}
            <CreateModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={addSubject}
                title="Enter Subject Name"
                placeholder="e.g. Math, Biology, Russian..."
                value={newSubject}          // controlled state
                setValue={setNewSubject}    // setter
            />

        </View>
    );
}