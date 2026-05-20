import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info,  setInfo]  = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(null); // 'delete' | null

  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { setPage(1); }, [query, pageSize]);
  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      const data = res.data?.data ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError(t("admin.categories.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      await api.patch(`/admin/categories/${id}/approve`);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
      );
    } catch {
      setError(t("admin.categories.approveError"));
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      removeFromSelection([id]);
    } catch {
      setError(t("admin.categories.deleteError"));
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectMany(ids, target) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => target ? next.add(id) : next.delete(id));
      return next;
    });
  }

  function removeFromSelection(ids) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleBulkApprove() {
    const ids = Array.from(selected).filter((id) =>
      categories.find((c) => c.id === id)?.status === "pending"
    );
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await api.patch("/admin/categories/bulk-approve", { ids });
      const summary = res.data ?? {};
      setCategories((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: "approved" } : c))
      );
      removeFromSelection(ids);
      setInfo(t("admin.categories.approved", { count: summary.approved ?? ids.length }));
    } catch (e) {
      const status = e?.response?.status;
      setError(status === 422 ? e?.response?.data?.message ?? t("admin.categories.invalidData") : t("admin.categories.bulkApproveError"));
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await api.delete("/admin/categories/bulk-delete", { data: { ids } });
      const summary = res.data ?? {};
      setCategories((prev) => prev.filter((c) => !ids.includes(c.id)));
      removeFromSelection(ids);
      setInfo(t("admin.categories.bulkDeleted", {
        deleted: summary.deleted ?? ids.length,
        recipes: summary.recipes_affected ?? 0,
        notifs: summary.notifications_sent ?? 0,
      }));
    } catch (e) {
      const status = e?.response?.status;
      setError(status === 422 ? e?.response?.data?.message ?? t("admin.categories.invalidData") : t("admin.categories.bulkDeleteError"));
    } finally {
      setBulkBusy(false);
      setBulkConfirm(null);
    }
  }

  function handleExport() {
    const pendingItems = categories.filter((c) => c.status === "pending");
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_items: pendingItems.length,
        schema_version: "1.0",
      },
      items: pendingItems.map((c) => ({
        id: c.id,
        name: c.name,
        current_status: "pending",
        action: null,
        comment: null,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-pending-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(parsedJson) {
    setBulkBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await api.post("/admin/categories/bulk-import", parsedJson);
      const s = res.data ?? {};
      setInfo(t("admin.categories.imported", {
        approved: s.approved ?? 0,
        deleted: s.deleted ?? 0,
        created: s.created ?? 0,
        reused: s.reused ?? 0,
        recipes: s.recipes_affected ?? 0,
      }));
      setImportOpen(false);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      const errors = e?.response?.data?.errors;
      if (status === 422 && errors) {
        const first = Object.values(errors)[0];
        setError(Array.isArray(first) ? first[0] : String(first));
      } else if (status === 422) {
        setError(e?.response?.data?.message ?? t("admin.categories.importRejected"));
      } else {
        setError(t("admin.categories.importError"));
      }
      setImportOpen(false);
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleCreateMany(names) {
    if (names.length === 0) return;
    setBulkBusy(true);
    setError("");
    setInfo("");
    const payload = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_items: names.length,
        schema_version: "1.0",
      },
      items: names.map((name) => ({
        name,
        current_status: null,
        action: "create",
      })),
    };
    try {
      const res = await api.post("/admin/categories/bulk-import", payload);
      const s = res.data ?? {};
      setInfo(t("admin.categories.created", { created: s.created ?? 0, reused: s.reused ?? 0 }));
      setCreateOpen(false);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      setError(status === 422 ? e?.response?.data?.message ?? t("admin.categories.invalidData") : t("admin.categories.bulkCreateError"));
    } finally {
      setBulkBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [categories, query]);

  const pending  = filtered.filter((c) => c.status === "pending");
  const approved = filtered.filter((c) => c.status !== "pending");

  const { paginated: approvedPage, controls } = Pagination({
    items: approved,
    pageSize,
    setPageSize,
    page,
    setPage,
  });

  const selectedPendingCount = useMemo(
    () => Array.from(selected).filter((id) => categories.find((c) => c.id === id)?.status === "pending").length,
    [selected, categories]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">{t("admin.categories.title")}</h1>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">{error}</div>
      )}
      {info && (
        <div role="status" className="mb-4 rounded-xl border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm text-brand-success">{info}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t("admin.categories.searchPlaceholder")}
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <ActionBtn color="green" onClick={() => setCreateOpen(true)}>{t("admin.categories.createMany")}</ActionBtn>
            <ActionBtn color="gray"  onClick={handleExport}>{t("admin.categories.exportPending")}</ActionBtn>
            <ActionBtn color="gray"  onClick={() => setImportOpen(true)}>{t("admin.categories.importJson")}</ActionBtn>
          </div>

          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-orange mb-3">
                {t("admin.categories.pendingSection", { count: pending.length })}
              </h2>
              <AdminTable
                rows={pending}
                cols={[
                  { label: t("admin.common.name"), render: (c) => c.name },
                  {
                    label: t("admin.common.status"),
                    render: () => (
                      <span className="rounded-full bg-brand-warning/20 px-2.5 py-0.5 text-xs font-semibold text-brand-warning">
                        {t("admin.categories.pendingBadge")}
                      </span>
                    ),
                  },
                ]}
                actions={(c) => (
                  <>
                    <ActionBtn color="green" onClick={() => handleApprove(c.id)}>{t("admin.common.approve")}</ActionBtn>
                    <ActionBtn color="red"   onClick={() => handleDelete(c.id)}>{t("admin.common.delete")}</ActionBtn>
                  </>
                )}
                selection={{
                  selected,
                  onToggle: toggleSelect,
                  onToggleAll: (target) => toggleSelectMany(pending.map((c) => c.id), target),
                  allChecked: pending.length > 0 && pending.every((c) => selected.has(c.id)),
                }}
              />
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
              {t("admin.categories.approvedSection", { count: approved.length })}
            </h2>
            <AdminTable
              rows={approvedPage}
              cols={[{ label: t("admin.common.name"), render: (c) => c.name }]}
              actions={(c) => (
                <ActionBtn color="red" onClick={() => handleDelete(c.id)}>{t("admin.common.delete")}</ActionBtn>
              )}
              selection={{
                selected,
                onToggle: toggleSelect,
                onToggleAll: (target) => toggleSelectMany(approvedPage.map((c) => c.id), target),
                allChecked: approvedPage.length > 0 && approvedPage.every((c) => selected.has(c.id)),
              }}
            />
            {approved.length > pageSize && controls}
          </section>
        </>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl bg-brand-navy text-white px-5 py-3 shadow-2xl">
          <span className="text-sm font-medium">{t("admin.categories.selectedCount", { count: selected.size })}</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkBusy || selectedPendingCount === 0}
            className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold hover:bg-brand-green-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("admin.common.approve")} {selectedPendingCount > 0 ? selectedPendingCount : ""}
          </button>
          <button
            onClick={() => setBulkConfirm("delete")}
            disabled={bulkBusy}
            className="rounded-lg bg-brand-error px-3 py-1.5 text-xs font-semibold hover:bg-brand-error/90 disabled:opacity-40"
          >
            {t("admin.common.delete")} {selected.size}
          </button>
          <button
            onClick={clearSelection}
            disabled={bulkBusy}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium hover:bg-white/10 disabled:opacity-40"
          >
            {t("admin.categories.cancelSelection")}
          </button>
        </div>
      )}

      <ConfirmModal
        open={bulkConfirm === "delete"}
        title={t("admin.categories.bulkDeleteTitle", { count: selected.size })}
        message={t("admin.categories.bulkDeleteMessage")}
        confirmText={t("admin.categories.bulkDeleteConfirm")}
        cancelText={t("admin.common.cancel")}
        loading={bulkBusy}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={handleBulkDelete}
      />

      {importOpen && (
        <ImportJsonModal
          onClose={() => setImportOpen(false)}
          onConfirm={handleImport}
          busy={bulkBusy}
        />
      )}

      {createOpen && (
        <CreateManyModal
          onClose={() => setCreateOpen(false)}
          onConfirm={handleCreateMany}
          busy={bulkBusy}
        />
      )}
    </div>
  );
}

// ── Componentes internos reutilizados en las páginas admin ──────────────────

export function AdminTable({ rows, cols, actions, selection }) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-4">{t("admin.common.noItems")}</p>;
  }
  const hasSelection = !!selection;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            {hasSelection && (
              <th className="px-3 py-3 text-left font-semibold w-10">
                <input
                  type="checkbox"
                  aria-label={t("admin.common.selectAll")}
                  checked={selection.allChecked}
                  onChange={(e) => selection.onToggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-brand-green cursor-pointer"
                />
              </th>
            )}
            {cols.map((c) => (
              <th key={c.label} className="px-5 py-3 text-left font-semibold">{c.label}</th>
            ))}
            <th className="px-5 py-3 text-right font-semibold">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {hasSelection && (
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label={t("admin.common.selectRow", { name: row.name ?? row.titulo ?? row.id })}
                    checked={selection.selected.has(row.id)}
                    onChange={() => selection.onToggle(row.id)}
                    className="h-4 w-4 rounded border-gray-300 accent-brand-green cursor-pointer"
                  />
                </td>
              )}
              {cols.map((c) => (
                <td key={c.label} className="px-5 py-3 text-brand-navy">{c.render(row)}</td>
              ))}
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">{actions(row)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActionBtn({ color = "red", onClick, children, disabled = false, title }) {
  const colors = {
    red:   "border-brand-error/30 text-brand-error hover:bg-brand-error/10",
    green: "border-brand-green text-brand-green hover:bg-brand-green/10",
    gray:  "border-gray-200 text-gray-600 hover:bg-gray-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${colors[color]} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

// ── Modales para import / create-many ──────────────────────────────────────

function ImportJsonModal({ onClose, onConfirm, busy }) {
  const { t } = useTranslation();
  const [parsed, setParsed] = useState(null);
  const [parseErr, setParseErr] = useState("");
  const [filename, setFilename] = useState("");

  function handleFile(e) {
    setParseErr("");
    setParsed(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data?.metadata?.schema_version) throw new Error("metadata.schema_version");
        if (!Array.isArray(data.items)) throw new Error("items[]");
        setParsed(data);
      } catch (err) {
        setParseErr(t("admin.categories.fileInvalid", { msg: err.message }));
      }
    };
    reader.readAsText(file);
  }

  const summary = parsed
    ? parsed.items.reduce(
        (acc, it) => {
          const k = it.action ?? "sin_acción";
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        },
        {}
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-brand-navy mb-1">{t("admin.categories.importTitle")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("admin.categories.importHelp")}</p>

        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          disabled={busy}
          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green file:px-3 file:py-2 file:text-white file:font-medium hover:file:bg-brand-green-dark"
        />

        {filename && <p className="text-xs text-gray-400 mt-2">{t("admin.categories.fileLabel", { name: filename })}</p>}

        {parseErr && <div role="alert" className="mt-3 rounded-lg border border-brand-error/30 bg-brand-error/10 px-3 py-2 text-sm text-brand-error">{parseErr}</div>}

        {parsed && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-brand-navy mb-1">{t("admin.categories.summaryItems", { count: parsed.items.length })}</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {Object.entries(summary).map(([k, v]) => (
                <li key={k}>· {k}: {v}</li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mt-2">{t("admin.categories.schema", { version: parsed.metadata.schema_version })}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {t("admin.common.cancel")}
          </button>
          <button
            onClick={() => onConfirm(parsed)}
            disabled={busy || !parsed}
            className="flex-1 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? t("admin.common.importing") : t("admin.categories.import")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateManyModal({ onClose, onConfirm, busy }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const tooMany = lines.length > 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-brand-navy mb-1">{t("admin.categories.createManyTitle")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("admin.categories.createManyHelp")}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"Vegano\nSin gluten\nKeto"}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        />

        <p className={`text-xs mt-1 text-right ${tooMany ? "text-brand-error" : "text-gray-400"}`}>
          {lines.length} / 50
        </p>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {t("admin.common.cancel")}
          </button>
          <button
            onClick={() => onConfirm(lines)}
            disabled={busy || lines.length === 0 || tooMany}
            className="flex-1 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? t("admin.common.creating") : t("admin.categories.createN", { count: lines.length })}
          </button>
        </div>
      </div>
    </div>
  );
}
