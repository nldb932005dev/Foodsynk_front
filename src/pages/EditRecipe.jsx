import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // Campos
  const [titulo, setTitulo] = useState("");
  const [time,   setTime]   = useState("");
  const [pasos,  setPasos]  = useState("");
  const [foto,   setFoto]   = useState("");
  const [status, setStatus] = useState("draft");

  // [{id, name, isNew}] para categorías · [{id, nombre, isNew}] para ingredientes
  const [selectedCategories,  setSelectedCategories]  = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Opciones (listas del servidor)
  const [categories,  setCategories]  = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // Original para detectar cambios en campos de texto
  const [original, setOriginal] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [recipeRes, catRes, ingRes] = await Promise.all([
          api.get(`/recipes/${id}?include=categories,ingredients`),
          api.get("/categories"),
          api.get("/ingredients"),
        ]);

        const recipe = recipeRes.data?.data ?? recipeRes.data;

        const data = {
          titulo: recipe.titulo  ?? "",
          time:   recipe.time    ?? "",
          pasos:  recipe.pasos   ?? "",
          foto:   recipe.foto    ?? "",
          status: recipe.status  ?? "draft",
        };

        setTitulo(data.titulo);
        setTime(data.time !== "" ? String(data.time) : "");
        setPasos(data.pasos);
        setFoto(data.foto);
        setStatus(data.status);
        const sortedIngs = [...(recipe.ingredients ?? [])].sort((a, b) => a.id - b.id);
        setOriginal({
          ...data,
          categoryIds:     (recipe.categories ?? []).map((c) => c.id).sort((a, b) => a - b),
          ingredientIds:   sortedIngs.map((i) => i.id),
          ingredientPivots: sortedIngs.map((i) => ({
            id: i.id,
            cantidad: i.pivot?.cantidad ?? '',
            unidad_medida: i.pivot?.unidad_medida ?? '',
          })),
        });

        setSelectedCategories(
          (recipe.categories ?? []).map((c) => ({ id: c.id, name: c.name, isNew: false }))
        );
        setSelectedIngredients(
          (recipe.ingredients ?? []).map((i) => ({
            id: i.id,
            nombre: i.nombre,
            isNew: false,
            cantidad: i.pivot?.cantidad ?? '',
            unidad_medida: i.pivot?.unidad_medida ?? '',
          }))
        );

        setCategories(catRes.data?.data  ?? catRes.data  ?? []);
        setIngredients(ingRes.data?.data ?? ingRes.data  ?? []);
      } catch {
        setError(t("errors.loadRecipeEdit"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Handlers de selección ────────────────────────────────────────────────
  function handleSelectCategory(item) {
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === item.id)
        ? prev.filter((c) => c.id !== item.id)
        : [...prev, { id: item.id, name: item.name, isNew: false }]
    );
  }

  function handleRemoveCategory(itemId) {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== itemId));
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

  function handleRemoveIngredient(itemId) {
    setSelectedIngredients((prev) => prev.filter((i) => i.id !== itemId));
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

  const isPublishing = status === "published";

  const currentCatIds = selectedCategories.map((c) => c.id).sort((a, b) => a - b);
  const currentIngIds = selectedIngredients.map((i) => i.id).sort((a, b) => a - b);
  const currentIngPivots = [...selectedIngredients]
    .sort((a, b) => a.id - b.id)
    .map((i) => ({ id: i.id, cantidad: i.cantidad, unidad_medida: i.unidad_medida }));

  const hasChanges =
    titulo !== original.titulo ||
    String(time) !== String(original.time ?? "") ||
    pasos  !== original.pasos  ||
    foto   !== original.foto   ||
    status !== original.status ||
    JSON.stringify(currentCatIds)   !== JSON.stringify(original.categoryIds    ?? []) ||
    JSON.stringify(currentIngIds)   !== JSON.stringify(original.ingredientIds  ?? []) ||
    JSON.stringify(currentIngPivots) !== JSON.stringify(original.ingredientPivots ?? []);

  const publishErrors = isPublishing ? [
    ...(!titulo.trim()                    ? [t("recipes.form.errTitleRequired")]    : []),
    ...(!pasos.trim()                     ? [t("recipes.form.errStepsRequired")]    : []),
    ...(!time || parseInt(time, 10) <= 0  ? [t("recipes.form.errTimeRequired")]     : []),
    ...(selectedCategories.length === 0   ? [t("recipes.form.errCategoryRequired")] : []),
  ] : [];

  const missingForPublish = publishErrors.length > 0;
  const canSubmit = !saving && hasChanges && !fotoError && !missingForPublish;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (foto && !isValidUrl(foto)) {
      setError(t("errors.photoUrlInvalid"));
      return;
    }

    setSaving(true);
    try {
      await api.put(`/recipes/${id}`, {
        titulo:       titulo.trim()  || null,
        time:         time ? parseInt(time, 10) : null,
        pasos:        pasos.trim()   || null,
        foto:         foto.trim()    || null,
        status,
        category_ids: selectedCategories.map((c) => c.id),
        ingredients:  selectedIngredients.map((i) => ({
          id: i.id,
          cantidad: i.cantidad || null,
          unidad_medida: i.unidad_medida || null,
        })),
      });

      setSuccess(t("recipes.form.updated"));
      const savedIngs = [...selectedIngredients].sort((a, b) => a.id - b.id);
      setOriginal({
        titulo: titulo.trim(), time, pasos: pasos.trim(), foto: foto.trim(), status,
        categoryIds:      selectedCategories.map((c) => c.id).sort((a, b) => a - b),
        ingredientIds:    savedIngs.map((i) => i.id),
        ingredientPivots: savedIngs.map((i) => ({
          id: i.id,
          cantidad: i.cantidad,
          unidad_medida: i.unidad_medida,
        })),
      });
      setTimeout(() => navigate("/my-recipes"), 1200);
    } catch (err) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else {
          setError(t("errors.formData"));
        }
      } else if (httpStatus === 403) {
        setError(t("errors.noPermissionEditRecipe"));
      } else if (httpStatus === 404) {
        setError(t("errors.recipeNotFound"));
      } else if (httpStatus === 429) {
        setError(t("errors.tooManyAttemptsShort"));
      } else {
        setError(t("errors.saveChangesGeneric"));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error && !titulo && !time && !pasos) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/my-recipes")}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("recipes.form.backToMine")}
        </button>
        <ErrorMessage message={error} />
      </div>
    );
  }

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
        Volver a Mis Recetas
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#2D6A4F">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">{t("recipes.form.editTitle")}</h1>
            <p className="text-sm text-gray-500">{t("recipes.form.editSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Estado */}
          <div>
            <span className="text-sm font-medium text-brand-navy block mb-1.5">{t("recipes.form.status")}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  status === "draft"
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t("recipes.form.draft")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  status === "published"
                    ? "bg-brand-green text-white border-brand-green"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t("recipes.form.published")}
              </button>
            </div>
          </div>

          {/* Título */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              {t("recipes.form.title")} {isPublishing && <span className="text-brand-coral">*</span>}
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

          {/* Tiempo */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              {t("recipes.form.prepTime")} {isPublishing && <span className="text-brand-coral">*</span>}
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
              {t("recipes.form.steps")} {isPublishing && <span className="text-brand-coral">*</span>}
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
            required={isPublishing}
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

          {/* Mensajes */}
          {error   && <ErrorMessage message={error} />}
          {success && (
            <div className="rounded-xl border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm text-brand-success">
              {success}
            </div>
          )}

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
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:cursor-not-allowed disabled:bg-brand-disabled"
            >
              {saving ? t("common.saving") : t("recipes.form.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
