export interface Cambio {


  idCambio:number,
  idVenta: number,
  producto: string,
  cantidadCambiada: number,
  motivo:string,
  fechaCambio: Date,
  estadoProductoDevuelto: string,
  nuevoProducto: string,
  numeroDocumento: string;
  diferenciaPrecio:string,
  unidadMedida: string,
};
