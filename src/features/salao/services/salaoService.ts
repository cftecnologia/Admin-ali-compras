import api from "@/shared/lib/api";

function unwrap<T = any>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

export const salaoService = {
  listMesas: async (params?: Record<string, unknown>) =>
    unwrap(await api.get("/salao/mesas", { params })),

  createMesa: async (data: Record<string, unknown>) =>
    unwrap(await api.post("/salao/mesas", data)),

  rotateMesaQr: async (id: string) =>
    unwrap(await api.post(`/salao/mesas/${id}/qrcode/rotate`)),

  openComanda: async (data: Record<string, unknown>) =>
    unwrap(await api.post("/salao/comandas", data)),

  listComandas: async (params?: Record<string, unknown>) =>
    unwrap(await api.get("/salao/comandas", { params })),

  getComanda: async (id: string) =>
    unwrap(await api.get(`/salao/comandas/${id}`)),

  addItem: async (comandaId: string, data: Record<string, unknown>) =>
    unwrap(await api.post(`/salao/comandas/${comandaId}/itens`, data)),

  closeAccount: async (comandaId: string, data: Record<string, unknown>) =>
    unwrap(await api.post(`/salao/comandas/${comandaId}/fechar-conta`, data)),

  transferTable: async (comandaId: string, data: Record<string, unknown>) =>
    unwrap(await api.post(`/salao/comandas/${comandaId}/transferir-mesa`, data)),

  joinTables: async (comandaId: string, data: Record<string, unknown>) =>
    unwrap(await api.post(`/salao/comandas/${comandaId}/juntar-mesas`, data)),

  listKds: async (params?: Record<string, unknown>) =>
    unwrap(await api.get("/salao/kds", { params })),

  updateItemStatus: async (itemId: string, status: string) =>
    unwrap(await api.patch(`/salao/kds/itens/${itemId}/status`, { status })),
};
