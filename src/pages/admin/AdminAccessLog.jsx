import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import SearchBar from "../../components/SearchBar";

// Acciones conocidas (SEC-CIBER.3 enriquecido + 2FA-EMAIL). El backend filtra
// por coincidencia exacta; este listado es solo conveniencia de UI.
const ACTION_OPTIONS = [
  "login",
  "login_failed",
  "register",
  "logout",
  "password_reset_requested",
  "password_reset",
  "bot_blocked",
  "honeypot",
  "form_too_fast",
  "brute_force",
  "2fa_challenge_sent",
  "2fa_challenge_success",
  "2fa_challenge_failed",
  "2fa_enabled",
  "2fa_disabled",
];

// Token semántico del badge según éxito/acción. El badge rojo de sospechoso
// usa brand-error (no bg-red-*) por la regla de marca del proyecto.
function actionBadge(row) {
  const action = (row.action ?? "").toLowerCase();
  const failedish =
    row.success === false ||
    /fail|failed|blocked|brute|honeypot|too_fast|denied|invalid/.test(action);
  if (failedish) {
    return "bg-brand-error/10 text-brand-error";
  }
  return "bg-brand-success/10 text-brand-success";
}

// País → emoji bandera a partir del código ISO-2 (regional indicators).
function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  const cc = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(
    ...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
  );
}

function truncate(str, n = 12) {
  if (!str) return "—";
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es");
}

const EMPTY_FILTERS = {
  action: "",
  success: "",
  is_suspicious: "",
  country: "",
  email: "",
  date_from: "",
  date_to: "",
};

export default function AdminAccessLog() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Borrador en los inputs vs. filtros aplicados (el fetch es server-side).
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, page]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const params = { page };
      Object.entries(applied).forEach(([k, v]) => {
        if (v !== "" && v != null) params[k] = v;
      });
      const res = await api.get("/admin/access-logs", { params });

      // El paginador puede venir plano (Laravel) o doble-envuelto (Orion).
      const root = res.data ?? {};
      let pag = root;
      if (
        root.data &&
        !Array.isArray(root.data) &&
        (root.data.data || root.data.current_page || root.data.meta)
      ) {
        pag = root.data;
      }
      const list = Array.isArray(pag.data)
        ? pag.data
        : Array.isArray(root.data)
        ? root.data
        : [];
      const m = pag.meta ?? pag;
      setRows(list);
      setMeta({
        current_page: m.current_page ?? page,
        last_page: m.last_page ?? 1,
        total: m.total ?? list.length,
      });
    } catch {
      setRows([]);
      setError(t("admin.access.loadError"));
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(e) {
    e?.preventDefault();
    setPage(1);
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  }

  function setField(name, value) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function exportCsv() {
    const headers = [
      t("admin.access.colDate"),
      t("admin.access.colAction"),
      t("admin.access.success"),
      t("admin.access.colEmail"),
      t("admin.access.colUser"),
      t("admin.access.colIp"),
      t("admin.access.colCountry"),
      t("admin.access.colCity"),
      t("admin.access.colIsp"),
      t("admin.access.colDevice"),
      t("admin.access.colBrowser"),
      t("admin.access.colOs"),
      t("admin.access.colFingerprint"),
      t("admin.access.colSuspicious"),
      t("admin.access.csvReason"),
    ];
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) =>
      [
        fmtDate(r.created_at),
        r.action,
        r.success === false ? t("admin.access.no") : t("admin.access.yes"),
        r.email ?? r.user?.email,
        r.user?.name,
        r.ip ?? r.ip_address,
        r.country,
        r.city,
        r.isp,
        r.device,
        r.browser,
        r.os,
        r.fingerprint ?? r.fingerprint_hash,
        r.is_suspicious ? t("admin.access.yes") : t("admin.access.no"),
        r.suspicious_reason ?? r.suspicion_reason,
      ]
        .map(esc)
        .join(",")
    );
    const csv = "﻿" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accesos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-navy focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20";

  const cols = useMemo(
    () => [
      { label: t("admin.access.colDate"), render: (r) => fmtDate(r.created_at) },
      {
        label: t("admin.access.colAction"),
        render: (r) => (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionBadge(
              r
            )}`}
          >
            {r.action ?? "—"}
          </span>
        ),
      },
      { label: t("admin.access.colEmail"), render: (r) => r.email ?? r.user?.email ?? "—" },
      {
        label: t("admin.access.colUser"),
        render: (r) =>
          r.user?.name ? (
            <Link
              to="/admin/users"
              className="text-brand-green hover:underline"
            >
              {r.user.name}
            </Link>
          ) : (
            "—"
          ),
      },
      { label: t("admin.access.colIp"), render: (r) => r.ip ?? r.ip_address ?? "—" },
      {
        label: t("admin.access.colCountry"),
        render: (r) => {
          const flag = flagEmoji(r.country_code ?? r.countryCode);
          const name = r.country ?? "—";
          return flag ? `${flag} ${name}` : name;
        },
      },
      { label: t("admin.access.colCity"), render: (r) => r.city ?? "—" },
      { label: t("admin.access.colIsp"), render: (r) => r.isp ?? "—" },
      { label: t("admin.access.colDevice"), render: (r) => r.device ?? "—" },
      { label: t("admin.access.colBrowser"), render: (r) => r.browser ?? "—" },
      { label: t("admin.access.colOs"), render: (r) => r.os ?? "—" },
      {
        label: t("admin.access.colFingerprint"),
        render: (r) => {
          const fp = r.fingerprint ?? r.fingerprint_hash;
          return (
            <span title={fp ?? ""} className="font-mono text-xs">
              {truncate(fp)}
            </span>
          );
        },
      },
      {
        label: t("admin.access.colSuspicious"),
        render: (r) =>
          r.is_suspicious ? (
            <span
              title={r.suspicious_reason ?? r.suspicion_reason ?? ""}
              className="rounded-full bg-brand-error/10 px-2.5 py-0.5 text-xs font-semibold text-brand-error"
            >
              {t("admin.access.colSuspicious")}
            </span>
          ) : (
            <span className="text-xs text-brand-success">OK</span>
          ),
      },
    ],
    [t]
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">{t("admin.access.title")}</h1>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("admin.access.exportCsv")}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={applyFilters}
        className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="mb-3">
          <SearchBar
            value={draft.email}
            onChange={(v) => setField("email", v)}
            placeholder={t("admin.access.searchPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersAction")}
            </span>
            <select
              value={draft.action}
              onChange={(e) => setField("action", e.target.value)}
              className={inputCls}
            >
              <option value="">{t("admin.access.any")}</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersResult")}
            </span>
            <select
              value={draft.success}
              onChange={(e) => setField("success", e.target.value)}
              className={inputCls}
            >
              <option value="">{t("admin.access.any")}</option>
              <option value="true">{t("admin.access.success")}</option>
              <option value="false">{t("admin.access.failure")}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersSuspicious")}
            </span>
            <select
              value={draft.is_suspicious}
              onChange={(e) => setField("is_suspicious", e.target.value)}
              className={inputCls}
            >
              <option value="">{t("admin.access.any")}</option>
              <option value="true">{t("admin.access.onlySuspicious")}</option>
              <option value="false">{t("admin.access.onlyNormal")}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersCountry")}
            </span>
            <input
              type="text"
              value={draft.country}
              onChange={(e) => setField("country", e.target.value)}
              placeholder={t("admin.access.countryPlaceholder")}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersFrom")}
            </span>
            <input
              type="date"
              value={draft.date_from}
              onChange={(e) => setField("date_from", e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-navy">
              {t("admin.access.filtersTo")}
            </span>
            <input
              type="date"
              value={draft.date_to}
              onChange={(e) => setField("date_to", e.target.value)}
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark"
          >
            {t("admin.access.applyFilters")}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("admin.access.clearFilters")}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-sm text-gray-400">
          {t("admin.access.noResults")}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.label}
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className={`transition-colors hover:bg-gray-50 ${
                      row.is_suspicious ? "bg-brand-error/5" : ""
                    }`}
                  >
                    {cols.map((c) => (
                      <td
                        key={c.label}
                        className="whitespace-nowrap px-4 py-3 text-brand-navy"
                      >
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-brand-navy">
            <span className="text-gray-500">
              {t("admin.access.total", { count: meta.total })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                aria-label={t("common.prevPage")}
                className="rounded-lg border border-gray-200 px-3 py-1 text-brand-navy hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>
              <span aria-live="polite">
                {t("admin.access.page", { current: meta.current_page, total: meta.last_page })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(meta.last_page, p + 1))
                }
                disabled={meta.current_page >= meta.last_page}
                aria-label={t("common.nextPage")}
                className="rounded-lg border border-gray-200 px-3 py-1 text-brand-navy hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
