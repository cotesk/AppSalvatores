import { DetallePedido } from "./detalle-pedido";

export interface Pedido {


  idPedido: number,
  idMesa: number,
  nombreMesa: string,
  idUsuario: number;
  nombreUsuario: string,
  fechaHora?: string,
  cancelado: boolean,
  comentarioGeneral: string;
  pagado: boolean;
  estadoPedido: string;
  tipoPedido: string;
  cantidadProductoTexto: string,
  totalTexto: string,
  detallePedidos: DetallePedido[],

  domicilio?: {
    nombre: string;
    direccion: string;
    telefono: string;
    referencia?: string;
  } | null;

}
