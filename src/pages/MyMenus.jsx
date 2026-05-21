import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";

export default function MyMenus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/menus");
      const data = res.data?.data ?? res.data;
      setMenus(Array.isArray(data) ? data : []);
    } catch {
      setError(t("errors.loadMenus"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/menus/${deleteTarget.id}`);
      setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError(t("errors.deleteMenu"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={t("menus.mine.title")} subtitle={t("menus.mine.subtitle")} />
        <button
          onClick={() => navigate("/my-menus/create")}
          className="flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("menus.mine.newMenu")}
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && menus.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          }
          title={t("menus.mine.emptyTitle")}
          subtitle={t("menus.mine.emptySubtitle")}
        />
      )}

      {!loading && !error && menus.length > 0 && (
        <ul className="space-y-3">
          {menus.map((menu) => (
            <li
              key={menu.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy">{menu.nombre}</p>
                {menu.comidas ? (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("menus.mine.summary", { dias: menu.dias, comidas: Object.keys(menu.comidas).length, personas: menu.personas })}
                  </p>
                ) : (
                  <p className="text-xs text-brand-warning mt-0.5">
                    {t("menus.mine.noPlan")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Planificar */}
                <button
                  onClick={() => navigate(`/my-menus/${menu.id}/plan`)}
                  title={t("menus.mine.plan")}
                  className="rounded-lg border border-gray-200 p-2 text-brand-navy hover:bg-brand-green hover:text-white hover:border-brand-green transition-all"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                </button>

                {/* Lista de la compra */}
                <button
                  onClick={() => navigate(`/my-menus/${menu.id}/shopping-list`)}
                  title={t("menus.mine.shoppingList")}
                  className="rounded-lg border border-gray-200 p-2 text-brand-navy hover:bg-brand-green hover:text-white hover:border-brand-green transition-all"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </button>

                {/* Editar */}
                <button
                  onClick={() => navigate(`/my-menus/${menu.id}/edit`)}
                  title={t("menus.mine.edit")}
                  className="rounded-lg border border-gray-200 p-2 text-brand-navy hover:bg-brand-green hover:text-white hover:border-brand-green transition-all"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => setDeleteTarget(menu)}
                  title={t("menus.mine.delete")}
                  className="rounded-lg border border-gray-200 p-2 text-brand-navy hover:bg-brand-coral hover:text-white hover:border-brand-coral transition-all"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={t("menus.mine.deleteTitle")}
        message={t("menus.mine.deleteMessage", { name: deleteTarget?.nombre })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
