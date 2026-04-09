export interface Reporte {
  cliente: string,
  producto: string,
  fechaRegistro: string,
  numeroDocumento: string,
  tipoPago: string,
  precio: string,
  cantidad: number,
  totalVenta: string,
  total: string,
  carateristicas: string,


  anulada: boolean;

  precioPagado: string;
  intereses?: number,
  unidadMedida: string;

  nombreMesa?: string,
  usuarioAtendio?: string,
}
