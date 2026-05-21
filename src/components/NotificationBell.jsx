import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";

const POLL_MS = 30000;

function timeAgo(iso, t) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return t("notifications.ago.now");
  if (diff < 3600)  return t("notifications.ago.minutes", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("notifications.ago.hours", { count: Math.floor(diff / 3600) });
  return t("notifications.ago.days", { count: Math.floor(diff / 86400) });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [open, setOpen]   = useState(false);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.get("/my-notifications/unread-count");
        const n = res.data?.unread_count ?? res.data?.count ?? res.data?.data?.count ?? 0;
        if (!cancelled) setCount(Number(n) || 0);
      } catch {
        // silencio: la campana es secundaria
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await api.get("/my-notifications", { params: { per_page: 5 } });
        const data = res.data?.data ?? res.data ?? [];
        setRecent(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setRecent([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleItemClick(n) {
    setOpen(false);
    if (!n.read_at) {
      try {
        await api.patch(`/my-notifications/${n.id}/read`);
        setCount((c) => Math.max(0, c - 1));
      } catch {
        // ignorar
      }
    }
    if (n.link) navigate(n.link);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        aria-label={count > 0 ? t("notifications.ariaCount", { count }) : t("notifications.aria")}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-brand-navy hover:bg-brand-cream transition-colors"
      >
        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-error px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden z-40">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-navy">{t("notifications.panelTitle")}</span>
            <Link to="/notificaciones" onClick={() => setOpen(false)} className="text-xs text-brand-green hover:underline">
              {t("notifications.viewAll")}
            </Link>
          </div>

          {loading && <p className="px-4 py-6 text-sm text-gray-500 text-center">{t("notifications.panelLoading")}</p>}

          {!loading && recent.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">{t("notifications.panelEmpty")}</p>
          )}

          {!loading && recent.length > 0 && (
            <ul className="max-h-80 overflow-y-auto">
              {recent.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      !n.read_at ? "bg-brand-green/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at && (
                        <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full bg-brand-green flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.created_at, t)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
