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
  const [activeTags, setActiveTags] = useState([]);
  const [timeMin, setTimeMin] = useState(0);
  const [timeMax, setTimeMax] = useState(TIME_SLIDER_MAX);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "popular"

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        setError("");
        // El backend pagina /api/recipes (15 por página). Pedimos la primera,
        // leemos meta.last_page y disparamos el resto en paralelo. Necesario
        // hasta que el backend exponga ?per_page=999 o devuelva todo sin paginar.
        const first = await api.get("/recipes?page=1");
        const firstData = first.data?.data ?? first.data;
        const lastPage = first.data?.meta?.last_page ?? 1;
        const accumulated = Array.isArray(firstData) ? [...firstData] : [];
        if (lastPage > 1) {
          const rest = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, i) =>
              api.get(`/recipes?page=${i + 2}`)
            )
          );
          rest.forEach((r) => {
            const d = r.data?.data ?? r.data;
            if (Array.isArray(d)) accumulated.push(...d);
          });
        }
        // Workaround: el backend ordena por id ASC, lo que entierra las recetas
        // nuevas al final. Ordenamos client-side por id DESC mientras el backend
        // no aplique orderByDesc('created_at').
        accumulated.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setAllRecipes(accumulated);
      } catch {
        setError("No se pudieron cargar las recetas.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
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

    if (activeTags.length > 0) {
      // AND/intersección: la receta debe cumplir TODAS las categorías seleccionadas.
      result = result.filter((r) => {
        const names = (r.categories ?? []).map((c) => c.name);
        return activeTags.every((t) => names.includes(t));
      });
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

    // Orden: "recent" mantiene el id DESC del load; "popular" reordena por
    // likes_count (copia, para no mutar allRecipes ni el resultado filtrado).
    if (sortBy === "popular") {
      result = [...result].sort(
        (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)
      );
    }

    return result;
  }, [allRecipes, debouncedQuery, activeTags, timeMin, timeMax, selectedAllergens, sortBy]);

  function toggleAllergen(id) {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function toggleTag(name) {
    setActiveTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  function clearTags() {
    setActiveTags([]);
  }

  function resetFilters() {
    setActiveTags([]);
    setTimeMin(0);
    setTimeMax(TIME_SLIDER_MAX);
    setSelectedAllergens([]);
    setQuery("");
  }

  const activeFiltersCount =
    activeTags.length +
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
    activeTags,
    toggleTag,
    clearTags,
    timeMin,
    setTimeMin,
    timeMax,
    setTimeMax,
    selectedAllergens,
    toggleAllergen,
    resetFilters,
    isFiltering,
    activeFiltersCount,
    sortBy,
    setSortBy,
  };
}
