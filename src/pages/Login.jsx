import { useState, useRef } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Turnstile from "../components/Turnstile";
import { getFingerprint } from "../utils/fingerprint";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function Login() {
  const { token, setToken, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [tsToken, setTsToken] = useState("");
  const [tsResetKey, setTsResetKey] = useState(0);
  const [hp, setHp] = useState("");
  const mountedAt = useRef(Date.now());

  if (authLoading) return null;
  if (token) return <Navigate to="/home" replace />;

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    touched.email && !emailRegex.test(normalizedEmail)
      ? t("validation.emailInvalid")
      : "";
  const passwordError =
    touched.password && password.length < 6
      ? t("validation.passwordMin")
      : "";

  const canSubmit =
    !loading &&
    !!tsToken &&
    emailRegex.test(normalizedEmail) &&
    password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fingerprint = await getFingerprint();
      const res = await api.post("/login", {
        email: normalizedEmail,
        password,
        "cf-turnstile-response": tsToken,
        website: hp,
        _elapsed_ms: Date.now() - mountedAt.current,
        fingerprint,
      });

      // Usuario con 2FA: el backend responde 202 sin token. Vamos al paso
      // intermedio llevando el token pendiente por router state (es una
      // credencial efímera: no se guarda en sessionStorage).
      if (res.status === 202 || res.data.pending_2fa) {
        navigate("/2fa-challenge", {
          state: { pendingToken: res.data.pending_token, email: normalizedEmail },
        });
        return;
      }

      setToken(res.data.token);
      setUser(res.data.user);
      // Admin sin 2FA: entra pero se le lleva a configurarlo (sin loop).
      if (res.data.force_2fa_setup) {
        navigate("/mi-cuenta", { state: { promptTwoFactor: true } });
      } else {
        navigate("/home");
      }
    } catch (err) {
      // El token de Turnstile es de un solo uso: forzar resolver de nuevo.
      setTsToken("");
      setTsResetKey((k) => k + 1);
      const status = err?.response?.status;
      if (status === 401 || status === 422) {
        setError(t("errors.invalidCredentials"));
      } else if (status === 429) {
        setError(t("errors.tooManyAttempts"));
      } else {
        setError(t("errors.loginGeneric"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-navy">
      <header className="px-6 py-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-brand-navy">
          Food<span className="text-brand-coral">Synk</span>
        </Link>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 md:items-center">
        {/* Form panel */}
        <div className="order-2 md:order-1">
          <div className="rounded-3xl border border-brand-green-light/50 bg-white p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                {t("auth.brandEyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                {t("auth.login.title")}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {t("auth.login.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.login.email")}
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
                  <span className="mt-2 block text-xs text-brand-error">
                    {emailError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.login.password")}
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
                  <span className="mt-2 block text-xs text-brand-error">
                    {passwordError}
                  </span>
                )}
              </label>

              {/* Honeypot anti-bot: invisible para humanos, los bots lo rellenan */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px" }}
                aria-hidden="true"
              />

              <Turnstile key={tsResetKey} onToken={setTsToken} />

              <button
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-brand-disabled"
                disabled={!canSubmit}
              >
                {loading ? t("auth.login.submitting") : t("auth.login.submit")}
              </button>

              <p className="text-center text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </p>

              {error && (
                <div role="alert" className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
                  {error}
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.login.noAccount")}{" "}
              <Link
                to="/register"
                className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
              >
                {t("auth.login.registerLink")}
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
                {t("auth.login.infoEyebrow")}
              </p>
              <h2 className="text-2xl font-semibold text-brand-navy">
                {t("auth.login.infoTitle")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("auth.login.infoText")}
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-brand-navy">
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.recipes")}</p>
                  <p className="text-gray-500">{t("auth.features.recipesOrganize")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.lists")}</p>
                  <p className="text-gray-500">{t("auth.features.listsNeed")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.menus")}</p>
                  <p className="text-gray-500">{t("auth.features.menusWeek")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.time")}</p>
                  <p className="text-gray-500">{t("auth.features.timeSeconds")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
