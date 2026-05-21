import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useRecipes(endpoint = "/recipes") {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        // El backend pagina /recipes (15 por página) y los devuelve por id ASC.
        // Pedimos la primera página, leemos meta.last_page y traemos el resto en
        // paralelo para disponer del listado completo (necesario para ordenar y
        // paginar client-side). Endpoints sin paginar —sin meta— caen a
        // lastPage = 1 y solo usan la primera respuesta.
        const first = await api.get(`${endpoint}?page=1`);
        const firstData = first.data?.data ?? first.data;
        const lastPage = first.data?.meta?.last_page ?? 1;
        const accumulated = Array.isArray(firstData) ? [...firstData] : [];
        if (lastPage > 1) {
          const rest = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, i) =>
              api.get(`${endpoint}?page=${i + 2}`)
            )
          );
          rest.forEach((r) => {
            const d = r.data?.data ?? r.data;
            if (Array.isArray(d)) accumulated.push(...d);
          });
        }
        setRecipes(accumulated);
      } catch {
        setError("No se pudieron cargar las recetas.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [endpoint]);

  return { recipes, loading, error };
}
