import { DetalleVenta } from "./detalle-venta";

export interface Venta {


  idVenta?: number,
  numeroDocumento?: string,
  tipoPago: string,
  tipoTranferencia: string,
  totalTexto: string,
  fechaRegistro?: string,
  // nombreCompleto:string ;
  idPedido: number;
  idCaja: number;
  anulada: boolean,
  gananciaTexto: string,
  cantidadProductoTexto: string,
  estadoVenta: string,
  precioEfectivoTexto: string,
  precioTransferenciaTexto: string,
  precioTransferenciaSegundoTexto: string,
  detalleVenta: DetalleVenta[],

  nombreMesa?: string,
  usuarioAtendio?: string,

}
