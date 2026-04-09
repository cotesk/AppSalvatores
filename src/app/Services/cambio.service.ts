
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import{Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { catchError, tap } from 'rxjs/operators'
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class CambioService {


  private urlApi:string =environment.endpoint + "Cambio/"


  constructor(private http:HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No se encontró un token JWT en el almacenamiento local.');
      throw new Error('No se encontró un token JWT en el almacenamiento local.');
    }
    return new HttpHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    });
  }
  // Método para realizar un cambio
  realizarCambio(cambio: any): Observable<any> {
    console.log('Enviando solicitud de cambio:', cambio);
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.urlApi}Cambios`, cambio, { headers }).pipe(
      tap((response) => {
        console.log('Respuesta del servidor:', response);
        // Mostrar mensaje de éxito aquí
        this.mostrarMensajeExito();
      }),
      catchError((error) => {
        console.error('Error al realizar el cambio:', error);
        // Propagar el error para que pueda ser manejado en el componente
        throw error;
      })
    );
  }
  mostrarMensajeExito(): void {
    // Mostrar mensaje de éxito (por ejemplo, usando SweetAlert)
    Swal.fire({
      icon: 'success',
      title: 'Cambio realizado',
      text: 'El cambio se realizó correctamente.'
    });
  }

  // Método para obtener todos los cambios realizados
  obtenerCambios(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.urlApi}Lista`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCambiosIdVenta(idVenta: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.urlApi}Buscar/${idVenta}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCambiosTodoIdVenta(idVenta: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.urlApi}BuscarTodo/${idVenta}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error:', error);
    return throwError('Error al realizar la solicitud. Por favor, inténtalo de nuevo más tarde.');
  }

  // realizarCambio(cambio: any): Observable<any> {
  //   console.log('Ocurrió un error:', cambio);
  //   return this.http.post<any>(`${this.urlApi}Cambio`, cambio).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  // // Método para obtener todos los cambios realizados
  // obtenerCambios(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.urlApi}Lista`).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  // obtenerCambiosIdVenta(idVenta:number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.urlApi}Buscar/${idVenta}`).pipe(
  //     catchError(this.handleError)
  //   );
  // }



}
