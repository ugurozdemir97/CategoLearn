import { StyleSheet } from "react-native";

export default StyleSheet.create({

    // CONTAINERS

    container: {flex: 1},

    buttonContainer: {
        position: "absolute",
        right: 20,
        flexDirection: "column",
        alignItems: "center",
        rowGap: 12
    },

    colorPicker: {
        flexDirection: "row", 
        flexWrap: "wrap", 
        justifyContent: "center",
        width: 170,
        height: 170,
        gap: 10,
        marginBottom: 15
    },

    // ALIGNMENT

    spaceBetween: {justifyContent: "space-between"},
    spaceAround: {justifyContent: "space-around"},

    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
    },

    centered: {
        justifyContent: "center",
        alignItems: "center"
    },

    paddingHorizontal: {paddingHorizontal: 20},
    paddingVertical: {paddingVertical: 15},

    // TEXT

    bigText: {fontSize: 18, fontWeight: "bold"},
    midText: {fontSize: 16},
    smallText: {fontSize: 14},
    tinyText: {fontSize: 12},
    centeredText: {textAlign: "center"},

    // BUTTONS

    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2
    },

    normalButton: {
        padding: 8, 
        borderRadius: 5, 
        alignItems: "center"
    },

    smallInputButton: {
        padding: 8,
        borderRadius: 5,
        borderWidth: 1
    },  

    colorButton: {
        width: 50,        
        height: 50,
        aspectRatio: 1,          
        borderRadius: 5,
    },

    // MODALS

    modalContent: {
        width: "96%",
        padding: 15,
        borderRadius: 5
    },

    input: {
        borderRadius: 5,
        flex: 1
    },

    fieldInput: {
        minHeight: 100,
        maxHeight: 300,
        flex: 0,
        textAlignVertical: "top"
    },

    // Card detail fields
    contextArea: {
        width: "100%",
        paddingHorizontal: 15, 
    },

    // Visuals 

    itemColorDisplay: {
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 15,
    },

    dashedBorder: {
        borderWidth: 1.5,
        borderStyle: "dashed"
    }
});
