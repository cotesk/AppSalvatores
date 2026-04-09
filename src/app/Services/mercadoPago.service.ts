// mercado-pago.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CustomPreferenceRequest } from '../Interfaces/CustomPreferenceRequest';
import { environment } from '../environments/environment';
import { Transactions } from '../Interfaces/transactions';
import { ProductoOnline } from '../Interfaces/productosOnline';
import { ReponseApi } from '../Interfaces/reponse-api';

@Injectable({
  providedIn: 'root',
})
export class MercadoPagoService {


  private urlApi: string = environment.endpoint + "MercadoPago/"


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

  constructor(private http: HttpClient) { }

  createPreference(customRequest: CustomPreferenceRequest): Observable<any> {
    return this.http.post(`${this.urlApi}create-preference`, customRequest, { responseType: 'text' as 'json' });
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

  // Método para actualizar el estado de una compra según TransactionId
  EstadoCompra(transactionId: number): Observable<any> {
    const headers = this.getHeaders();

    // Usar TransactionId como parámetro en la URL
    return this.http.post<any>(`${this.urlApi}EstadoCompra?TransactionId=${transactionId}`, null, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  cancelPedido(paymentId: number): Observable<any> {
    const url = `${this.urlApi}cancelPayment?paymentId=${paymentId}`;

    return this.http.post<any>(url,null)
      .pipe(
        catchError(this.handleError)
      );
  }

  Reembolso(transactionId: number): Observable<any> {
    // const headers = this.getHeaders(); // Usa el método de encabezados para la autenticación
    const url = `${this.urlApi}refund/${transactionId}`; // Ruta hacia tu endpoint de reembolso en el backend



    return this.http.post<any>(url, null) // Llama al endpoint con una solicitud POST
      .pipe(
        catchError(this.handleError) // Maneja cualquier error que ocurra en la solicitud
      );
  }


  SolicitarReembolso(transactionId: number, correo: string): Observable<any> {
    const url = `${this.urlApi}solicitarReembolso?transactionId=${transactionId}&correo=${correo}`;

    // Crear el cuerpo de la solicitud POST
    const body = {
      transactionId: transactionId,
      correo: correo
    };

    return this.http.post<any>(`${this.urlApi}solicitarReembolso?transactionId=${transactionId}&correo=${correo}`,null)
      .pipe(
        catchError(this.handleError)
      );
  }

  BuscarNumeroDocumento(numeroDocumento: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}BuscarNumeroDocumento?numeroDocumento=${numeroDocumento}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para buscar una transacción por TransactionId
  Transactions(transactionId: number): Observable<Transactions> {
    return this.http.get<Transactions>(`${this.urlApi}Buscar-TransactionId?TransactionId=${transactionId}`);
  }
  listaTransactions(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Buscar-Transaction`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Método para buscar un cliente por TransactionId
  // ClienteOnline(transactionId: number): Observable<ClienteOnline> {
  //   return this.http.get<ClienteOnline>(`${this.urlApi}Buscar-ClienteId?TransactionId=${transactionId}`);
  // }

  // Método para buscar productos por TransactionId
  ProductosOnline(transactionId: number): Observable<ProductoOnline[]> {
    return this.http.get<ProductoOnline[]>(`${this.urlApi}Buscar-ProductosId?TransactionId=${transactionId}`);
  }

  // Método para obtener transacciones filtradas por día, mes y año
  getTransactionsByDate(day?: number, month?: number, year?: number): Observable<Transactions[]> {
    const headers = this.getHeaders();

    // Configuración de los parámetros de consulta (query parameters)
    let params = new HttpParams();
    if (day) params = params.append('day', day.toString());
    if (month) params = params.append('month', month.toString());
    if (year) params = params.append('year', year.toString());

    return this.http.get<Transactions[]>(`${this.urlApi}FechaTransaction`, { headers, params })
      .pipe(
        catchError(this.handleError)
      );
  }



}
