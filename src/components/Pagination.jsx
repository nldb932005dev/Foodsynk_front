import { useEffect, useState } from "react";
import i18n from "../i18n";

function PageInput({ safePage, totalPages, setPage, label }) {
  const [draft, setDraft] = useState(String(safePage));

  // Sincroniza el input cuando el page externo cambia (botones prev/next, reset al filtrar).
  useEffect(() => {
    setDraft(String(safePage));
  }, [safePage]);

  function commit() {
    const v = parseInt(draft, 10);
    if (Number.isNaN(v)) {
      setDraft(String(safePage));
      return;
    }
    const clamped = Math.min(totalPages, Math.max(1, v));
    setPage(clamped);
    setDraft(String(clamped));
  }

  return (
    <input
      type="number"
      min={1}
      max={totalPages}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        }
      }}
      aria-label={label}
      className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm text-brand-navy focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
    />
  );
}

export default function Pagination({ items, pageSize, setPageSize, page, setPage }) {
  const t = i18n.t.bind(i18n);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = items.slice(start, end);

  return {
    paginated,
    controls: (
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <label className="text-sm text-gray-500 flex items-center gap-2">
          {t("common.show")}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            aria-label={t("common.perPage")}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-brand-navy focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 text-sm text-brand-navy">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label={t("common.prevPage")}
            className="rounded-lg border border-gray-200 px-3 py-1 text-brand-navy hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <span className="flex items-center gap-1.5" aria-live="polite">
            <PageInput
              safePage={safePage}
              totalPages={totalPages}
              setPage={setPage}
              label={t("common.goToPage")}
            />
            <span>/ {totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label={t("common.nextPage")}
            className="rounded-lg border border-gray-200 px-3 py-1 text-brand-navy hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    ),
  };
}
