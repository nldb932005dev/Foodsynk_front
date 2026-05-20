import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇬🇧", label: "EN" },
];

// Selector de idioma siempre visible (invitados y autenticados, desktop y
// móvil). Persiste la elección en localStorage — el LanguageDetector la lee al
// recargar — y sincroniza <html lang> para SEO/accesibilidad.
export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.language || "es").slice(0, 2);

  useEffect(() => {
    document.documentElement.lang = current;
  }, [current]);

  function changeLang(e) {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    document.documentElement.lang = lng;
  }

  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t("nav.selectLanguage")}</span>
      <span aria-hidden="true" className="pointer-events-none absolute left-2 text-sm">
        {active.flag}
      </span>
      <select
        value={current}
        onChange={changeLang}
        aria-label={t("nav.selectLanguage")}
        title={t("nav.language")}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-6 text-xs font-semibold text-brand-navy hover:border-brand-green focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-colors cursor-pointer"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 w-3 h-3 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </label>
  );
}
