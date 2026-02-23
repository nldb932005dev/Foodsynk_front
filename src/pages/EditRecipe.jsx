import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

// Max lengths for fields (security: limit input size)
const MAX_TITULO = 150;
const MAX_TIEMPO = 50;
const MAX_PASOS = 5000;
const MAX_FOTO_URL = 500;

// Sanitize text input: trim and collapse excessive whitespace
function sanitize(value) {
  return value.replace(/\s{3,}/g, "  ").trimStart();
}

// Validate URL format (basic check, no javascript: or data: allowed)
function isValidUrl(url) {
  if (!url) return true; // empty is allowed
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [titulo, setTitulo] = useState("");
  const [tiempo, setTiempo] = useState("");
  const [pasos, setPasos] = useState("");
  const [foto, setFoto] = useState("");

  // Track original values to detect changes
  const [original, setOriginal] = useState({});

  // Touched state for validation feedback
  const [touched, setTouched] = useState({
    titulo: false,
    tiempo: false,
    pasos: false,
    foto: false,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/recipes/${id}`);
        const recipe = res.data?.data ?? res.data;

        const data = {
          titulo: recipe.titulo ?? "",
          tiempo: recipe.tiempo ?? "",
          pasos: recipe.pasos ?? "",
          foto: recipe.foto ?? "",
        };

        setTitulo(data.titulo);
        setTiempo(data.tiempo);
        setPasos(data.pasos);
        setFoto(data.foto);
        setOriginal(data);
      } catch {
        setError("No se pudo cargar la receta para editar.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Validation
  const fotoError = touched.foto && foto && !isValidUrl(foto)
    ? "La URL de la imagen no es valida (debe empezar por http:// o https://)."
    : "";

  // At least one field must have content
  const allEmpty =
    titulo.trim() === "" &&
    tiempo.trim() === "" &&
    pasos.trim() === "" &&
    foto.trim() === "";

  // Check if anything changed from original
  const hasChanges =
    titulo !== original.titulo ||
    tiempo !== original.tiempo ||
    pasos !== original.pasos ||
    foto !== original.foto;

  const canSubmit =
    !saving && !allEmpty && hasChanges && !fotoError;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (allEmpty) {
      setError("No puedes dejar todos los campos vacios.");
      return;
    }

    if (foto && !isValidUrl(foto)) {
      setError("La URL de la foto no es valida.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/recipes/${id}`, {
        titulo: titulo.trim() || null,
        tiempo: tiempo.trim() || null,
        pasos: pasos.trim() || null,
        foto: foto.trim() || null,
      });

      setSuccess("Receta actualizada correctamente.");
      // Update original to reflect saved state
      setOriginal({
        titulo: titulo.trim(),
        tiempo: tiempo.trim(),
        pasos: pasos.trim(),
        foto: foto.trim(),
      });

      setTimeout(() => navigate("/my-recipes"), 1200);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError("Datos incorrectos. Revisa los campos e intentalo de nuevo.");
        }
      } else if (status === 403) {
        setError("No tienes permiso para editar esta receta.");
      } else if (status === 404) {
        setError("La receta no existe o ha sido eliminada.");
      } else if (status === 429) {
        setError("Demasiados intentos. Espera un momento.");
      } else {
        setError("Error al guardar los cambios. Intentalo de nuevo mas tarde.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner text="Cargando receta..." />;

  if (error && !titulo && !tiempo && !pasos) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/my-recipes")}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver a Mis Recetas
        </button>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/my-recipes")}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a Mis Recetas
      </button>

      {/* Form card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#2D6A4F">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Editar receta</h1>
            <p className="text-sm text-gray-500">Modifica los campos que quieras actualizar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titulo */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Titulo
            </span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={titulo}
              onChange={(e) => setTitulo(sanitize(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
              maxLength={MAX_TITULO}
              placeholder="Nombre de la receta"
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {titulo.length}/{MAX_TITULO}
            </span>
          </label>

          {/* Tiempo */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Tiempo de preparacion
            </span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              value={tiempo}
              onChange={(e) => setTiempo(sanitize(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, tiempo: true }))}
              maxLength={MAX_TIEMPO}
              placeholder="Ej: 30 minutos"
            />
          </label>

          {/* Foto URL */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              URL de la imagen
            </span>
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
              maxLength={MAX_FOTO_URL}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {fotoError && (
              <span className="mt-1 block text-xs text-brand-coral">{fotoError}</span>
            )}
          </label>

          {/* Pasos */}
          <label className="block">
            <span className="text-sm font-medium text-brand-navy">
              Pasos de preparacion
            </span>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-y min-h-[120px]"
              value={pasos}
              onChange={(e) => setPasos(e.target.value.substring(0, MAX_PASOS))}
              onBlur={() => setTouched((t) => ({ ...t, pasos: true }))}
              maxLength={MAX_PASOS}
              rows={6}
              placeholder="Describe los pasos para preparar la receta..."
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {pasos.length}/{MAX_PASOS}
            </span>
          </label>

          {/* Warning: all empty */}
          {allEmpty && (
            <p className="text-xs text-brand-coral">
              Debes rellenar al menos un campo.
            </p>
          )}

          {/* Messages */}
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Buttons */}
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
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
