import { Pedido } from "./pedido";

export interface PedidosPorMesaResponse {
  status: boolean;
  value: {
    total: number;
    pedidos: Pedido[];
  };
}
