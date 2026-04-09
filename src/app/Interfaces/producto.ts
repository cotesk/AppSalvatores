export interface Producto {


  idProducto: number,
  nombre: string,
  idCategoria: number,
  descripcionCategoria: string,
  stock: number,
  precio: string,
  esActivo: number,

  imageData: string[] | null;
  // imagenUrl: string | null;
  imagenUrl: string[] | null
  nombreImagen: string[] | null;
  caracteristicas: string,

  descuentos: string;
  codigo: string,
  iva: string,



  precioSinDescuento?: string;
  cantidadDisponible?: string;
  // imagenLocalStorage: string | null;

  unidadMedida?: string;

  precioPorCajaSeleccionado?: boolean;

  imagenes: {
    nombreImagen: string;
    imageData: string | null;
    imagenUrl: string | null;
  }[];
  tienePorcion?: number,
  precioPorPorcionTexto?: string,


}
