import { FileFacturaService } from './../../../../Services/file-factura.service';


import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfirmDialogComponent } from '../../Modales/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatSort } from '@angular/material/sort';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import React from 'react';
import { Document, Page } from 'react-pdf'; // O importa el componente adecuado según la biblioteca que elijas para PDF
// import ExcelRenderer from 'react-excel-renderer'; // Solo si decides utilizar un visor de XLSX
import { NgxExtendedPdfViewerComponent } from 'ngx-extended-pdf-viewer';
import { NgZone } from '@angular/core';
import Swal from 'sweetalert2';
import { ArchivoFactura } from '../../../../Interfaces/archivoFactura';
import { WhatsappService } from '../../../../Services/whatsappService .service';
import * as CryptoJS from 'crypto-js';
import { UsuariosService } from '../../../../Services/usuarios.service';

@Component({
  selector: 'app-file-list-factura',
  templateUrl: './file-list-factura.component.html',
  styleUrls: ['./file-list-factura.component.css'],
  providers: [DatePipe]
})
export class FileListFacturaComponent implements OnInit, AfterViewInit {

  ArchivoFacturas: ArchivoFactura[] = [];
  columnas: string[] = ['id', 'nombre', 'tipo', 'fechaRegistro', 'numeroDocumento', 'acciones'];
  filtro: string = '';
  dataInicio: ArchivoFactura[] = [];
  dataListaArchivoFacturas = new MatTableDataSource(this.dataInicio);
  // dataSource = new MatTableDataSource<ArchivoFactura>(this.ArchivoFacturas);
  filtroFecha: Date | undefined;
  filtroTipo: string = 'texto'; // Por defecto, filtrar por texto
  botonBuscarDesactivado: boolean = true;
  filteredData = new MatTableDataSource(this.ArchivoFacturas);
  selectedDate: Date | null = new Date();
  fechaForm: FormGroup;
  isBusquedaActiva: boolean = false;
  isBusquedaFecha: boolean = false;
  hasRealizadoBusqueda: boolean = true;
  day: number | undefined;
  month: number | undefined;
  year: number | undefined;
  isEliminarArchivoFacturasSelected: boolean = false;
  noRecords: boolean = false;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('inputFiltro') inputFiltro!: ElementRef;
  @ViewChild(MatSort) sort!: MatSort;

  page = 1;
  pageSize = 5;
  totalFacturas = 0;
  totalPages = 0;
  searchTerm = '';


  constructor(private http: HttpClient,
    private fileService: FileFacturaService,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private _utilidadServicio: UtilidadService,
    private fb: FormBuilder,
    private zone: NgZone,
    private whatsappService: WhatsappService,
    private _usuarioServicio: UsuariosService,
  ) {
    this.filtroFecha = new Date();
    this.fechaForm = this.fb.group({
      fechaInput: new FormControl('', [Validators.required, this.fechaValidator()])
    });

  }
  fechaValidator() {
    return (control: { value: string }) => {
      const fechaRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{2}$/;  // Formato DD/MM/YYYY
      const esValido = fechaRegex.test(control.value);

      return esValido ? null : { formatoInvalido: true };
    };
  }

  // Esta es la original y funcional

  // applyDateFilter(): void {
  //   if (this.day || this.month || this.year) {
  //     const filterParams: { day?: number, month?: number, year?: number } = {};
  //     if (this.day) filterParams.day = this.day;
  //     if (this.month) filterParams.month = this.month;
  //     if (this.year) filterParams.year = this.year;

  //     const filterDate: Date = new Date(filterParams.year || 0, (filterParams.month || 1) - 1, filterParams.day || 1);

  //     this.fileService.getFilesByDate(filterParams.day, filterParams.month, filterParams.year).subscribe(
  //       ArchivoFacturas => {
  //         this.ArchivoFacturas = ArchivoFacturas;
  //         this.dataListaArchivoFacturas.data = this.ArchivoFacturas;

  //         // Verificar si la lista de ArchivoFacturas está vacía después de la búsqueda
  //         if (this.ArchivoFacturas.length === 0) {
  //           this.mostrarErrorSinArchivoFacturas();
  //         }
  //       },
  //       error => {
  //         console.error('Error al obtener ArchivoFacturas por fecha', error);
  //         this.mostrarErrorSinArchivoFacturas();
  //       }
  //     );
  //   }
  // }
  applyDateFilter(): void {
    if (this.day || this.month || this.year) {
      const filterParams: { day?: number, month?: number, year?: number } = {};
      if (this.day) filterParams.day = this.day;
      if (this.month) filterParams.month = this.month;
      if (this.year) filterParams.year = this.year;

      const filterDate: Date = new Date(filterParams.year || 0, (filterParams.month || 1) - 1, filterParams.day || 1);

      this.fileService.getFilesByDate(filterParams.day, filterParams.month, filterParams.year, this.page, this.pageSize).subscribe(
        response => {
          this.ArchivoFacturas = response.data;
          this.dataListaArchivoFacturas.data = this.ArchivoFacturas;
          this.totalFacturas = response.total;
          this.totalPages = response.totalPages;
          this.noRecords = this.ArchivoFacturas.length === 0;


        },
        error => {

          if (error.status === 401) {
            let idUsuario: number = 0;


            // Obtener el idUsuario del localStorage
            const usuarioString = localStorage.getItem('usuario');
            const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
            const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
            if (datosDesencriptados !== null) {
              const usuario = JSON.parse(datosDesencriptados);
              idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

              this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
                (usuario: any) => {

                  console.log('Usuario obtenido:', usuario);
                  let refreshToken = usuario.refreshToken

                  // Manejar la renovación del token
                  this._usuarioServicio.renovarToken(refreshToken).subscribe(
                    (response: any) => {
                      console.log('Token actualizado:', response.token);
                      // Guardar el nuevo token de acceso en el almacenamiento local
                      localStorage.setItem('authToken', response.token);
                      this.applyDateFilter();

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
          } else {
            console.error('Error al obtener ArchivoFacturas por fecha', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontraron Archivo Facturas para la búsqueda especificada.'
            });
            this.noRecords = true;

          }

        }
      );
    }
  }



  isFechaValida(): boolean {
    if (this.day || this.month || this.year) {
      // Realiza la validación según los campos que estén llenos
      if (this.day && (this.day < 1 || this.day > 31)) return false;
      if (this.month && (this.month < 1 || this.month > 12)) return false;
      if (this.year && (this.year < 1900 || this.year > 2100)) return false;

      return true;
    }
    return false;
  }

  // FileListComponent.ts

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear().toString().slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  cambiarTipoFiltro(): void {
    if (this.filtroTipo == 'fecha') {
      // this.isBusquedaFecha = false;
      // this.isEliminarArchivoFacturasSelected = false; // Asegúrate de que esté desactivado si se selecciona "Fecha"
      this.day = undefined;
      this.month = undefined;
      this.year = undefined;
      this.filtro = '';
      this.aplicarFiltroTabla();
      // this.loadFiles();
    } else if (this.filtroTipo == 'eliminar') {
      // this.isEliminarArchivoFacturasSelected = true;
      // this.isBusquedaFecha = false; // Desactiva la búsqueda por fecha si se selecciona "Eliminar ArchivoFacturas"
      this.filtro = '';
      this.aplicarFiltroTabla();
      // this.loadFiles();
    } else {
      this.filtro = '';
      this.aplicarFiltroTabla();
    }
  }


  limpiarYRecargarTabla(): void {
    // Limpiar campos de fecha y texto
    this.filtro = '';
    this.day = undefined;
    this.month = undefined;
    this.year = undefined;
    this.isBusquedaActiva = false;

    // Limpiar filtro y reiniciar la tabla
    this.clearDateFilter();
    this.loadFiles();
  }



  clearDateFilter() {
    console.log('Limpiando filtro por fecha...');
    this.selectedDate = null;
    this.day = undefined;  // Restablece el valor del día
    this.month = undefined;  // Restablece el valor del mes
    this.year = undefined;  // Restablece el valor del año
    this.filtro = '';
    this.dataListaArchivoFacturas = new MatTableDataSource<ArchivoFactura>([]);
    this.dataListaArchivoFacturas.paginator = this.paginator;
    Swal.fire({
      icon: 'success',
      title: 'Limpiando y Recargando',
      text: `Se limpiará todo y se reiniciará la tabla`,
    });
    // this._utilidadServicio.mostrarAlerta("Se limpiará todo y se reiniciará la tabla", 'Ok!');
    this.loadFiles();
  }

  onFechaInputChange(event: MatDatepickerInputEvent<Date | null>): void {
    if (event.value !== null) {
      this.filtroFecha = event.value;
    } else {
      this.filtroFecha = undefined;
    }
    this.aplicarFiltroTabla();
  }



  ngOnInit(): void {
    this.loadFiles();
    this.dataListaArchivoFacturas.paginator = this.paginator;
  }
  ngAfterViewInit(): void {
    this.dataListaArchivoFacturas.paginator = this.paginator;
    this.dataListaArchivoFacturas.sort = this.sort;
    // this.dataListaArchivoFacturas.sort = this.sort;
  }
  // aplicarFiltroTabla(): void {
  //   let textoFiltro = this.filtro.trim().toLowerCase();

  //   if (this.filtroTipo === 'fecha' && this.filtroFecha instanceof Date) {
  //     const formattedDate = moment(this.filtroFecha).format('M/D/YY');
  //     textoFiltro = formattedDate;
  //   }

  //   this.dataListaArchivoFacturas.filter = textoFiltro;

  //   if (this.dataListaArchivoFacturas.paginator) {
  //     this.dataListaArchivoFacturas.paginator.firstPage();
  //   }
  // }
  aplicarFiltroTabla() {
    const textoFiltro = this.filtro.trim().toLowerCase();
    if (textoFiltro === '') {
      this.loadFiles();
    } else {

      this.fileService.getFiles(1, 15, textoFiltro).subscribe(response => {
        this.dataListaArchivoFacturas.data = response.data;
        this.totalFacturas = response.total;
        this.totalPages = response.totalPages;
        this.noRecords = this.totalFacturas === 0;

        // Asegúrate de que el paginador esté configurado después de actualizar los datos
        if (this.paginator) {
          this.paginator.firstPage();
        }

        // Asegúrate de que el ordenador esté configurado después de actualizar los datos
        if (this.sort) {
          this.dataListaArchivoFacturas.sort = this.sort;
        }
      },
        error => {

          if (error.status === 401) {
            console.error('Error al descargar el ArchivoFactura', error);
            // Agrega lógica para manejar el error, como mostrar un mensaje al usuario
            let idUsuario: number = 0;


            // Obtener el idUsuario del localStorage
            const usuarioString = localStorage.getItem('usuario');
            const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
            const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
            if (datosDesencriptados !== null) {
              const usuario = JSON.parse(datosDesencriptados);
              idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

              this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
                (usuario: any) => {

                  console.log('Usuario obtenido:', usuario);
                  let refreshToken = usuario.refreshToken

                  // Manejar la renovación del token
                  this._usuarioServicio.renovarToken(refreshToken).subscribe(
                    (response: any) => {
                      console.log('Token actualizado:', response.token);
                      // Guardar el nuevo token de acceso en el almacenamiento local
                      localStorage.setItem('authToken', response.token);
                      this.aplicarFiltroTabla();

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
          } else {
            console.error('Error al obtener ArchivoFacturas', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al obtener los archivos.'
            });
          }

        });

    }

  }

  calcularPaginaDelArchivo(archivoBuscado: ArchivoFactura): number {
    // Obtener el índice del archivo buscado dentro del array completo (no el array paginado)
    const indiceArchivo = this.ArchivoFacturas.findIndex(archivo =>
      archivo.id === archivoBuscado.id // Asumiendo que el identificador (id) es único
    );
    console.log('Índice del Archivo Buscado:', indiceArchivo);
    // Calcular la página basada en el índice del archivo dentro del array completo
    if (indiceArchivo !== -1) {
      return Math.floor(indiceArchivo / this.pageSize);
    } else {
      return 0; // Si no se encuentra el archivo, se asume que está en la primera página
    }
  }


  getFileNameWithoutExtension(fullFileName: string): string {
    // Encuentra la última aparición del punto en el nombre del ArchivoFactura
    const lastDotIndex = fullFileName.lastIndexOf('.');

    // Si hay un punto y no es el primer o último carácter
    if (lastDotIndex !== -1 && lastDotIndex !== 0 && lastDotIndex !== fullFileName.length - 1) {
      // Extrae el nombre del ArchivoFactura sin la extensión
      return fullFileName.slice(0, lastDotIndex);
    } else {
      // Si no se encuentra un punto o está en el primer o último carácter,
      // simplemente devuelve el nombre completo
      return fullFileName;
    }
  }


  getFileTypeLabel(type: string): string {
    switch (type) {
      case 'application/pdf':
        return 'PDF';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'xlsx';
      // Agrega más casos según sea necesario
      default:
        return type;
    }
  }




  // applyFilter(): void {
  //   console.log('Aplicando filtro:', this.filtro);
  //   this.dataListaArchivoFacturas.filter = this.filtro.trim().toLowerCase();
  // }
  confirmDeleteFile(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { message: '¿Estás seguro de que deseas eliminar este archivo factura?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si el usuario confirma, procede con la eliminación
        this.deleteFile(id);
      }
    });
  }
  // loadFiles(): void {
  //   // Haz una solicitud HTTP para obtener la lista de ArchivoFacturas desde tu API
  //   this.fileService.getFiles().subscribe((files) => {
  //     this.ArchivoFacturas = files.map(file => ({
  //       ...file,

  //     }));
  //     this.dataListaArchivoFacturas.data = this.ArchivoFacturas;
  //   });

  // }
  loadFiles(): void {
    this.fileService.getFiles(this.page, this.pageSize).subscribe((response) => {
      this.ArchivoFacturas = response.data.map(file => ({ ...file }));
      this.dataListaArchivoFacturas.data = response.data;
      this.totalFacturas = response.total;
      this.totalPages = response.totalPages;

      // Verifica si no hay registros y establece la bandera en consecuencia
      this.noRecords = this.ArchivoFacturas.length === 0;
      this.dataListaArchivoFacturas.paginator = this.paginator;
    }, error => {
      console.error('Error al descargar el ArchivoFactura', error);
      // Agrega lógica para manejar el error, como mostrar un mensaje al usuario
      let idUsuario: number = 0;


      // Obtener el idUsuario del localStorage
      const usuarioString = localStorage.getItem('usuario');
      const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados !== null) {
        const usuario = JSON.parse(datosDesencriptados);
        idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

        this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
          (usuario: any) => {

            console.log('Usuario obtenido:', usuario);
            let refreshToken = usuario.refreshToken

            // Manejar la renovación del token
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                console.log('Token actualizado:', response.token);
                // Guardar el nuevo token de acceso en el almacenamiento local
                localStorage.setItem('authToken', response.token);
                this.loadFiles();

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
    });
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadFiles();
      // if (this.filtroTipo === 'fecha') {
      //   this.applyDateFilter();
      // } else {
      //   this.loadFiles();
      // }
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.loadFiles();
      // if (this.filtroTipo === 'fecha') {
      //   this.applyDateFilter();
      // } else {
      //   this.loadFiles();
      // }
    }
  }

  firstPage() {
    this.page = 1;
    this.loadFiles();
    // if (this.filtroTipo === 'fecha') {
    //   this.applyDateFilter();
    // } else {
    //   this.loadFiles();
    // }
  }

  lastPage() {
    this.page = this.totalPages;
    this.loadFiles();
    // if (this.filtroTipo === 'fecha') {
    //   this.applyDateFilter();
    // } else {
    //   this.loadFiles();
    // }
  }
  pageSizeChange() {
    this.page = 1;
    this.loadFiles();
    // if (this.filtroTipo === 'fecha') {
    //   this.applyDateFilter();
    // } else {
    //   this.loadFiles();
    // }
  }

  openPdfViewerModal(fileUrl: string): void {
    const dialogRef = this.dialog.open(NgxExtendedPdfViewerComponent, {
      width: '80%',
      data: {
        src: fileUrl,
      },
    });

    dialogRef.afterOpened().subscribe(() => {
      console.log('Modal abierto');
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Modal cerrado');
    });
  }



  //funcional
  // enviarPorWhatsApp(nombre: string): void {
  //   this.fileService.obtenerUrlPorNombre(nombre).subscribe(
  //     (data: { url: string }) => {
  //       const blobUrl = data.url;

  //       const numeroTelefono = prompt('Por favor ingrese su número de teléfono:');

  //       if (numeroTelefono) {
  //         const mensaje = `¡Hola! Aquí tienes el enlace para descargar tu factura : ${blobUrl}`;
  //         const urlWhatsApp = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`;
  //         window.open(urlWhatsApp);
  //       } else {
  //         alert('Por favor ingrese un número de teléfono válido.');
  //       }
  //     },
  //     (error) => {
  //       console.error('Error al obtener el archivo PDF:', error);
  //       alert('Ocurrió un error al obtener el archivo PDF.');
  //     }
  //   );
  // }

  //funcional
  enviarPorWhatsApp(nombre: string): void {
    this.fileService.obtenerUrlPorNombre(nombre).subscribe(
      (data: { url: string }) => {
        const blobUrl = data.url;

        Swal.fire({
          title: 'Ingrese el número de teléfono',
          input: 'tel',
          inputLabel: 'Número de teléfono',
          inputPlaceholder: 'Ej. +1234567890',
          inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
          },
          showCancelButton: true,
          confirmButtonColor: '#1337E8',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Enviar',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value) {
              return 'Por favor ingrese un número de teléfono.';
            } else if (!/^\+?[0-9]*$/.test(value)) {
              return 'Por favor ingrese un número de teléfono válido.';
            }
            return null;
          }
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            const numeroTelefono = result.value;
            const mensaje = `¡Hola! Aquí tienes el enlace para descargar tu factura : ${blobUrl}`;
            const urlWhatsApp = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(urlWhatsApp);
          } else if (result.isDismissed) {

            Swal.fire('Cancelado', 'No se ingresó un número de teléfono.', 'info');
          }
        });

      },
      (error) => {
        console.error('Error al obtener el archivo PDF:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener el archivo PDF.', 'error');
      }
    );
  }






  enviarCorreo(nombre: string, tipo: string) {
    Swal.fire({
      title: 'Ingrese su correo electrónico',
      input: 'email',
      inputLabel: 'Correo electrónico',
      inputPlaceholder: 'Ingrese su correo electrónico',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un correo electrónico';
        }
        // else if (!value.endsWith('@gmail.com') && !value.endsWith('@unicesar.edu.co')) {
        //   return 'Por favor, ingrese un correo electrónico de Gmail o unicesar.edu.co válido';
        // }
        else {
          return ''; // Retorna una cadena vacía si no hay problemas de validación
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const correo = result.value;
        // const nombreArchivo = nombre;
        this.fileService.obtenerUrlPorNombre(nombre).subscribe(
          (data: { url: string }) => {
            const blobUrl = data.url;

            this.fileService.enviarEmail(correo, blobUrl, tipo).subscribe(
              (response) => {
                Swal.fire('Correo enviado', 'La factura a sido enviada correctamente a su correo.', 'success');
              },
              (error) => {
                Swal.fire('Error', 'Hubo un error al enviar el correo electrónico', 'error');
              }
            );
          },
          (error) => {
            console.error('Error al obtener el archivo PDF:', error);
            Swal.fire('Error', 'Ocurrió un error al obtener el archivo PDF.', 'error');
          }
        );
      }
    });
  }



  convertBlobUrl(url: string): Promise<string> {
    return fetch(url).then(response => {
      if (!response.ok) {
        throw new Error('Error al cargar el archivo');
      }
      return response.blob();
    }).then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    });
  }

  //funcional
  // previewFile(id: number, fileType: string): void {
  //   this.fileService.downloadFile(id).subscribe(
  //     (blob: Blob) => {
  //       // Crea una URL de objeto (Object URL) para el blob descargado
  //       const url = URL.createObjectURL(blob);

  //       // Verifica el tipo de ArchivoFactura y abre una nueva pestaña con el visor adecuado
  //       if (fileType === 'application/pdf') {
  //         // Para ArchivoFacturas PDF, abre una nueva pestaña con el visor de PDF
  //         window.open(url, '_blank');
  //       } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  //         // Para ArchivoFacturas XLSX, abre una nueva pestaña para descargar el ArchivoFactura
  //         const link = document.createElement('a');
  //         link.href = url;
  //         link.setAttribute('download', `ArchivoFactura.xlsx`); // Cambia el nombre del ArchivoFactura según sea necesario
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);
  //       } else {
  //         // Tipo de ArchivoFactura no compatible, muestra un mensaje de error
  //         console.error('Tipo de ArchivoFactura no compatible:', fileType);
  //         // Puedes mostrar un mensaje de error al usuario aquí
  //       }
  //     },
  //     error => {
  //       console.error('Error al descargar el ArchivoFactura', error);
  //       // Maneja el error, por ejemplo, mostrando un mensaje de error al usuario
  //       let idUsuario: number = 0;


  //       // Obtener el idUsuario del localStorage
  //       const usuarioString = localStorage.getItem('usuario');
  //       const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
  //       const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
  //       if (datosDesencriptados !== null) {
  //         const usuario = JSON.parse(datosDesencriptados);
  //         idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

  //         this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
  //           (usuario: any) => {

  //             console.log('Usuario obtenido:', usuario);
  //             let refreshToken = usuario.refreshToken

  //             // Manejar la renovación del token
  //             this._usuarioServicio.renovarToken(refreshToken).subscribe(
  //               (response: any) => {
  //                 console.log('Token actualizado:', response.token);
  //                 // Guardar el nuevo token de acceso en el almacenamiento local
  //                 localStorage.setItem('authToken', response.token);
  //                 this.previewFile(id, fileType);

  //               },
  //               (error: any) => {
  //                 console.error('Error al actualizar el token:', error);
  //               }
  //             );



  //           },
  //           (error: any) => {
  //             console.error('Error al obtener el usuario:', error);
  //           }
  //         );
  //       }
  //     }
  //   );
  // }



  previewFile(fileId: number, fileType: string) {
    this.fileService.downloadFile(fileId).subscribe({
      next: (response) => {
        window.open(response.message, '_blank'); // Abre el enlace en una nueva pestaña
      },
      error: (err) => {
        console.error('Error al descargar el ArchivoFactura', err);
        // Maneja el error, por ejemplo, mostrando un mensaje de error al usuario
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.previewFile(fileId, fileType);

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
      },
    });
  }

  //funcional
  // downloadFile(id: number): void {
  //   console.log(`Descargar ArchivoFactura con ID ${id}`);
  //   this.fileService.downloadFile(id).subscribe(
  //     (blob: Blob) => {
  //       const link = document.createElement('a');
  //       link.href = window.URL.createObjectURL(blob);
  //       link.download = this.ArchivoFacturas.find(ArchivoFactura => ArchivoFactura.id === id)?.nombre || 'ArchivoFactura';
  //       link.click();
  //     },
  //     error => {
  //       console.error('Error al descargar el ArchivoFactura', error);
  //       // Agrega lógica para manejar el error, como mostrar un mensaje al usuario
  //       let idUsuario: number = 0;


  //       // Obtener el idUsuario del localStorage
  //       const usuarioString = localStorage.getItem('usuario');
  //       const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
  //       const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
  //       if (datosDesencriptados !== null) {
  //         const usuario = JSON.parse(datosDesencriptados);
  //         idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

  //         this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
  //           (usuario: any) => {

  //             console.log('Usuario obtenido:', usuario);
  //             let refreshToken = usuario.refreshToken

  //             // Manejar la renovación del token
  //             this._usuarioServicio.renovarToken(refreshToken).subscribe(
  //               (response: any) => {
  //                 console.log('Token actualizado:', response.token);
  //                 // Guardar el nuevo token de acceso en el almacenamiento local
  //                 localStorage.setItem('authToken', response.token);
  //                 this.downloadFile(id);

  //               },
  //               (error: any) => {
  //                 console.error('Error al actualizar el token:', error);
  //               }
  //             );



  //           },
  //           (error: any) => {
  //             console.error('Error al obtener el usuario:', error);
  //           }
  //         );
  //       }
  //     }
  //   );
  // }

  downloadFile(id: number): void {
    console.log(`Descargar archivo con ID ${id}`);

    this.fileService.downloadFile(id).subscribe({
      next: (response) => {
        const link = document.createElement('a');
        link.href = response.message;  // URL del archivo

        // Si el archivo es PDF, añadir un atributo 'download' para forzar la descarga
        if (response.message.endsWith('.pdf')) {
          link.setAttribute('download', ''); // Forzar descarga de PDF
        }

        // Si es un archivo Excel o de otro tipo, se maneja de forma similar
        // Asegurarse de que la URL sea correcta y que se pueda descargar
        link.target = '_self';  // Abrir en la misma ventana
        link.download = this.ArchivoFacturas.find(archivo => archivo.id === id)?.nombre || 'archivo';  // Nombre del archivo

        // Asegurarse de que el archivo se descargue
        document.body.appendChild(link);  // Agregar el enlace al DOM

        link.click();  // Simula el clic para la descarga

        // Limpiar el DOM después de la descarga
        document.body.removeChild(link);
      },
      error: (err) => {
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.downloadFile(id);

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
      },
    });
  }


  deleteFile(id: number): void {
    // Implementa la lógica para eliminar el ArchivoFactura
    console.log(`Eliminar Archivo Factura con ID ${id}`);
    this.fileService.deleteFile(id).subscribe(() => {
      Swal.fire({
        icon: 'success',
        title: 'Factura Eliminada',
        text: `La factura fue eliminada`,
      });

      // Actualiza la lista de ArchivoFacturas después de la eliminación
      this.loadFiles();
    }, error => {
      let idUsuario: number = 0;


      // Obtener el idUsuario del localStorage
      const usuarioString = localStorage.getItem('usuario');
      const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados !== null) {
        const usuario = JSON.parse(datosDesencriptados);
        idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

        this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
          (usuario: any) => {

            console.log('Usuario obtenido:', usuario);
            let refreshToken = usuario.refreshToken

            // Manejar la renovación del token
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                console.log('Token actualizado:', response.token);
                // Guardar el nuevo token de acceso en el almacenamiento local
                localStorage.setItem('authToken', response.token);
                this.deleteFile(id);

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

    });
  }





  confirmarEliminarTodosArchivoFacturas(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: { message: '¿Estás seguro de que deseas eliminar todas las Facturas?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si el usuario confirma, procede con la eliminación de todos los ArchivoFacturas
        this.eliminarTodosArchivoFacturas();
      }
    });
  }

  private eliminarTodosArchivoFacturas(): void {
    // Llama al servicio para eliminar todos los ArchivoFacturas
    this.fileService.eliminarTodosArchivos().subscribe(
      response => {
        console.log(response.message); // Mensaje del servidor
        Swal.fire({
          icon: 'success',
          title: 'Facturas Eliminadas',
          text: `Se eliminaron todos las Facturas`,
        });
        // this._utilidadServicio.mostrarAlerta("Se eliminaron todos los ArchivoFacturas", 'OK!');
        // Recarga la lista de ArchivoFacturas después de la eliminación
        this.loadFiles();
      },
      error => {
        console.error('Error al eliminar todos los ArchivoFacturas', error);
        Swal.fire({
          icon: 'error',
          title: 'ERROR',
          text: `Error al eliminar todos los ArchivoFacturas`,
        });
        // this._utilidadServicio.mostrarAlerta("Error al eliminar todos los ArchivoFacturas", 'ERROR!');
        // Agrega lógica para manejar el error, como mostrar un mensaje al usuario
      }
    );
  }

}
