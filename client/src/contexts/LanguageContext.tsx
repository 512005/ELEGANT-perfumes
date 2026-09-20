import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "ar" | "en";
type LanguageContextValue = { language: Language; isArabic: boolean; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "novalre-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const value = useMemo(() => ({ language, isArabic: language === "ar", toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar") }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function bi(arabic: string, english: string, language: Language) {
  return language === "ar" ? arabic : english;
}
