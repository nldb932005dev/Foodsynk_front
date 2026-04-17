import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(user) {
    const newStatus = user.active === false ? true : false;
    try {
      await api.patch(`/admin/users/${user.id}`, { active: newStatus });
      setItems((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: newStatus } : u))
      );
    } catch {
      setError("No se pudo actualizar el usuario.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Usuarios</h1>

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
            { label: "Nombre", render: (u) => u.name },
            { label: "Email",  render: (u) => u.email },
            {
              label: "Admin",
              render: (u) =>
                u.is_admin ? (
                  <span className="rounded-full bg-brand-green-light/60 px-2.5 py-0.5 text-xs font-semibold text-brand-green-dark">
                    Admin
                  </span>
                ) : null,
            },
          ]}
          actions={(u) => (
            <ActionBtn
              color={u.active === false ? "green" : "gray"}
              onClick={() => handleToggle(u)}
            >
              {u.active === false ? "Activar" : "Desactivar"}
            </ActionBtn>
          )}
        />
      )}
    </div>
  );
}
