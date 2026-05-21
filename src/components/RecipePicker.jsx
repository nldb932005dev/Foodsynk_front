import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import useRecipeSearch from "../hooks/useRecipeSearch";
import SearchBar from "./SearchBar";

function MiniRecipeCard({ recipe, onAdd }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 hover:border-brand-green/30 transition-colors">
      {recipe.foto ? (
        <img
          src={recipe.foto}
          alt=""
          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-brand-cream flex items-center justify-center flex-shrink-0">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21l3.75-3.75a2.25 2.25 0 013.182 0L12 19.5m0 0l3.75-3.75M3 3h18M3 7.5h18M3 12h18"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-navy truncate">{recipe.titulo}</p>
        {recipe.time && (
          <p className="text-xs text-gray-400">{t("recipes.card.minutes", { count: recipe.time })}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAdd(recipe)}
        className="flex-shrink-0 rounded-lg bg-brand-green px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-dark transition-colors"
      >
        {t("picker.add")}
      </button>
    </div>
  );
}

function FavoritesTab({ onSelect }) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/my-favorites")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green-light border-t-brand-green" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-8">
        {t("picker.noFavorites")}
      </p>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto flex-1">
      {favorites.map((r) => (
        <MiniRecipeCard key={r.id} recipe={r} onAdd={onSelect} />
      ))}
    </div>
  );
}

function ExploreTab({ onSelect }) {
  const { t } = useTranslation();
  const { filtered, loading, query, setQuery, tags, activeTags, toggleTag, clearTags } =
    useRecipeSearch();

  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1">
      <SearchBar value={query} onChange={setQuery} placeholder={t("picker.searchPlaceholder")} />

      {/* Pills de categorías (multi-selección AND) */}
      {!loading && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={clearTags}
            aria-pressed={activeTags.length === 0}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeTags.length === 0
                ? "bg-brand-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("filters.all")}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              aria-pressed={activeTags.includes(tag)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeTags.includes(tag)
                  ? "bg-brand-green text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green-light border-t-brand-green" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">{t("picker.noResults")}</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((r) => (
            <MiniRecipeCard key={r.id} recipe={r} onAdd={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecipePicker({ open, onClose, onSelect, slotLabel }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("explorar");

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over desde la derecha */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("picker.addToDishAria")}
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-navy">{t("picker.addRecipe")}</h2>
            {slotLabel && (
              <p className="text-xs text-gray-500 mt-0.5">{slotLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t("picker.closePanel")}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {["favoritos", "explorar"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-brand-green text-brand-green"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "favoritos" ? t("picker.myFavorites") : t("picker.explore")}
            </button>
          ))}
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {activeTab === "favoritos" ? (
            <FavoritesTab onSelect={onSelect} />
          ) : (
            <ExploreTab onSelect={onSelect} />
          )}
        </div>
      </div>
    </>
  );
}
