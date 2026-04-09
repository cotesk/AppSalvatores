// Models/Bodega.cs
export interface Bodega
{
  idBodega: number;
  idProducto: number;
  cantidadEnBodega: number;
  fechaRegistro: string;
  imageData: string | null;
  codigoBarra: string;
  nombreProducto: string;
}
