import { Venta } from "./venta";

export interface VentasFiadasResponseDTO {
  nombreCliente: string;
  totalFiado: number;
  ventas: Venta[];
}