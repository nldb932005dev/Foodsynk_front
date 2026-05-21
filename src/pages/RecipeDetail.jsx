import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Receta
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Like / favorito
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // Comentarios
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // â”€â”€ Carga inicial de la receta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/recipes/${id}`);
        const data = res.data?.data ?? res.data;
        setRecipe(data);
        setLiked(data.user_liked ?? false);
        setFavorited(data.user_favorited ?? false);
        setLikesCount(data.likes_count ?? 0);
      } catch {
        setError(t("errors.loadRecipe"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // â”€â”€ Carga de comentarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    async function loadComments() {
      try {
        setCommentsLoading(true);
        const res = await api.get(`/recipes/${id}/comments`);
        const data = res.data?.data ?? res.data;
        setComments(Array.isArray(data) ? data : []);
      } catch {
        // comentarios son no-crÃ­ticos, silencioso
      } finally {
        setCommentsLoading(false);
      }
    }
    loadComments();
  }, [id]);

  // â”€â”€ Like â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function toggleLike() {
    if (!user || loadingLike) return;
    setLoadingLike(true);
    try {
      if (liked) {
        const res = await api.delete(`/recipes/${id}/like`);
        setLiked(false);
        // El backend devuelve el contador real; fallback optimista si no.
        setLikesCount(res.data?.likes_count ?? Math.max(0, likesCount - 1));
      } else {
        const res = await api.post(`/recipes/${id}/like`);
        setLiked(true);
        setLikesCount(res.data?.likes_count ?? likesCount + 1);
      }
    } catch {
      // silencioso â€” el contador vuelve al estado correcto en el prÃ³ximo load
    } finally {
      setLoadingLike(false);
    }
  }

  // â”€â”€ Favorito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function toggleFavorite() {
    if (!user || loadingFav) return;
    setLoadingFav(true);
    try {
      if (favorited) {
        await api.delete(`/recipes/${id}/favorite`);
        setFavorited(false);
      } else {
        await api.post(`/recipes/${id}/favorite`);
        setFavorited(true);
      }
    } catch {
      // No interrumpir la experiencia si falla la sincronizacion optimista.
    } finally {
      setLoadingFav(false);
    }
  }

  // â”€â”€ Comentarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || postingComment) return;
    setPostingComment(true);
    setCommentError("");
    try {
      const res = await api.post(`/recipes/${id}/comments`, { body: newComment.trim() });
      const comment = res.data?.data ?? res.data;
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } catch {
      setCommentError(t("errors.postComment"));
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    setDeleteError("");
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) setDeleteError(t("errors.deleteCommentForbidden"));
      else if (status === 404) setDeleteError(t("errors.deleteCommentNotFound"));
      else setDeleteError(t("errors.deleteCommentGeneric"));
    }
  }

  // â”€â”€ Estados de carga / error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("common.back")}
        </button>
        <div className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
          {error || t("recipes.detail.notFound")}
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === recipe.user_id;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cabecera: volver + editar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-brand-green-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("common.back")}
        </button>

        {isOwner && (
          <button
            onClick={() => navigate(`/my-recipes/${recipe.id}/edit`)}
            className="flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            {t("recipes.detail.editRecipe")}
          </button>
        )}
      </div>

      {/* Card principal */}
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Imagen */}
        {recipe.foto ? (
          <img src={recipe.foto} alt={recipe.titulo} className="w-full h-64 sm:h-80 object-cover" />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-brand-green-light/20 flex items-center justify-center">
            <svg className="w-20 h-20 text-brand-green/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
            </svg>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            {recipe.titulo ?? t("recipes.detail.noTitle")}
          </h1>

          {/* Like + favorito */}
          <div className="flex items-center gap-3 mt-4">
            {/* Contador de likes â€” siempre visible */}
            <button
              onClick={toggleLike}
              disabled={!user || loadingLike}
              title={user ? (liked ? t("recipes.detail.removeLike") : t("recipes.detail.addLike")) : t("recipes.detail.loginToLike")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                liked
                  ? "bg-brand-coral/10 text-brand-coral"
                  : "bg-gray-100 text-gray-500 hover:bg-brand-coral/10 hover:text-brand-coral"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {likesCount}
            </button>

            {/* Favorito â€” solo autenticados */}
            {user && (
              <button
                onClick={toggleFavorite}
                disabled={loadingFav}
                title={favorited ? t("recipes.detail.removeFavorite") : t("recipes.detail.addFavorite")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  favorited
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-gray-100 text-gray-500 hover:bg-brand-green/10 hover:text-brand-green"
                } disabled:opacity-50`}
              >
                <svg className="w-4 h-4" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {favorited ? t("recipes.detail.saved") : t("recipes.detail.saveBtn")}
              </button>
            )}
          </div>

          {/* Tiempo y etiquetas */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {recipe.time && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recipe.time}
              </div>
            )}
            {recipe.categories?.map((cat) => (
              <span key={cat.id} className="text-xs bg-brand-green-light/40 text-brand-green-dark px-3 py-1 rounded-full font-medium">
                {cat.name}
              </span>
            ))}
          </div>

          {/* Ingredientes */}
          {recipe.ingredients?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-brand-navy mb-3">{t("recipes.detail.ingredients")}</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-green flex-shrink-0" />
                    {(() => {
                      const nombre = typeof ing === "string" ? ing : ing.nombre ?? ing.name;
                      const cantidad = ing.pivot?.cantidad;
                      const unidad = ing.pivot?.unidad_medida;
                      if (cantidad) return t("recipes.detail.ingredientOf", { quantity: cantidad, unit: unidad ? " " + unidad : "", name: nombre });
                      return nombre;
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pasos */}
          {recipe.pasos && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-brand-navy mb-3">{t("recipes.detail.preparation")}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                {recipe.pasos}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* SecciÃ³n de comentarios */}
      <section className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">{t("recipes.detail.comments")}</h2>

        {/* Formulario â€” solo autenticados */}
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("recipes.detail.commentPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 resize-none transition-colors"
            />
            {commentError && (
              <p className="mt-1 text-xs text-brand-error">{commentError}</p>
            )}
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postingComment ? t("recipes.detail.publishingComment") : t("recipes.detail.publishComment")}
              </button>
            </div>
          </form>
        )}

        {/* Lista de comentarios */}
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green-light border-t-brand-green" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {user ? t("recipes.detail.beFirst") : t("recipes.detail.noComments")}
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-brand-green-light/40 flex items-center justify-center text-xs font-semibold text-brand-green-dark flex-shrink-0">
                  {comment.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-brand-navy">
                      {comment.user?.name ?? t("nav.user")}
                    </span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-400 hover:text-brand-coral transition-colors flex-shrink-0"
                        title={t("recipes.detail.deleteComment")}
                      >
                        {t("recipes.detail.deleteCommentBtn")}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {deleteError && (
          <p role="alert" className="mt-4 text-sm text-brand-error">
            {deleteError}
          </p>
        )}

        {/* CTA para no autenticados */}
        {!user && (
          <p className="mt-4 text-center text-sm text-gray-500">
            <button onClick={() => navigate("/login")} className="text-brand-green font-medium hover:underline">
              {t("auth.register.loginLink")}
            </button>{" "}
            {t("recipes.detail.loginToComment")}
          </p>
        )}
      </section>
    </div>
  );
}

