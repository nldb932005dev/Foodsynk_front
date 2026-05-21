import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./locales/es.json";
import en from "./locales/en.json";

// Bundles importados estáticamente → la inicialización es síncrona, no hace
// falta Suspense ni estado de carga en los componentes.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    // Las "namespaces" del bloque I18N se modelan como objetos de primer
    // nivel dentro del único bundle `translation` (common, auth, recipes,
    // menus, admin, errors, validation, units, nav...). Así `t('common.save')`
    // funciona sin prefijo de namespace y los bundles quedan en un solo JSON.
    ns: ["translation"],
    defaultNS: "translation",
    detection: {
      // localStorage (elección explícita del usuario) → idioma del navegador
      // → fallback 'es'. Persistimos en localStorage al cambiar.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React ya escapa
    },
  });

export default i18n;
