import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminRecipes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/recipes");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar las recetas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/recipes/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("No se pudo eliminar la receta.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Recetas</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <AdminTable
          rows={items}
          cols={[
            { label: "Título",  render: (r) => r.titulo },
            { label: "Autor",   render: (r) => r.user?.name ?? "—" },
            {
              label: "Estado",
              render: (r) => (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  r.status === "published"
                    ? "bg-brand-green-light/60 text-brand-green-dark"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {r.status === "published" ? "Publicada" : "Borrador"}
                </span>
              ),
            },
          ]}
          actions={(r) => (
            <ActionBtn color="red" onClick={() => handleDelete(r.id)}>Borrar</ActionBtn>
          )}
        />
      )}
    </div>
  );
}
