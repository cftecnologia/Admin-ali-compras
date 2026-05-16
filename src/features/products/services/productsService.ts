import api from "@/shared/lib/api";
import type { ProductStorePayload } from "../types/product";

const toList = (payload: any) => {
  const data = payload?.data;
  return Array.isArray(data) ? data : data?.data || [];
};

export const productsService = {
  async getStoreProducts() {
    const response = await api.get("/produtos_loja");
    return toList(response.data);
  },

  async getAllStoreProducts() {
    const firstResponse = await api.get("/produtos_loja", {
      params: { page: 1, per_page: 100 },
    });
    const firstData = firstResponse.data?.data;
    const firstList = toList(firstResponse.data);
    const totalPages = firstData?.total_pages || 1;

    if (totalPages <= 1) return firstList;

    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        api.get("/produtos_loja", {
          params: { page: index + 2, per_page: 100 },
        }),
      ),
    );

    return [
      ...firstList,
      ...remainingResponses.flatMap((response) => toList(response.data)),
    ];
  },

  async getActiveCategories() {
    const response = await api.get("/categorias", { params: { ativa: true, per_page: 100 } });
    return toList(response.data);
  },

  async searchGlobalProducts(params: {
    search?: string;
    page: number;
    perPage: number;
  }) {
    const response = await api.get("/produtos", {
      params: {
        busca_global: params.search || undefined,
        ativo: true,
        page: params.page,
        per_page: params.perPage,
      },
    });

    const responseData = response.data.data;
    return {
      products: Array.isArray(responseData) ? responseData : responseData?.data || [],
      totalPages: responseData?.total_pages || 1,
    };
  },

  async getProductVariations(productId: string) {
    const response = await api.get("/variacoes_produto", {
      params: { produto_id: productId },
    });
    return toList(response.data);
  },

  async createStoreProduct(payload: ProductStorePayload) {
    const response = await api.post("/produtos_loja", payload);
    return response.data.data;
  },

  async updateStoreProduct(productStoreId: string, payload: ProductStorePayload) {
    await api.patch(`/produtos_loja/${productStoreId}`, payload);
  },

  async createStoreProductVariation(payload: Record<string, any>) {
    await api.post("/variacoes_produto_loja", payload);
  },

  async toggleHighlight(productStoreId: string, highlighted: boolean) {
    await api.patch(`/produtos_loja/${productStoreId}`, { destaque: highlighted });
  },

  async toggleStatus(productStoreId: string, active: boolean) {
    await api.patch(`/produtos_loja/${productStoreId}/ativo`, { ativo: active });
  },
};
