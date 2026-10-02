import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import en from '@/locales/en.json';
import ro from '@/locales/ro.json';

const locales = { en, ro };
const STORAGE_KEY = 'projectly-language';

export const supportedLanguages = [
  { id: 'en', label: en.settingsDialog.english },
  { id: 'ro', label: en.settingsDialog.romanian },
];

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && locales[stored] ? stored : 'en';
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      strings: locales[language] ?? locales.en,
    }),
    [language],
  );

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useStrings() {
  return useLanguage().strings;
}
