// contexts/language-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const LANGUAGES = [
  { name: "English", letsGo: "Let's go", to: "to" },
  { name: "Tsonga", letsGo: "A hi fambeni", to: "eka" },
  { name: "Afrikaans", letsGo: "Kom ons gaan", to: "na" },
  { name: "Zulu", letsGo: "Asishambe", to: "siye" },
  { name: "Xhosa", letsGo: "Masihambeni", to: "siye" },
  { name: "Northern Sotho", letsGo: "A re yeng", to: "go" },
  { name: "Tswana", letsGo: "A re yeng", to: "kwa" },
  { name: "Sotho", letsGo: "Ha re yeng", to: "ho" },
  { name: "Swazi", letsGo: "Asishambe", to: "siye" },
  { name: "Venda", letsGo: "Ri a fhambeni", to: "kha" },
  { name: "Ndebele", letsGo: "Asishambe", to: "siya" },
];

interface LanguageContextType {
  currentLang: typeof LANGUAGES[0];
  currentIndex: number;
  isAnimating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LANGUAGES.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLang: LANGUAGES[currentIndex],
        currentIndex,
        isAnimating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}