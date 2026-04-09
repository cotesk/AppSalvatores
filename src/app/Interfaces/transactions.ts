export interface Transactions {
  transactionId: number;
  amount: number;
  currency: string;
  createdDate: string; // Puedes usar Date si deseas que sea un objeto de tipo fecha en lugar de una cadena
  status: string;
  mercadoPagoFee: number;
  netReceived: number;
  paymentMethod: string;
  paymentMethodType: string;
  estadoVenta: string;
  cardNumber?: string | null; // Opcional porque puede ser null
  cardType?: string | null; // Opcional porque puede ser null
  cardNameCliente?: string | null; // Opcional porque puede ser null
  customerId: number;
}
