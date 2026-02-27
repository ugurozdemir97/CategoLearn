import { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { getLocales } from "expo-localization";
import { loadLanguage, saveLanguage } from "../storage/languagePreference.js";

// Language context
const LanguageContext = createContext();

// Available languages
export const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' }
];

// Language provider component
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    
    // Detect system language on first load
    const systemLanguage = getLocales()[0]?.languageCode || "en";
    const defaultLanguage = availableLanguages.find(l => l.code === systemLanguage) ? systemLanguage : "en";
    
    const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);

    // Load saved language on mount
    useEffect(() => {
        const loadSavedLanguage = async () => {
            const savedLanguage = await loadLanguage();
            if (savedLanguage) {
                await i18n.changeLanguage(savedLanguage);
                setCurrentLanguage(savedLanguage);
            } else {
                await i18n.changeLanguage(defaultLanguage);
                setCurrentLanguage(defaultLanguage);
            }
        };
        loadSavedLanguage();
    }, []);

    // Change language and save preference
    const changeLanguage = async (languageCode) => {
        await i18n.changeLanguage(languageCode);
        setCurrentLanguage(languageCode);
        await saveLanguage(languageCode);
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, availableLanguages }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Hook to use language
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {throw new Error("useLanguage must be used within LanguageProvider")}
    return context;
}