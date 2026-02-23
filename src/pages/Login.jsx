import { useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Navigate, Link } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function Login() {
  const { token, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  if (token) return <Navigate to="/home" replace />;

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    touched.email && !emailRegex.test(normalizedEmail)
      ? "Introduce un email valido."
      : "";
  const passwordError =
    touched.password && password.length < 6
      ? "La contrasena debe tener al menos 6 caracteres."
      : "";

  const canSubmit =
    !loading && emailRegex.test(normalizedEmail) && password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", {
        email: normalizedEmail,
        password,
      });

      setToken(res.data.token);
      setUser(res.data.user);
      navigate("/home");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 422) {
        setError("Credenciales incorrectas. Revisa tu email y contrasena.");
      } else if (status === 429) {
        setError("Demasiados intentos. Espera un momento antes de volver a intentarlo.");
      } else {
        setError("Error al iniciar sesion. Intentalo de nuevo mas tarde.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 md:items-center">
        {/* Form panel */}
        <div className="order-2 md:order-1">
          <div className="rounded-3xl border border-brand-green-light/50 bg-white p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                Foodsynk
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                Bienvenida de vuelta
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Accede a tus recetas y menus.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-brand-navy">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value.replace(/\s+/g, ""))
                  }
                  onBlur={() =>
                    setTouched((t) => ({ ...t, email: true }))
                  }
                  autoComplete="email"
                  inputMode="email"
                  maxLength={120}
                  required
                />
                {emailError && (
                  <span className="mt-2 block text-xs text-brand-coral">
                    {emailError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-brand-navy">
                Contrasena
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, password: true }))
                  }
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
                {passwordError && (
                  <span className="mt-2 block text-xs text-brand-coral">
                    {passwordError}
                  </span>
                )}
              </label>

              <button
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={!canSubmit}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-coral">
                  {error}
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
              >
                Registrate
              </Link>
            </p>
          </div>
        </div>

        {/* Info panel */}
        <div className="order-1 md:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-brand-green-light/50 bg-gradient-to-br from-brand-green-light/30 via-brand-cream to-brand-green-light/20 p-8 shadow-xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-green-light/40 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl" />
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                Planifica mejor
              </p>
              <h2 className="text-2xl font-semibold text-brand-navy">
                Menus saludables sin complicaciones
              </h2>
              <p className="text-sm text-gray-500">
                Guarda tus recetas favoritas, crea listas de compra y organiza tu
                semana en minutos.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-brand-navy">
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">Recetas</p>
                  <p className="text-gray-500">Organiza y edita tus platos.</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">Listas</p>
                  <p className="text-gray-500">Compra solo lo que necesitas.</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">Menus</p>
                  <p className="text-gray-500">Planifica tu semana.</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">Tiempo</p>
                  <p className="text-gray-500">Planifica en segundos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
