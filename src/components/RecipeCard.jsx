import { useNavigate } from "react-router-dom";

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="cursor-pointer rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 group"
    >
      {/* Imagen */}
      {recipe.foto ? (
        <div className="overflow-hidden">
          <img
            src={recipe.foto}
            alt={recipe.titulo}
            className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-44 w-full bg-brand-green-light/30 flex items-center justify-center">
          <svg className="w-14 h-14 text-brand-green/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
          </svg>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        <h3 className="text-brand-navy font-semibold text-base truncate">
          {recipe.titulo ?? "Sin titulo"}
        </h3>

        {/* Tiempo (si existe) */}
        {recipe.tiempo && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.tiempo}
          </div>
        )}

        {/* Etiquetas (si existen) */}
        {recipe.etiquetas && recipe.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.etiquetas.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-brand-green-light/40 text-brand-green-dark px-2.5 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preview de pasos */}
        {recipe.pasos && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {recipe.pasos}
          </p>
        )}
      </div>
    </article>
  );
}
