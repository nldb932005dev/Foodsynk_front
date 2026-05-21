import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useRecipes from "../hooks/useRecipes";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import RecipeGrid from "../components/RecipeGrid";
import Pagination from "../components/Pagination";

export default function Home() {
  const { recipes, loading, error } = useRecipes();
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "popular"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Orden client-side (copia, para no mutar el array del hook): "recent" usa
  // id DESC como proxy de fecha —igual que useRecipeSearch—; "popular" reordena
  // por likes_count.
  const sortedRecipes = useMemo(() => {
    const copy = [...recipes];
    if (sortBy === "popular") {
      return copy.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    }
    return copy.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [recipes, sortBy]);

  // Volver a la página 1 al cambiar el orden: si no, el usuario puede quedarse
  // en una página fuera de rango o sin ver el nuevo primer resultado.
  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  const { paginated, controls } = Pagination({
    items: sortedRecipes,
    pageSize,
    setPageSize,
    page,
    setPage,
  });

  return (
    <div>
      <PageHeader
        title={t("recipes.home.title")}
        subtitle={t("recipes.home.subtitle")}
      />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && recipes.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
            </svg>
          }
          title={t("recipes.home.empty")}
        />
      )}

      {!loading && !error && recipes.length > 0 && (
        <>
          {/* Selector de orden: recientes / populares.
              Móvil: etiqueta a la izquierda y píldora a la derecha (justify-between);
              flex-wrap evita desbordes en pantallas muy estrechas. */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <span className="text-xs font-medium text-gray-400" aria-hidden="true">
              {t("recipes.home.sortLabel")}
            </span>
            <div
              className="inline-flex rounded-full bg-gray-100 p-0.5"
              role="group"
              aria-label={t("recipes.home.sortLabel")}
            >
              <button
                onClick={() => setSortBy("recent")}
                aria-pressed={sortBy === "recent"}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
                  sortBy === "recent"
                    ? "bg-white text-brand-green shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("recipes.home.sortRecent")}
              </button>
              <button
                onClick={() => setSortBy("popular")}
                aria-pressed={sortBy === "popular"}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green ${
                  sortBy === "popular"
                    ? "bg-white text-brand-green shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("recipes.home.sortPopular")}
              </button>
            </div>
          </div>
          <RecipeGrid recipes={paginated} />
          {sortedRecipes.length > pageSize && controls}
        </>
      )}
    </div>
  );
}
