import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function AppLayout() {
  const { token, user, setToken, setUser } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-brand-cream">
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
