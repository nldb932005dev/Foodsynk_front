import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserBadge from "./UserBadge";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ isAuthenticated = false, user = null, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const asideRef = useRef(null);
  const hamburgerRef = useRef(null);
  const closeRef = useRef(null);
  const wasOpen = useRef(false);

  const isActive = (path) => location.pathname === path;

  function closeSidebar() {
    setOpen(false);
  }

  // D2.5 — Focus trap + Escape + inert cuando está cerrado
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    // Inert: evita que Tab alcance los enlaces del sidebar oculto
    if (open) {
      aside.removeAttribute("inert");
    } else {
      aside.setAttribute("inert", "");
    }

    if (!open) return;

    // Mover el foco al botón de cerrar al abrir
    closeRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        closeSidebar();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = aside.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Restaurar foco al hamburger al cerrar
  useEffect(() => {
    if (wasOpen.current && !open) {
      hamburgerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  const navItemClass = (active) =>
    `w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-green text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Barra superior fija */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Boton hamburguesa — solo autenticado */}
          {isAuthenticated && (
            <button
              ref={hamburgerRef}
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-brand-navy hover:bg-brand-cream transition-colors"
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
              aria-controls="app-sidebar"
            >
              <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserBadge user={user} onLogout={onLogout} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-cream transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-brand-green px-3 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
            >
              {t("nav.register")}
            </Link>
          </div>
        )}
      </header>

      {/* Overlay oscuro — solo autenticado */}
      {isAuthenticated && open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar lateral — solo autenticado */}
      {isAuthenticated && (
        <aside
          id="app-sidebar"
          ref={asideRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.navMenu")}
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
              ref={closeRef}
              onClick={closeSidebar}
              className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={t("nav.closeMenu")}
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Enlaces de navegacion — Link en vez de button (D2.2) */}
          <nav className="mt-4 px-3 space-y-1">
            <Link to="/home" onClick={closeSidebar} className={navItemClass(isActive("/home"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {t("nav.home")}
            </Link>

            <Link to="/my-recipes" onClick={closeSidebar} className={navItemClass(isActive("/my-recipes"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {t("nav.myRecipes")}
            </Link>

            <Link to="/my-recipes/create" onClick={closeSidebar} className={navItemClass(isActive("/my-recipes/create"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t("nav.newRecipe")}
            </Link>

            <Link to="/my-favorites" onClick={closeSidebar} className={navItemClass(isActive("/my-favorites"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {t("nav.myFavorites")}
            </Link>

            <Link to="/my-menus" onClick={closeSidebar} className={navItemClass(location.pathname.startsWith("/my-menus"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
              {t("nav.myMenus")}
            </Link>

            <Link to="/notificaciones" onClick={closeSidebar} className={navItemClass(isActive("/notificaciones"))}>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {t("nav.notifications")}
            </Link>

            <div className="pt-3 mt-3 border-t border-white/10">
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Zona de usuario + cerrar sesion en sidebar (parte inferior) */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div
                className="h-8 w-8 rounded-full bg-brand-green-light/20 flex items-center justify-center text-sm font-semibold text-brand-green-light flex-shrink-0"
                title={user?.name || t("nav.user")}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : (
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-white/80 truncate">
                {user?.name || t("nav.user")}
              </span>
            </div>

            <div className="px-3 pb-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-coral hover:bg-brand-coral/10 transition-colors"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
