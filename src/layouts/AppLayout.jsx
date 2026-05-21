import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

// Email de contacto del autor para el mailto del footer.
// Cambia esta constante si quieres redirigir a otra dirección.
const CONTACT_EMAIL = "nurlopbor09@iesfidiana.es";

export default function AppLayout() {
  const { token, user, setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAuthenticated = !!token;

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

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <footer className="border-t border-brand-green-light/40 bg-white/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>
            © 2026{" "}
            <span className="font-semibold text-brand-navy">Nuria López</span>{" "}
            · Foodsynk
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-green underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green rounded"
            >
              {t("footer.license")}
            </a>
            <span aria-hidden="true">·</span>
            <span>{t("footer.safeCreative")}</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                "Foodsynk — Contacto"
              )}`}
              className="hover:text-brand-green underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green rounded"
            >
              {t("footer.contact")}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
