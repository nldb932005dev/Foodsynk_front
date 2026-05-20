import { useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TwoFactorChallenge() {
  const { token, setToken, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const pendingToken = location.state?.pendingToken ?? null;
  const email = location.state?.email ?? null;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (token) return <Navigate to="/home" replace />;
  // Sin token pendiente no hay nada que verificar (recarga directa de la URL).
  if (!pendingToken) return <Navigate to="/login" replace />;

  const canSubmit = !loading && code.length === 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/2fa/challenge", {
        pending_2fa_token: pendingToken,
        code,
      });

      setToken(res.data.token);
      setUser(res.data.user);
      navigate("/home");
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.errors?.code?.[0];
      if (status === 422) {
        setError(backendMsg ?? t("twoFactor.errInvalidCode"));
      } else if (status === 429) {
        setError(t("errors.tooManyAttempts"));
      } else {
        setError(t("twoFactor.errChallenge"));
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
              {t("twoFactor.challengeTitle")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("twoFactor.challengeSubtitle")}
              {email ? ` (${email})` : ""}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-brand-navy">
              {t("twoFactor.codeLabel")}
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-center text-lg tracking-[0.5em] text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
              />
            </label>

            <button
              className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-brand-disabled"
              disabled={!canSubmit}
            >
              {loading
                ? t("twoFactor.challengeSubmitting")
                : t("twoFactor.challengeSubmit")}
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

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link
              to="/login"
              className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
            >
              {t("twoFactor.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
