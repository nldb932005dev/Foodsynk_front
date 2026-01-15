import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Home() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get("/recipes");

      // Si /recipes viene paginado (Laravel):
      setRecipes(res.data.data);

      // Si alguna vez viniera sin paginar, podrías usar:
      // const payload = res.data;
      // setRecipes(Array.isArray(payload) ? payload : payload.data ?? []);
    }

    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Todas las recetas</h1>

      {recipes.length === 0 && <p>No hay recetas todavía</p>}

      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id} style={{ marginBottom: 16 }}>
            <strong>{recipe.titulo}</strong>

            {recipe.foto && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={recipe.foto}
                  alt={recipe.titulo}
                  style={{ width: 220, height: 140, objectFit: "cover", borderRadius: 8 }}
                />
              </div>
            )}

            <div style={{ marginTop: 8, whiteSpace: "pre-line" }}>
              {recipe.pasos}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
