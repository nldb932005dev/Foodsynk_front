import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import ConfirmModal from "../components/ConfirmModal";

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-brand-navy mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Alert({ message, type = "error" }) {
  if (!message) return null;
  const styles =
    type === "success"
      ? "border-brand-success/30 bg-brand-success/10 text-brand-success"
      : "border-brand-error/30 bg-brand-error/10 text-brand-error";
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm mt-4 ${styles}`}>
      {message}
    </div>
  );
}

export default function MiCuenta() {
  const { user, setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // — Datos personales —
  const [perfil, setPerfil] = useState({
    name: user?.name ?? "",
    apellido: user?.apellido ?? "",
    email: user?.email ?? "",
  });
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState({ text: "", type: "error" });

  async function handlePerfil(e) {
    e.preventDefault();
    setPerfilLoading(true);
    setPerfilMsg({ text: "", type: "error" });
    try {
      const res = await api.patch("/user", perfil);
      const updated = res.data.data;
      setUser((prev) => ({ ...prev, ...updated }));
      setPerfilMsg({ text: t("account.profileSaved"), type: "success" });
    } catch (err) {
      const msgs = err.response?.data?.errors;
      const first = msgs ? Object.values(msgs)[0]?.[0] : null;
      setPerfilMsg({ text: first ?? t("errors.saveProfile"), type: "error" });
    } finally {
      setPerfilLoading(false);
    }
  }

  // — Cambiar contraseña —
  const [pwd, setPwd] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ text: "", type: "error" });

  async function handlePwd(e) {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg({ text: "", type: "error" });
    try {
      await api.post("/user/password", pwd);
      setPwd({ current_password: "", password: "", password_confirmation: "" });
      setPwdMsg({ text: t("account.passwordChanged"), type: "success" });
    } catch (err) {
      const msgs = err.response?.data?.errors;
      const first = msgs ? Object.values(msgs)[0]?.[0] : null;
      setPwdMsg({ text: first ?? t("errors.changePassword"), type: "error" });
    } finally {
      setPwdLoading(false);
    }
  }

  // — Verificación en dos pasos (2FA) —
  const twoFactorEnabled = !!user?.two_factor_enabled;
  const promptTwoFactor = !!location.state?.promptTwoFactor && !twoFactorEnabled;
  const [tfStep, setTfStep] = useState("idle"); // idle | code
  const [tfCode, setTfCode] = useState("");
  const [tfPassword, setTfPassword] = useState("");
  const [tfLoading, setTfLoading] = useState(false);
  const [tfMsg, setTfMsg] = useState({ text: "", type: "error" });

  function firstError(err, fallback) {
    const msgs = err.response?.data?.errors;
    const first = msgs ? Object.values(msgs)[0]?.[0] : null;
    return first ?? fallback;
  }

  async function handleTfEnableStart() {
    setTfLoading(true);
    setTfMsg({ text: "", type: "error" });
    try {
      await api.post("/2fa/enable");
      setTfStep("code");
      setTfMsg({ text: t("twoFactor.codeSentInfo"), type: "success" });
    } catch {
      setTfMsg({ text: t("twoFactor.errEnable"), type: "error" });
    } finally {
      setTfLoading(false);
    }
  }

  async function handleTfConfirm(e) {
    e.preventDefault();
    setTfLoading(true);
    setTfMsg({ text: "", type: "error" });
    try {
      await api.post("/2fa/confirm", { code: tfCode });
      setUser((prev) => ({ ...prev, two_factor_enabled: true }));
      setTfStep("idle");
      setTfCode("");
      setTfMsg({ text: t("twoFactor.enabledOk"), type: "success" });
    } catch (err) {
      setTfMsg({ text: firstError(err, t("twoFactor.errInvalidCode")), type: "error" });
    } finally {
      setTfLoading(false);
    }
  }

  async function handleTfDisable(e) {
    e.preventDefault();
    setTfLoading(true);
    setTfMsg({ text: "", type: "error" });
    try {
      await api.post("/2fa/disable", { password: tfPassword });
      setUser((prev) => ({ ...prev, two_factor_enabled: false }));
      setTfPassword("");
      setTfMsg({ text: t("twoFactor.disabledOk"), type: "success" });
    } catch (err) {
      setTfMsg({ text: firstError(err, t("twoFactor.errDisable")), type: "error" });
    } finally {
      setTfLoading(false);
    }
  }

  // — Exportar datos —
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState({ text: "", type: "error" });

  async function handleExport() {
    setExportLoading(true);
    setExportMsg({ text: "", type: "error" });
    try {
      const res = await api.get("/user/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datos-foodsynk-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg({ text: t("account.downloadStarted"), type: "success" });
    } catch {
      setExportMsg({ text: t("errors.exportData"), type: "error" });
    } finally {
      setExportLoading(false);
    }
  }

  // — Eliminar cuenta —
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ text: "", type: "error" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteMsg({ text: "", type: "error" });
    try {
      await api.delete("/user", { data: { password: deletePassword } });
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setToken(null);
      setUser(null);
      navigate("/");
    } catch (err) {
      const msgs = err.response?.data?.errors;
      const first = msgs ? Object.values(msgs)[0]?.[0] : null;
      setDeleteMsg({ text: first ?? t("errors.deleteAccount"), type: "error" });
      setConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-brand-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const btnCls =
    "rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <h1 className="text-2xl font-bold text-brand-navy">{t("account.title")}</h1>

      {/* 1. Datos personales */}
      <SectionCard title={t("account.personalData")}>
        <form onSubmit={handlePerfil} className="space-y-4">
          <div>
            <label className={labelCls}>{t("account.name")}</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              className={inputCls}
              value={perfil.name}
              onChange={(e) => setPerfil((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t("account.lastName")} <span className="text-gray-400 font-normal">{t("common.optional")}</span>
            </label>
            <input
              type="text"
              maxLength={100}
              className={inputCls}
              value={perfil.apellido}
              onChange={(e) => setPerfil((p) => ({ ...p, apellido: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>{t("account.email")}</label>
            <input
              type="email"
              required
              maxLength={255}
              className={inputCls}
              value={perfil.email}
              onChange={(e) => setPerfil((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={perfilLoading} className={btnCls}>
            {perfilLoading ? t("common.saving") : t("account.saveChanges")}
          </button>
          <Alert message={perfilMsg.text} type={perfilMsg.type} />
        </form>
      </SectionCard>

      {/* 2. Cambiar contraseña */}
      <SectionCard title={t("account.changePassword")}>
        <form onSubmit={handlePwd} className="space-y-4">
          <div>
            <label className={labelCls}>{t("account.currentPassword")}</label>
            <input
              type="password"
              required
              className={inputCls}
              value={pwd.current_password}
              onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>
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
          <div>
            <label className={labelCls}>{t("account.newPassword")}</label>
            <input
              type="password"
              required
              className={inputCls}
              value={pwd.password}
              onChange={(e) => setPwd((p) => ({ ...p, password: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelCls}>{t("account.confirmNewPassword")}</label>
            <input
              type="password"
              required
              className={inputCls}
              value={pwd.password_confirmation}
              onChange={(e) => setPwd((p) => ({ ...p, password_confirmation: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={pwdLoading} className={btnCls}>
            {pwdLoading ? t("account.changing") : t("account.changePasswordBtn")}
          </button>
          <Alert message={pwdMsg.text} type={pwdMsg.type} />
        </form>
      </SectionCard>

      {/* 3. Verificación en dos pasos */}
      <SectionCard title={t("twoFactor.sectionTitle")}>
        {promptTwoFactor && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm text-brand-warning"
          >
            {t("twoFactor.setupPrompt")}
          </div>
        )}
        <p className="text-sm text-gray-500 mb-4">
          {twoFactorEnabled
            ? t("twoFactor.statusEnabled")
            : t("twoFactor.statusDisabled")}
        </p>

        {twoFactorEnabled ? (
          <form onSubmit={handleTfDisable} className="space-y-4">
            <p className="text-sm text-gray-500">{t("twoFactor.disableInfo")}</p>
            <div>
              <label className={labelCls}>{t("twoFactor.passwordLabel")}</label>
              <input
                type="password"
                required
                className={inputCls}
                value={tfPassword}
                onChange={(e) => setTfPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={tfLoading}
              className="rounded-xl bg-brand-error px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tfLoading ? t("twoFactor.disabling") : t("twoFactor.disableBtn")}
            </button>
          </form>
        ) : tfStep === "code" ? (
          <form onSubmit={handleTfConfirm} className="space-y-4">
            <p className="text-sm text-gray-500">{t("twoFactor.codeSentInfo")}</p>
            <div>
              <label className={labelCls}>{t("twoFactor.codeLabel")}</label>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={`${inputCls} tracking-[0.4em] text-center`}
                value={tfCode}
                onChange={(e) =>
                  setTfCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={tfLoading || tfCode.length !== 6}
                className={btnCls}
              >
                {tfLoading ? t("twoFactor.confirming") : t("twoFactor.confirmBtn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTfStep("idle");
                  setTfCode("");
                  setTfMsg({ text: "", type: "error" });
                }}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={handleTfEnableStart}
            disabled={tfLoading}
            className={btnCls}
          >
            {tfLoading ? t("twoFactor.sending") : t("twoFactor.enableBtn")}
          </button>
        )}
        <Alert message={tfMsg.text} type={tfMsg.type} />
      </SectionCard>

      {/* 4. Descargar mis datos */}
      <SectionCard title={t("account.myData")}>
        <p className="text-sm text-gray-500 mb-4">
          {t("account.myDataText")}
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className={btnCls}
        >
          {exportLoading ? t("account.preparing") : t("account.downloadData")}
        </button>
        <Alert message={exportMsg.text} type={exportMsg.type} />
      </SectionCard>

      {/* 5. Zona de peligro */}
      <div className="bg-white rounded-2xl border-2 border-brand-error/40 shadow-sm p-6">
        <h2 className="text-base font-semibold text-brand-error mb-1">{t("account.dangerZone")}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("account.dangerText")}
        </p>
        <div className="mb-4">
          <label className={labelCls}>{t("account.confirmPasswordToContinue")}</label>
          <input
            type="password"
            className={inputCls}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button
          onClick={() => {
            if (!deletePassword) {
              setDeleteMsg({ text: t("validation.confirmPasswordPrompt"), type: "error" });
              return;
            }
            setConfirmOpen(true);
          }}
          className="rounded-xl bg-brand-error px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {t("account.deleteAccount")}
        </button>
        <Alert message={deleteMsg.text} type={deleteMsg.type} />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t("account.deleteConfirmTitle")}
        message={t("account.deleteConfirmMessage")}
        confirmText={t("account.deleteConfirmBtn")}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
