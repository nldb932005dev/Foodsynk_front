import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeText } from '../utils/normalize';

export default function CreatableSelector({
  label,
  items,
  selected,
  onSelect,
  onCreate,
  onRemove,
  nameField = 'name',
  maxItems = 30,
  required = false,
  helpText,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const normalizedSearch = normalizeText(search);
  const selectedIds = selected.map((s) => s.id);

  const filteredItems = items.filter((item) =>
    normalizeText(item[nameField]).includes(normalizedSearch)
  );

  const hasExactMatch = filteredItems.some(
    (item) => normalizeText(item[nameField]) === normalizedSearch
  );

  const alreadySelected = normalizedSearch.length > 0 &&
    selected.some((s) => normalizeText(s[nameField ?? 'name']) === normalizedSearch);

  const showCreate =
    search.trim().length > 0 &&
    !hasExactMatch &&
    !alreadySelected &&
    selected.length < maxItems;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [createError, setCreateError] = useState('');

  async function handleCreate() {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    setCreateError('');
    try {
      await onCreate(name);
      setSearch('');
      inputRef.current?.focus();
    } catch {
      setCreateError(t('errors.createItem'));
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && !alreadySelected) {
        const first = filteredItems[0];
        if (!selectedIds.includes(first.id)) {
          onSelect(first);
          setSearch('');
        }
      } else if (showCreate) {
        handleCreate();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleSelect(item) {
    if (selectedIds.includes(item.id)) {
      onRemove(item.id);
    } else if (selected.length < maxItems) {
      onSelect(item);
    }
    setSearch('');
    inputRef.current?.focus();
  }

  const atLimit = selected.length >= maxItems;

  return (
    <div ref={containerRef}>
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-sm font-medium text-brand-navy">
          {label}
          {required && <span className="text-brand-coral ml-0.5">*</span>}
        </span>
        {atLimit && (
          <span className="text-xs text-brand-error ml-1">{t('selector.max', { max: maxItems })}</span>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-gray-400 mb-1.5">{helpText}</p>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 disabled:opacity-50"
          placeholder={atLimit ? t('selector.limitReached', { max: maxItems }) : t('selector.searchOrAdd', { label: label.toLowerCase() })}
          value={search}
          disabled={creating || atLimit}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          maxLength={80}
          autoComplete="off"
        />

        {open && (search.length > 0 || filteredItems.length > 0) && (
          <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md divide-y divide-gray-50">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-green/5 text-brand-green font-medium'
                      : 'text-brand-navy hover:bg-brand-cream/50'
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                >
                  <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-xs ${
                    isSelected
                      ? 'border-brand-green bg-brand-green text-white'
                      : 'border-gray-300'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  {item[nameField]}
                </button>
              );
            })}

            {showCreate && (
              <>
                {filteredItems.length > 0 && (
                  <div className="border-t border-dashed border-gray-200" />
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-green hover:bg-brand-green/5 transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
                  disabled={creating}
                >
                  {creating ? (
                    <svg className="h-4 w-4 animate-spin text-brand-green" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-brand-green text-brand-green text-xs font-bold">+</span>
                  )}
                  <span>
                    {creating ? t('selector.creating') : <>{t('selector.create')} <strong>"{search.trim()}"</strong></>}
                  </span>
                </button>
              </>
            )}

            {filteredItems.length === 0 && !showCreate && search.length > 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">{t('selector.noResults')}</p>
            )}
          </div>
        )}
      </div>

      {createError && (
        <p className="mt-1 text-xs text-brand-error">{createError}</p>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => {
            const displayName = item[nameField] ?? item.name ?? item.nombre;
            return (
              <span
                key={item.id}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  nameField === 'name'
                    ? 'bg-brand-green/10 text-brand-green'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {displayName}
                {item.isNew && (
                  <span className="text-brand-green font-bold" title={t('selector.justCreated')}>✦</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="ml-0.5 hover:opacity-70 font-bold leading-none"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
