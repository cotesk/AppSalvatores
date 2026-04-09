import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import{Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { Categoria } from '../Interfaces/categoria';
@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private urlApi:string =environment.endpoint + "Categoria/"

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

  private getHeaders2(): HttpHeaders {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No se encontró un token JWT en el almacenamiento local.');
      throw new Error('No se encontró un token JWT en el almacenamiento local.');
    }
    return new HttpHeaders({

      "Authorization": `Bearer ${token}`
    });
  }

  lista():Observable<ReponseApi>{
     const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Lista`, { headers: headers }).pipe(
      catchError(this.handleError)
    );

  }
  listaCard():Observable<ReponseApi>{

    return this.http.get<any>(`${this.urlApi}ListaCard`).pipe(
      catchError(this.handleError)
    );
  }
  // listaPaginada(page: number, size: number, search: string): Observable<any> {
  //   page = Math.max(page, 1);
  //   const params = {
  //     page: page.toString(),
  //     size: size.toString(),
  //     search: search || ''
  //   };
  //   const headers = this.getHeaders();
  //   return this.http.get<any>(`${this.urlApi}ListaPaginada`, { params, headers }).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  listaPaginada(page: number = 1, pageSize: number = 5, searchTerm: string = ''): Observable<any> {
    const url = `${this.urlApi}ListaPaginada?page=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  guardar(request:Categoria):Observable<ReponseApi> {
    const headers = this.getHeaders();
    console.log('Datos enviados al servidor:', request);
    return this.http.post<ReponseApi>(`${this.urlApi}Guardar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  exportarProductos(): Observable<Blob> {
    const headers = this.getHeaders(); // Añadir headers
    return this.http.get(`${this.urlApi}exportar-categorias`, { headers: headers, responseType: 'blob' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  // Método para importar productos
  importarProductos(file: File): Observable<any> {
    const headers = this.getHeaders2(); // Añadir headers
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.urlApi}importar-categorias`, formData, { headers: headers, responseType: 'text' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  editar(request:Categoria):Observable<ReponseApi>{
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(`${this.urlApi}Editar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  eliminar(id:number):Observable<ReponseApi>{
    const headers = this.getHeaders();
    return this.http.delete<ReponseApi>(`${this.urlApi}Eliminar/${id}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  cambiarEstado(id: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    // Aquí realizas la solicitud HTTP PUT con los encabezados configurados.
    return this.http.put<ReponseApi>(`${this.urlApi}CambiarEstado/${id}`, null, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: any) {
    console.error('Error en la solicitud:', error);
    return throwError('Ocurrió un error en la solicitud. Por favor, inténtelo de nuevo más tarde.');
  }
  // lista():Observable<ReponseApi>{

  //   return this.http.get<ReponseApi>(`${this.urlApi}Lista`)
  // }
  // guardar(request:Categoria):Observable<ReponseApi>{

  //   return this.http.post<ReponseApi>(`${this.urlApi}Guardar`,request)

  // }
  // editar(request:Categoria):Observable<ReponseApi>{

  //   return this.http.put<ReponseApi>(`${this.urlApi}Editar`,request)

  // }

  // eliminar(id:number):Observable<ReponseApi>{

  //   return this.http.delete<ReponseApi>(`${this.urlApi}Eliminar/${id}`)

  // }

  // cambiarEstado(id: number): Observable<ReponseApi> {
  //   // Aquí debes realizar la lógica para cambiar el estado en tu backend.
  //   // Por ejemplo, puedes hacer una petición HTTP PUT a tu API para cambiar el estado de la categoría.
  //   // El id de la categoría se pasa como parámetro en la URL.
  //   return this.http.put<ReponseApi>(`${this.urlApi}CambiarEstado/${id}`, null);
  // }

}
