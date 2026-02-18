import { useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Navigate, Link } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function Register() {
  const { token, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    passwordConfirm: false,
  });

  if (token) return <Navigate to="/home" replace />;

  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const nameError =
    touched.name && trimmedName.length < 2
      ? "El nombre debe tener al menos 2 caracteres."
      : "";
  const emailError =
    touched.email && !emailRegex.test(normalizedEmail)
      ? "Introduce un email valido."
      : "";
  const passwordError =
    touched.password && password.length < 6
      ? "La contrasena debe tener al menos 6 caracteres."
      : "";
  const passwordConfirmError =
    touched.passwordConfirm && password !== passwordConfirm
      ? "Las contrasenas no coinciden."
      : "";

  const canSubmit =
    !loading &&
    trimmedName.length >= 2 &&
    emailRegex.test(normalizedEmail) &&
    password.length >= 6 &&
    password === passwordConfirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/register", {
        name: trimmedName,
        email: normalizedEmail,
        password,
        password_confirmation: passwordConfirm,
      });

      setToken(res.data.token);
      setUser(res.data.user);
      navigate("/home");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError("Datos incorrectos. Revisa los campos e intentalo de nuevo.");
        }
      } else if (status === 429) {
        setError("Demasiados intentos. Espera un momento antes de volver a intentarlo.");
      } else {
        setError("Error al crear la cuenta. Intentalo de nuevo mas tarde.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f2ea] text-[#3f2f24]">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 md:items-center">
        <div className="order-2 md:order-1">
          <div className="rounded-3xl border border-[#d7ccb8] bg-[#fffaf2] p-8 shadow-[0_20px_60px_-40px_rgba(63,47,36,0.7)]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#5f7d5f]">
                Foodsynk
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#2f4a2f]">
                Crea tu cuenta
              </h1>
              <p className="mt-2 text-sm text-[#6b5a4b]">
                Empieza a organizar tus recetas y menus.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-[#4d3b2f]">
                Nombre
                <input
                  className="mt-2 w-full rounded-xl border border-[#d8cbb6] bg-white/70 px-4 py-3 text-sm text-[#3f2f24] placeholder:text-[#9a8a7a] outline-none transition focus:border-[#5f7d5f] focus:ring-2 focus:ring-[#5f7d5f]/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
                {nameError && (
                  <span className="mt-2 block text-xs text-[#8b5a44]">
                    {nameError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-[#4d3b2f]">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-[#d8cbb6] bg-white/70 px-4 py-3 text-sm text-[#3f2f24] placeholder:text-[#9a8a7a] outline-none transition focus:border-[#5f7d5f] focus:ring-2 focus:ring-[#5f7d5f]/20"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value.replace(/\s+/g, ""))
                  }
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  autoComplete="email"
                  inputMode="email"
                  maxLength={120}
                  required
                />
                {emailError && (
                  <span className="mt-2 block text-xs text-[#8b5a44]">
                    {emailError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-[#4d3b2f]">
                Contrasena
                <input
                  className="mt-2 w-full rounded-xl border border-[#d8cbb6] bg-white/70 px-4 py-3 text-sm text-[#3f2f24] placeholder:text-[#9a8a7a] outline-none transition focus:border-[#4d8b7b] focus:ring-2 focus:ring-[#4d8b7b]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
                {passwordError && (
                  <span className="mt-2 block text-xs text-[#8b5a44]">
                    {passwordError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-[#4d3b2f]">
                Confirmar contrasena
                <input
                  className="mt-2 w-full rounded-xl border border-[#d8cbb6] bg-white/70 px-4 py-3 text-sm text-[#3f2f24] placeholder:text-[#9a8a7a] outline-none transition focus:border-[#4d8b7b] focus:ring-2 focus:ring-[#4d8b7b]/20"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, passwordConfirm: true }))
                  }
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
                {passwordConfirmError && (
                  <span className="mt-2 block text-xs text-[#8b5a44]">
                    {passwordConfirmError}
                  </span>
                )}
              </label>

              <button
                className="w-full rounded-xl bg-[#5f7d5f] px-4 py-3 text-sm font-semibold text-[#f7f1e6] transition hover:bg-[#537153] disabled:cursor-not-allowed disabled:bg-[#b8b1a5]"
                disabled={!canSubmit}
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </button>

              {error && (
                <div className="rounded-xl border border-[#e7c7b7] bg-[#fff0e8] px-4 py-3 text-sm text-[#8b3b2f]">
                  {error}
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-[#6b5a4b]">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/"
                className="font-semibold text-[#5f7d5f] hover:text-[#2f4a2f] transition-colors underline underline-offset-2"
              >
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-[#d7ccb8] bg-gradient-to-br from-[#e6efe1] via-[#f1ebe0] to-[#d9ece7] p-8 shadow-[0_20px_60px_-45px_rgba(63,47,36,0.6)]">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#cfe2d4]/60 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#d6c2a8]/60 blur-2xl" />
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4d8b7b]">
                Empieza ahora
              </p>
              <h2 className="text-2xl font-semibold text-[#2f4a2f]">
                Tu cocina, organizada
              </h2>
              <p className="text-sm text-[#6b5a4b]">
                Crea una cuenta para guardar recetas, planificar menus semanales
                y generar listas de compra automaticamente.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-[#4d3b2f]">
                <div className="rounded-xl border border-[#d7ccb8] bg-white/70 px-3 py-3">
                  <p className="font-semibold text-[#2f5f52]">Recetas</p>
                  <p>Guarda tus favoritas.</p>
                </div>
                <div className="rounded-xl border border-[#d7ccb8] bg-white/70 px-3 py-3">
                  <p className="font-semibold text-[#2f5f52]">Listas</p>
                  <p>Compra solo lo necesario.</p>
                </div>
                <div className="rounded-xl border border-[#d7ccb8] bg-white/70 px-3 py-3">
                  <p className="font-semibold text-[#2f5f52]">Menus</p>
                  <p>Planifica tu semana.</p>
                </div>
                <div className="rounded-xl border border-[#d7ccb8] bg-white/70 px-3 py-3">
                  <p className="font-semibold text-[#2f5f52]">Gratis</p>
                  <p>Sin coste para empezar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
