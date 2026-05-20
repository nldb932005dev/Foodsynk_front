import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminRecipes() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(1); }, [query, pageSize]);
  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/recipes");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(t("admin.recipes.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/recipes/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError(t("admin.recipes.deleteError"));
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const titulo = (r.titulo ?? "").toLowerCase();
      const author = (r.user?.name ?? "").toLowerCase();
      const email  = (r.user?.email ?? "").toLowerCase();
      return titulo.includes(q) || author.includes(q) || email.includes(q);
    });
  }, [items, query]);

  const { paginated, controls } = Pagination({
    items: filtered,
    pageSize,
    setPageSize,
    page,
    setPage,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">{t("admin.recipes.title")}</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t("admin.recipes.searchPlaceholder")}
            />
          </div>
          <AdminTable
          rows={paginated}
          cols={[
            { label: t("admin.recipes.colTitle"),  render: (r) => r.titulo },
            { label: t("admin.recipes.colAuthor"),   render: (r) => r.user?.name ?? "—" },
            {
              label: t("admin.recipes.colEmail"),
              render: (r) =>
                r.user?.email ? (
                  <Link
                    to="/admin/usuarios"
                    className="text-brand-green hover:underline"
                  >
                    {r.user.email}
                  </Link>
                ) : (
                  "—"
                ),
            },
            {
              label: t("admin.recipes.colStatus"),
              render: (r) => (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  r.status === "published"
                    ? "bg-brand-green-light/60 text-brand-green-dark"
                    : "bg-brand-warning/20 text-brand-warning"
                }`}>
                  {r.status === "published" ? t("admin.recipes.published") : t("admin.recipes.draft")}
                </span>
              ),
            },
          ]}
          actions={(r) => (
            <ActionBtn color="red" onClick={() => handleDelete(r.id)}>{t("admin.common.delete")}</ActionBtn>
          )}
        />
        {filtered.length > pageSize && controls}
        </>
      )}
    </div>
  );
}
