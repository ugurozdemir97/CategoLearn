import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../language/i18n.js";
import { getWhatsNewConfig } from "./whatsNewConfig.js";

const WHATS_NEW_SEEN_PREFIX = "whats_new_seen_v";

/**
 * Returns the localized What's New content when the current version has not
 * been seen. Versions without matching translations do not show a modal.
 */
export const getUnseenWhatsNew = async () => {
    try {
        const config = getWhatsNewConfig();
        const storageKey = `${WHATS_NEW_SEEN_PREFIX}${config.version}`;
        const hasBeenSeen = await AsyncStorage.getItem(storageKey);

        if (hasBeenSeen === "true") return null;
        if (!i18n.exists(config.titleKey) || !i18n.exists(config.middleKey)) return null;

        const bottomText = i18n.exists(config.bottomKey)
            ? i18n.t(config.bottomKey)
            : null;

        return {
            version: config.version,
            title: i18n.t(config.titleKey),
            middleText: i18n.t(config.middleKey),
            bottomText: bottomText || null,
        };
    } catch (error) {
        console.error("What's New check failed", error);
        return null;
    }
};

/**
 * Marks a version as seen after the user closes its What's New modal.
 */
export const markWhatsNewAsSeen = async (version) => {
    try {
        const storageKey = `${WHATS_NEW_SEEN_PREFIX}${version}`;
        await AsyncStorage.setItem(storageKey, "true");
    } catch (error) {
        console.error("Failed to mark What's New as seen", error);
    }
};
