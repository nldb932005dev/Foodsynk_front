import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function CreateMenu() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState([]); // { id, titulo }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Carga de todas las recetas publicadas para el buscador
  useEffect(() => {
    api.get("/recipes")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAllRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const selectedIds = new Set(selectedRecipes.map((r) => r.id));

  const suggestions = allRecipes.filter(
    (r) =>
      !selectedIds.has(r.id) &&
      (r.titulo ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  function addRecipe(recipe) {
    setSelectedRecipes((prev) => [...prev, { id: recipe.id, titulo: recipe.titulo }]);
    setSearchQuery("");
  }

  function removeRecipe(id) {
    setSelectedRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Crear el menú
      const res = await api.post("/menus", { nombre: nombre.trim() });
      const menu = res.data?.data ?? res.data;

      // 2. Adjuntar recetas seleccionadas
      await Promise.all(
        selectedRecipes.map((r) =>
          api.post(`/menus/${menu.id}/recipes`, { recipe_id: r.id })
        )
      );

      navigate("/my-menus");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "No se pudo crear el menú.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/my-menus")}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a mis menús
      </button>

      <h1 className="text-2xl font-bold text-brand-navy mb-6">Nuevo menú</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">
            Nombre del menú <span className="text-brand-coral">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Semana del 20 de enero"
            maxLength={100}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-brand-navy placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* Buscador de recetas */}
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">
            Añadir recetas
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca una receta para añadir..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-brand-navy placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />

          {/* Sugerencias */}
          {searchQuery.trim() && suggestions.length > 0 && (
            <ul className="mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              {suggestions.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => addRecipe(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-green-light/20 transition-colors"
                  >
                    {r.titulo}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQuery.trim() && suggestions.length === 0 && (
            <p className="mt-2 text-xs text-gray-400">Sin resultados para "{searchQuery}".</p>
          )}
        </div>

        {/* Recetas seleccionadas */}
        {selectedRecipes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-brand-navy mb-2">
              Recetas en este menú ({selectedRecipes.length})
            </p>
            <ul className="space-y-2">
              {selectedRecipes.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-brand-cream/50 px-4 py-2.5"
                >
                  <span className="text-sm text-brand-navy">{r.titulo}</span>
                  <button
                    type="button"
                    onClick={() => removeRecipe(r.id)}
                    className="text-xs text-gray-400 hover:text-brand-coral transition-colors"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/my-menus")}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !nombre.trim()}
            className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creando..." : "Crear menú"}
          </button>
        </div>
      </form>
    </div>
  );
}
