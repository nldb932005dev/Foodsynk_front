import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";

export default function ShoppingList() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menuName, setMenuName] = useState("");
  const [ingredients, setIngredients] = useState([]); // { nombre, cantidad? }
  const [checked, setChecked] = useState({});          // { nombre: bool }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [listRes, menuRes] = await Promise.all([
          api.get(`/menus/${id}/shopping-list`),
          api.get(`/menus/${id}`),
        ]);

        const data = listRes.data?.data ?? listRes.data;
        const menu = menuRes.data?.data ?? menuRes.data;

        setMenuName(menu.nombre ?? "Menú");
        setIngredients(Array.isArray(data) ? data : []);
        // Inicializar todos los checkboxes como no marcados
        const initial = {};
        (Array.isArray(data) ? data : []).forEach((ing) => {
          initial[ing.nombre ?? ing.name ?? ing] = false;
        });
        setChecked(initial);
      } catch {
        setError("No se pudo cargar la lista de la compra.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function toggleCheck(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getIngredientKey(ing) {
    return ing.nombre ?? ing.name ?? String(ing);
  }

  function getIngredientLabel(ing) {
    if (typeof ing === "string") return ing;
    const nombre = ing.nombre ?? ing.name ?? "Ingrediente";
    const cantidad = ing.pivot?.cantidad ?? "";
    const unidad = ing.pivot?.unidad_medida ?? "";
    if (cantidad) return `${nombre} — ${cantidad}${unidad ? " " + unidad : ""}`;
    return nombre;
  }

  async function handleCopy() {
    const text = ingredients
      .map((ing) => `- ${getIngredientLabel(ing)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard no disponible en algunos contextos
    }
  }

  const pending = ingredients.filter((ing) => !checked[getIngredientKey(ing)]);
  const done = ingredients.filter((ing) => checked[getIngredientKey(ing)]);

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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a mis menús
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Lista de la compra</h1>
          <p className="text-sm text-gray-500 mt-0.5">{menuName}</p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!error && ingredients.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          Este menú no tiene recetas con ingredientes.
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Pendientes */}
          {pending.length > 0 && (
            <ul className="divide-y divide-gray-50">
              {pending.map((ing) => {
                const key = getIngredientKey(ing);
                return (
                  <li key={key}>
                    <label className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleCheck(key)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green/20 cursor-pointer"
                      />
                      <span className="text-sm text-brand-navy">{getIngredientLabel(ing)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Comprados */}
          {done.length > 0 && (
            <>
              {pending.length > 0 && <div className="border-t border-gray-200" />}
              <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                Comprado
              </div>
              <ul className="divide-y divide-gray-50">
                {done.map((ing) => {
                  const key = getIngredientKey(ing);
                  return (
                    <li key={key}>
                      <label className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => toggleCheck(key)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green/20 cursor-pointer"
                        />
                        <span className="text-sm text-gray-400 line-through">{getIngredientLabel(ing)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Progreso */}
      {ingredients.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          {done.length} de {ingredients.length} ingredientes comprados
        </p>
      )}
    </div>
  );
}
