import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getFingerprint } from "../utils/fingerprint";

export default function ResetPassword() {
  // El enlace del correo apunta a /password-reset/{token}?email={email}:
  // token en la ruta, email en el query string.
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [touched, setTouched] = useState({
    password: false,
    passwordConfirm: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);

  // Sin token o sin email el enlace está incompleto: no hay nada que validar.
  const showInvalid = !token || !email || linkInvalid;

  // Tras el éxito, dejamos ver el mensaje un momento y vamos a /login.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(id);
  }, [done, navigate]);

  const passwordError =
    touched.password && password.length < 6
      ? t("validation.passwordMin")
      : "";
  const passwordConfirmError =
    touched.passwordConfirm && password !== passwordConfirm
      ? t("validation.passwordsMismatch")
      : "";

  const canSubmit =
    !loading && password.length >= 6 && password === passwordConfirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fingerprint = await getFingerprint();
      // baseURL ya incluye /api: la ruta va sin prefijo /api (gotcha del repo).
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
        fingerprint,
      });
      setDone(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (errors?.email) {
          // 422 con errors.email = token inválido o caducado (caduca a 30 min).
          setLinkInvalid(true);
        } else if (errors?.password) {
          // Mismo patrón que F-AUTH-FIX.2 en Register.jsx: la regla
          // uncompromised() del backend rechaza contraseñas filtradas con un
          // texto alarmante; si lo detectamos, lo sustituimos por uno amable.
          const pwdErrors = errors.password;
          const firstPwdError = Array.isArray(pwdErrors)
            ? pwdErrors[0]
            : pwdErrors;
          if (
            typeof firstPwdError === "string" &&
            firstPwdError.toLowerCase().includes("filtraci")
          ) {
            setError(t("errors.passwordPwnedFriendly"));
          } else {
            setError(firstPwdError || t("errors.formData"));
          }
        } else {
          setError(t("errors.formData"));
        }
      } else if (status === 429) {
        setError(t("errors.tooManyAttempts"));
      } else {
        setError(t("auth.resetPassword.errorGeneric"));
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
          {showInvalid ? (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                  {t("auth.brandEyebrow")}
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                  {t("auth.resetPassword.invalidTitle")}
                </h1>
              </div>
              <div
                role="alert"
                className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
              >
                {t("auth.resetPassword.invalidLink")}
              </div>
              <p className="mt-6 text-center text-sm text-gray-500">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
                >
                  {t("auth.resetPassword.requestNewLink")}
                </Link>
              </p>
            </>
          ) : done ? (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                  {t("auth.brandEyebrow")}
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                  {t("auth.resetPassword.successTitle")}
                </h1>
              </div>
              <div
                role="status"
                className="rounded-xl border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm text-brand-success"
              >
                {t("auth.resetPassword.success")}
              </div>
              <p className="mt-6 text-center text-sm text-gray-500">
                <Link
                  to="/login"
                  className="font-semibold text-brand-green hover:text-brand-green-dark transition-colors underline underline-offset-2"
                >
                  {t("auth.resetPassword.goToLogin")}
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-green">
                  {t("auth.brandEyebrow")}
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-brand-navy">
                  {t("auth.resetPassword.title")}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t("auth.resetPassword.subtitle")}
                  {email ? ` (${email})` : ""}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg border border-brand-green-light/50 bg-brand-cream/40 px-3 py-2 text-xs text-brand-navy">
                  <p className="font-semibold mb-1">
                    {t("auth.register.passwordHelp.title")}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>{t("auth.register.passwordHelp.rule1")}</li>
                    <li>{t("auth.register.passwordHelp.rule2")}</li>
                    <li>{t("auth.register.passwordHelp.rule3")}</li>
                    <li>{t("auth.register.passwordHelp.rule4")}</li>
                    <li>{t("auth.register.passwordHelp.rule5")}</li>
                  </ul>
                </div>

                <label className="block text-sm font-medium text-brand-navy">
                  {t("auth.resetPassword.newPassword")}
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, password: true }))
                    }
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={72}
                    autoFocus
                    required
                  />
                  {passwordError && (
                    <span className="mt-2 block text-xs text-brand-error">
                      {passwordError}
                    </span>
                  )}
                </label>

                <label className="block text-sm font-medium text-brand-navy">
                  {t("auth.resetPassword.confirmPassword")}
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-brand-cream/50 px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, passwordConfirm: true }))
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

                <button
                  className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-brand-disabled"
                  disabled={!canSubmit}
                >
                  {loading
                    ? t("auth.resetPassword.submitting")
                    : t("auth.resetPassword.submit")}
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
                  {t("auth.resetPassword.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
