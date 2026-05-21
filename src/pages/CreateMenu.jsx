import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";

const COMIDAS_DISPONIBLES = ["desayuno", "almuerzo", "comida", "merienda", "cena"];

export default function CreateMenu() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "es-ES";
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState(7);
  const [personas, setPersonas] = useState(4);
  const [comidas, setComidas] = useState({
    desayuno: 0,
    almuerzo: 0,
    comida: 1,
    merienda: 0,
    cena: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Cálculo del preview en tiempo real
  const comidasActivas = Object.entries(comidas).filter(([, v]) => v > 0);
  const platosPorDia = comidasActivas.reduce((acc, [, v]) => acc + v, 0);
  const totalPlatos = dias * platosPorDia;

  function toggleComida(nombre) {
    setComidas((prev) => ({
      ...prev,
      [nombre]: prev[nombre] > 0 ? 0 : 1,
    }));
  }

  function stepComida(nombre, delta) {
    setComidas((prev) => {
      const next = (prev[nombre] ?? 0) + delta;
      return { ...prev, [nombre]: Math.min(3, Math.max(1, next)) };
    });
  }

  function clampDias(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return 1;
    return Math.min(30, Math.max(1, n));
  }

  function clampPersonas(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return 1;
    return Math.min(20, Math.max(1, n));
  }

  const canSubmit = comidasActivas.length > 0 && dias >= 1;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    const comidasPayload = Object.fromEntries(
      Object.entries(comidas).filter(([, v]) => v > 0)
    );

    const nombreFinal =
      nombre.trim() || t("menus.form.menuNameDefault", { date: new Date().toLocaleDateString(locale) });

    try {
      const res = await api.post("/menus", {
        nombre: nombreFinal,
        dias,
        comidas: comidasPayload,
        personas,
      });
      const menu = res.data?.data ?? res.data;
      navigate(`/my-menus/${menu.id}/plan`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? t("errors.createMenu");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => navigate("/my-menus")}
        className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        {t("menus.form.back")}
      </button>

      <h1 className="text-2xl font-bold text-brand-navy mb-1">{t("menus.form.newTitle")}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("menus.form.newSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre (opcional) */}
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">
            {t("menus.form.menuName")}{" "}
            <span className="text-xs text-gray-400 font-normal">{t("common.optional")}</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t("menus.form.menuNamePlaceholder", { date: new Date().toLocaleDateString(locale) })}
            maxLength={100}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-brand-navy placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* Días y personas en la misma fila */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              {t("menus.form.numDays")}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDias((d) => Math.max(1, d - 1))}
                className="h-9 w-9 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center font-bold"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={30}
                value={dias}
                onChange={(e) => setDias(clampDias(e.target.value))}
                className="w-14 text-center rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-brand-navy focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              />
              <button
                type="button"
                onClick={() => setDias((d) => Math.min(30, d + 1))}
                className="h-9 w-9 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              {t("menus.form.people")}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPersonas((p) => Math.max(1, p - 1))}
                className="h-9 w-9 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center font-bold"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={personas}
                onChange={(e) => setPersonas(clampPersonas(e.target.value))}
                className="w-14 text-center rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-brand-navy focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              />
              <button
                type="button"
                onClick={() => setPersonas((p) => Math.min(20, p + 1))}
                className="h-9 w-9 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Selector de comidas */}
        <div>
          <p className="text-sm font-medium text-brand-navy mb-3">
            {t("menus.form.whichMeals")}
          </p>
          <div className="space-y-3">
            {COMIDAS_DISPONIBLES.map((clave) => {
              const activa = comidas[clave] > 0;
              return (
                <div key={clave} className="flex items-center gap-4">
                  {/* Checkbox */}
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activa}
                      onChange={() => toggleComida(clave)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-green cursor-pointer"
                    />
                    <span
                      className={`text-sm font-medium ${
                        activa ? "text-brand-navy" : "text-gray-400"
                      }`}
                    >
                      {t(`comidas.${clave}`)}
                    </span>
                  </label>

                  {/* Stepper de platos (solo visible si activa) */}
                  {activa && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stepComida(clave, -1)}
                        disabled={comidas[clave] <= 1}
                        className="h-7 w-7 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center text-xs font-bold disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-brand-navy">
                        {comidas[clave]}
                      </span>
                      <button
                        type="button"
                        onClick={() => stepComida(clave, +1)}
                        disabled={comidas[clave] >= 3}
                        className="h-7 w-7 rounded-lg border border-gray-200 text-brand-navy hover:bg-gray-50 transition-colors flex items-center justify-center text-xs font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-400 ml-1">{t("menus.form.dishes")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {comidasActivas.length === 0 && (
            <p className="mt-2 text-xs text-brand-error">
              {t("validation.selectMeal")}
            </p>
          )}
        </div>

        {/* Preview en tiempo real */}
        {totalPlatos > 0 && (
          <div className="rounded-xl bg-brand-green/5 border border-brand-green/20 px-4 py-3">
            <p className="text-sm font-semibold text-brand-green">
              {t("menus.form.summaryLabel", { count: totalPlatos })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("menus.form.summaryDetail", {
                count: dias,
                dias,
                detail: comidasActivas.map(([c, n]) => `${t(`comidas.${c}`)} (${n})`).join(", "),
              })}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/my-menus")}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("menus.form.creating") : t("menus.form.createAndPlan")}
          </button>
        </div>
      </form>
    </div>
  );
}
