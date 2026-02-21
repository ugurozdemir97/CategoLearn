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

    toolBarContainer: {
        borderRadius: 6,
        overflow: 'hidden',
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

    colorRow: {
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 10,
        marginTop: 6,
        borderWidth: 1,
        gap: 10
    },

    arrowButton: {
        width: 30,
        height: 30,
        borderRadius: 7,
        borderWidth: 1
    },

    crumbButton: {
        paddingHorizontal: 6,
        paddingVertical: 2
    },

    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        backgroundColor: "transparent"
    },

    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4
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

    // Card detail fields

    contextArea: {
        width: "100%",
        paddingHorizontal: 15, 
    },

    // Visuals 

    itemColorDisplay: {
        position: "absolute",
        left: 10, top: 5, bottom: 5,
        width: 10,
        borderRadius: 3
    },

    dashedBorder: {
        borderWidth: 1.5,
        borderStyle: "dashed"
    },

    colorBox: {
        width: 28,
        height: 28,
        borderRadius: 6
    },

    dragDots: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: 10,
        gap: 2
    },

    dragDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5
    }

});
