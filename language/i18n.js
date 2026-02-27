import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

// Detect device language
const locales = getLocales();
const defaultLang = locales[0]?.languageCode || "en";

// Initialise i18n
i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: "v3",
        lng: defaultLang,
        fallbackLng: "en",
        interpolation: {escapeValue: false},
        resources: {
            en: { translation: en },
            tr: { translation: tr },
        }
    });

export default i18n;