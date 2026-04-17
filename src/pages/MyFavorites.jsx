import { useEffect, useState } from "react";
import { api } from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import RecipeGrid from "../components/RecipeGrid";

export default function MyFavorites() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/my-favorites");
        const data = res.data?.data ?? res.data;
        setRecipes(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar tus favoritos.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Mis Favoritos"
        subtitle="Recetas que has guardado"
      />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && recipes.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          }
          title="Aún no tienes favoritos"
          subtitle="Guarda recetas desde su página de detalle."
        />
      )}

      {!loading && !error && recipes.length > 0 && (
        <RecipeGrid recipes={recipes} />
      )}
    </div>
  );
}
