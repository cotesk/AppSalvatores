export interface EditarTipoVenta {
  TipoPago: string; // "EFECTIVO" | "TRANSFERENCIA" | "COMBINADO"
  TipoTranferencia?: string; // Nequi, Daviplata, Bancolombia, etc.
  PrecioEfectivo?: number;
  PrecioTransferencia?: number;
  PrecioTransferenciaSegundo?: number; // opcional, según tu backend
}
