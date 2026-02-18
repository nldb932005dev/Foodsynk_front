import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/recipes/${id}`);
        // La API puede devolver { data: recipe } o directamente recipe
        setRecipe(res.data?.data ?? res.data);
      } catch {
        setError("No se pudo cargar la receta.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Receta no encontrada"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Boton volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver
      </button>

      {/* Card principal */}
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Imagen */}
        {recipe.foto ? (
          <img
            src={recipe.foto}
            alt={recipe.titulo}
            className="w-full h-64 sm:h-80 object-cover"
          />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-brand-green-light/20 flex items-center justify-center">
            <svg className="w-20 h-20 text-brand-green/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
            </svg>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            {recipe.titulo ?? "Sin titulo"}
          </h1>

          {/* Tiempo y etiquetas */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {recipe.tiempo && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recipe.tiempo}
              </div>
            )}

            {recipe.etiquetas && recipe.etiquetas.length > 0 &&
              recipe.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-brand-green-light/40 text-brand-green-dark px-3 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))
            }
          </div>

          {/* Ingredientes (si existen) */}
          {recipe.ingredientes && recipe.ingredientes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-brand-navy mb-3">Ingredientes</h2>
              <ul className="space-y-2">
                {recipe.ingredientes.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-green flex-shrink-0" />
                    {typeof ing === "string" ? ing : ing.nombre ?? ing.name}
                    {ing.pivot?.cantidad && ` - ${ing.pivot.cantidad}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pasos */}
          {recipe.pasos && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-brand-navy mb-3">Preparacion</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                {recipe.pasos}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
