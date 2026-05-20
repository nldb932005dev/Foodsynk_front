import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function UserBadge({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { t } = useTranslation();

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const fullName = user?.name || t("nav.user");

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Boton: inicial con tooltip */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 w-9 rounded-full bg-brand-green-light/40 flex items-center justify-center text-sm font-semibold text-brand-green-dark hover:bg-brand-green-light/60 transition-colors cursor-pointer"
        title={fullName}
        aria-label={t("nav.userMenu", { name: fullName })}
      >
        {user?.name ? (
          initial
        ) : (
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-gray-200 shadow-lg py-2 animate-fade-in z-50">
          {/* Nombre del usuario */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-brand-navy truncate">
              {fullName}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            )}
          </div>

          {/* Mi cuenta */}
          <Link
            to="/mi-cuenta"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-navy hover:bg-gray-50 transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {t("nav.account")}
          </Link>

          {/* Boton logout */}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-coral hover:bg-brand-coral/5 transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
