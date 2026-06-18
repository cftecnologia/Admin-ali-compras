import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  ChefHat,
  ClipboardList,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { salaoService } from "@/features/salao/services/salaoService";
import { showSystemNotice } from "@/shared/components/SystemNoticeModal";

const PRIMARY = "#122a4c";
const CLIENT_BASE_URL = (import.meta.env.VITE_CLIENTE_URL || window.location.origin).replace(/\/$/, "");

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const unwrapList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export function SalaoPage() {
  const user = useMemo(getUser, []);
  const [tab, setTab] = useState<"mesas" | "comandas" | "kds">("mesas");
  const [mesas, setMesas] = useState<any[]>([]);
  const [comandas, setComandas] = useState<any[]>([]);
  const [kds, setKds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTable, setCreatingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [selectedComanda, setSelectedComanda] = useState<any | null>(null);

  const load = async () => {
    if (!user?.loja_id) return;
    setLoading(true);
    try {
      const [tablesPayload, tabsPayload, kdsPayload] = await Promise.all([
        salaoService.listMesas({ loja_id: user.loja_id, per_page: 100 }),
        salaoService.listComandas({ loja_id: user.loja_id, status: "aberta", per_page: 100 }),
        salaoService.listKds({ loja_id: user.loja_id }),
      ]);
      setMesas(unwrapList(tablesPayload));
      setComandas(unwrapList(tabsPayload));
      setKds(unwrapList(kdsPayload));
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível carregar o salão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createMesa = async () => {
    if (!newTableNumber.trim()) return;
    setCreatingTable(true);
    try {
      await salaoService.createMesa({
        loja_id: user.loja_id,
        numero: newTableNumber.trim(),
        capacidade: 4,
      });
      setNewTableNumber("");
      await load();
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível criar a mesa.");
    } finally {
      setCreatingTable(false);
    }
  };

  const openComanda = async (mesa: any) => {
    try {
      const result = await salaoService.openComanda({
        loja_id: user.loja_id,
        mesa_id: mesa.id,
        quantidade_pessoas: 1,
      });
      setSelectedComanda(result);
      await load();
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível abrir a comanda.");
    }
  };

  const rotateQr = async (mesa: any) => {
    try {
      const result = await salaoService.rotateMesaQr(mesa.id);
      const url = `${CLIENT_BASE_URL}/mercado/${mesa.loja_id}/mesa/${result.qr_token}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      showSystemNotice("Novo link do QR Code copiado para a área de transferência.");
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível renovar o QR Code.");
    }
  };

  const closeAccount = async (comanda: any) => {
    try {
      await salaoService.closeAccount(comanda.id, {
        tipo: "compartilhada",
        percentual_taxa_servico: 10,
      });
      setSelectedComanda(null);
      await load();
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível fechar a conta.");
    }
  };

  const updateKds = async (item: any, status: string) => {
    try {
      await salaoService.updateItemStatus(item.id, status);
      await load();
    } catch (error: any) {
      showSystemNotice(error?.response?.data?.message || error?.message || "Não foi possível atualizar o item.");
    }
  };

  const activeTabClass = "bg-white text-gray-900 shadow-sm";

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Salão</h1>
            <p className="text-sm text-gray-500">Mesas, comandas, atendimento e cozinha.</p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
        <div className="mt-4 inline-flex rounded-lg bg-gray-100 p-1">
          {[
            ["mesas", Armchair, "Mesas"],
            ["comandas", ClipboardList, "Comandas"],
            ["kds", ChefHat, "KDS"],
          ].map(([id, Icon, label]) => (
            <button
              key={String(id)}
              onClick={() => setTab(id as any)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === id ? activeTabClass : "text-gray-500"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando salão...
          </div>
        ) : tab === "mesas" ? (
          <div className="space-y-4">
            <div className="flex max-w-sm gap-2">
              <input
                value={newTableNumber}
                onChange={(event) => setNewTableNumber(event.target.value)}
                placeholder="Número da mesa"
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm"
              />
              <button
                onClick={() => void createMesa()}
                disabled={creatingTable}
                className="inline-flex items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                <Plus className="h-4 w-4" />
                Mesa
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {mesas.map((mesa) => (
                <div key={mesa.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Mesa</div>
                      <div className="text-2xl font-semibold text-gray-900">{mesa.numero}</div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">
                      {mesa.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => void openComanda(mesa)}
                      disabled={mesa.comanda_aberta}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {mesa.comanda_aberta ? `Comanda ${mesa.comanda_aberta.numero_comanda}` : "Abrir comanda"}
                    </button>
                    <button
                      onClick={() => void rotateQr(mesa)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700"
                    >
                      <QrCode className="h-4 w-4" />
                      Gerar link QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "comandas" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {comandas.map((comanda) => (
                <button
                  key={comanda.id}
                  onClick={() => setSelectedComanda(comanda)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{comanda.numero_comanda}</div>
                      <div className="text-sm text-gray-500">Mesa {comanda.mesa?.numero}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">R$ {Number(comanda.total || 0).toFixed(2).replace(".", ",")}</div>
                      <div className="text-xs capitalize text-gray-500">{comanda.status}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              {selectedComanda ? (
                <>
                  <h2 className="font-semibold text-gray-900">{selectedComanda.numero_comanda}</h2>
                  <p className="text-sm text-gray-500">Use a tela de produtos para copiar IDs e lançar itens nesta primeira versão operacional.</p>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Total</span>
                      <strong>R$ {Number(selectedComanda.total || 0).toFixed(2).replace(".", ",")}</strong>
                    </div>
                    <button
                      onClick={() => void closeAccount(selectedComanda)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <Receipt className="h-4 w-4" />
                      Fechar conta compartilhada
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Selecione uma comanda.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-3">
            {kds.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{item.nome_produto}</div>
                    <div className="text-sm text-gray-500">Mesa {item.mesa?.numero} · {item.numero_comanda}</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs capitalize text-amber-700">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {["recebido", "preparando", "pronto", "entregue"].map((status) => (
                    <button
                      key={status}
                      onClick={() => void updateKds(item, status)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs capitalize text-gray-700 hover:bg-gray-50"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
