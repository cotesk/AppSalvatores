import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ModalProductoComponent } from '../../Modales/modal-producto/modal-producto.component';
import { Mesa } from './../../../../Interfaces/mesa';
import { MesaService } from './../../../../Services/mesa.service';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import Swal from 'sweetalert2';
import { ModalCategoriaComponent } from '../../Modales/modal-categoria/modal-categoria.component';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { MatSort } from '@angular/material/sort';
import { ModalMesasComponent } from '../../Modales/modal-mesas/modal-mesas.component';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit, AfterViewInit {


  columnasTabla: string[] = ['nombreMesa', 'tipo', 'ocupada', 'acciones'];
  dataInicio: Mesa[] = [];
  dataListaMesa = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  @ViewChild(MatSort) sort!: MatSort;
  selectedFile: File | null = null;

  page = 1;
  pageSize = 5;
  totalCategorias = 0;
  totalPages = 0;
  searchTerm = '';

  constructor(
    private dialog: MatDialog,
    private _mesaServicio: MesaService,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,
    private signalRService: SignalRService,
    private router: Router

  ) { }

  obtenerMesa() {


    this._mesaServicio.listaPaginada(this.page, this.pageSize, this.searchTerm).subscribe({
      next: (data) => {
        if (data && data.data && data.data.length > 0) {
          console.log(data.data)
          // this.totalCategorias = data.total;
          // this.totalPages = data.totalPages;
          // this.dataListaMesa.data = data.data;

          this.totalCategorias = data.total;
          this.totalPages = Math.ceil(this.totalCategorias / this.pageSize);
          this.dataListaMesa.data = data.data;
        } else {
          this.totalCategorias = 0; // Reinicia el total de categorías si no hay datos
          this.totalPages = 0; // Reinicia el total de páginas si no hay datos
          this.dataListaMesa.data = []; // Limpia los datos existentes
          // Swal.fire({
          //   icon: 'warning',
          //   title: 'Advertencia',
          //   text: 'No se encontraron datos',
          // });
        }
      },
      error: (e) => {
        this.totalCategorias = 0; // Reinicia el total de categorías en caso de error
        this.totalPages = 0; // Reinicia el total de páginas en caso de error
        this.dataListaMesa.data = [];
        let idUsuario: number = 0;
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario;

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {
              let refreshToken = usuario.refreshToken;
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  localStorage.setItem('authToken', response.token);
                  this.obtenerMesa();
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
    });
  }


  ngOnInit(): void {
    this.obtenerMesa();

  }


  ngAfterViewInit(): void {
    this.dataListaMesa.paginator = this.paginacionTabla;
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.obtenerMesa();
  }

  firstPage() {
    this.page = 1;
    this.obtenerMesa();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.obtenerMesa();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.obtenerMesa();
    }
  }

  lastPage() {
    this.page = this.totalPages;
    this.obtenerMesa();
  }
  pageSizeChange() {
    this.page = 1;
    this.obtenerMesa();
  }


  nuevaCategoria() {

    this.dialog.open(ModalMesasComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerMesa();

    });
  }

  editarProducto(mesa: Mesa) {

    this.dialog.open(ModalMesasComponent, {
      disableClose: true,
      data: mesa
    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerMesa();

    });
  }


  eliminarProducto(categoria: Mesa) {

    Swal.fire({

      title: "¿Desea eliminar la mesa?",
      text: categoria.nombreMesa,
      icon: "warning",
      confirmButtonColor: '#3085d6',
      confirmButtonText: "Si, eliminar",
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, volver'

    }).then((resultado) => {


      if (resultado.isConfirmed) {

        this._mesaServicio.eliminar(categoria.idMesa).subscribe({
          next: (data) => {

            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Mesa Eliminada',
                text: `La mesa fue eliminada`,
              });
              // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
              this.obtenerMesa();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `No se pudo eliminar la categoria`,
              });
              // this._utilidadServicio.mostrarAlerta("No se pudo eliminar la categoria","Error");

            }

          },

          error: (e) => {

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
                      this.eliminar(categoria);
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

        })

      }


    })

  }
  eliminar(categoria: Mesa) {
    this._mesaServicio.eliminar(categoria.idMesa).subscribe({
      next: (data) => {

        if (data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Categoria Eliminada',
            text: `La categoria fue eliminada`,
          });
          // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
          this.obtenerMesa();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'ERROR',
            text: `No se pudo eliminar la categoria`,
          });
          // this._utilidadServicio.mostrarAlerta("No se pudo eliminar la categoria","Error");

        }

      },

      error: (e) => {

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
                  this.eliminar(categoria);
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

    })
  }

  aplicarFiltroTabla(event: Event) {
    const filtroValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filtroValue === 'ocupada' || filtroValue === 'Ocupada') {
      this.searchTerm = '1';
    } else if (filtroValue === 'no ocupada' || filtroValue === 'No Ocupada') {
      this.searchTerm = '0';
    } else {
      this.searchTerm = filtroValue;
    }

    this.obtenerMesa();
  }

  exportarCategoria() {
    this._mesaServicio.exportarMesas().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Generar 4 números aleatorios
      const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      // Obtener la fecha y hora actual
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      const formattedTime = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

      // Crear el nombre del archivo
      a.download = `Mesa_${randomNumbers}_${formattedDate}_${formattedTime}.xlsx`;

      // Crear el enlace de descarga
      document.body.appendChild(a);
      a.href = url;
      a.click();
      document.body.removeChild(a);
    }, error => {
      console.error('Error al obtener los datos de la empresa:', error);
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
                this.exportarCategoria();
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


  importarCategoria(): void {
    Swal.fire({
      title: 'Selecciona el archivo de categoria',
      input: 'file',  // Tipo de input para archivo
      inputAttributes: {
        accept: '.xlsx,.xls',  // Aceptar solo archivos de Excel
        'aria-label': 'Sube tu archivo de categoria'
      },
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Importar',
      cancelButtonText: 'Cancelar',
      preConfirm: (file) => {
        if (!file) {
          Swal.showValidationMessage('Debes seleccionar un archivo');
        }
        return file;  // Retornar el archivo seleccionado
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedFile = result.value;  // Obtener el archivo seleccionado
        if (this.selectedFile) {
          this._mesaServicio.importarMesas(this.selectedFile).subscribe(
            (response) => {
              console.log('Categoria importados correctamente:', response);
              Swal.fire('Éxito', 'Categoria importados correctamente', 'success');
              this.obtenerMesa();
            },
            (error) => {
              // console.error('Error al importar productos:', error); // Imprime el error completo
              // Swal.fire('Error', 'Hubo un error al importar los productos: ' + error.message, 'error');
              console.log('Error al importar Categoria:', error);
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
                        this.import2(this.selectedFile);
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
        } else {
          console.log('Por favor seleccione un archivo.');
        }

      }
    });
  }


  import2(selectedFile: any) {

    this._mesaServicio.importarMesas(selectedFile).subscribe(
      (response) => {
        console.log('Categoria importados correctamente:', response);
        Swal.fire('Éxito', 'Categoria importados correctamente', 'success');
        this.obtenerMesa();
      },
      (error) => {
        // console.error('Error al importar productos:', error); // Imprime el error completo
        // Swal.fire('Error', 'Hubo un error al importar los productos: ' + error.message, 'error');
        console.log('Error al importar Categoria:', error);
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
                  this.import2(selectedFile);
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
