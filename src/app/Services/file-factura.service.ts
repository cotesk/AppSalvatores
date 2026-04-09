import { ArchivoFactura } from './../Interfaces/archivoFactura';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FileFacturaService {

  // private urlApi: string = "http://localhost:5226/api/FileUpload/upload"; // Asegúrate de que la ruta sea correcta
  // private urlApi: string = "http://localhost:5226/api/FileUploadFactura"; //principal y funcional
  // private urlApi: string =  "https://www.sofemprethy.somee.com/api/FileUploadFactura";
  private urlApi: string =  environment.endpoint + "FileUploadFactura";


  constructor(private http: HttpClient) { }


  // getFilesByDate(selectedDate: Date): Observable<Archivo[]> {
  //   const params = new HttpParams().set('selectedDate', selectedDate.toISOString());

  //   return this.http.get<Archivo[]>(`${this.urlApi}/getfilesbydate`, { params });
  // }
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
//orifinal y funcional
  // getFilesByDate(day?: number, month?: number, year?: number): Observable<ArchivoFactura[]> {
  //   const params = new HttpParams()
  //     .set('day', day ? day.toString() : '')
  //     .set('month', month ? month.toString() : '')
  //     .set('year', year ? year.toString() : '');

  //   const headers = this.getHeaders();

  //   return this.http.get<ArchivoFactura[]>(`${this.urlApi}/getfilesbydate`, { params, headers: headers });
  // }
  getFilesByDate(day?: number, month?: number, year?: number, page: number = 1, pageSize: number = 5): Observable<{ data: ArchivoFactura[], total: number, totalPages: number }> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('day', day ? day.toString() : '')
      .set('month', month ? month.toString() : '')
      .set('year', year ? year.toString() : '')
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<{ data: ArchivoFactura[], total: number, totalPages: number }>(`${this.urlApi}/getfilesbydate`, { params, headers: headers }).pipe(
      map(response => {
        const files = response.data.map(file => ({
          ...file,
          fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
        }));
        return { data: files, total: response.total, totalPages: response.totalPages };
      })
    );
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

  // getFiles(): Observable<ArchivoFactura[]> {
  //   const headers = this.getHeaders();
  //   return this.http.get<ArchivoFactura[]>(this.urlApi, { headers: headers }).pipe(
  //     map((files: ArchivoFactura[]) => {
  //       return files.map(file => ({
  //         ...file,
  //         fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
  //       }));
  //     })
  //   );
  // }

  getFiles(page: number = 1, pageSize: number = 5, searchTerm: string | null = null): Observable<{ data: ArchivoFactura[], total: number, totalPages: number }> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    console.log('URL de solicitud:', this.urlApi);
    console.log('Headers:', headers);
    console.log('Parámetros de consulta:', params.toString());

    return this.http.get<{ data: ArchivoFactura[], total: number, totalPages: number }>(this.urlApi, { headers: headers, params: params }).pipe(
      map(response => {
        const files = response.data.map(file => ({
          ...file,
          fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
        }));
        return { data: files, total: response.total, totalPages: response.totalPages };
      })
    );
  }



  GetArchivo(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.urlApi}/${id}`, { headers: headers, responseType: 'blob' });
  }

  deleteFile(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.urlApi}/${id}`, { headers: headers });
  }

  downloadFile(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.urlApi}/${id}`, { headers: headers, responseType: 'json' });
  }
  obtenerUrlPorNombre(nombre: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.urlApi}/obtenerUrlPorNombre/${nombre}`);
  }
  uploadFile(file: File): Observable<any> {
    const headers = this.getHeaders();
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(`${this.urlApi}/upload`, formData, { headers: headers });
  }

  generarYSubirPDF(pdfBase64: string, numeroDocumento: string, Nombre: string): Observable<any> {
    // Convertir el base64 a un blob
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Crear un FormData y agregar el blob
    const formData = new FormData();
    formData.append('pdf', blob, 'archivo.pdf');
    formData.append('numeroDocumento', numeroDocumento);
    formData.append('Nombre', Nombre);

    const headers = this.getHeaders();
    // Realizar la solicitud HTTP POST para subir el PDF
    return this.http.post(`${this.urlApi}/uploadPdf`, formData, { headers: headers });
  }

  enviarEmail(correo: string, nombreArchivo: string, tipo:string): Observable<any> {
    const headers = this.getHeaders().append('Content-Type', 'application/x-www-form-urlencoded');

    const emailRequest = new URLSearchParams();
    emailRequest.set('emailPara', correo);
    emailRequest.set('asunto', 'IMPORTANTE');
    // emailRequest.set('contenido', `Se ha enviado su Factura para su descarga.`);
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



//aqui
// getFilesByDate(day?: number, month?: number, year?: number): Observable<ArchivoFactura[]> {
//   const params = new HttpParams()
//     .set('day', day ? day.toString() : '')
//     .set('month', month ? month.toString() : '')
//     .set('year', year ? year.toString() : '');

//   return this.http.get<ArchivoFactura[]>(`${this.urlApi}/getfilesbydate`, { params });
// }
// // En tu servicio (FileService, por ejemplo)
// getFilesCountByMonth(year: number, month: number): Observable<number> {
//   const url = `${this.urlApi}/files/countByMonth?year=${year}&month=${month}`;
//   return this.http.get<number>(url);
// }
// eliminarTodosArchivos(): Observable<any> {
//   return this.http.delete(`${this.urlApi}/eliminarTodosArchivos`);
// }


// getFiles(): Observable<ArchivoFactura[]> {
//   return this.http.get<ArchivoFactura[]>(this.urlApi).pipe(
//     map((files: ArchivoFactura[]) => {
//       return files.map(file => ({
//         ...file,
//         fechaRegistro: new Date(file.fechaRegistro)  // Convertir a objeto Date
//       }));
//     })
//   );
// }
// GetArchivo(id: number): Observable<any> {
//   return this.http.get(`${this.urlApi}/${id}`, { responseType: 'blob' });
// }
// deleteFile(id: number): Observable<any> {
//   return this.http.delete(`${this.urlApi}/${id}`);
// }
// downloadFile(id: number): Observable<Blob> {
//   return this.http.get(`${this.urlApi}/${id}`, { responseType: 'blob' });
// }
// uploadFile(file: File): Observable<any> {
//   const formData: FormData = new FormData();
//   formData.append('file', file, file.name);

//   return this.http.post(`${this.urlApi}/upload`, formData);
// }


// generarYSubirPDF(pdfBase64: string, numeroDocumento: string, Nombre: string): Observable<any> {
//   // Convertir el base64 a un blob
//   const byteCharacters = atob(pdfBase64);
//   const byteNumbers = new Array(byteCharacters.length);
//   for (let i = 0; i < byteCharacters.length; i++) {
//     byteNumbers[i] = byteCharacters.charCodeAt(i);
//   }
//   const byteArray = new Uint8Array(byteNumbers);
//   const blob = new Blob([byteArray], { type: 'application/pdf' });

//   // Crear un FormData y agregar el blob
//   const formData = new FormData();
//   formData.append('pdf', blob, 'archivo.pdf');
//   formData.append('numeroDocumento', numeroDocumento);
//   formData.append('Nombre', Nombre);
//   // Realizar la solicitud HTTP POST para subir el PDF
//   return this.http.post(`${this.urlApi}/uploadPdf`, formData);
// }




}
