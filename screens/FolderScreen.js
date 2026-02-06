import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import CircleButton from "../components/CircleButton.js";
import CreateModal from "../components/CreateModal.js";
import styles from "../styles/styles.js";

// This screen is inside of a subject folder. Here you can create subfolders or cards with information about the topic.
// Let's say the subject is "English". You can create a folder "Grammar" and inside it 
// create cards like "Past Tense", "Future Tense" etc. Or you can create a card "Vocabulary" and add fields 
// like "Word 1", "Word 2" etc. and write translations there.
export default function FolderScreen({ route, navigation }) {

    const { node } = route.params;                           // node = { name: item, type: "subject/folder/card", children: [] }
    const [children, setChildren] = useState(node.children || []);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState("");
    const [createType, setCreateType] = useState(null);     // "folder" or "card"
    const [fields, setFields] = useState([]);

    // Add new subfolder or card to the current folder
    const addItem = () => {
        const trimmed = newName.trim();

        if (!trimmed) {
            Alert.alert("Invalid Name", "Name cannot be empty.");
            return;
        }
        if (children.some(c => c.name === trimmed)) {
            Alert.alert("Duplicate", "This name already exists.");
            return;
        }

        if (createType === "Category") {
            setChildren([...children, { name: trimmed, type: "Category", children: [] }]);
        } else if (createType === "Card") {
            setChildren([...children, { name: trimmed, type: "Card", fields: fields }]);
        }

        setNewName("");
        setFields([]);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>

            <CircleButton icon="back" isGoBack={true} onPress={() => navigation.goBack()} />
            
            <View style={styles.paddingContainer}>
                <Text style={[styles.title, styles.bold]}>{node.name}</Text>
            </View>

            {children.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.noItem}>No Items Yet</Text>
                </View>
            ) : (

                <FlatList
                    data={[
                        ...children.filter(c => c.type === "Category"),
                        ...children.filter(c => c.type === "Card")
                    ]}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (

                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => {
                                if (item.type === "Category") navigation.push("Folder", { node: item });
                                else navigation.navigate("CardDetail", { card: item });
                            }}
                        >
                            <Text style={styles.itemText}>
                                {item.type === "Category" ? "📁 " : "📝 "}
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <CircleButton icon="folder" onPress={() => { setCreateType("Category"); setModalVisible(true); }} />
                <CircleButton icon="card" onPress={() => { setCreateType("Card"); setModalVisible(true); }} />
            </View>

            {/* Modal */}
            <CreateModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={addItem}
                title={`Create ${createType}`}
                placeholder={`Enter ${createType} Name`}
                value={newName}
                setValue={setNewName}
                isCard={createType === "Card"}
                fields={fields}
                setFields={setFields}
                mode="create"
            />

        </View>
    );
}