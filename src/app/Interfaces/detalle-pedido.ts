export interface DetallePedido {

    idProducto: number,
    cantidad: number,
    precioUnitarioTexto: string,
    comentario: string,
    totalTexto: string,
    descripcionProducto: string,
    unidadMedidaTexto: string,
    idMesa?: number;
    nombreMesa?: string;
    tipoMesa?: string;


    //Preducto

    nombre?: string;
    idCategoria?: number;
    descripcionCategoria?: string;
    stock?: number;
    precio?: string;
    esActivo?: number;
    // imageData: string[] | null;
    caracteristicas?: string,

    descuentos?: string;
    codigo?: string;
    iva?: string;
    precioSinDescuento?: string;
    cantidadDisponible?: string;
    tipoPago?: string | null;
    tipoTranferencia?: string | null,
    precioDelIva?: string | null;
    // intereses?: number;
    // imagenLocalStorage: string;
    unidadMedida?: string;

    imagenUrl?: string[] | null
    nombreImagen?: string[] | null;

    imagenes?: {
        nombreImagen: string;
        imageData: string | null;
        imagenUrl: string | null;
    }[];
    tienePorcion?: number,

    //Fin producto

    //Pedido

    //
    // 🔥 NUEVOS CAMPOS
    seleccionado?: boolean;
    cantidadSeleccionada?: number;

}
