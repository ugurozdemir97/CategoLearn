import { StyleSheet } from "react-native";

export default StyleSheet.create({

    // CONTAINERS

    container: {
        flex: 1,
        paddingHorizontal: 15
    },

    centered: {
        justifyContent: "center",
        alignItems: "center"
    },

    // HEADER & FOOTER

    headerAndFooter: {
        position: "absolute",
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        zIndex: 10
    },

    header: {top: 0},
    footer: {bottom: 0},

    // ALIGNMENT

    rowSpaceBetween: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },


    // TEXT

    title: {fontSize: 22, fontWeight: "bold"},
    midText: {fontSize: 19, fontWeight: "bold"},
    smallText: {fontSize: 15},
    centeredText: {textAlign: "center"},

    // BUTTONS

    buttonContainer: {
        position: "absolute",
        right: 20,
        flexDirection: "column",
        alignItems: "center",
        rowGap: 12
    },

    circleButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2
    },

    item: {
        padding: 16,
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1
    },

    normalButton: {
         flex: 1, 
         padding: 14, 
         borderRadius: 10, 
         alignItems: "center"
    },

    // MODALS

    modalContent: {
        width: "90%",
        padding: 15,
        borderRadius: 16
    },

    input: {
        paddingHorizontal: 14,
        borderRadius: 10
    },

    fieldInput: {
        height: 100,
        textAlignVertical: "top"
    },

    dashedBorder: {
        borderWidth: 1,
        borderStyle: "dashed"
    },

    // Card detail fields
    contextArea: {
        width: "92%",
        paddingTop: 5,
        paddingBottom: 15, 
        paddingHorizontal: 15, 
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    }
});
