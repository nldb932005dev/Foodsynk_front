import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";

export default function EditMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [originalRecipeIds, setOriginalRecipeIds] = useState(new Set());
  const [selectedRecipes, setSelectedRecipes] = useState([]); // { id, titulo }
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [menuRes, recipesRes] = await Promise.all([
          api.get(`/menus/${id}`),
          api.get("/recipes"),
        ]);

        const menu = menuRes.data?.data ?? menuRes.data;
        const recipes = recipesRes.data?.data ?? recipesRes.data;

        setNombre(menu.nombre ?? "");

        const menuRecipes = menu.recipes ?? [];
        setSelectedRecipes(menuRecipes.map((r) => ({ id: r.id, titulo: r.titulo })));
        setOriginalRecipeIds(new Set(menuRecipes.map((r) => r.id)));
        setAllRecipes(Array.isArray(recipes) ? recipes : []);
      } catch {
        setError("No se pudo cargar el menú.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

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

  function removeRecipe(recipeId) {
    setSelectedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Actualizar nombre
      await api.put(`/menus/${id}`, { nombre: nombre.trim() });

      // 2. Calcular diff
      const finalIds = new Set(selectedRecipes.map((r) => r.id));
      const toAdd = selectedRecipes.filter((r) => !originalRecipeIds.has(r.id));
      const toRemove = [...originalRecipeIds].filter((rid) => !finalIds.has(rid));

      // 3. Aplicar cambios en paralelo
      await Promise.all([
        ...toAdd.map((r) => api.post(`/menus/${id}/recipes`, { recipe_id: r.id })),
        ...toRemove.map((rid) => api.delete(`/menus/${id}/recipes/${rid}`)),
      ]);

      navigate("/my-menus");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "No se pudo guardar el menú.";
      setError(msg);
    } finally {
      setSubmitting(false);
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

      <h1 className="text-2xl font-bold text-brand-navy mb-6">Editar menú</h1>

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

        {/* Recetas en el menú */}
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
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
