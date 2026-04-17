import { useState } from "react";

export const ALLERGENS = [
  { id: "gluten",       label: "Gluten" },
  { id: "lacteos",      label: "Lácteos" },
  { id: "huevo",        label: "Huevo" },
  { id: "pescado",      label: "Pescado" },
  { id: "marisco",      label: "Marisco" },
  { id: "frutos_secos", label: "Frutos secos" },
  { id: "cacahuetes",   label: "Cacahuetes" },
  { id: "soja",         label: "Soja" },
  { id: "sesamo",       label: "Sésamo" },
  { id: "mostaza",      label: "Mostaza" },
  { id: "apio",         label: "Apio" },
  { id: "altramuces",   label: "Altramuces" },
  { id: "moluscos",     label: "Moluscos" },
  { id: "sulfitos",     label: "Sulfitos" },
];

function TimeRangeSlider({ min, max, minVal, maxVal, onMinChange, onMaxChange }) {
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="select-none">
      {/* Slider: interactive layer on top of visual layer */}
      <div className="relative py-4 mx-1">
        {/* Visual track */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200"
          aria-hidden="true"
        />
        {/* Active range fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-brand-orange pointer-events-none"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
          aria-hidden="true"
        />
        {/* Min thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-orange shadow pointer-events-none -translate-x-1/2"
          style={{ left: `${minPercent}%` }}
          aria-hidden="true"
        />
        {/* Max thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-orange shadow pointer-events-none -translate-x-1/2"
          style={{ left: `${maxPercent}%` }}
          aria-hidden="true"
        />
        {/* Min range input — invisible, interactive */}
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={(e) => onMinChange(Math.min(Number(e.target.value), maxVal - 5))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          style={{ zIndex: minVal > max - 15 ? 5 : 3 }}
          aria-label={`Tiempo mínimo: ${minVal} minutos`}
        />
        {/* Max range input — invisible, interactive */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={(e) => onMaxChange(Math.max(Number(e.target.value), minVal + 5))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          style={{ zIndex: 4 }}
          aria-label={`Tiempo máximo: ${maxVal} minutos`}
        />
      </div>

      {/* Value labels */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex-1 text-center rounded-lg border border-gray-200 bg-white py-1.5">
          <span className="text-xs font-semibold text-brand-navy">{minVal} min</span>
        </div>
        <span className="text-xs text-gray-400" aria-hidden="true">—</span>
        <div className="flex-1 text-center rounded-lg border border-gray-200 bg-white py-1.5">
          <span className="text-xs font-semibold text-brand-navy">
            {maxVal >= max ? `${max}+ min` : `${maxVal} min`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FilterPanel({
  tags,
  activeTag,
  onTagClick,
  timeMin,
  timeMax,
  setTimeMin,
  setTimeMax,
  timeSliderMax,
  selectedAllergens,
  onAllergenToggle,
  onReset,
  activeFiltersCount,
}) {
  const [allergensOpen, setAllergensOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Reset */}
      {activeFiltersCount > 0 && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 rounded text-xs font-semibold text-brand-coral hover:opacity-75 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-coral"
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar filtros ({activeFiltersCount})
        </button>
      )}

      {/* Categories */}
      <section aria-labelledby="filter-cat-heading">
        <h3
          id="filter-cat-heading"
          className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3"
        >
          Categoría
        </h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="filter-cat-heading">
          <button
            onClick={() => onTagClick(null)}
            aria-pressed={activeTag === null}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
              activeTag === null
                ? "bg-brand-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todas
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
                activeTag === tag
                  ? "bg-brand-green text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-gray-100" aria-hidden="true" />

      {/* Time */}
      <section aria-labelledby="filter-time-heading">
        <h3
          id="filter-time-heading"
          className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1"
        >
          Tiempo de preparación
        </h3>
        <TimeRangeSlider
          min={0}
          max={timeSliderMax}
          minVal={timeMin}
          maxVal={timeMax}
          onMinChange={setTimeMin}
          onMaxChange={setTimeMax}
        />
      </section>

      <hr className="border-gray-100" aria-hidden="true" />

      {/* Allergens */}
      <section aria-labelledby="filter-allergens-btn">
        <button
          id="filter-allergens-btn"
          onClick={() => setAllergensOpen((o) => !o)}
          aria-expanded={allergensOpen}
          aria-controls="allergens-list"
          className="w-full flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Sin alérgenos
          </span>
          {selectedAllergens.length > 0 && (
            <span className="text-xs font-semibold text-brand-green bg-brand-green/10 rounded-full px-2 py-0.5">
              {selectedAllergens.length}
            </span>
          )}
          <svg
            aria-hidden="true"
            className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${
              allergensOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div id="allergens-list" hidden={!allergensOpen} className="mt-3">
          <p className="text-xs text-gray-400 mb-3">
            Excluir recetas que puedan contener:
          </p>
          <div className="space-y-2.5">
            {ALLERGENS.map(({ id, label }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAllergens.includes(id)}
                  onChange={() => onAllergenToggle(id)}
                  className="w-4 h-4 rounded border-gray-300 accent-brand-green cursor-pointer focus:ring-2 focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700 group-hover:text-brand-navy transition-colors leading-none">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
