import { useEffect, useMemo, useState } from "react";
import { KeyRound, X } from "lucide-react";
import api from "@/shared/lib/api";

export type MfaApproval = {
  administrator_id: string;
  totp_code: string;
  password?: string;
};

type Props = {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (approval: MfaApproval) => void;
};

export function MfaApprovalModal({ open, title, description, loading, onClose, onConfirm }: Props) {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [administratorId, setAdministratorId] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const delegated = administratorId !== user.id;

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setCode("");
    setError("");
    api.get("/auth/mfa/approvers")
      .then(({ data }) => {
        const items = data.data || [];
        setAdministrators(items);
        setAdministratorId(
          items.some((item: any) => item.id === user.id) ? user.id : items[0]?.id || ""
        );
      })
      .catch((err) => setError(err.response?.data?.error?.message || "Não foi possível listar administradores."));
  }, [open, user.id]);

  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!administratorId || !/^\d{6}$/.test(code) || (delegated && !password)) return;
    onConfirm({
      administrator_id: administratorId,
      totp_code: code,
      ...(delegated ? { password } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><KeyRound className="h-5 w-5" />{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <label className="mt-5 block text-sm font-medium text-gray-700">Administrador aprovador</label>
        <select value={administratorId} onChange={(e) => setAdministratorId(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          {administrators.map((admin) => <option key={admin.id} value={admin.id}>{admin.nome} ({admin.email})</option>)}
        </select>
        {delegated && (
          <>
            <label className="mt-4 block text-sm font-medium text-gray-700">Senha do administrador</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </>
        )}
        <label className="mt-4 block text-sm font-medium text-gray-700">Código do autenticador</label>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-[0.3em]" />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">Cancelar</button>
          <button disabled={loading || !administratorId || code.length !== 6 || (delegated && !password)} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Validando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
}
