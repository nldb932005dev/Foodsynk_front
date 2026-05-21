import { useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getFingerprint } from "../utils/fingerprint";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function ForgotPassword() {
  const { token, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  if (authLoading) return null;
  if (token) return <Navigate to="/home" replace />;

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    touched && !emailRegex.test(normalizedEmail)
      ? t("validation.emailInvalid")
      : "";

  const canSubmit = !loading && emailRegex.test(normalizedEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fingerprint = await getFingerprint();
      // baseURL ya incluye /api: la ruta va sin prefijo /api (gotcha del repo).
      // /forgot-password no lleva middleware turnstile: aquí no hay widget.
      await api.post("/forgot-password", {
        email: normalizedEmail,
        fingerprint,
      });
      setSent(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        // El backend responde 422 con errors.email tanto si el email no
        // existe como si se supera el throttle (3/min). Mostramos el
        // mensaje del backend tal cual.
        const emailErrors = err?.response?.data?.errors?.email;
        const firstError = Array.isArray(emailErrors)
          ? emailErrors[0]
          : emailErrors;
        setError(firstError || t("errors.formData"));
      } else if (status === 429) {
        setError(t("errors.tooManyAttempts"));
      } else {
        setError(t("auth.forgotPassword.errorGeneric"));
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
      <div className="mx-auto max-w-md px-6 py-10">
        <div className="rounded-3xl border border-brand-green-light/50 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
              {t("auth.brandEyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
              {t("auth.forgotPassword.title")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {sent
                ? t("auth.forgotPassword.sentSubtitle")
                : t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          {sent ? (
            <div
              role="status"
              className="rounded-xl border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm text-brand-success"
            >
              {t("auth.forgotPassword.sent")}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-brand-navy">
                {t("auth.forgotPassword.email")}
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ""))}
                  onBlur={() => setTouched(true)}
                  autoComplete="email"
                  inputMode="email"
                  maxLength={120}
                  autoFocus
                  required
                />
                {emailError && (
                  <span className="mt-2 block text-xs text-brand-error">
                    {emailError}
                  </span>
                )}
              </label>

              <button
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-brand-disabled"
                disabled={!canSubmit}
              >
                {loading
                  ? t("auth.forgotPassword.submitting")
                  : t("auth.forgotPassword.submit")}
              </button>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
                >
                  {error}
                </div>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link
              to="/login"
              className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
            >
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
