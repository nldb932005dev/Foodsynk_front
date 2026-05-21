import { useState, useRef } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Turnstile from "../components/Turnstile";
import { getFingerprint } from "../utils/fingerprint";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function Register() {
  const { token, setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [tsToken, setTsToken] = useState("");
  const [tsResetKey, setTsResetKey] = useState(0);
  const [hp, setHp] = useState("");
  const mountedAt = useRef(Date.now());

  if (token) return <Navigate to="/home" replace />;

  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const nameError =
    touched.name && trimmedName.length < 2
      ? t("validation.nameMin")
      : "";
  const emailError =
    touched.email && !emailRegex.test(normalizedEmail)
      ? t("validation.emailInvalid")
      : "";
  const passwordError =
    touched.password && password.length < 6
      ? t("validation.passwordMin")
      : "";
  const passwordConfirmError =
    touched.passwordConfirm && password !== passwordConfirm
      ? t("validation.passwordsMismatch")
      : "";

  const canSubmit =
    !loading &&
    !!tsToken &&
    trimmedName.length >= 2 &&
    emailRegex.test(normalizedEmail) &&
    password.length >= 6 &&
    password === passwordConfirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fingerprint = await getFingerprint();
      const res = await api.post("/register", {
        name: trimmedName,
        email: normalizedEmail,
        password,
        password_confirmation: passwordConfirm,
        "cf-turnstile-response": tsToken,
        website: hp,
        _elapsed_ms: Date.now() - mountedAt.current,
        fingerprint,
      });

      setToken(res.data.token);
      setUser(res.data.user);
      navigate("/home");
    } catch (err) {
      // El token de Turnstile es de un solo uso: forzar resolver de nuevo.
      setTsToken("");
      setTsResetKey((k) => k + 1);
      const status = err?.response?.status;
      if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const pwdErrors = errors.password;
          const firstPwdError = Array.isArray(pwdErrors) ? pwdErrors[0] : pwdErrors;
          if (
            typeof firstPwdError === "string" &&
            firstPwdError.toLowerCase().includes("filtraci")
          ) {
            setError(t("errors.passwordPwnedFriendly"));
          } else {
            const firstError = Object.values(errors)[0];
            setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
          }
        } else {
          setError(t("errors.registerData"));
        }
      } else if (status === 429) {
        setError(t("errors.tooManyAttempts"));
      } else {
        setError(t("errors.registerGeneric"));
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
        <div className="order-2 md:order-1">
          <div className="rounded-3xl border border-brand-green-light/50 bg-white p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                {t("auth.brandEyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                {t("auth.register.title")}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {t("auth.register.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.register.name")}
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
                {nameError && (
                  <span className="mt-2 block text-xs text-brand-error">
                    {nameError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.register.email")}
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                  <span className="mt-2 block text-xs text-brand-error">
                    {emailError}
                  </span>
                )}
              </label>

              <div className="rounded-lg border border-brand-green-light/50 bg-brand-cream/40 px-3 py-2 text-xs text-brand-navy">
                <p className="font-semibold mb-1">{t("auth.register.passwordHelp.title")}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t("auth.register.passwordHelp.rule1")}</li>
                  <li>{t("auth.register.passwordHelp.rule2")}</li>
                  <li>{t("auth.register.passwordHelp.rule3")}</li>
                  <li>{t("auth.register.passwordHelp.rule4")}</li>
                  <li>{t("auth.register.passwordHelp.rule5")}</li>
                </ul>
              </div>

              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.register.password")}
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                  <span className="mt-2 block text-xs text-brand-error">
                    {passwordError}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.register.passwordConfirm")}
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                  <span className="mt-2 block text-xs text-brand-error">
                    {passwordConfirmError}
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
                {loading ? t("auth.register.submitting") : t("auth.register.submit")}
              </button>

              {error && (
                <div role="alert" className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
                  {error}
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.register.haveAccount")}{" "}
              <Link
                to="/login"
                className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
              >
                {t("auth.register.loginLink")}
              </Link>
            </p>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-brand-green-light/50 bg-gradient-to-br from-brand-green-light/30 via-brand-cream to-brand-green-light/20 p-8 shadow-xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-green-light/40 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl" />
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                {t("auth.register.infoEyebrow")}
              </p>
              <h2 className="text-2xl font-semibold text-brand-navy">
                {t("auth.register.infoTitle")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("auth.register.infoText")}
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-brand-navy">
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.recipes")}</p>
                  <p className="text-gray-500">{t("auth.features.recipesSave")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.lists")}</p>
                  <p className="text-gray-500">{t("auth.features.listsNeeded")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.menus")}</p>
                  <p className="text-gray-500">{t("auth.features.menusWeek")}</p>
                </div>
                <div className="rounded-xl border border-brand-green-light/50 bg-white/70 px-3 py-3">
                  <p className="font-semibold text-brand-green">{t("auth.features.free")}</p>
                  <p className="text-gray-500">{t("auth.features.freeText")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
