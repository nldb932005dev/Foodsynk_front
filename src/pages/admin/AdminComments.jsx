import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminComments() {
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
      const res = await api.get("/admin/comments");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(t("admin.comments.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/comments/${id}`);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError(t("admin.comments.deleteError"));
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const body   = (c.body ?? "").toLowerCase();
      const author = (c.user?.name ?? "").toLowerCase();
      const recipe = (c.recipe?.titulo ?? "").toLowerCase();
      return body.includes(q) || author.includes(q) || recipe.includes(q);
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
      <h1 className="text-2xl font-bold text-brand-navy mb-6">{t("admin.comments.title")}</h1>

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
              placeholder={t("admin.comments.searchPlaceholder")}
            />
          </div>
          <AdminTable
            rows={paginated}
            cols={[
              { label: t("admin.comments.colComment"), render: (c) => (
                <span className="line-clamp-1 max-w-xs block">{c.body}</span>
              )},
              { label: t("admin.comments.colAuthor"),    render: (c) => c.user?.name ?? "—" },
              { label: t("admin.comments.colRecipe"),   render: (c) => c.recipe?.titulo ?? "—" },
            ]}
            actions={(c) => (
              <ActionBtn color="red" onClick={() => handleDelete(c.id)}>{t("admin.common.delete")}</ActionBtn>
            )}
          />
          {filtered.length > pageSize && controls}
        </>
      )}
    </div>
  );
}
