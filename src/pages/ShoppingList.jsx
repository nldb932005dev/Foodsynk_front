import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import { normalizeText } from "../utils/normalize";

export default function ShoppingList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [menu, setMenu] = useState(null);
  const [ingredients, setIngredients] = useState([]); // agrupados y multiplicados
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [listRes, menuRes] = await Promise.all([
          api.get(`/menus/${id}/shopping-list`),
          api.get(`/menus/${id}`),
        ]);

        const rawList = listRes.data?.data ?? listRes.data;
        const menuData = menuRes.data?.data ?? menuRes.data;
        setMenu(menuData);

        const personas = menuData?.personas ?? 1;
        const rawArray = Array.isArray(rawList) ? rawList : [];

        // Agrupar por nombre+unidad (dos unidades distintas → dos filas)
        const grouped = {};
        rawArray.forEach((ing) => {
          const label = ing.nombre ?? ing.name ?? String(ing);
          const unidad = ing.pivot?.unidad_medida ?? "";
          const key = `${normalizeText(label)}|${unidad}`;
          if (!grouped[key]) {
            grouped[key] = {
              key,
              label,
              totalCantidad: 0,
              unidad,
              hasCantidad: false,
              recipes: [],
            };
          }
          const cantidad = parseFloat(ing.pivot?.cantidad ?? 0);
          if (cantidad > 0) {
            grouped[key].totalCantidad += cantidad * personas;
            grouped[key].hasCantidad = true;
          }
          if (ing.recipes) {
            grouped[key].recipes.push(...ing.recipes.map((r) => r.titulo ?? r));
          }
        });

        const processed = Object.values(grouped);
        setIngredients(processed);

        const initial = {};
        processed.forEach((ing) => {
          initial[ing.key] = false;
        });
        setChecked(initial);
      } catch {
        setError(t("errors.loadShoppingList"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Pendientes y comprados — definidos antes de los handlers para que
  // handleCopy / handleDownload exporten solo lo que falta por comprar.
  const pending = ingredients.filter((ing) => !checked[ing.key]);
  const done = ingredients.filter((ing) => checked[ing.key]);

  function toggleCheck(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getDisplayLabel(ing) {
    if (ing.hasCantidad && ing.totalCantidad > 0) {
      const cantidad = Number.isInteger(ing.totalCantidad)
        ? ing.totalCantidad
        : ing.totalCantidad.toFixed(1);
      return `${ing.label} — ${cantidad}${ing.unidad ? " " + ing.unidad : ""}`;
    }
    return ing.label;
  }

  function handleDownload() {
    if (pending.length === 0) {
      setCopyMessage(t("shopping.allBought"));
      setTimeout(() => setCopyMessage(""), 2000);
      return;
    }
    const nombreMenu = menu?.nombre ?? 'menu';
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `lista-compra-${nombreMenu.toLowerCase().replace(/\s+/g, '-')}-${fecha}.txt`;
    const header = `${t("shopping.fileHeader", { name: menu?.nombre ?? t("shopping.menuFallback") })}\n`;
    const subheader = menu?.personas ? `${t("shopping.filePeople", { count: menu.personas })}\n` : '';
    const separator = '─'.repeat(40) + '\n';
    const items = pending.map(ing => `• ${getDisplayLabel(ing)}`).join('\n');
    const blob = new Blob([header + subheader + separator + items], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (pending.length === 0) {
      setCopyMessage(t("shopping.allBought"));
      setTimeout(() => setCopyMessage(""), 2000);
      return;
    }
    const text = pending.map((ing) => `- ${getDisplayLabel(ing)}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard no disponible en algunos contextos
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => navigate("/my-menus")}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        {t("shopping.back")}
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{t("shopping.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{menu?.nombre ?? t("shopping.menuFallback")}</p>
          {menu?.personas && (
            <p className="text-xs text-gray-400 mt-0.5">
              {t("shopping.forPeople", { count: menu.personas })}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              />
            </svg>
            {copyMessage || (copied ? t("shopping.copied") : t("shopping.copy"))}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {t("shopping.download")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error mb-4">
          {error}
        </div>
      )}

      {!error && ingredients.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          {t("shopping.empty")}
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Pendientes */}
          {pending.length > 0 && (
            <ul className="divide-y divide-gray-50">
              {pending.map((ing) => (
                <li key={ing.key}>
                  <label className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleCheck(ing.key)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-green cursor-pointer"
                    />
                    <span className="text-sm text-brand-navy">
                      {getDisplayLabel(ing)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {/* Comprados */}
          {done.length > 0 && (
            <>
              {pending.length > 0 && <div className="border-t border-gray-200" />}
              <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                {t("shopping.bought")}
              </div>
              <ul className="divide-y divide-gray-50">
                {done.map((ing) => (
                  <li key={ing.key}>
                    <label className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleCheck(ing.key)}
                        className="h-4 w-4 rounded border-gray-300 accent-brand-green cursor-pointer"
                      />
                      <span className="text-sm text-gray-400 line-through">
                        {getDisplayLabel(ing)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {ingredients.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          {t("shopping.boughtCount", { done: done.length, total: ingredients.length })}
        </p>
      )}
    </div>
  );
}
