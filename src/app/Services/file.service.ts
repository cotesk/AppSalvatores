import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Archivo } from '../Interfaces/archivo';
@Injectable({
  providedIn: 'root'
})
export class FileService {
  // private urlApi: string = "http://localhost:5226/api/FileUpload/upload"; // Asegúrate de que la ruta sea correcta
  // private urlApi: string = "http://localhost:5226/api/FileUpload"; //principal y funcional
  // private urlApi: string = environment.endpoint + "FileUpload"
  //  private urlApi: string =  "https://www.sofemprethy.somee.com/api/FileUpload";
   private urlApi: string =  environment.endpoint + "FileUpload";

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No se encontró un token JWT en el almacenamiento local.');
      throw new Error('No se encontró un token JWT en el almacenamiento local.');
    }
    return new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });
  }

  uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    const headers = this.getHeaders();
    return this.http.post(`${this.urlApi}/upload`, formData, { headers: headers }).pipe(
      catchError(error => {
        console.error('Error al subir el archivo', error);
        return throwError(error);
      })
    );
  }


  getFilesByDate(day?: number, month?: number, year?: number): Observable<Archivo[]> {
    const params = new HttpParams()
      .set('day', day ? day.toString() : '')
      .set('month', month ? month.toString() : '')
      .set('year', year ? year.toString() : '');

    const headers = this.getHeaders();

    return this.http.get<Archivo[]>(`${this.urlApi}/getfilesbydate`, { params, headers: headers });
  }

  getFilesCountByMonth(year: number, month: number): Observable<number> {
    const url = `${this.urlApi}/files/countByMonth?year=${year}&month=${month}`;
    const headers = this.getHeaders();
    return this.http.get<number>(url, { headers: headers });
  }

  eliminarTodosArchivos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.urlApi}/eliminarTodosArchivos`, { headers: headers });
  }
  obtenerUrlPorNombre(nombre: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.urlApi}/obtenerUrlPorNombre/${nombre}`);
  }
  enviarEmail(correo: string, nombreArchivo: string, tipo:string): Observable<any> {
    const headers = this.getHeaders().append('Content-Type', 'application/x-www-form-urlencoded');

    const emailRequest = new URLSearchParams();
    emailRequest.set('emailPara', correo);
    emailRequest.set('asunto', 'IMPORTANTE');
    // emailRequest.set('contenido', `Se ha enviado su archivo a su correo: "${nombreArchivo}" para su descarga.`);
    // emailRequest.set('contenido', `Se ha enviado su archivo a su correo  para su descarga.`);
    emailRequest.set('urlPdf', nombreArchivo );
    emailRequest.set('tipo', tipo );

    console.log("Enviando correo electrónico:", emailRequest.toString());

    return this.http.post(`${this.urlApi}/sendemail`, emailRequest.toString(), { headers: headers })
    .pipe(
      catchError(error => {
        console.error("Error al enviar el correo electrónico:", "color: #ff5722; font-size: 16px; font-weight: bold;", error);
        throw error;
      })
    );
}



  getFiles(): Observable<Archivo[]> {
    const headers = this.getHeaders();
    return this.http.get<Archivo[]>(this.urlApi, { headers: headers }).pipe(
      map((files: Archivo[]) => {
        return files.map(file => ({
          ...file,
          fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
        }));
      })
    );
  }
  // getFiles(page: number = 1, pageSize: number = 5, searchTerm: string | null = null): Observable<{ data: Archivo[], total: number, totalPages: number }> {
  //   const headers = this.getHeaders();
  //   let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('pageSize', pageSize.toString());

  //   if (searchTerm) {
  //     params = params.set('searchTerm', searchTerm);
  //   }

  //   return this.http.get<{ data: Archivo[], total: number, totalPages: number }>(this.urlApi, { headers: headers, params: params }).pipe(
  //     map(response => {
  //       const files = response.data.map(file => ({
  //         ...file,
  //         fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
  //       }));
  //       return { data: files, total: response.total, totalPages: response.totalPages };
  //     })
  //   );
  // }
  deleteFile(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.urlApi}/${id}`, { headers: headers });
  }

  downloadFile(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.urlApi}/${id}`, { headers: headers, responseType: 'json' });
  }

  // uploadFile(file: File): Observable<any> {
  //   const formData: FormData = new FormData();
  //   formData.append('file', file, file.name);

  //   return this.http.post(`${this.urlApi}/upload`, formData);
  // }
  // getFilesByDate(day?: number, month?: number, year?: number): Observable<Archivo[]> {
  //   const params = new HttpParams()
  //     .set('day', day ? day.toString() : '')
  //     .set('month', month ? month.toString() : '')
  //     .set('year', year ? year.toString() : '');

  //   return this.http.get<Archivo[]>(`${this.urlApi}/getfilesbydate`, { params });
  // }
  // // En tu servicio (FileService, por ejemplo)
  // getFilesCountByMonth(year: number, month: number): Observable<number> {
  //   const url = `${this.urlApi}/files/countByMonth?year=${year}&month=${month}`;
  //   return this.http.get<number>(url);
  // }
  // eliminarTodosArchivos(): Observable<any> {
  //   return this.http.delete(`${this.urlApi}/eliminarTodosArchivos`);
  // }


  // getFiles(): Observable<Archivo[]> {
  //   return this.http.get<Archivo[]>(this.urlApi).pipe(
  //     map((files: Archivo[]) => {
  //       return files.map(file => ({
  //         ...file,
  //         fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
  //       }));
  //     })
  //   );
  // }

  // deleteFile(id: number): Observable<any> {
  //   return this.http.delete(`${this.urlApi}/${id}`);
  // }
  // downloadFile(id: number): Observable<Blob> {
  //   return this.http.get(`${this.urlApi}/${id}`, { responseType: 'blob' });
  // }

}
