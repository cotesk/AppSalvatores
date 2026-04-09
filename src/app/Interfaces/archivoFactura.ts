export interface ArchivoFactura {

  id: number;
  nombre: string;
  numeroDocumento: string;
  tipo: string;
  datos: Uint8Array;
   fechaRegistro: Date;

}
