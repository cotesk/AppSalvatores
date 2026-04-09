import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ModalProductoComponent } from '../../Modales/modal-producto/modal-producto.component';
import { Categoria } from './../../../../Interfaces/categoria';
import { CategoriaService } from './../../../../Services/categoria.service';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import Swal from 'sweetalert2';
import { ModalCategoriaComponent } from '../../Modales/modal-categoria/modal-categoria.component';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent implements OnInit, AfterViewInit {

  columnasTabla: string[] = ['nombre', 'estado', 'acciones'];
  dataInicio: Categoria[] = [];
  dataListaCategoria = new MatTableDataSource(this.dataInicio);
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
    private _categoriaServicio: CategoriaService,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,

  ) { }


  // obtenerCategoria() {

  //   this._categoriaServicio.lista().subscribe({

  //     next: (data) => {
  //       if (data.status) {

  //         data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));
  //         this.dataListaCategoria.data = data.value;


  //       } else {

  //         Swal.fire({
  //           icon: 'warning',
  //           title: 'Advertencia',
  //           text: `no se encontraron datos`,
  //         });
  //         // this._utilidadServicio.mostrarAlerta("no se encontraron datos", "Oops!");

  //       }

  //     },
  //     error: (e) => {

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
  //                 this.obtenerCategoria();
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

  //   })
  // }
  obtenerCategoria() {


    this._categoriaServicio.listaPaginada(this.page, this.pageSize, this.searchTerm).subscribe({
      next: (data) => {
        if (data && data.data && data.data.length > 0) {
          // this.totalCategorias = data.total;
          // this.totalPages = data.totalPages;
          // this.dataListaCategoria.data = data.data;

          this.totalCategorias = data.total;
          this.totalPages = Math.ceil(this.totalCategorias / this.pageSize);
          this.dataListaCategoria = data.data;
        } else {
          this.totalCategorias = 0; // Reinicia el total de categorías si no hay datos
          this.totalPages = 0; // Reinicia el total de páginas si no hay datos
          this.dataListaCategoria.data = []; // Limpia los datos existentes
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
        this.dataListaCategoria.data = [];
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
                  this.obtenerCategoria();
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
    this.obtenerCategoria();

  }


  ngAfterViewInit(): void {
    this.dataListaCategoria.paginator = this.paginacionTabla;
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.obtenerCategoria();
  }

  aplicarFiltroTabla(event: Event) {
    const filtroValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filtroValue === 'activo' || filtroValue === 'Activo') {
      this.searchTerm = '1';
    } else if (filtroValue === 'no activo' || filtroValue === 'No Activo') {
      this.searchTerm = '0';
    } else {
      this.searchTerm = filtroValue;
    }

    this.obtenerCategoria();
  }
  firstPage() {
    this.page = 1;
    this.obtenerCategoria();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.obtenerCategoria();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.obtenerCategoria();
    }
  }

  lastPage() {
    this.page = this.totalPages;
    this.obtenerCategoria();
  }
  pageSizeChange() {
    this.page = 1;
    this.obtenerCategoria();
  }


  nuevaCategoria() {

    this.dialog.open(ModalCategoriaComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerCategoria();

    });
  }

  editarProducto(categoria: Categoria) {

    this.dialog.open(ModalCategoriaComponent, {
      disableClose: true,
      data: categoria
    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerCategoria();

    });
  }
  cambiarEstado(categoria: Categoria) {
    Swal.fire({
      title: '¿Desea cambiar el estado de la categoría?',
      text: `Categoría: ${categoria.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar estado'
    }).then((result) => {
      if (result.isConfirmed) {
        this._categoriaServicio.cambiarEstado(categoria.idCategoria).subscribe({
          next: (data) => {
            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: `El estado de la categoría ha sido cambiado correctamente.`,
              });
              this.obtenerCategoria(); // Actualizar la lista después de cambiar el estado
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo cambiar el estado de la categoría.`,
              });
            }
          },
          error: (error) => {
            // Swal.fire({
            //   icon: 'error',
            //   title: 'Error',
            //   text: `Ocurrió un error al cambiar el estado de la categoría: ${error}`,
            // });


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
                      this.estado(categoria);
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
    });
  }
  estado(categoria: Categoria) {
    this._categoriaServicio.cambiarEstado(categoria.idCategoria).subscribe({
      next: (data) => {
        if (data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: `El estado de la categoría ha sido cambiado correctamente.`,
          });
          this.obtenerCategoria(); // Actualizar la lista después de cambiar el estado
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo cambiar el estado de la categoría.`,
          });
        }
      },
      error: (error) => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error',
        //   text: `Ocurrió un error al cambiar el estado de la categoría: ${error}`,
        // });


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
                  this.estado(categoria);
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
  eliminarProducto(categoria: Categoria) {

    Swal.fire({

      title: "¿Desea eliminar la acategoria?",
      text: categoria.nombre,
      icon: "warning",
      confirmButtonColor: '#3085d6',
      confirmButtonText: "Si, eliminar",
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, volver'

    }).then((resultado) => {


      if (resultado.isConfirmed) {

        this._categoriaServicio.eliminar(categoria.idCategoria).subscribe({
          next: (data) => {

            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Categoria Eliminada',
                text: `La categoria fue eliminada`,
              });
              // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
              this.obtenerCategoria();
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
  eliminar(categoria: Categoria) {
    this._categoriaServicio.eliminar(categoria.idCategoria).subscribe({
      next: (data) => {

        if (data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Categoria Eliminada',
            text: `La categoria fue eliminada`,
          });
          // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
          this.obtenerCategoria();
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


  exportarCategoria() {
    this._categoriaServicio.exportarProductos().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Generar 4 números aleatorios
      const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      // Obtener la fecha y hora actual
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      const formattedTime = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

      // Crear el nombre del archivo
      a.download = `Categoria_${randomNumbers}_${formattedDate}_${formattedTime}.xlsx`;

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
          this._categoriaServicio.importarProductos(this.selectedFile).subscribe(
            (response) => {
              console.log('Categoria importados correctamente:', response);
              Swal.fire('Éxito', 'Categoria importados correctamente', 'success');
              this.obtenerCategoria();
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

    this._categoriaServicio.importarProductos(selectedFile).subscribe(
      (response) => {
        console.log('Categoria importados correctamente:', response);
        Swal.fire('Éxito', 'Categoria importados correctamente', 'success');
        this.obtenerCategoria();
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
