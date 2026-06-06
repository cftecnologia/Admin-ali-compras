export type Product = Record<string, any>;

export type ProductFilters = {
  search: string;
  category: string;
  status: string;
};

export type ProductStorePayload = {
  preco: number | null;
  preco_promocional: number | null;
  estoque: number;
  produto_id: string;
  categoria_id: string | null;
  ativo_na_loja: boolean;
  destaque: boolean;
  consumo_imediato: boolean;
  codigo_interno: string;
  tipo_venda: "unidade" | "peso";
  quantidade_minima_compra: number;
  incremento_quantidade: number;
};
