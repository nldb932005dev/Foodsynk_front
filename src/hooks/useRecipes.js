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
        const pageEndpoint = (page) => {
          const separator = endpoint.includes("?") ? "&" : "?";
          return `${endpoint}${separator}page=${page}`;
        };
        const first = await api.get(pageEndpoint(1));
        const firstData = first.data?.data ?? first.data;
        const lastPage = first.data?.meta?.last_page ?? 1;
        const accumulated = Array.isArray(firstData) ? [...firstData] : [];

        if (lastPage > 1) {
          const rest = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, i) =>
              api.get(pageEndpoint(i + 2))
            )
          );
          rest.forEach((res) => {
            const data = res.data?.data ?? res.data;
            if (Array.isArray(data)) accumulated.push(...data);
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
