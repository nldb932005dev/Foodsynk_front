import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import UserBadge from "./UserBadge";

export default function Navbar({ isAuthenticated = false, user = null, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function navigateTo(path) {
    navigate(path);
    setOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Barra superior fija */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Boton hamburguesa — solo autenticado */}
          {isAuthenticated && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-brand-navy hover:bg-brand-cream transition-colors"
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-brand-navy">
            Food<span className="text-brand-coral">Synk</span>
          </Link>
        </div>

        {/* Zona derecha — condicional */}
        {isAuthenticated ? (
          <UserBadge user={user} onLogout={onLogout} />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-cream transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-brand-green px-3 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}
      </header>

      {/* Overlay oscuro — solo autenticado */}
      {isAuthenticated && open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar lateral — solo autenticado */}
      {isAuthenticated && (
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-brand-navy shadow-2xl transform transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Cabecera sidebar */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <span className="text-xl font-bold text-white">
              Food<span className="text-brand-coral">Synk</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Enlaces de navegacion */}
          <nav className="mt-4 px-3 space-y-1">
            <button
              onClick={() => navigateTo("/home")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive("/home")
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Home
            </button>

            <button
              onClick={() => navigateTo("/my-recipes")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive("/my-recipes")
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Mis Recetas
            </button>

            <button
              onClick={() => navigateTo("/my-recipes/create")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive("/my-recipes/create")
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva Receta
            </button>

            <button
              onClick={() => navigateTo("/my-favorites")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive("/my-favorites")
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Mis Favoritos
            </button>

            <button
              onClick={() => navigateTo("/my-menus")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname.startsWith("/my-menus")
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
              Mis Menús
            </button>
          </nav>

          {/* Zona de usuario + cerrar sesion en sidebar (parte inferior) */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
            {/* Identidad del usuario */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div
                className="h-8 w-8 rounded-full bg-brand-green-light/20 flex items-center justify-center text-sm font-semibold text-brand-green-light flex-shrink-0"
                title={user?.name || "Usuario"}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-white/80 truncate">
                {user?.name || "Usuario"}
              </span>
            </div>

            {/* Boton logout */}
            <div className="px-3 pb-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-coral hover:bg-brand-coral/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Cerrar sesion
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
