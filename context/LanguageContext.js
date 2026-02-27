import { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
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
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    // Load saved language on mount
    useEffect(() => {
        const loadSavedLanguage = async () => {
            const savedLanguage = await loadLanguage();
            if (savedLanguage) {
                await i18n.changeLanguage(savedLanguage);
                setCurrentLanguage(savedLanguage);
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