import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import { useAuth } from "../../auth/useAuth";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import { AdminTable, ActionBtn } from "./AdminCategories";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [disableTarget, setDisableTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => { setPage(1); }, [query, pageSize]);
  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(t("admin.users.loadError"));
    } finally {
      setLoading(false);
    }
  }

  function patchUserInList(id, patch) {
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function handleEnable(user) {
    setError("");
    try {
      const res = await api.patch(`/admin/users/${user.id}/enable`);
      const updated = res.data?.data ?? res.data ?? {};
      patchUserInList(user.id, {
        is_disabled: false,
        disabled_until: null,
        disabled_permanently: false,
        disabled_reason: null,
        ...updated,
      });
    } catch {
      setError(t("admin.users.enableError"));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setItems((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        status === 422
          ? err?.response?.data?.message ?? t("admin.users.deleteSelf")
          : t("admin.users.deleteError");
      setError(msg);
      setDeleteTarget(null);
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      const name  = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
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
      <h1 className="text-2xl font-bold text-brand-navy mb-6">{t("admin.users.title")}</h1>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">{error}</div>
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
            placeholder={t("admin.users.searchPlaceholder")}
          />
        </div>
        <AdminTable
          rows={paginated}
          cols={[
            { label: t("admin.users.colName"), render: (u) => u.name },
            { label: t("admin.users.colEmail"),  render: (u) => u.email },
            {
              label: t("admin.users.adminBadge"),
              render: (u) =>
                u.is_admin ? (
                  <span className="rounded-full bg-brand-green-light/60 px-2.5 py-0.5 text-xs font-semibold text-brand-green-dark">
                    {t("admin.users.adminBadge")}
                  </span>
                ) : null,
            },
            {
              label: t("admin.users.colRegistered"),
              render: (u) =>
                u.created_at
                  ? new Date(u.created_at).toLocaleDateString()
                  : "—",
            },
            {
              label: t("admin.users.colStatus"),
              render: (u) => {
                if (!u.is_disabled) {
                  return <span className="text-xs text-brand-success">{t("admin.users.active")}</span>;
                }
                if (u.disabled_permanently) {
                  return (
                    <span className="rounded-full bg-brand-error/10 px-2.5 py-0.5 text-xs font-semibold text-brand-error">
                      {t("admin.users.disabledPermanent")}
                    </span>
                  );
                }
                const fecha = u.disabled_until
                  ? new Date(u.disabled_until).toLocaleDateString()
                  : "?";
                return (
                  <span className="rounded-full bg-brand-warning/20 px-2.5 py-0.5 text-xs font-semibold text-brand-warning">
                    {t("admin.users.disabledUntil", { date: fecha })}
                  </span>
                );
              },
            },
          ]}
          actions={(u) => {
            const isSelf = currentUser && u.id === currentUser.id;
            return (
              <div className="flex flex-wrap justify-end gap-1.5">
                {u.is_disabled ? (
                  <ActionBtn
                    color="green"
                    onClick={() => handleEnable(u)}
                    disabled={isSelf}
                    title={isSelf ? t("admin.users.noSelfOp") : t("admin.users.enableTitle")}
                  >
                    {t("admin.users.enable")}
                  </ActionBtn>
                ) : (
                  <ActionBtn
                    color="gray"
                    onClick={() => setDisableTarget(u)}
                    disabled={isSelf}
                    title={isSelf ? t("admin.users.noSelfDisable") : t("admin.users.disableTitleTip")}
                  >
                    {t("admin.users.disable")}
                  </ActionBtn>
                )}
                <ActionBtn
                  color="gray"
                  onClick={() => setNotifyTarget(u)}
                  title={t("admin.users.notifyTip")}
                >
                  {t("admin.users.notify")}
                </ActionBtn>
                <ActionBtn
                  color="gray"
                  onClick={() => setHistoryTarget(u)}
                  title={t("admin.users.historyTip")}
                >
                  {t("admin.users.history")}
                </ActionBtn>
                <ActionBtn
                  color="red"
                  onClick={() => setDeleteTarget(u)}
                  disabled={isSelf}
                  title={isSelf ? t("admin.users.noSelfDelete") : t("admin.users.deleteTip")}
                >
                  {t("admin.common.delete")}
                </ActionBtn>
              </div>
            );
          }}
        />
        {filtered.length > pageSize && controls}
        </>
      )}

      {disableTarget && (
        <DisableUserModal
          user={disableTarget}
          onClose={() => setDisableTarget(null)}
          onDone={(patch) => {
            patchUserInList(disableTarget.id, patch);
            setDisableTarget(null);
          }}
        />
      )}

      {historyTarget && (
        <HistoryModal
          user={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {notifyTarget && (
        <NotifyUserModal
          user={notifyTarget}
          onClose={() => setNotifyTarget(null)}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={t("admin.users.deleteTitleName", { name: deleteTarget?.name ?? t("admin.users.userFallback") })}
        message={t("admin.users.deleteMessage")}
        confirmText={t("admin.users.deleteConfirm")}
        cancelText={t("admin.common.cancel")}
        loading={deleteSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

// ── Modales ────────────────────────────────────────────────────────────────

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function DisableUserModal({ user, onClose, onDone }) {
  const { t } = useTranslation();
  const DURACIONES = [
    { value: "1",   label: t("admin.users.d1") },
    { value: "7",   label: t("admin.users.d7") },
    { value: "30",  label: t("admin.users.d30") },
    { value: "custom", label: t("admin.users.customDate") },
  ];
  const [permanent, setPermanent] = useState(false);
  const [duration, setDuration]   = useState("7");
  const [customDate, setCustomDate] = useState(addDaysISO(7));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const payload = { permanent, reason: reason.trim() || null };
      if (!permanent) {
        payload.until = duration === "custom" ? customDate : addDaysISO(Number(duration));
      }
      const res = await api.patch(`/admin/users/${user.id}/disable`, payload);
      const updated = res.data?.data ?? res.data ?? {};
      onDone({
        is_disabled: true,
        disabled_permanently: permanent,
        disabled_until: payload.until ?? null,
        disabled_reason: payload.reason,
        ...updated,
      });
    } catch (e2) {
      const status = e2?.response?.status;
      setErr(status === 422
        ? e2?.response?.data?.message ?? t("admin.users.invalidData")
        : t("admin.users.disableError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-brand-navy mb-1">{t("admin.users.notifyTitle", { name: user.name }).replace(t("admin.users.notify"), t("admin.users.disable"))}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("admin.users.disableSubtitle")}</p>

        <fieldset className="mb-4">
          <legend className="text-sm font-semibold text-brand-navy mb-2">{t("admin.users.disableType")}</legend>
          <label className="flex items-center gap-2 mb-1.5">
            <input type="radio" name="dis-type" checked={!permanent} onChange={() => setPermanent(false)} />
            <span className="text-sm">{t("admin.users.temporary")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="dis-type" checked={permanent} onChange={() => setPermanent(true)} />
            <span className="text-sm">{t("admin.users.permanent")}</span>
          </label>
        </fieldset>

        {!permanent && (
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-semibold text-brand-navy">{t("admin.users.duration")}</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              {DURACIONES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {duration === "custom" && (
              <input
                type="date"
                value={customDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              />
            )}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-semibold text-brand-navy">Motivo (opcional)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 255))}
            maxLength={255}
            rows={3}
            placeholder="Ej: spam reiterado en comentarios."
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="text-xs text-gray-400 block text-right">{reason.length}/255</span>
        </label>

        {err && (
          <div role="alert" className="mb-4 rounded-lg border border-brand-error/30 bg-brand-error/10 px-3 py-2 text-sm text-brand-error">{err}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${permanent ? "bg-brand-error hover:bg-brand-error/90" : "bg-brand-warning hover:bg-brand-warning/90"}`}>
            {submitting ? "Aplicando..." : "Confirmar desactivación"}
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryModal({ user, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/users/${user.id}/disable-history`);
        const data = res.data?.data ?? res.data ?? [];
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setErr("No se pudo cargar el histórico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-fade-in max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-brand-navy mb-4">Histórico de {user.name}</h3>

        {loading && <p className="text-sm text-gray-500">Cargando...</p>}
        {err && <p role="alert" className="text-sm text-brand-error">{err}</p>}
        {!loading && !err && events.length === 0 && (
          <p className="text-sm text-gray-500">Sin eventos registrados.</p>
        )}

        {!loading && !err && events.length > 0 && (
          <ul className="space-y-3">
            {events.map((ev, i) => {
              const fecha = ev.created_at ? new Date(ev.created_at).toLocaleString("es") : "?";
              const accion = ev.action === "reactivated" ? "Reactivación" : "Desactivación";
              const color  = ev.action === "reactivated" ? "text-brand-success" : "text-brand-error";
              return (
                <li key={ev.id ?? i} className="border-l-2 border-gray-200 pl-3">
                  <p className={`text-sm font-semibold ${color}`}>{accion}</p>
                  <p className="text-xs text-gray-500">{fecha}</p>
                  {ev.disabled_by_name && (
                    <p className="text-xs text-gray-500">Por: {ev.disabled_by_name}</p>
                  )}
                  {ev.until && (
                    <p className="text-xs text-gray-500">
                      Hasta: {new Date(ev.until).toLocaleDateString("es")}
                    </p>
                  )}
                  {ev.reason && (
                    <p className="text-xs text-brand-navy mt-1">Motivo: {ev.reason}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifyUserModal({ user, onClose }) {
  const [title, setTitle] = useState("");
  const [body,  setBody]  = useState("");
  const [link,  setLink]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok,  setOk]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      await api.post(`/admin/users/${user.id}/notify`, {
        title: title.trim(),
        body:  body.trim(),
        link:  link.trim() || null,
      });
      setOk(true);
      setTimeout(onClose, 900);
    } catch (e2) {
      const status = e2?.response?.status;
      setErr(status === 422
        ? e2?.response?.data?.message ?? "Datos no válidos."
        : "No se pudo enviar la notificación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-brand-navy mb-1">Notificar a {user.name}</h3>
        <p className="text-sm text-gray-500 mb-4">Aparecerá en el centro de notificaciones del usuario.</p>

        <label className="block mb-3">
          <span className="text-sm font-semibold text-brand-navy">Título</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            maxLength={200}
            required
            placeholder="Ej: Aviso del administrador"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-semibold text-brand-navy">Mensaje</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            maxLength={1000}
            required
            rows={4}
            placeholder="Cuerpo de la notificación..."
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="text-xs text-gray-400 block text-right">{body.length}/1000</span>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-semibold text-brand-navy">Link (opcional)</span>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/ayuda"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </label>

        {err && <div role="alert" className="mb-4 rounded-lg border border-brand-error/30 bg-brand-error/10 px-3 py-2 text-sm text-brand-error">{err}</div>}
        {ok  && <div role="status" className="mb-4 rounded-lg border border-brand-success/30 bg-brand-success/10 px-3 py-2 text-sm text-brand-success">Notificación enviada.</div>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-50">
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
