import { useEffect, useState } from "react";
import { api } from "../../api/axios";

function StatCard({ label, value, color = "brand-green" }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-4xl font-bold mt-2 text-${color}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: null, recipes: null, pendingCategories: null, comments: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, recipesRes, categoriesRes, commentsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/recipes"),
          api.get("/admin/categories"),
          api.get("/admin/comments"),
        ]);

        const users    = usersRes.data?.data ?? usersRes.data;
        const recipes  = recipesRes.data?.data ?? recipesRes.data;
        const cats     = categoriesRes.data?.data ?? categoriesRes.data;
        const comments = commentsRes.data?.data ?? commentsRes.data;

        const pending = Array.isArray(cats)
          ? cats.filter((c) => c.status === "pending").length
          : null;

        setStats({
          users:             Array.isArray(users)    ? users.length    : null,
          recipes:           Array.isArray(recipes)  ? recipes.length  : null,
          pendingCategories: pending,
          comments:          Array.isArray(comments) ? comments.length : null,
        });
      } catch {
        // silencioso — las cards mostrarán "—"
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-8">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard label="Usuarios registrados" value={stats.users} color="brand-navy" />
          <StatCard label="Recetas totales"       value={stats.recipes} color="brand-green" />
          <StatCard label="Categorías pendientes" value={stats.pendingCategories} color="brand-orange" />
          <StatCard label="Comentarios totales"   value={stats.comments} color="brand-navy" />
        </div>
      )}
    </div>
  );
}
