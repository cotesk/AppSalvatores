
import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { FileService } from '../../../../Services/file.service';
interface Archivo {
  id: number;
  nombre: string;
  tipo: string;
  datos: string; // Aquí debes ajustar el tipo según tus necesidades
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

  @ViewChild('fileInput') fileInput!: ElementRef<any>;


  fileToUpload: File | null = null;
  archivoDescargado: Archivo | null = null;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';

  constructor(private http: HttpClient,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,
    private fileService: FileService,
  ) { }

  handleFileInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.fileToUpload = inputElement.files.item(0);
    }
  }
  clearFile() {
    // Resetea la variable que contiene el archivo seleccionado
    this.fileToUpload = null;
    this.archivoDescargado = null;

    // Limpia el campo de entrada de archivos (input type="file")
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';

      // Restablece el valor del campo, ya que algunos navegadores no permiten
      // restablecer directamente el valor del campo de entrada de archivos
      this.fileInput.nativeElement.type = 'text';
      this.fileInput.nativeElement.type = 'file';
    }
  }

  resetComponent(): void {
    // Restablece todas las variables a su estado inicial
    this.fileToUpload = null;
    this.clearFile();
    this.archivoDescargado = null;
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No se encontró un token JWT en el almacenamiento local.');
      throw new Error('No se encontró un token JWT en el almacenamiento local.');
    }
    return new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });
  }
  uploadFile(): void {
    if (this.fileToUpload) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Seguro que deseas subir este archivo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, subir archivo',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          if (this.fileToUpload) {
            this.fileService.uploadFile(this.fileToUpload).subscribe(
              (response: any) => {
                console.log('Archivo subido exitosamente', response);
                Swal.fire({
                  icon: 'success',
                  title: 'Archivo Subido',
                  text: 'Archivo subido correctamente'
                });
                this.clearFile();
              },
              (error: any) => {
                console.error('Error al subir el archivo', error);

                let idUsuario: number = 0;

                const usuarioString = localStorage.getItem('usuario');
                const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
                const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
                if (datosDesencriptados !== null) {
                  const usuario = JSON.parse(datosDesencriptados);
                  idUsuario = usuario.idUsuario;

                  this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
                    (usuario: any) => {
                      console.log('Usuario obtenido:', usuario);
                      let refreshToken = usuario.refreshToken;

                      this._usuarioServicio.renovarToken(refreshToken).subscribe(
                        (response: any) => {
                          console.log('Token actualizado:', response.token);
                          localStorage.setItem('authToken', response.token);
                          this.subirArchivo(this.fileToUpload!);
                        },
                        (error: any) => {
                          console.error('Error al actualizar el token:', error);
                        }
                      );
                    },
                    (error: any) => {
                      console.error('Error al obtener el usuario:', error);
                    }
                  );
                }
              }
            );
          }
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Por favor selecciona un archivo antes de subirlo'
      });
    }
  }

  subirArchivo(fileToUpload:File ) {
    this.fileService.uploadFile(this.fileToUpload!).subscribe(
      (response: any) => {
        console.log('Archivo subido exitosamente', response);
        Swal.fire({
          icon: 'success',
          title: 'Archivo Subido',
          text: 'Archivo subido correctamente'
        });
        this.clearFile();
      },
      (error: any) => {
        console.error('Error al subir el archivo', error);

        let idUsuario: number = 0;

        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario;

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {
              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken;

              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  localStorage.setItem('authToken', response.token);
                  this.uploadFile();
                },
                (error: any) => {
                  console.error('Error al actualizar el token:', error);
                }
              );
            },
            (error: any) => {
              console.error('Error al obtener el usuario:', error);
            }
          );
        }
      }
    );
  }

}


