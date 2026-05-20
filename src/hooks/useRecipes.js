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
        const res = await api.get(endpoint);
        const data = res.data?.data ?? res.data;
        setRecipes(Array.isArray(data) ? data : []);
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
