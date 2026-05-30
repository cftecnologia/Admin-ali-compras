import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { authService } from "@/features/auth/services/authService";
import type { MfaStatus } from "@/features/auth/types/auth";
import api from "@/shared/lib/api";

export function SecurityMfaPanel() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; totp: { qr_code: string; secret: string } } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => setStatus(await authService.getMfaStatus());
  useEffect(() => { void load().catch(() => setError("Não foi possível carregar os autenticadores.")); }, []);

  const enroll = async () => {
    try {
      setLoading(true);
      setError("");
      setEnrollment(await authService.enrollMfa());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Não foi possível cadastrar outro autenticador.");
    } finally {
      setLoading(false);
    }
  };

  const confirmEnrollment = async () => {
    if (!enrollment || code.length !== 6) return;
    try {
      setLoading(true);
      const challenge = await authService.challengeMfa(enrollment.id);
      authService.persistSession(await authService.verifyMfa(enrollment.id, challenge.id, code));
      setEnrollment(null);
      setCode("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (factorId: string) => {
    try {
      setLoading(true);
      await api.delete(`/auth/mfa/factors/${factorId}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Não foi possível remover o autenticador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-800"><KeyRound className="h-4 w-4" />Autenticação em dois fatores</h3>
          <p className="mt-1 text-sm text-gray-500">Use um aplicativo autenticador para proteger o acesso e aprovar operações sensíveis.</p>
        </div>
        <button onClick={enroll} disabled={loading} className="flex items-center gap-1 rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><Plus className="h-4 w-4" />Adicionar</button>
      </div>
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mt-4 space-y-2">
        {status?.factors.map((factor) => (
          <div key={factor.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
            <span>{factor.friendly_name || "Aplicativo autenticador"}</span>
            <button onClick={() => void remove(factor.id)} disabled={loading} title="Remover autenticador"><Trash2 className="h-4 w-4 text-red-500" /></button>
          </div>
        ))}
      </div>
      {enrollment && (
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
          <img src={enrollment.totp.qr_code} alt="QR code do novo autenticador" className="mx-auto h-40 w-40" />
          <p className="mt-2 text-xs text-gray-600">Chave manual: <span className="font-mono">{enrollment.totp.secret}</span></p>
          <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-[0.3em]" />
          <button onClick={() => void confirmEnrollment()} disabled={loading || code.length !== 6} className="mt-3 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Confirmar autenticador</button>
        </div>
      )}
    </div>
  );
}
