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

    cardActionTray: {
        position: "absolute",
        right: 10,
        width: 100,
        alignItems: "center",
        zIndex: 10,
    },

    cardActionClip: {
        width: 100,
        height: 112,
        paddingBottom: 12,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "flex-end",
    },

    cardActionButtons: {
        alignItems: "center",
        gap: 12,
    },

    cardActionCaretButton: {
        width: 76,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 9,
    },

    footerBar: {
        position: "relative",
        zIndex: 20,
        elevation: 6,
        shadowColor: "transparent",
        shadowOpacity: 0,
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

    fieldSetActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
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

    fieldSetActionButton: {
        minWidth: 38,
        height: 34,
        paddingHorizontal: 4,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
    },

    fieldSetRowButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
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
        flex: 1,
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
    },

    underShadow: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,   
        shadowRadius: 4,      
        elevation: 4,         
    }

});
