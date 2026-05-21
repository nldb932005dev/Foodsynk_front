import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";

function formatDate(iso, locale) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(locale);
}

export default function Notificaciones() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "es";
  const FILTROS = [
    { value: "all",    label: t("notifications.filterAll") },
    { value: "unread", label: t("notifications.filterUnread") },
    { value: "read",   label: t("notifications.filterRead") },
  ];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(page); }, [page]);

  async function load(p) {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/my-notifications", { params: { page: p } });
      const payload = res.data ?? {};
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      setItems(data);
      setLastPage(Number(payload.last_page ?? payload.meta?.last_page ?? 1));
    } catch {
      setError(t("errors.loadNotifications"));
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.read_at);
    if (filter === "read")   return items.filter((n) =>  n.read_at);
    return items;
  }, [items, filter]);

  async function handleMarkRead(n) {
    if (n.read_at) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
    try {
      await api.patch(`/my-notifications/${n.id}/read`);
    } catch {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: null } : x)));
      setError(t("errors.markRead"));
    }
  }

  async function handleMarkAllRead() {
    setBusy(true);
    setError("");
    try {
      await api.patch("/my-notifications/read-all");
      const ts = new Date().toISOString();
      setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: ts })));
    } catch {
      setError(t("errors.markAllRead"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(n) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await api.delete(`/my-notifications/${n.id}`);
    } catch {
      setError(t("errors.deleteNotification"));
      load(page);
    }
  }

  async function handleDeleteRead() {
    const readOnes = items.filter((n) => n.read_at);
    if (readOnes.length === 0) return;
    setBusy(true);
    setError("");
    const ids = readOnes.map((n) => n.id);
    setItems((prev) => prev.filter((n) => !n.read_at));
    try {
      await Promise.all(ids.map((id) => api.delete(`/my-notifications/${id}`)));
    } catch {
      setError(t("errors.deleteSomeNotifications"));
      load(page);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">{t("notifications.title")}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-brand-green text-white"
                  : "bg-white text-brand-navy hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={busy || items.every((n) => n.read_at)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-brand-navy hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("notifications.markAllRead")}
          </button>
          <button
            onClick={handleDeleteRead}
            disabled={busy || items.every((n) => !n.read_at)}
            className="rounded-lg border border-brand-error/30 px-3 py-1.5 text-xs font-medium text-brand-error hover:bg-brand-error/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("notifications.deleteRead")}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-12">
          {filter === "unread" ? t("notifications.emptyUnread") : filter === "read" ? t("notifications.emptyRead") : t("notifications.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border p-4 transition-colors ${
                n.read_at
                  ? "border-gray-100 bg-white"
                  : "border-brand-green/30 bg-brand-green/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-navy">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.created_at, locale)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => handleMarkRead(n)}
                        className="text-xs font-semibold text-brand-green hover:underline"
                      >
                        {t("notifications.open")}
                      </Link>
                    )}
                    {!n.read_at && (
                      <button
                        onClick={() => handleMarkRead(n)}
                        className="text-xs text-brand-navy hover:underline"
                      >
                        {t("notifications.markRead")}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(n)}
                  aria-label={t("notifications.deleteNotification")}
                  className="rounded-lg p-1 text-gray-400 hover:text-brand-error hover:bg-brand-error/10 transition-colors"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-brand-navy">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span aria-live="polite">{page} / {lastPage}</span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            aria-label="Página siguiente"
            className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
