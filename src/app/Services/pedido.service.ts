import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Pedido } from '../Interfaces/pedido';

import { ReponseApi } from '../Interfaces/reponse-api';
import { PedidosPorMesaResponse } from '../Interfaces/pedidosPorMesaResponse ';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private urlApi: string = environment.endpoint + "Pedido/";

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


  registrar(request: Pedido, tipo: any): Observable<ReponseApi> {
    const headers = this.getHeaders();
    console.log('Datos enviados al servidor Venta:', request);
    return this.http.post<ReponseApi>(`${this.urlApi}Registrar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }



  //   registrar(request: Pedido): Observable<ReponseApi> {
  //   const headers = this.getHeaders();

  //   // ✅ Limpiar campos innecesarios de cada producto en el detalle
  //   const cleanRequest: Pedido = {
  //     ...request,
  //     detallePedido: request.detallePedido.map(item => ({
  //       idProducto: item.idProducto,
  //       descripcionProducto: item.descripcionProducto,
  //       idMesa: item.idMesa,
  //       nombreMesa: item.nombreMesa,
  //       tipoMesa: item.tipoMesa,
  //       cantidad: item.cantidad,
  //       precioUnitarioTexto: item.precioUnitarioTexto,
  //       unidadMedidaTexto: item.unidadMedidaTexto,
  //       comentario: item.comentario,
  //       totalTexto: item.totalTexto
  //     }))
  //   };

  //   console.log('Datos enviados al servidor Venta (limpios):', cleanRequest);

  //   return this.http.post<ReponseApi>(`${this.urlApi}Registrar`, cleanRequest, { headers }).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  editarPedido(id: number, pedido: Pedido): Observable<void> {
    return this.http.put<void>(`${this.urlApi}editar/${id}`, pedido, {
      headers: this.getHeaders()
    });
  }


  actualizarPedido(id: number, pedido: Pedido): Observable<void> {

    console.log("📤 Enviando a backend (Angular):", JSON.stringify(pedido, null, 2));

    return this.http.put<void>(`${this.urlApi}actualizar/${id}`, pedido, {
      headers: this.getHeaders()
    });
  }


  anularPedido(idPedido: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(`${this.urlApi}Anular/${idPedido}`, {}, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  obtenerPedidosIdPedido(idPedido: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.urlApi}Buscar/${idPedido}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  buscarPedidoPorIdUsuario(idUsuario: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.urlApi}PorUsuario/${idUsuario}`, {
      headers: this.getHeaders()
    });
  }

  //  buscarPedidoPorIdUsuarioAdmin(idUsuario: number): Observable<Pedido> {
  //   return this.http.get<Pedido>(`${this.urlApi}PorUsuarioAdmin/${idUsuario}`, {
  //     headers: this.getHeaders()
  //   });
  // }
  // ✅ Método para obtener pedidos por usuario con paginación
  buscarPedidoPorIdUsuarioAdmin(
    idUsuario: number,
    page: number = 1,
    pageSize: number = 5,
    metodoBusqueda: string | null = null,
    searchTerm: string | null = null,
    fechaInicio: string | null = null,
    fechaFin: string | null = null
  ): Observable<ReponseApi> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (metodoBusqueda) params = params.set('metodoBusqueda', metodoBusqueda);
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<ReponseApi>(`${this.urlApi}PorUsuarioAdmin/${idUsuario}`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }


  obtenerPedidosPorMesa(idMesa: number, pagina: number, tamanioPagina: number): Observable<PedidosPorMesaResponse> {
    const headers = this.getHeaders();
    const url = `${this.urlApi}PedidosPorMesa/${idMesa}?page=${pagina}&pageSize=${tamanioPagina}`;
    console.log('URL solicitada:', url);
    return this.http.get<PedidosPorMesaResponse>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }





  obtenerTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.urlApi); // sin headers porque no está protegido
  }


  private handleError(error: any) {
    console.error('Error en el servicio Pedido:', error);

    let mensaje = 'Ocurrió un error desconocido.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensaje = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      mensaje = `
      Código de estado: ${error.status}
      Mensaje del servidor: ${error.message}
      Detalles: ${JSON.stringify(error.error)}
    `;
    }

    return throwError(() => new Error(mensaje));
  }



  // imprimirCocina(pedido: Pedido): Observable<ReponseApi> {
  //   const headers = this.getHeaders();

  //   console.log('🖨️ Enviando pedido a cocina:', pedido);

  //   return this.http.post<ReponseApi>(
  //     `${this.urlApi}imprimir-cocina`,
  //     pedido,
  //     { headers }
  //   ).pipe(
  //     catchError(this.handleError)
  //   );
  // }



  // imprimirCocina(pedido: Pedido, esReimpresion: boolean = false): Observable<ReponseApi> {
  //   const headers = this.getHeaders();

  //   const params = new HttpParams()
  //     .set('esReimpresion', esReimpresion);

  //   console.log('🖨️ Enviando pedido a impresión:', pedido, 'Reimpresión:', esReimpresion);

  //   return this.http.post<ReponseApi>(
  //     `${this.urlApi}imprimir-cocina`,
  //     pedido,
  //     { headers, params }
  //   ).pipe(
  //     catchError(this.handleError)
  //   );
  // }


  imprimirCocina(pedido: any, esReimpresion: boolean = false) {
    const headers = this.getHeaders();

    const params = new HttpParams()
      .set('esReimpresion', esReimpresion);

    return this.http.post<any>(
      `${this.urlApi}imprimir-cocina?esReimpresion=${esReimpresion}`,
      pedido,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

}
