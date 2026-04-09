export interface DetalleVenta {

  idProducto: number,
  descripcionProducto: string,
  cantidad: number,
  precioTexto: string,
  totalTexto: string,
  descripcionCaracteristica: string,
  precioPagadoTexto: string,
  descuentosTexto: string,
  ivaTexto: string,
  unidadMedidaTexto: string,

  editandoCantidad?: boolean;
  // direccionNombre:string ,
  // nombreCliente: string;
  nombre: string;
  idCategoria: number;
  descripcionCategoria: string;
  stock: number;
  precio: string;
  esActivo: number;
  imageData: string[] | null;
  caracteristicas: string,
  // idProveedor: number,
  // nombreProvee: string ;

  descuentos: string;
  codigo: string;
  iva: string;
  precioSinDescuento?: string;
  cantidadDisponible?: string;
  tipoPago?: string;
  tipoTranferencia?:string,
  precioDelIva?: string;
  // intereses?: number;
  // imagenLocalStorage: string;
  unidadMedida: string;

  imagenUrl: string[] | null
  nombreImagen: string[] | null;

    imagenes?: {
    nombreImagen: string;
    imageData: string | null;
    imagenUrl: string | null;
  }[];

  
}
