import { StyleSheet } from "react-native";

export default StyleSheet.create({

    // General containers
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: "#0c1323"
    },

    paddingContainer: {
        paddingHorizontal: 50
    },

    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    title: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: "center",
        color: "rgb(152, 245, 255)"
    },

    noItem: {
        fontSize: 18,
        textAlign: "center",
        color: "rgb(193, 249, 255)"
    },

    bold: {
        fontWeight: "bold"
    },

    itemText: {
        fontSize: 16,
        color: "#ffffff"
    },

    // List items
    item: {
        padding: 15,
        backgroundColor: "#121f3d",
        marginVertical: 5,
        borderRadius: 15,
        borderWidth: 0.8,
        borderColor: "#42acf3"
    },

    // Floating buttons
    plusButton: {
        position: "absolute",
        right: 20,
        bottom: 20,
        backgroundColor: "#007AFF",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5
    },
    plusText: {
        color: "white",
        fontSize: 30,
        fontWeight: "bold"
    },
    folderButton: {
        position: "absolute",
        right: 20,
        bottom: 100,
        backgroundColor: "#007AFF",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.7)"
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#1e1e1e",
        padding: 20,
        borderRadius: 10,
        elevation: 10
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
        textAlign: "center",
        color: "#ffffff"
    },
    input: {
        borderWidth: 1,
        borderColor: "#444",
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
        color: "#ffffff",
        backgroundColor: "#2a2a2a"
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    // Card detail fields
    field: {
        marginBottom: 15
    },

    buttonContainer: {
        position: "absolute",
        right: 20,
        flexDirection: "column",
        alignItems: "center",
        rowGap: 10
    },

    circleButton: {
        backgroundColor: "#007AFF",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5
    },

    goBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        position: "absolute",
        left: 20,
        top: 40,
    },

header: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 50,
  backgroundColor: "#111",   // dark background
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 10,
  zIndex: 10,
},

footer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 60,
  backgroundColor: "#111",   // dark background
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-around",
  borderTopWidth: 1,
  borderTopColor: "#333",    // subtle divider
  zIndex: 10,
},

footerButton: {
  color: "#fff",             // light icons/text
},

headerButton: {
  color: "#fff",             // light icons/text
},

});