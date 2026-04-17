import { useEffect, useState } from "react";
import { api } from "../../api/axios";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      const data = res.data?.data ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      await api.patch(`/admin/categories/${id}/approve`);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
      );
    } catch {
      setError("No se pudo aprobar la categoría.");
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("No se pudo eliminar la categoría.");
    }
  }

  const pending  = categories.filter((c) => c.status === "pending");
  const approved = categories.filter((c) => c.status !== "pending");

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Categorías</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-orange mb-3">
                Pendientes de aprobación ({pending.length})
              </h2>
              <AdminTable
                rows={pending}
                cols={[
                  { label: "Nombre", render: (c) => c.nombre },
                  {
                    label: "Estado",
                    render: () => (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Pendiente
                      </span>
                    ),
                  },
                ]}
                actions={(c) => (
                  <>
                    <ActionBtn color="green" onClick={() => handleApprove(c.id)}>Aprobar</ActionBtn>
                    <ActionBtn color="red"   onClick={() => handleDelete(c.id)}>Borrar</ActionBtn>
                  </>
                )}
              />
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Aprobadas ({approved.length})
            </h2>
            <AdminTable
              rows={approved}
              cols={[{ label: "Nombre", render: (c) => c.nombre }]}
              actions={(c) => (
                <ActionBtn color="red" onClick={() => handleDelete(c.id)}>Borrar</ActionBtn>
              )}
            />
          </section>
        </>
      )}
    </div>
  );
}

// ── Componentes internos reutilizados en las páginas admin ──────────────────

export function AdminTable({ rows, cols, actions }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-4">Sin elementos.</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            {cols.map((c) => (
              <th key={c.label} className="px-5 py-3 text-left font-semibold">{c.label}</th>
            ))}
            <th className="px-5 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {cols.map((c) => (
                <td key={c.label} className="px-5 py-3 text-brand-navy">{c.render(row)}</td>
              ))}
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">{actions(row)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActionBtn({ color = "red", onClick, children }) {
  const colors = {
    red:   "border-red-200 text-red-600 hover:bg-red-50",
    green: "border-brand-green text-brand-green hover:bg-brand-green/10",
    gray:  "border-gray-200 text-gray-600 hover:bg-gray-50",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  );
}
