import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { Producto } from '../Interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private urlApi: string = environment.endpoint + "Producto/"


  constructor(private http: HttpClient) { }
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
  iva(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}IvaPrimero`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  lista(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Lista`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  lista2(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}Lista2`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  listaCard(): Observable<ReponseApi> {

    return this.http.get<any>(`${this.urlApi}ListaCard`).pipe(
      catchError(this.handleError)
    );
  }

  ingresarProductos(idProducto: number, cantidad: number): Observable<any> {
    const headers = this.getHeaders(); // Obtener los headers con el token
    return this.http.post<any>(`${this.urlApi}ingresarProductos`, { idProducto, cantidad }, { headers: headers }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  ingresarProductosVencidos(idProducto: number, cantidad: number): Observable<any> {
    const headers = this.getHeaders(); // Obtener los headers con el token
    return this.http.post<any>(`${this.urlApi}ingresarProductosVencidos`, { idProducto, cantidad }, { headers: headers }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

   stockProductos(idProducto: number, cantidad: number): Observable<any> {
    const headers = this.getHeaders(); // Obtener los headers con el token
    return this.http.post<any>(`${this.urlApi}actualizarStockProducto`, { idProducto, cantidad }, { headers: headers }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }



  listaPaginada(page: number = 1, pageSize: number = 5, searchTerm: string = ''): Observable<any> {
    const url = `${this.urlApi}ListaPaginada?page=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  listaPaginadaCards(
    page: number = 1,
    pageSize: number = 5,
    metodoBusqueda: string = '',
    searchTerm: any | null,
    orden: string = ''
  ): Observable<any> {
    const headers = this.getHeaders();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (metodoBusqueda) {
      params = params.set('metodoBusqueda', metodoBusqueda);
    }
    if (searchTerm) {
      for (const key of Object.keys(searchTerm)) {
        if (searchTerm[key] !== null && searchTerm[key] !== undefined) {
          params = params.set('searchTerm', searchTerm[key]);
        }
      }
    }
    if (orden) {
      params = params.set('orden', orden);
    }

    // 🔍 Ver los parámetros que se van a enviar
    // console.log('🛠️ Parámetros enviados a ListaPaginadaCards:', {
    //   page,
    //   pageSize,
    //   metodoBusqueda,
    //   searchTerm,
    //   orden,
    //   paramsString: params.toString() // Ver cómo quedaría en la URL
    // });
    console.log(params);
    return this.http.get<any>(`${this.urlApi}ListaPaginadaCards`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }




  listaPaginadaCardsCompra(
    page: number,
    pageSize: number,
    metodoBusqueda: string | null,
    searchTerm: any | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (metodoBusqueda !== null) {
      params = params.set('metodoBusqueda', metodoBusqueda);
    }
    if (searchTerm) {
      for (const key of Object.keys(searchTerm)) {
        if (searchTerm[key] !== null && searchTerm[key] !== undefined) {
          params = params.set('searchTerm', searchTerm[key]);
        }
      }
    }
    // if (searchTerm) {
    //   params = params.set('searchTerm', searchTerm);
    // }
    console.log('Params:', params.toString())
    return this.http.get<any>(`${this.urlApi}ListaPaginadaCardsCompra`, { params });
  }

  obtenerProductos(): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}stockbajo`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  guardar(request: Producto): Observable<ReponseApi> {
    const headers = this.getHeaders();
    console.log('Producto lo que esta llegando:', request);
    return this.http.post<ReponseApi>(`${this.urlApi}Guardar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  actualizarIva(nuevoIva: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put<any>(`${this.urlApi}ActualizarIva`, nuevoIva, { headers: headers });
  }
  // ProductoService

  // actualizarImagenProducto(idProducto: number, nuevaImagen: File): Observable<ReponseApi> {

  //   console.log('ID del producto en actualizarImagenProducto:', idProducto);

  //   const formData = new FormData();
  //   formData.append('imagen', nuevaImagen);

  //   const headers = this.getHeaders2();

  //   return this.http.post<ReponseApi>(`${this.urlApi}ActualizarImagen/${idProducto}`, formData, { headers: headers }).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  actualizarImagen(id: number, imagen: File, imagenAReemplazar: string): Observable<any> {
    const headers = this.getHeaders2(); // headers sin "Content-Type" para que lo genere Angular

    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('imagenAReemplazar', imagenAReemplazar);

    return this.http.post<any>(
      `${this.urlApi}ActualizarImagen/${id}`,
      formData,
      { headers: headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  agregarNuevaImagen(id: number, imagen: File): Observable<any> {
    const headers = this.getHeaders2(); // sin Content-Type

    const formData = new FormData();
    formData.append('imagen', imagen);

    return this.http.post<any>(
      `${this.urlApi}AgregarNuevaImagen/${id}`,
      formData,
      { headers: headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  eliminarImagen(id: number, imagenAReemplazar: string): Observable<any> {
    const headers = this.getHeaders2(); // sin Content-Type

    const formData = new FormData();
    formData.append('imagenAReemplazar', imagenAReemplazar);

    return this.http.post<any>(
      `${this.urlApi}EliminarImagen/${id}`,
      formData,
      { headers: headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  obtenerImagenesProducto(idProducto: number): Observable<string[]> {
    const headers = this.getHeaders(); // Usa tu método con JWT

    return this.http.get<string[]>(`${this.urlApi}ObtenerImagenes/${idProducto}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }




  buscarPorNombre(nombre: string): Observable<ReponseApi> {
    const headers = this.getHeaders();
    const url = `${this.urlApi}BuscarPorNombre?nombre=${nombre}`;

    return this.http.get<ReponseApi>(url, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  exportarProductos(): Observable<Blob> {
    const headers = this.getHeaders(); // Añadir headers
    return this.http.get(`${this.urlApi}exportar-productos`, { headers: headers, responseType: 'blob' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  // Método para importar productos
  importarProductos(file: File): Observable<any> {
    const headers = this.getHeaders2(); // Añadir headers
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.urlApi}importar-productos`, formData, { headers: headers, responseType: 'text' }).pipe(
      catchError(this.handleError) // Manejar errores
    );
  }

  obtenerImagenProducto(idProducto: number): Observable<any> {
    const url = `${this.urlApi}imagen/${idProducto}`;
    return this.http.get<any>(url);
  }

  obtenerImagenNombreProducto(nombre: string): Observable<any> {
    const url = `${this.urlApi}imagen/nombre/${nombre}`;
    return this.http.get<any>(url);
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

  editar(request: Producto): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(`${this.urlApi}Editar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.delete<ReponseApi>(`${this.urlApi}Eliminar/${id}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Método para obtener productos por proveedor
  obtenerProductosPorProveedor(idProveedor: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}porProveedor/${idProveedor}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  obtenerProductosPorCategoria(idCategoria: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}porCategoria/${idCategoria}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: any) {
    if (error.status === 404) {
      console.error('Recurso no encontrado:', error.message);
    } else if (error.status === 500) {
      console.error('Error del servidor:', error.message);
    } else {
      console.error('Error en la solicitud:', error);
    }
    return throwError('Ocurrió un error. Por favor, inténtelo de nuevo más tarde.');
  }



  // lista(): Observable<ReponseApi> {

  //   return this.http.get<ReponseApi>(`${this.urlApi}Lista`)
  // }

  // guardar(request: Producto): Observable<ReponseApi> {

  //   return this.http.post<ReponseApi>(`${this.urlApi}Guardar`, request)

  // }

  // editar(request: Producto): Observable<ReponseApi> {

  //   return this.http.put<ReponseApi>(`${this.urlApi}Editar`, request)

  // }

  // eliminar(id: number): Observable<ReponseApi> {

  //   return this.http.delete<ReponseApi>(`${this.urlApi}Eliminar/${id}`)

  // }

  // obtenerProductosPorProveedor(idProveedor: number): Observable<ReponseApi> {
  //   return this.http.get<ReponseApi>(`${this.urlApi}porProveedor/${idProveedor}`);
  // }

  // obtenerProductos(): Observable<ReponseApi> {

  //   return this.http.get<ReponseApi>(`${this.urlApi}stockbajo`)
  // }

  // actualizarImagenProducto(idProducto: number, nuevaImagen: File): Observable<ReponseApi> {
  //   console.log('ID del producto en actualizarImagenProducto:', idProducto);

  //   const formData = new FormData();
  //   formData.append('imagen', nuevaImagen);

  //   return this.http.post<ReponseApi>(`${this.urlApi}ActualizarImagen/${idProducto}`, formData);
  // }

  // verificarNombreExistente(nombre: string): Observable<boolean> {
  //   const url = `${this.urlApi}verificar-nombre/${nombre}`;
  //   return this.http.get<boolean>(url);
  // }
}
