import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        //backGroundColor: colors.bgPrimary,
    },

    paddingContainer: {
        paddingHorizontal: 40,
    },

    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 16,
        textAlign: "center",
        //color: colors.textAccent,
        letterSpacing: 0.5,
    },

    noItem: {
        fontSize: 17,
        textAlign: "center",
        //color: colors.textSecondary,
        fontWeight: "500",
    },

    bold: {
        fontWeight: "bold",
    },

    itemText: {
        fontSize: 16,
        //color: colors.textPrimary,
        fontWeight: "500",
    },

    // List items
    item: {
        padding: 16,
        //backGroundColor: colors.bgCard,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        //borderColor: colors.border,
        //shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    itemSelected: {
        //backGroundColor: colors.selected,
        //borderColor: colors.accentLight,
    },

    // Floating buttons
    plusButton: {
        position: "absolute",
        right: 20,
        bottom: 20,
        //backGroundColor: colors.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        //shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },

    plusText: {
        //color: colors.textPrimary,
        fontSize: 28,
        fontWeight: "bold",
    },

    folderButton: {
        position: "absolute",
        right: 20,
        bottom: 100,
        //backGroundColor: colors.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        //backGroundColor: "rgba(0, 0, 0, 0.8)",
    },

    modalContent: {
        width: "85%",
        //backGroundColor: colors.bgModal,
        padding: 24,
        borderRadius: 16,
        elevation: 10,
        borderWidth: 1,
        //borderColor: colors.border,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 16,
        textAlign: "center",
        //color: colors.textPrimary,
    },

    input: {
        borderWidth: 1,
        //borderColor: colors.border,
        padding: 14,
        marginBottom: 14,
        borderRadius: 10,
        //color: colors.textPrimary,
        //backGroundColor: colors.bgSecondary,
        fontSize: 16,
    },

    inputFocused: {
        //borderColor: colors.accent,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },

    // Card detail fields
    field: {
        marginBottom: 12,
        paddingVertical: 8,
    },

    fieldContext: {
        //color: colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },

    buttonContainer: {
        position: "absolute",
        right: 20,
        flexDirection: "column",
        alignItems: "center",
        rowGap: 12,
    },

    circleButton: {
        //backGroundColor: colors.accent,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        //shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },

    circleButtonSecondary: {
        //backGroundColor: colors.bgCard,
        borderWidth: 1,
        //borderColor: colors.border,
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
        height: 56,
        //backGroundColor: colors.bgSecondary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        //backGroundColor: colors.bgSecondary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        zIndex: 10,
    },

    footerButton: {
        //color: colors.textPrimary,
        padding: 8,
    },

    headerButton: {
        //color: colors.textPrimary,
        padding: 8,
    },

    // Selection count badge
    selectionBadge: {
        //backGroundColor: colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },

    selectionBadgeText: {
        //color: colors.textPrimary,
        fontWeight: "600",
        fontSize: 14,
    },

    // Icon colors export for components
    //iconColor: colors.textPrimary,
    //iconColorMuted: colors.textSecondary,
    //iconColorAccent: colors.accentLight,
    //dangerColor: colors.danger,
    //accentColor: colors.accent,
});
