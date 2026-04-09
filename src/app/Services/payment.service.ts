import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { PurchaseDTO } from '../Interfaces/purchaseDTO';
import { ReponseApi } from '../Interfaces/reponse-api';

export interface ProductRequest {
  // imagenData: string | null;
  productName: string;
  amount: number; // Precio en pesos
  quantity: number;
}

export interface PaymentRequest {
  products: ProductRequest[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}

export interface RefundResponse {
  purchaseId: number;
  paymentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private urlApi: string = environment.endpoint + "Payments/"
  private apiUrl: string = environment.endpoint + "paypal/"
  private urlApi2: string = environment.endpoint + "MercadoPago/"
  constructor(private http: HttpClient) { }

  // createPayment(paymentData: any): Observable<any> {
  //   return this.http.post(`${this.urlApi}process-payment`, paymentData);
  // }
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No se encontró un token JWT en el almacenamiento local.');
      throw new Error('No se encontró un token JWT en el almacenamiento local.');
    }
      // Si el token es demasiado grande, intenta optimizarlo
      if (token.length > 1000) {
        console.warn('El token JWT es muy grande. Considera optimizar su contenido.');
      }
    return new HttpHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    });
  }


  createCheckoutSession(request: PaymentRequest): Observable<any> {
    return this.http.post<any>(this.urlApi+'create-checkout-session', request);
  }

  getCustomerPurchases(email: string): Observable<PurchaseDTO[]> {
    // Configura los parámetros de la consulta
    const params = new HttpParams().set('email', email);

    return this.http.get<PurchaseDTO[]>(`${this.urlApi}customer-purchases`, { params });
  }

 // Método para procesar el reembolso
 refunds(request: any): Observable<any> {
  return this.http.post<any>(this.urlApi + 'refund', request);
}

// Método para obtener los detalles del reembolso basado en el PurchaseId
procesarReembolso(id: PurchaseDTO): Observable<RefundResponse> {
  return this.http.get<RefundResponse>(`${this.urlApi}${id}`).pipe(
    catchError(this.handleError)
  );
}

EstadoPurchasesId(id: number): Observable<ReponseApi> {
  const headers = this.getHeaders();
  return this.http.post<ReponseApi>(`${this.urlApi}EstadoPurchasesId/${id}`, {}, { headers }).pipe(
    catchError(this.handleError)
  );
}


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Errores del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Errores del servidor
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  // createPreference(preferenceRequest: any): Observable<any> {
  //   return this.http.post(`${this.urlApi}create-preference`, preferenceRequest);
  // }


  // payWithNequi(amount: number, phoneNumber: string): Observable<any> {
  //   return this.http.post(this.urlApi + "nequi", { amount, phoneNumber });
  // }


  // createOrder(amount: number, currency: string): Observable<any> {
  //   return this.http.post(`${this.urlApi}create-order`, { amount, currency });
  // }

  // captureOrder(orderId: string): Observable<any> {
  //   return this.http.post(`${this.urlApi}capture-order`, { orderId });
  // }



  // createPayment(paymentData: any): Observable<any> {
  //   const formData = new FormData();
  //   formData.append('amount', paymentData.amount);
  //   formData.append('description', paymentData.description);
  //   formData.append('cardNumber', paymentData.cardNumber);
  //   formData.append('expirationMonth', paymentData.expirationMonth.toString());
  //   formData.append('expirationYear', paymentData.expirationYear.toString());
  //   formData.append('cardholderName', paymentData.cardholderName);
  //   formData.append('securityCode', paymentData.securityCode);
  //   formData.append('email', paymentData.email);

  //   return this.http.post(`${this.urlApi2}create`, formData);
  // }
}
