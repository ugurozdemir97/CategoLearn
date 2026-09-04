import appConfig from "../../app.json";

/**
 * Builds the translation keys for the installed app version.
 * For a new release, update app.json and add matching keys to each locale file.
 */
export const getWhatsNewConfig = () => {
    const version = appConfig.expo.version;
    const versionKey = `v${version.replace(/\./g, "_")}`;
    const translationPrefix = `whats_new.${versionKey}`;

    return {
        version,
        titleKey: `${translationPrefix}.title`,
        middleKey: `${translationPrefix}.middle`,
        bottomKey: `${translationPrefix}.bottom`,
    };
};
