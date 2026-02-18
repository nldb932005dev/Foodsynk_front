import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await api.post("/logout");
    } catch {
      // Error silenciado: el logout local se ejecuta igualmente
    } finally {
      setToken(null);
      setUser(null);
      navigate("/", { replace: true });
    }
  }

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
          {/* Boton hamburguesa */}
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-brand-navy hover:bg-brand-cream transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo */}
          <span className="text-xl font-bold text-brand-navy">
            Food<span className="text-brand-coral">Synk</span>
          </span>
        </div>

        {/* Boton cerrar sesion - siempre visible */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-brand-coral/10 px-3 py-2 text-sm font-medium text-brand-coral hover:bg-brand-coral/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="hidden sm:inline">Cerrar sesion</span>
        </button>
      </header>

      {/* Overlay oscuro */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar lateral */}
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
        </nav>

        {/* Cerrar sesion en sidebar (parte inferior) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-coral hover:bg-brand-coral/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
