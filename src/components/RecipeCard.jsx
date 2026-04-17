import { useNavigate } from "react-router-dom";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e8f5e9' width='400' height='300'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='48' fill='%232D6A4F' opacity='0.3'%3E%F0%9F%8D%BD%3C/text%3E%3Ctext x='50%25' y='62%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%232D6A4F' opacity='0.4'%3ESin imagen%3C/text%3E%3C/svg%3E";

export default function RecipeCard({ recipe, showActions = false, onEdit, onDelete, onPublish }) {
  const navigate = useNavigate();

  function handleImageError(e) {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_IMG;
  }

  return (
    <article
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="relative cursor-pointer rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 group"
    >
      {/* Action buttons (edit/delete) */}
      {showActions && (
        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(recipe);
            }}
            className="rounded-lg bg-white/90 backdrop-blur-sm p-2 shadow-md border border-gray-200 text-brand-navy hover:bg-brand-green hover:text-white hover:border-brand-green hover:scale-110 hover:shadow-lg transition-all duration-200"
            title="Editar receta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(recipe);
            }}
            className="rounded-lg bg-white/90 backdrop-blur-sm p-2 shadow-md border border-gray-200 text-brand-navy hover:bg-brand-coral hover:text-white hover:border-brand-coral hover:scale-110 hover:shadow-lg transition-all duration-200"
            title="Eliminar receta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
              <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={recipe.foto || PLACEHOLDER_IMG}
          alt={recipe.titulo}
          className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={handleImageError}
        />
        {/* Badge de estado — solo en MyRecipes */}
        {showActions && recipe.status && (
          <span className={`absolute bottom-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            recipe.status === "draft"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-brand-green-light/60 text-brand-green-dark border-brand-green-light"
          }`}>
            {recipe.status === "draft" ? "Borrador" : "Publicada"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-brand-navy font-semibold text-base truncate">
          {recipe.titulo ?? "Sin titulo"}
        </h3>

        {/* Time */}
        {recipe.time && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
            <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.time} min
          </div>
        )}

        {/* Categorías */}
        {recipe.categories && recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs bg-brand-green-light/40 text-brand-green-dark px-2.5 py-0.5 rounded-full font-medium"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Ingredientes */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.ingredients.slice(0, 4).map((ing) => {
              const cantidad = ing.pivot?.cantidad;
              const unidad = ing.pivot?.unidad_medida;
              const label = cantidad
                ? `${cantidad}${unidad ? " " + unidad : ""} ${ing.nombre}`
                : ing.nombre;
              return (
                <span
                  key={ing.id}
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                >
                  {label}
                </span>
              );
            })}
            {recipe.ingredients.length > 4 && (
              <span className="text-xs text-gray-400 px-1 py-0.5">
                +{recipe.ingredients.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Steps preview */}
        {recipe.pasos && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {recipe.pasos}
          </p>
        )}

        {/* Botón Publicar — solo borradores en MyRecipes */}
        {showActions && recipe.status === "draft" && (
          <button
            onClick={(e) => { e.stopPropagation(); onPublish?.(recipe); }}
            className="mt-3 w-full rounded-lg border border-brand-green py-1.5 text-xs font-semibold text-brand-green hover:bg-brand-green hover:text-white transition-colors"
          >
            Publicar receta
          </button>
        )}
      </div>
    </article>
  );
}
