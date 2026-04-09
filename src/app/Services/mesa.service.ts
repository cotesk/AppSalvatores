import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { Mesa } from '../Interfaces/mesa';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  private urlApi: string = environment.endpoint + "Mesa/";

  constructor(private http: HttpClient) {}

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

  // ✅ Obtener lista básica
  lista(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}Lista`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Obtener lista para tarjetas
  listaCard(): Observable<ReponseApi> {
    return this.http.get<ReponseApi>(`${this.urlApi}ListaCard`).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Obtener lista paginada
  listaPaginada(page: number = 1, pageSize: number = 5, searchTerm: string = ''): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}ListaPaginada?page=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Guardar nueva mesa
  guardar(mesa: Mesa): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.post<ReponseApi>(`${this.urlApi}Guardar`, mesa, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Editar mesa
  editar(mesa: Mesa): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(`${this.urlApi}Editar`, mesa, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Eliminar mesa por ID
  eliminar(id: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.delete<ReponseApi>(`${this.urlApi}Eliminar/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Exportar a Excel
  exportarMesas(): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.get(`${this.urlApi}exportar-mesas`, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ Importar archivo de Excel
  importarMesas(file: File): Observable<any> {
    const headers = this.getHeaders(); // Authorization solamente
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.urlApi}importar-mesas`, formData, {
      headers: new HttpHeaders({
        'Authorization': headers.get('Authorization')!
      })
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Error del lado del cliente:', error.error.message);
    } else {
      console.error(`Error del backend: ${error.status}, body: `, error.error);
    }
    return throwError(() => new Error('Ocurrió un error. Por favor intenta de nuevo.'));
  }
}
