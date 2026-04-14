import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

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

  // ── Campos del formulario ────────────────────────────────────────────────
  const [titulo, setTitulo] = useState("");
  const [time,   setTime]   = useState("");
  const [pasos,  setPasos]  = useState("");
  const [foto,   setFoto]   = useState("");
  const [status, setStatus] = useState("draft");

  const [selectedCategories,  setSelectedCategories]  = useState([]); // [id, ...]
  const [selectedIngredients, setSelectedIngredients] = useState([]); // [id, ...]

  // ── Opciones de selección ───────────────────────────────────────────────
  const [categories,  setCategories]  = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError,   setOptionsError]   = useState("");

  // ── Búsqueda dentro de los listados ────────────────────────────────────
  const [catSearch, setCatSearch] = useState("");
  const [ingSearch, setIngSearch] = useState("");

  // ── Estado del envío ────────────────────────────────────────────────────
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState({});

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
        setOptionsError("No se pudieron cargar las categorías e ingredientes.");
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  // ── Helpers de selección ────────────────────────────────────────────────
  function toggleCategory(id) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleIngredient(id) {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ── Validación ──────────────────────────────────────────────────────────
  const isPublishing = status === "published";

  const fotoError =
    touched.foto && foto && !isValidUrl(foto)
      ? "La URL no es válida (debe empezar por http:// o https://)."
      : "";

  const missingForPublish =
    isPublishing &&
    (!titulo.trim() || !time || !pasos.trim() || selectedCategories.length === 0);

  const canSubmit = !saving && !fotoError && !missingForPublish;

  // ── Envío ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (foto && !isValidUrl(foto)) {
      setError("La URL de la foto no es válida.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/recipes", {
        titulo:       titulo.trim()  || null,
        time:         time ? parseInt(time, 10) : null,
        pasos:        pasos.trim()   || null,
        foto:         foto.trim()    || null,
        status,
        category_ids: selectedCategories,
        ingredients:  selectedIngredients.map((id) => ({ id })),
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
          setError("Datos incorrectos. Revisa los campos e inténtalo de nuevo.");
        }
      } else if (status422 === 429) {
        setError("Demasiados intentos. Espera un momento.");
      } else {
        setError("Error al guardar la receta. Inténtalo de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Filtrado de listas ───────────────────────────────────────────────────
  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredIngs = ingredients.filter((i) =>
    i.nombre.toLowerCase().includes(ingSearch.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────
  if (loadingOptions) return <LoadingSpinner text="Cargando opciones..." />;

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
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Nueva receta</h1>
            <p className="text-sm text-gray-500">Rellena los campos y guarda o publica</p>
          </div>
        </div>

        {optionsError && <ErrorMessage message={optionsError} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Título */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Título {isPublishing && <span className="text-brand-coral">*</span>}
            </span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.trimStart())}
              onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
              maxLength={MAX_TITULO}
              placeholder="Nombre de la receta"
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {titulo.length}/{MAX_TITULO}
            </span>
          </label>

          {/* Tiempo (minutos) */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Tiempo de preparación (minutos) {isPublishing && <span className="text-brand-coral">*</span>}
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, time: true }))}
              placeholder="Ej: 30"
            />
          </label>

          {/* URL foto */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">URL de la imagen</span>
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
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {fotoError && (
              <span className="mt-1 block text-xs text-brand-coral">{fotoError}</span>
            )}
          </label>

          {/* Pasos */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Pasos de preparación {isPublishing && <span className="text-brand-coral">*</span>}
            </span>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-y min-h-[120px]"
              value={pasos}
              onChange={(e) => setPasos(e.target.value.substring(0, MAX_PASOS))}
              onBlur={() => setTouched((t) => ({ ...t, pasos: true }))}
              rows={6}
              placeholder="Describe los pasos para preparar la receta..."
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {pasos.length}/{MAX_PASOS}
            </span>
          </label>

          {/* Categorías */}
          <div>
            <span className="text-sm font-medium text-brand-navy">
              Categorías {isPublishing && <span className="text-brand-coral">*</span>}
            </span>
            {selectedCategories.length > 0 && (
              <span className="ml-2 text-xs text-brand-green font-medium">
                {selectedCategories.length} seleccionada{selectedCategories.length !== 1 ? "s" : ""}
              </span>
            )}
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              placeholder="Buscar categoría..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
            <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
              {filteredCats.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
              ) : (
                filteredCats.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-cream/50">
                    <input
                      type="checkbox"
                      className="accent-brand-green"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span className="text-sm text-brand-navy">{cat.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <span className="text-sm font-medium text-brand-navy">Ingredientes</span>
            {selectedIngredients.length > 0 && (
              <span className="ml-2 text-xs text-brand-green font-medium">
                {selectedIngredients.length} seleccionado{selectedIngredients.length !== 1 ? "s" : ""}
              </span>
            )}
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              placeholder="Buscar ingrediente..."
              value={ingSearch}
              onChange={(e) => setIngSearch(e.target.value)}
            />
            <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
              {filteredIngs.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
              ) : (
                filteredIngs.map((ing) => (
                  <label key={ing.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-cream/50">
                    <input
                      type="checkbox"
                      className="accent-brand-green"
                      checked={selectedIngredients.includes(ing.id)}
                      onChange={() => toggleIngredient(ing.id)}
                    />
                    <span className="text-sm text-brand-navy">{ing.nombre}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Aviso si falta algo para publicar */}
          {isPublishing && missingForPublish && (
            <p className="text-xs text-brand-coral">
              Para publicar necesitas: título, tiempo, pasos y al menos una categoría.
            </p>
          )}

          {error && <ErrorMessage message={error} />}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/my-recipes")}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || fotoError}
              onClick={() => setStatus("draft")}
              className="flex-1 rounded-xl border border-brand-green px-4 py-3 text-sm font-semibold text-brand-green hover:bg-brand-green/5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && status === "draft" ? "Guardando..." : "Guardar borrador"}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              onClick={() => setStatus("published")}
              className="flex-1 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving && status === "published" ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
