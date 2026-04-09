import { Venta } from './../Interfaces/venta';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { ReponseApi } from '../Interfaces/reponse-api';
import { HistorialResponse } from '../Interfaces/HistorialResponse ';
import { VentasFiadasResponseDTO } from '../Interfaces/ventasFiadasResponseDTO';
import { PagoFiadoDTO2 } from '../Interfaces/pagoFiadoDTO2';
import { PagoFiadoDTO } from '../Interfaces/pagoFiadoDTO';
import { EditarTipoVenta } from '../Interfaces/editarTipoVenta';

@Injectable({
  providedIn: 'root'
})
export class VentaService {



  private urlApi: string = environment.endpoint + "Venta/"


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


  obtenerVentasFiadasPorDocumento(numeroDocumento: string): Observable<VentasFiadasResponseDTO> {
    return this.http.get<VentasFiadasResponseDTO>(
      `${this.urlApi}BuscarNumeroDocumento?numeroDocumento=${numeroDocumento}`
    );
  }

  obtenerTodasVentasFiadasPorDocumento(idCliente: number): Observable<VentasFiadasResponseDTO> {
    const headers = this.getHeaders();
    return this.http.get<VentasFiadasResponseDTO>(
      `${this.urlApi}BuscarFiadoPorCliente/${idCliente}`,
      { headers: headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  pagarFiadoPorCliente(dto: PagoFiadoDTO): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.post<ReponseApi>(`${this.urlApi}PagarFiadoPorCliente`, dto, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  pagarUnSoloFiadoPorCliente(dto: PagoFiadoDTO2): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.post<ReponseApi>(`${this.urlApi}PagarUnSoloFiadoPorCliente`, dto, { headers }).pipe(
      catchError(this.handleError)
    );
  }


  registrar(request: Venta): Observable<ReponseApi> {
    const headers = this.getHeaders();
    console.log('Datos enviados al servidor Venta:', request);
    return this.http.post<ReponseApi>(`${this.urlApi}Registrar`, request, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  completarHeladeria(idVenta: number): Observable<ReponseApi> {
    const headers = this.getHeaders();

    return this.http.post<ReponseApi>(
      `${this.urlApi}CompletarHeladeria/${idVenta}`,
      {}, 
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  historial(buscarPor: string, numeroVenta: string, fechaInicio: string, fechaFin: string): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}Historial?buscarPor=${buscarPor}&numeroVenta=${numeroVenta}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getVentaPorDocumento(numeroDocumento: string): Observable<ReponseApi> {
    // const headers = this.getHeaders();
    return this.http.get<ReponseApi>(
      `${this.urlApi}BuscarNumeroDocumento?numeroDocumento=${numeroDocumento}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }



  // historial(buscarPor: string, numeroVenta: string, fechaInicio: string, fechaFin: string, page: number, pageSize: number, searchTerm: string | null): Observable<[HistorialResponse, number, number]> {
  //   const headers = this.getHeaders();
  //   return this.http.get<[HistorialResponse, number, number]>(`${this.urlApi}Historial?buscarPor=${buscarPor}&numeroVenta=${numeroVenta}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&page=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}`, { headers: headers }).pipe(
  //     catchError(this.handleError)
  //   );
  // }



  // reporte(fechaInicio:string,fechaFin:string):Observable<ReponseApi>{

  //   return this.http.get<ReponseApi>(`${this.urlApi}Reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)

  // }
  reporte(fechaInicio: string, fechaFin: string, anulada: boolean): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.get<ReponseApi>(`${this.urlApi}Reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&anulada=${anulada}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  anularVenta(idVenta: number): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(`${this.urlApi}Anular/${idVenta}`, {}, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
  obtenerVentaIdVenta(idVenta: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.urlApi}Buscar/${idVenta}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  buscarClienteCredito(cedula: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.urlApi}BuscarClienteCredito/${cedula}`, { headers });
  }

  private handleError(error: any) {
    console.error('Error en la solicitud:', error);
    return throwError('Ocurrió un error en la solicitud. Por favor, inténtelo de nuevo más tarde.');
  }

  editarTipoDeVenta(idVenta: number, dto: EditarTipoVenta): Observable<ReponseApi> {
    const headers = this.getHeaders();
    return this.http.put<ReponseApi>(
      `${this.urlApi}EditarTipoDeVenta/${idVenta}`,
      dto,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // registrar(request: Venta): Observable<ReponseApi> {
  //   console.log('Datos enviados al servidor:', request);
  //   return this.http.post<ReponseApi>(`${this.urlApi}Registrar`, request);
  // }


  // historial(buscarPor:string,numeroVenta:string,fechaInicio:string,fechaFin:string):Observable<ReponseApi>{

  //   return this.http.get<ReponseApi>(`${this.urlApi}Historial?buscarPor=${buscarPor}&numeroVenta=${numeroVenta}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)

  // }
  // reporte(fechaInicio: string, fechaFin: string, anulada: boolean): Observable<ReponseApi> {
  //   return this.http.get<ReponseApi>(`${this.urlApi}Reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&anulada=${anulada}`);
  // }

  // anularVenta(idVenta: number): Observable<ReponseApi> {
  //   return this.http.put<ReponseApi>(`${this.urlApi}Anular/${idVenta}`, {});
  // }



}
