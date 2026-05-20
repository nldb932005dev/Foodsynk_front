import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminIngredients() {
  const { t } = useTranslation();
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
      setError(t("admin.ingredients.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/ingredients/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError(t("admin.ingredients.deleteError"));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">{t("admin.ingredients.title")}</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <AdminTable
          rows={items}
          cols={[{ label: t("admin.common.name"), render: (i) => i.nombre }]}
          actions={(i) => (
            <ActionBtn color="red" onClick={() => handleDelete(i.id)}>{t("admin.common.delete")}</ActionBtn>
          )}
        />
      )}
    </div>
  );
}
