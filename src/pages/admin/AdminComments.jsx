import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminComments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/comments");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los comentarios.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/comments/${id}`);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("No se pudo eliminar el comentario.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Comentarios</h1>

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
            { label: "Comentario", render: (c) => (
              <span className="line-clamp-1 max-w-xs block">{c.body}</span>
            )},
            { label: "Autor",    render: (c) => c.user?.name ?? "—" },
            { label: "Receta",   render: (c) => c.recipe?.titulo ?? "—" },
          ]}
          actions={(c) => (
            <ActionBtn color="red" onClick={() => handleDelete(c.id)}>Borrar</ActionBtn>
          )}
        />
      )}
    </div>
  );
}
