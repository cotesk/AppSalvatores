import { ProductItemDTO } from "./productItemDTO";

export interface PurchaseDTO {
  id: number;
  customerEmail: string;
  totalAmount: number;
  purchaseDate: Date;
  status: string;
  nameCliente : string;
  telefono : string;
  direccion : string;
  productItems: ProductItemDTO[];
}
