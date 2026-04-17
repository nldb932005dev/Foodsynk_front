import { useState, useEffect, useMemo } from "react";
import { api } from "../api/axios";

const ALLERGEN_KEYWORDS = {
  gluten:       ["trigo", "harina", "pan", "centeno", "cebada", "espelta", "avena", "pasta", "sémola", "gluten"],
  lacteos:      ["leche", "queso", "mantequilla", "nata", "yogur", "crema", "lactosa", "caseína"],
  huevo:        ["huevo", "yema", "clara"],
  pescado:      ["salmón", "atún", "bacalao", "merluza", "sardina", "anchoa", "trucha", "pescado"],
  marisco:      ["gambas", "langostino", "cangrejo", "mejillón", "ostra", "langosta", "bogavante", "marisco"],
  frutos_secos: ["almendra", "nuez", "avellana", "piñón", "pistacio", "anacardo", "macadamia"],
  cacahuetes:   ["cacahuete", "maní"],
  soja:         ["soja", "tofu", "tempeh", "miso", "edamame"],
  sesamo:       ["sésamo", "tahini", "ajonjolí"],
  mostaza:      ["mostaza"],
  apio:         ["apio"],
  altramuces:   ["altramuz"],
  moluscos:     ["sepia", "calamar", "pulpo", "caracol"],
  sulfitos:     ["vino", "sulfito", "dióxido de azufre"],
};

export const TIME_SLIDER_MAX = 120;

export default function useRecipeSearch() {
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [timeMin, setTimeMin] = useState(0);
  const [timeMax, setTimeMax] = useState(TIME_SLIDER_MAX);
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/recipes");
        const data = res.data?.data ?? res.data;
        setAllRecipes(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar las recetas.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const tags = useMemo(() => {
    const set = new Set();
    allRecipes.forEach((r) => (r.categories ?? []).forEach((c) => set.add(c.name)));
    return [...set].sort();
  }, [allRecipes]);

  const filtered = useMemo(() => {
    let result = allRecipes;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.titulo ?? "").toLowerCase().includes(q) ||
          (r.pasos ?? "").toLowerCase().includes(q)
      );
    }

    if (activeTag) {
      result = result.filter((r) => (r.categories ?? []).some((c) => c.name === activeTag));
    }

    if (timeMin > 0 || timeMax < TIME_SLIDER_MAX) {
      result = result.filter((r) => {
        if (r.time == null) return true;
        if (timeMax >= TIME_SLIDER_MAX) return r.time >= timeMin;
        return r.time >= timeMin && r.time <= timeMax;
      });
    }

    if (selectedAllergens.length > 0) {
      result = result.filter((r) => {
        const ings = (r.ingredients ?? []).map((i) =>
          (i.nombre ?? i.name ?? "").toLowerCase()
        );
        if (ings.length === 0) return true;
        return !selectedAllergens.some((allergen) => {
          const kws = ALLERGEN_KEYWORDS[allergen] ?? [allergen];
          return ings.some((ing) => kws.some((kw) => ing.includes(kw)));
        });
      });
    }

    return result;
  }, [allRecipes, debouncedQuery, activeTag, timeMin, timeMax, selectedAllergens]);

  function toggleAllergen(id) {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function resetFilters() {
    setActiveTag(null);
    setTimeMin(0);
    setTimeMax(TIME_SLIDER_MAX);
    setSelectedAllergens([]);
    setQuery("");
  }

  const activeFiltersCount =
    (activeTag !== null ? 1 : 0) +
    (timeMin > 0 || timeMax < TIME_SLIDER_MAX ? 1 : 0) +
    selectedAllergens.length;

  const isFiltering = query.trim() !== "" || activeFiltersCount > 0;

  return {
    filtered,
    loading,
    error,
    query,
    setQuery,
    tags,
    activeTag,
    setActiveTag,
    timeMin,
    setTimeMin,
    timeMax,
    setTimeMax,
    selectedAllergens,
    toggleAllergen,
    resetFilters,
    isFiltering,
    activeFiltersCount,
  };
}
