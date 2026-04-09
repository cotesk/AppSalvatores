import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class DomicilioService {

  private urlApi: string = environment.endpoint + "Domicilio/";

  constructor(private http: HttpClient) { }

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

  
  obtenerTodos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Todos`, { headers })
      .pipe(catchError(this.handleError));
  }

 
  obtenerPorIdPedido(idPedido: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}domicilios/${idPedido}`, { headers })
      .pipe(catchError(this.handleError));
  }


  editarDomicilio(idDomicilio: number, data: any): Observable<any> {
    const headers = this.getHeaders();

    return this.http.put<any>(`${this.urlApi}domicilios/editar/${idDomicilio}`, data, { headers })
      .pipe(
        tap(() => {
        //   this.mostrarMensajeExito();
        }),
        catchError(this.handleError)
      );
  }

 
  private mostrarMensajeExito(): void {
    Swal.fire({
      icon: 'success',
      title: 'Domicilio actualizado',
      text: 'Los datos del domicilio fueron modificados correctamente.'
    });
  }

 
  private handleError(error: any): Observable<never> {
    console.error('Error en la solicitud de domicilios:', error);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error en la solicitud. Intenta nuevamente.'
    });

    return throwError('Error en la solicitud.');
  }

}
