export interface ReponseApi {

    status: boolean,
    msg: string,
    value: any
    token: string,

    //esto es opcional para la imprecion de cocina y heladeria, no es necesario para el registro del pedido
    imprimeCocina?: boolean;
    imprimeHeladeria?: boolean;
    pedidoId?: number;
    esReimpresion?: boolean;
}
