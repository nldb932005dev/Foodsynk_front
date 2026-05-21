import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import CreatableSelector from "../components/CreatableSelector";
import { UNIDADES } from "../utils/units";

const MAX_TITULO = 150;
const MAX_PASOS  = 10000;
const MAX_FOTO   = 2048;

function isValidUrl(url) {
  if (!url) return true;
  try {
    const p = new URL(url);
    return ["http:", "https:"].includes(p.protocol);
  } catch {
    return false;
  }
}

export default function CreateRecipe() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Campos del formulario ────────────────────────────────────────────────
  const [titulo, setTitulo] = useState("");
  const [time,   setTime]   = useState("");
  const [pasos,  setPasos]  = useState("");
  const [foto,   setFoto]   = useState("");

  // [{id, name, isNew}] para categorías · [{id, nombre, isNew}] para ingredientes
  const [selectedCategories,  setSelectedCategories]  = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // ── Opciones de selección ───────────────────────────────────────────────
  const [categories,  setCategories]  = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError,   setOptionsError]   = useState("");

  // ── Estado del envío ────────────────────────────────────────────────────
  const [savingAs, setSavingAs] = useState(null); // null | "draft" | "published"
  const [error,    setError]    = useState("");
  const [touched,  setTouched]  = useState({});
  const saving = savingAs !== null;

  // ── Carga de categorías e ingredientes ──────────────────────────────────
  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [catRes, ingRes] = await Promise.all([
          api.get("/categories"),
          api.get("/ingredients"),
        ]);
        setCategories(catRes.data?.data  ?? catRes.data  ?? []);
        setIngredients(ingRes.data?.data ?? ingRes.data  ?? []);
      } catch {
        setOptionsError(t("errors.loadOptions"));
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  // ── Handlers de selección ────────────────────────────────────────────────
  function handleSelectCategory(item) {
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === item.id)
        ? prev.filter((c) => c.id !== item.id)
        : [...prev, { id: item.id, name: item.name, isNew: false }]
    );
  }

  function handleRemoveCategory(id) {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCreateCategory(name) {
    const res = await api.post("/categories", { name });
    const created = res.data?.data ?? res.data;
    setSelectedCategories((prev) => [
      ...prev,
      { id: created.id, name: created.name, isNew: true },
    ]);
    setCategories((prev) => [...prev, created]);
  }

  function handleSelectIngredient(item) {
    setSelectedIngredients((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, { id: item.id, nombre: item.nombre, isNew: false, cantidad: '', unidad_medida: '' }]
    );
  }

  function handleRemoveIngredient(id) {
    setSelectedIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleCreateIngredient(nombre) {
    const res = await api.post("/ingredients", { nombre });
    const created = res.data?.data ?? res.data;
    setSelectedIngredients((prev) => [
      ...prev,
      { id: created.id, nombre: created.nombre, isNew: true, cantidad: '', unidad_medida: '' },
    ]);
    setIngredients((prev) => [...prev, created]);
  }

  function handleIngredientFieldChange(id, field, value) {
    setSelectedIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  // ── Validación ──────────────────────────────────────────────────────────
  const fotoError =
    touched.foto && foto && !isValidUrl(foto)
      ? t("validation.urlInvalid")
      : "";

  const publishErrors = [
    ...(!titulo.trim()                    ? [t("recipes.form.errTitleRequired")]    : []),
    ...(!pasos.trim()                     ? [t("recipes.form.errStepsRequired")]    : []),
    ...(!time || parseInt(time, 10) <= 0  ? [t("recipes.form.errTimeRequired")]     : []),
    ...(selectedCategories.length === 0   ? [t("recipes.form.errCategoryRequired")] : []),
  ];

  const canPublish = !saving && !fotoError && publishErrors.length === 0;

  // ── Envío ────────────────────────────────────────────────────────────────
  async function handleSave(targetStatus) {
    if (saving) return;
    setError("");

    if (foto && !isValidUrl(foto)) {
      setError(t("errors.photoUrlInvalid"));
      return;
    }

    setSavingAs(targetStatus);
    try {
      await api.post("/recipes", {
        titulo:       titulo.trim()  || null,
        time:         time ? parseInt(time, 10) : null,
        pasos:        pasos.trim()   || null,
        foto:         foto.trim()    || null,
        status:       targetStatus,
        category_ids: selectedCategories.map((c) => c.id),
        ingredients:  selectedIngredients.map((i) => ({
          id: i.id,
          cantidad: i.cantidad || null,
          unidad_medida: i.unidad_medida || null,
        })),
      });

      navigate("/my-recipes");
    } catch (err) {
      const status422 = err?.response?.status;
      if (status422 === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else {
          setError(t("errors.formData"));
        }
      } else if (status422 === 429) {
        setError(t("errors.tooManyAttemptsShort"));
      } else {
        setError(t("errors.saveRecipe"));
      }
    } finally {
      setSavingAs(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loadingOptions) return <LoadingSpinner text={t("common.loadingOptions")} />;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Volver */}
      <button
        onClick={() => navigate("/my-recipes")}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {t("recipes.form.backToMine")}
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#2D6A4F">
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">{t("recipes.form.newTitle")}</h1>
            <p className="text-sm text-gray-500">{t("recipes.form.newSubtitle")}</p>
          </div>
        </div>

        {optionsError && <ErrorMessage message={optionsError} />}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canPublish) handleSave("published");
          }}
          className="space-y-5"
        >
          {/* Submit oculto: habilita el envío implícito al pulsar Enter en un input.
              Los botones visibles son type="button" para evitar el race condition entre
              setState y submit (ver F-PUBLISH-FIX.1). */}
          <button type="submit" tabIndex={-1} aria-hidden="true" className="hidden" />

          {/* Título */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              {t("recipes.form.title")} <span className="text-brand-coral">*</span>
            </span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.trimStart())}
              onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
              maxLength={MAX_TITULO}
              placeholder={t("recipes.form.titlePlaceholder")}
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {titulo.length}/{MAX_TITULO}
            </span>
          </label>

          {/* Tiempo (minutos) */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              {t("recipes.form.prepTime")} <span className="text-brand-coral">*</span>
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, time: true }))}
              placeholder={t("recipes.form.prepTimePlaceholder")}
            />
          </label>

          {/* URL foto */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">{t("recipes.form.imageUrl")}</span>
            <input
              type="url"
              className={`mt-1.5 w-full rounded-xl border bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:ring-2 ${
                fotoError
                  ? "border-brand-coral focus:border-brand-coral focus:ring-brand-coral/20"
                  : "border-gray-200 focus:border-brand-green focus:ring-brand-green/20"
              }`}
              value={foto}
              onChange={(e) => setFoto(e.target.value.replace(/\s+/g, ""))}
              onBlur={() => setTouched((t) => ({ ...t, foto: true }))}
              maxLength={MAX_FOTO}
              placeholder={t("recipes.form.imageUrlPlaceholder")}
            />
            {fotoError && (
              <span className="mt-1 block text-xs text-brand-error">{fotoError}</span>
            )}
          </label>

          {/* Pasos */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              {t("recipes.form.steps")} <span className="text-brand-coral">*</span>
            </span>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-y min-h-[120px]"
              value={pasos}
              onChange={(e) => setPasos(e.target.value.substring(0, MAX_PASOS))}
              onBlur={() => setTouched((t) => ({ ...t, pasos: true }))}
              rows={6}
              placeholder={t("recipes.form.stepsPlaceholder")}
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {pasos.length}/{MAX_PASOS}
            </span>
          </label>

          {/* Categorías */}
          <CreatableSelector
            label={t("recipes.form.categories")}
            items={categories}
            selected={selectedCategories}
            onSelect={handleSelectCategory}
            onCreate={handleCreateCategory}
            onRemove={handleRemoveCategory}
            nameField="name"
            maxItems={15}
            required
            helpText={t("recipes.form.categoriesHelp")}
          />

          {/* Ingredientes */}
          <CreatableSelector
            label={t("recipes.form.ingredients")}
            items={ingredients}
            selected={selectedIngredients}
            onSelect={handleSelectIngredient}
            onCreate={handleCreateIngredient}
            onRemove={handleRemoveIngredient}
            nameField="nombre"
            maxItems={30}
            helpText={t("recipes.form.ingredientsHelp")}
          />

          {/* Cantidades por ingrediente */}
          {selectedIngredients.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("recipes.form.quantityPerIngredient")}
              </p>
              {selectedIngredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-2">
                  <span className="text-sm text-brand-navy w-32 truncate shrink-0">{ing.nombre}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999"
                    inputMode="decimal"
                    value={ing.cantidad}
                    placeholder={t("recipes.form.quantityPlaceholder")}
                    onChange={(e) => handleIngredientFieldChange(ing.id, 'cantidad', e.target.value)}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    aria-label={t("recipes.form.quantityOf", { name: ing.nombre })}
                  />
                  <select
                    value={ing.unidad_medida}
                    onChange={(e) => handleIngredientFieldChange(ing.id, 'unidad_medida', e.target.value)}
                    className="w-32 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    aria-label={t("recipes.form.unitOf", { name: ing.nombre })}
                  >
                    <option value="">—</option>
                    {UNIDADES.map((u) => (
                      <option key={u.value} value={u.value}>{t(`units.${u.value}`)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Errores de validación para publicar */}
          {publishErrors.length > 0 && (
            <div role="alert" className="rounded-xl border border-brand-coral/30 bg-brand-coral/5 px-4 py-3">
              <p className="text-xs font-semibold text-brand-error mb-1">{t("recipes.form.needToPublish")}</p>
              <ul className="list-disc list-inside space-y-0.5">
                {publishErrors.map((err, i) => (
                  <li key={i} className="text-xs text-brand-error">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/my-recipes")}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("draft")}
              className="flex-1 rounded-xl border border-brand-green px-4 py-3 text-sm font-semibold text-brand-green hover:bg-brand-green/5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingAs === "draft" ? t("recipes.form.savingDraft") : t("recipes.form.saveDraft")}
            </button>
            <button
              type="button"
              disabled={!canPublish}
              onClick={() => handleSave("published")}
              className="flex-1 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:cursor-not-allowed disabled:bg-brand-disabled"
            >
              {savingAs === "published" ? t("recipes.form.publishing") : t("recipes.form.publish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
