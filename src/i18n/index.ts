import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";

// Default resources - only English loaded initially
const resources = {
  en: { translation: en },
};

// Lazy load Spanish translations when needed
const loadSpanishTranslations = async () => {
  if (!i18n.hasResourceBundle("es", "translation")) {
    const es = await import("./locales/es.json");
    i18n.addResourceBundle("es", "translation", es.default, true, true);
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// Pre-load Spanish if it's the detected language
const currentLng = i18n.language;
if (currentLng === "es" || currentLng?.startsWith("es-")) {
  loadSpanishTranslations();
}

// Load Spanish translations when language changes
i18n.on("languageChanged", (lng) => {
  if (lng === "es" || lng?.startsWith("es-")) {
    loadSpanishTranslations();
  }
});

export default i18n;
