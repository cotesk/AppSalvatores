import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { Bodega } from '../Interfaces/bodega';
@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private urlApi: string = environment.endpoint + "Bodega/"


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

  exportarProductos(): Observable<Blob> {
    const headers = this.getHeaders(); // Añadir headers
    return this.http.get(`${this.urlApi}exportar-bodegas`, { headers: headers, responseType: 'blob' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  // Método para importar productos
  importarProductos(file: File): Observable<any> {
    const headers = this.getHeaders2(); // Añadir headers
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.urlApi}importar-bodegas`, formData, { headers: headers, responseType: 'text' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  lista(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Lista`, { headers: headers }).pipe(
      catchError(this.handleError)
    );

  }

  decodeBase64ToImageUrl(base64String: string): string {
    const bytes = atob(base64String);
    const arrayBuffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      arrayBuffer[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: 'image/png' });
    return URL.createObjectURL(blob);
  }
  // Método para obtener la lista de bodegas con paginación, filtro y conversión de imágenes base64
  obtenerListaPaginada(pageNumber: number, pageSize: number, searchTerm?: string): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    // Agregar el término de búsqueda solo si está presente
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    // Hacer la solicitud HTTP GET con los parámetros y los headers de autorización
    return this.http.get<any>(`${this.urlApi}listaPaginada`, { params, headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          // Verificar que 'response' y 'response.datos' existan y sean arrays
          if (response && Array.isArray(response.datos)) {
            // Convertir ImageData de base64 a URL de imagen
            response.datos.forEach((bodega: any) => {
              if (bodega.imageData) {
                bodega.imageUrl = this.decodeBase64ToImageUrl(bodega.imageData);
              }
            });
          } else {
            console.error('Respuesta inesperada del servidor', response);
          }
          return response;
        })
      );
  }



  sacarProductos(idBodega: number, cantidad: number): Observable<any> {
    const headers = this.getHeaders(); // Obtener los headers con el token
    return this.http.post<any>(`${this.urlApi}sacarProductos`, { idBodega, cantidad }, { headers: headers }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  AcomodarProductos(idBodega: number, cantidad: number): Observable<any> {
    const headers = this.getHeaders(); // Obtener los headers con el token
    return this.http.post<any>(`${this.urlApi}AcomodarProductos`, { idBodega, cantidad }, { headers: headers }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  guardar(request: Bodega): Observable<ReponseApi> {
    const headers = this.getHeaders();
    console.log('Datos enviados al servidor:', request);
    return this.http.post<ReponseApi>(`${this.urlApi}Guardar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }


  CambiarEstadoBodega(idCompra: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.urlApi}CambiarEstadoBodega/${idCompra}`, {}, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }



  getBodega(id: number): Observable<Bodega> {
    return this.http.get<Bodega>(`${this.urlApi}${id}`);
  }

  private handleError(error: any) {
    console.error('Error en la solicitud:', error);
    return throwError('Ocurrió un error en la solicitud. Por favor, inténtelo de nuevo más tarde.');
  }

}
