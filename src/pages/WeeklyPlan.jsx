import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import RecipePicker from "../components/RecipePicker";

function SlotCell({ slot, onAdd, onRemove }) {
  const { t } = useTranslation();
  if (slot) {
    return (
      <div className="relative group rounded-lg bg-brand-green/8 border border-brand-green/20 p-2 min-h-[60px]">
        {slot.recipe.foto ? (
          <img
            src={slot.recipe.foto}
            alt=""
            className="h-8 w-full object-cover rounded mb-1 opacity-80"
          />
        ) : null}
        <p className="text-xs font-medium text-brand-navy leading-tight line-clamp-2">
          {slot.recipe.titulo}
        </p>
        {slot.recipe.time && (
          <p className="text-xs text-gray-400 mt-0.5">{t("recipes.card.minutes", { count: slot.recipe.time })}</p>
        )}
        <button
          type="button"
          onClick={() => onRemove(slot)}
          aria-label={t("menus.weekly.removeRecipe", { name: slot.recipe.titulo })}
          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-brand-coral hover:border-brand-coral transition-colors text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 min-h-[60px] w-full text-gray-300 hover:border-brand-green hover:text-brand-green transition-colors"
      aria-label={t("menus.weekly.addToDish")}
    >
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}

export default function WeeklyPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [menu, setMenu] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null); // { dia, comida, plato }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [menuRes, slotsRes] = await Promise.all([
          api.get(`/menus/${id}`),
          api.get(`/menus/${id}/weekly-plan`),
        ]);
        setMenu(menuRes.data?.data ?? menuRes.data);
        const slotsData = slotsRes.data?.data ?? slotsRes.data;
        // El pivot dia/plato llega como string desde MySQL (withPivot sin
        // withCasts en Menu::recipes). Normalizamos a número aquí para que
        // findSlot y el contador puedan usar strict equality sin coerción.
        const normalized = Array.isArray(slotsData)
          ? slotsData.map((s) => ({ ...s, dia: Number(s.dia), plato: Number(s.plato) }))
          : [];
        setSlots(normalized);
      } catch {
        setError(t("errors.loadWeeklyPlan"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function findSlot(dia, comida, plato) {
    return slots.find(
      (s) => s.dia === dia && s.comida === comida && s.plato === plato
    );
  }

  function handleOpenPicker(dia, comida, plato) {
    setActiveSlot({ dia, comida, plato });
    setPickerOpen(true);
  }

  async function handleSelectRecipe(recipe) {
    if (!activeSlot) return;
    const { dia, comida, plato } = activeSlot;
    try {
      await api.post(`/menus/${id}/recipes`, {
        recipe_id: recipe.id,
        dia,
        comida,
        plato,
      });
      setSlots((prev) => [...prev, { dia, comida, plato, recipe }]);
    } catch {
      // Si falla el attach, no actualizamos el estado local
    }
    setPickerOpen(false);
    setActiveSlot(null);
  }

  async function handleRemoveSlot(slot) {
    try {
      await api.delete(`/menus/${id}/recipes/${slot.recipe.id}`, {
        data: { dia: slot.dia, comida: slot.comida, plato: slot.plato },
      });
      setSlots((prev) =>
        prev.filter(
          (s) =>
            !(
              s.dia === slot.dia &&
              s.comida === slot.comida &&
              s.plato === slot.plato
            )
        )
      );
    } catch {
      // Fallo silencioso
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("common.back")}
        </button>
        <div className="rounded-xl border border-brand-warning/30 bg-brand-warning/10 px-5 py-4">
          <p className="text-sm font-semibold text-brand-warning">
            {t("menus.weekly.errorTitle")}
          </p>
          <p className="text-xs text-brand-warning mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!menu) return null;

  const comidasMenu = menu.comidas ?? {};
  const diasCount = menu.dias ?? 7;

  // Filas: comida → platos (orden canónico)
  const COMIDAS_ORDEN = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
  const comidasOrdenadas = COMIDAS_ORDEN
    .filter(c => c in comidasMenu)
    .map(c => [c, comidasMenu[c]]);
  const filas = comidasOrdenadas.flatMap(([comida, nPlatos]) =>
    Array.from({ length: nPlatos }, (_, i) => ({ comida, plato: i + 1, nPlatos }))
  );

  // Columnas: días 1..N
  const dias = Array.from({ length: diasCount }, (_, i) => i + 1);

  // Progreso: total = total_platos (fuente única ya calculada por el backend;
  // 0 en menús viejos con comidas:null → barra a 0%, sin NaN). completados =
  // solo los slots que mapean a una celda real de la cuadrícula visible, para
  // que el contador "X/Y" cuadre siempre con las celdas rellenas.
  const totalSlots = Number(menu.total_platos) || 0;
  const celdasValidas = new Set();
  filas.forEach(({ comida, plato }) =>
    dias.forEach((dia) => celdasValidas.add(`${dia}|${comida}|${plato}`))
  );
  const celdasLlenas = new Set();
  for (const s of slots) {
    const key = `${s.dia}|${s.comida}|${s.plato}`;
    if (celdasValidas.has(key)) celdasLlenas.add(key);
  }
  const completados = celdasLlenas.size;

  const slotLabel = activeSlot
    ? (activeSlot.nPlatos > 1
        ? t("menus.weekly.slotLabelDish", { dia: activeSlot.dia, comida: t(`comidas.${activeSlot.comida}`, activeSlot.comida), plato: activeSlot.plato })
        : t("menus.weekly.slotLabel", { dia: activeSlot.dia, comida: t(`comidas.${activeSlot.comida}`, activeSlot.comida) }))
    : "";

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate("/my-menus")}
            className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-1"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t("menus.weekly.myMenus")}
          </button>
          <h1 className="text-xl font-bold text-brand-navy">{menu.nombre}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("menus.weekly.summary", { dias: diasCount, personas: menu.personas ?? 1 })}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="text-right">
          <p className="text-sm font-semibold text-brand-navy">
            {t("menus.weekly.progress", { done: completados, total: totalSlots })}
          </p>
          <div className="w-32 h-2 rounded-full bg-gray-100 mt-1 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-green transition-all"
              style={{
                width: totalSlots > 0 ? `${(completados / totalSlots) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => navigate(`/my-menus/${id}/shopping-list`)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-brand-navy hover:bg-gray-50 transition-colors"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {t("menus.weekly.shoppingList")}
        </button>
        <button
          onClick={() => navigate(`/my-menus/${id}/edit`)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-brand-navy hover:bg-gray-50 transition-colors"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          {t("menus.weekly.editMenu")}
        </button>
      </div>

      {/* Tabla semanal — scroll horizontal en móvil */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 w-24 min-w-[96px] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                {t("menus.weekly.mealCol")}
              </th>
              {dias.map((d) => (
                <th
                  key={d}
                  className="min-w-[120px] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100"
                >
                  {t("menus.weekly.day", { n: d })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map(({ comida, plato, nPlatos }, rowIdx) => (
              <tr
                key={`${comida}-${plato}`}
                className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                {/* Columna de etiqueta */}
                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-brand-navy">
                    {t(`comidas.${comida}`, comida)}
                  </p>
                  {nPlatos > 1 && (
                    <p className="text-xs text-gray-400">{t("menus.weekly.dish", { n: plato })}</p>
                  )}
                </td>

                {/* Celdas por día */}
                {dias.map((dia) => {
                  const slot = findSlot(dia, comida, plato);
                  return (
                    <td key={dia} className="px-2 py-2 border-b border-gray-100">
                      <SlotCell
                        slot={slot}
                        onAdd={() => handleOpenPicker(dia, comida, plato)}
                        onRemove={handleRemoveSlot}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        {t("menus.weekly.hint")}
      </p>

      {/* RecipePicker slide-over */}
      <RecipePicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setActiveSlot(null);
        }}
        onSelect={handleSelectRecipe}
        slotLabel={slotLabel}
      />
    </div>
  );
}
