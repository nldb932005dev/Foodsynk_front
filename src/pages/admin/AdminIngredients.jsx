import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminIngredients() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/ingredients");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los ingredientes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/ingredients/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("No se pudo eliminar el ingrediente.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Ingredientes</h1>

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
          cols={[{ label: "Nombre", render: (i) => i.nombre }]}
          actions={(i) => (
            <ActionBtn color="red" onClick={() => handleDelete(i.id)}>Borrar</ActionBtn>
          )}
        />
      )}
    </div>
  );
}
