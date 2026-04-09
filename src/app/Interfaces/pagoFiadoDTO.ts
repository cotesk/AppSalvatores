export interface PagoFiadoDTO {
  idCliente: number;
  idUsuario: number;
  metodoPago: string; // Ejemplo: "Efectivo" o "Transferencia"
  tipoPago:string;
}
