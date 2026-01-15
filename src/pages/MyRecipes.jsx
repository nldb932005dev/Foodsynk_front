import { useEffect, useState } from "react";
import { api } from "../api/axios";
import "./MyRecipes.module.css";

export default function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/my-recipes");

        // Si tu API es paginada (Laravel Resource/Pagination)
        const data = res.data?.data ?? res.data;

        setRecipes(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar tus recetas.");
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  return (
    <div className="my-recipes">
      <h1 className="my-recipes__title">Mis recetas</h1>

      {loading && <p className="my-recipes__info">Cargando...</p>}

      {!loading && error && <p className="my-recipes__error">{error}</p>}

      {!loading && !error && recipes.length === 0 && (
        <p className="my-recipes__info">No tienes recetas todavía.</p>
      )}

      <ul className="my-recipes__list">
        {recipes.map((recipe) => (
          <li className="my-recipes__item" key={recipe.id}>
            <div className="my-recipes__card">
              {recipe.foto && (
                <img
                  className="my-recipes__img"
                  src={recipe.foto}
                  alt={recipe.titulo ?? "Receta"}
                  loading="lazy"
                />
              )}

              <div className="my-recipes__content">
                <h2 className="my-recipes__recipe-title">
                  {recipe.titulo ?? "Sin título"}
                </h2>

                {recipe.pasos && (
                  <p className="my-recipes__steps">
                    {String(recipe.pasos).slice(0, 140)}
                    {String(recipe.pasos).length > 140 ? "..." : ""}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
