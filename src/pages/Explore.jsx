import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import useRecipeSearch, { TIME_SLIDER_MAX } from "../hooks/useRecipeSearch";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import RecipeGrid from "../components/RecipeGrid";
import Pagination from "../components/Pagination";

const QUICK_TAGS_COUNT = 4;

export default function Explore() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    filtered,
    loading,
    error,
    query,
    setQuery,
    tags,
    activeTag,
    setActiveTag,
    timeMin,
    setTimeMin,
    timeMax,
    setTimeMax,
    selectedAllergens,
    toggleAllergen,
    resetFilters,
    isFiltering,
    activeFiltersCount,
  } = useRecipeSearch();

  // Volver a página 1 cuando cambian filtros o búsqueda, si no el usuario
  // puede quedarse "fuera del rango" tras filtrar (ej. estaba en pág. 3 y
  // tras filtrar solo hay 1 página).
  useEffect(() => {
    setPage(1);
  }, [query, activeTag, timeMin, timeMax, selectedAllergens]);

  const { paginated, controls } = Pagination({
    items: filtered,
    pageSize,
    setPageSize,
    page,
    setPage,
  });

  const filterPanelProps = {
    tags,
    activeTag,
    onTagClick: setActiveTag,
    timeMin,
    timeMax,
    setTimeMin,
    setTimeMax,
    timeSliderMax: TIME_SLIDER_MAX,
    selectedAllergens,
    onAllergenToggle: toggleAllergen,
    onReset: resetFilters,
    activeFiltersCount,
  };

  const quickTags = tags.slice(0, QUICK_TAGS_COUNT);

  return (
    <div>
      <PageHeader
        title={t("recipes.explore.title")}
        subtitle={t("recipes.explore.subtitle")}
      />

      {/* Search bar — full width on all breakpoints */}
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* Quick filters strip — desktop only (shown above the sidebar+grid layout) */}
      {!loading && tags.length > 0 && (
        <div
          className="hidden lg:flex mt-3 flex-wrap items-center gap-2"
          role="group"
          aria-label={t("recipes.explore.quickFiltersLabel")}
        >
          <span className="text-xs font-medium text-gray-400 mr-1" aria-hidden="true">
            {t("recipes.explore.mostSearched")}
          </span>
          <button
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
              activeTag === null
                ? "bg-brand-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("filters.all")}
          </button>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
                activeTag === tag
                  ? "bg-brand-green text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Mobile/tablet: quick pills + "Filtros" button */}
      {!loading && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 lg:hidden"
          role="group"
          aria-label={t("recipes.explore.quickFiltersShort")}
        >
          {quickTags.length > 0 && (
            <>
              <button
                onClick={() => setActiveTag(null)}
                aria-pressed={activeTag === null}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeTag === null
                    ? "bg-brand-green text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("filters.all")}
              </button>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  aria-pressed={activeTag === tag}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                    activeTag === tag
                      ? "bg-brand-green text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </>
          )}

          {/* "Más filtros" button */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={
              activeFiltersCount > 0
                ? t("recipes.explore.filtersAria", { count: activeFiltersCount })
                : t("recipes.explore.filtersAriaNone")
            }
            className="ml-auto flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-green hover:text-brand-green transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M10 12h4" />
            </svg>
            {t("recipes.explore.filters")}
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main layout: sidebar (desktop) + results */}
      <div className="mt-5 flex gap-6 items-start">
        {/* Sidebar — desktop only */}
        <aside
          className="hidden lg:block w-60 flex-shrink-0 sticky top-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          aria-label={t("recipes.explore.filtersPanel")}
        >
          <h2 className="text-sm font-semibold text-brand-navy mb-5">{t("filters.title")}</h2>
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* Results */}
        <main
          className="flex-1 min-w-0"
          aria-live="polite"
          aria-label={t("recipes.explore.resultsAria")}
          aria-atomic="false"
        >
          {loading && <LoadingSpinner />}
          {!loading && error && <ErrorMessage message={error} />}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              icon={
                <svg
                  className="w-16 h-16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
              }
              title={isFiltering ? t("recipes.explore.noResultsTitle") : t("recipes.explore.noRecipesTitle")}
              subtitle={
                isFiltering ? t("recipes.explore.noResultsSubtitle") : undefined
              }
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <RecipeGrid recipes={paginated} />
              {filtered.length > pageSize && controls}
            </>
          )}
        </main>
      </div>

      {/* CTA — only for guests when there are results */}
      {!token && !loading && !error && filtered.length > 0 && (
        <div className="mt-10 text-center rounded-2xl border border-brand-green-light/50 bg-white p-6">
          <p className="text-brand-navy font-semibold">
            {t("recipes.explore.ctaTitle")}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {t("recipes.explore.ctaText")}
          </p>
          <Link
            to="/register"
            className="inline-block mt-4 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors"
          >
            {t("recipes.explore.ctaButton")}
          </Link>
        </div>
      )}

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("recipes.explore.filtersPanel")}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-full flex-col bg-white shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-brand-navy">{t("filters.title")}</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("recipes.explore.closeFilters")}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-navy transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel {...filterPanelProps} />
            </div>

            {/* Footer: apply button */}
            <div className="border-t border-gray-100 px-5 py-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-brand-green py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                {t("recipes.explore.viewN", { count: filtered.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
