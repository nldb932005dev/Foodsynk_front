import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import RecipeGrid from "../components/RecipeGrid";
import ConfirmModal from "../components/ConfirmModal";

export default function MyRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/my-recipes");
      const data = res.data?.data ?? res.data;
      setRecipes(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar tus recetas.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(recipe) {
    navigate(`/my-recipes/${recipe.id}/edit`);
  }

  function handleDeleteRequest(recipe) {
    setDeleteTarget(recipe);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/recipes/${deleteTarget.id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("No tienes permiso para eliminar esta receta.");
      } else if (status === 404) {
        // Already deleted, remove from list
        setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        setError("Error al eliminar la receta. Intentalo de nuevo.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Mis Recetas"
        subtitle="Recetas creadas por ti"
      />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && recipes.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="No tienes recetas todavia"
          subtitle="Las recetas que crees apareceran aqui"
        />
      )}

      {!loading && !error && recipes.length > 0 && (
        <RecipeGrid
          recipes={recipes}
          showActions
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar receta"
        message={`¿Estas seguro de que quieres eliminar "${deleteTarget?.titulo ?? "esta receta"}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
