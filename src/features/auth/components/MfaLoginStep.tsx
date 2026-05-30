import { useEffect, useState } from "react";
import { KeyRound, QrCode } from "lucide-react";
import { authService } from "../services/authService";
import type { LoginResponse } from "../types/auth";

type Props = {
  session: LoginResponse;
  onComplete: (session: LoginResponse) => void;
  onCancel: () => void;
};

export function MfaLoginStep({ session, onComplete, onCancel }: Props) {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const status = await authService.getMfaStatus();
        if (!active) return;
        if (status.enrollment_required) {
          const factor = await authService.enrollMfa();
          if (!active) return;
          setFactorId(factor.id);
          setQrCode(factor.totp.qr_code);
          setSecret(factor.totp.secret);
        } else {
          setFactorId(status.factors[0]?.id || "");
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Não foi possível preparar o autenticador.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void prepare();
    return () => { active = false; };
  }, []);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    try {
      setLoading(true);
      setError("");
      const challenge = await authService.challengeMfa(factorId);
      const elevatedSession = await authService.verifyMfa(factorId, challenge.id, code);
      onComplete({ ...session, ...elevatedSession, aal: "aal2" });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5">
      <div className="text-center">
        <KeyRound className="mx-auto h-10 w-10 text-blue-900" />
        <h2 className="mt-3 text-xl font-semibold text-gray-900">Autenticação em dois fatores</h2>
        <p className="mt-1 text-sm text-gray-500">
          {qrCode ? "Escaneie o QR code e informe o código gerado." : "Informe o código do seu aplicativo autenticador."}
        </p>
      </div>
      {qrCode && (
        <div className="space-y-2 text-center">
          <img src={qrCode} alt="QR code para configurar autenticador" className="mx-auto h-44 w-44" />
          <p className="text-xs text-gray-500">Chave manual: <span className="font-mono">{secret}</span></p>
        </div>
      )}
      {!qrCode && <QrCode className="mx-auto h-16 w-16 text-gray-300" />}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <input
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.35em]"
      />
      <button disabled={loading || code.length !== 6} className="w-full rounded-lg bg-blue-950 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Validando..." : "Confirmar código"}
      </button>
      <button type="button" onClick={onCancel} className="w-full text-sm font-medium text-gray-500">Voltar ao login</button>
    </form>
  );
}
