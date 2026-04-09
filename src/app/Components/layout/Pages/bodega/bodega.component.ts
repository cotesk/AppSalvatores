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
import { BodegaService } from '../../../../Services/bodega.service';
import { Bodega } from '../../../../Interfaces/bodega';
import { VerImagenProductoModalComponent } from '../../Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ProductoService } from '../../../../Services/producto.service';
import moment from 'moment';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import 'jspdf-autotable'; // Importamos la librería de tablas
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';


@Component({
  selector: 'app-bodega',
  templateUrl: './bodega.component.html',
  styleUrl: './bodega.component.css'
})
export class BodegaComponent implements OnInit, AfterViewInit {

  columnasTabla: string[] = ['imageData', 'nombreProducto', 'codigoBarra', 'cantidadEnBodega', 'acciones'];

  dataInicio: Bodega[] = [];
  dataListaBodega = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  @ViewChild(MatSort) sort!: MatSort;

  metodoBusqueda: string | null = '';
  productos: any[] = [];
  totalRegistros: number = 0;
  selectedFile: File | null = null;

  page = 1;
  totalPages = 0;
  pageSize: number = 5;
  totalBodega = 0;
  pageNumber: number = 1;
  searchTerm: string = '';

  constructor(
    private dialog: MatDialog,
    private _bodegaServicio: BodegaService,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,
    private _productoServicio: ProductoService,
    private empresaService: EmpresaService,

  ) {

    // this.dataListaBodega.filterPredicate = (data: Bodega, filter: string) => {
    //   const formattedFilter = filter.trim().toLowerCase();



    //   // Otros filtros basados en propiedades del objeto Proveedor
    //   return data.nombreProducto.toLowerCase().includes(formattedFilter) ||
    //     data.codigoBarra.toLowerCase().includes(formattedFilter)
    //   // data.cantidadEnBodega.toLowerCase().includes(formattedFilter)

    // };



  }


  // obtenerBodegas() {

  //   this._bodegaServicio.lista().subscribe({

  //     next: (data) => {
  //       if (data.status) {

  //         data.value.forEach((bodega: Bodega) => {
  //           if (bodega.imageData) {
  //             bodega.imageData = this.decodeBase64ToImageUrl(bodega.imageData);
  //           }
  //         });

  //         data.value.sort((a: Bodega, b: Bodega) => a.nombreProducto.localeCompare(b.nombreProducto));



  //         this.dataListaBodega.data = data.value;


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
  //                 this.obtenerBodegas();
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
  // decodeBase64ToImageUrl(base64String: string): string {
  //   const bytes = atob(base64String);
  //   const arrayBuffer = new Uint8Array(bytes.length);
  //   for (let i = 0; i < bytes.length; i++) {
  //     arrayBuffer[i] = bytes.charCodeAt(i);
  //   }
  //   const blob = new Blob([arrayBuffer], { type: 'image/png' });
  //   return URL.createObjectURL(blob);
  // }

  ngOnInit(): void {
    this.obtenerBodegas();

  }


  obtenerBodegas(): void {
    this._bodegaServicio.obtenerListaPaginada(this.pageNumber, this.pageSize, this.searchTerm)
      .subscribe(response => {
        console.log('Datos obtenidos:', response);
        this.dataInicio = response.datos; // Asegúrate de que esta propiedad sea correcta
        this.totalRegistros = response.totalRegistros;
        this.totalPages = Math.ceil(this.totalRegistros / this.pageSize);
        this.dataListaBodega.data = this.dataInicio; // Actualizar MatTableDataSource con los datos obtenidos
        console.log(this.dataInicio)
      });
  }
  decodeBase64ToImageUrl(base64String: string): string {
    return `data:image/jpeg;base64,${base64String}`;
  }


verImagen(producto: any): void {
  console.log('Ver imagen:', producto.imagenUrl);
  this.dialog.open(VerImagenProductoModalComponent, {
    data: {
      imagenes: producto.imagenUrl
    }
  });
}



  ngAfterViewInit(): void {
    this.dataListaBodega.paginator = this.paginacionTabla;
    this.dataListaBodega.sort = this.sort;
  }

  // Método para manejar el cambio de página
  cambiarPagina(pageNumber: number): void {
    this.pageNumber = pageNumber;
    this.obtenerBodegas();
  }


  // Función para buscar productos basada en el término de búsqueda
  buscarProductos(event: Event): void {
    const filtroValue = (event.target as HTMLInputElement).value.trim().toLowerCase();


    this.obtenerBodegas();
  }


  aplicarFiltroTabla(event: Event) {
    const filtroValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filtroValue;
    this.page = 1; // Reiniciar a la primera página al aplicar un nuevo filtro
    this.obtenerBodegas();
  }
  firstPage(): void {
    this.pageNumber = 1;
    this.obtenerBodegas();
  }

  lastPage(): void {
    this.pageNumber = this.totalPages;
    this.obtenerBodegas();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.obtenerBodegas();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.obtenerBodegas();
    }
  }



  pageSizeChange(event: any): void {
    this.pageSize = event.value;
    this.page = 1; // Reiniciar a la primera página al cambiar el tamaño de la página
    this.obtenerBodegas();
  }

  sacarProductos(element: Bodega) {
    Swal.fire({
      title: '¿Cuántos productos desea sacar?',
      html: `
      <input id="cantidadInput" class="swal2-input" type="number" min="1" max="${element.cantidadEnBodega}" step="1" placeholder="Cantidad" style="width: 120px; height: 50px; font-size: 16px;">
    `,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sacar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const input = Swal.getPopup()!.querySelector('#cantidadInput') as HTMLInputElement;
        const cantidad = Number(input.value);
        if (!cantidad || isNaN(cantidad)) {
          Swal.showValidationMessage('Debe ingresar una cantidad válida');
          return false;
        }
        if (cantidad > element.cantidadEnBodega) {
          Swal.showValidationMessage(`No puede sacar más de ${element.cantidadEnBodega} productos`);
          return false;
        }
        return cantidad;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cantidadASacar = result.value as number;
        this._bodegaServicio.sacarProductos(element.idBodega, cantidadASacar).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: `Se sacaron ${cantidadASacar} productos exitosamente.`,
            });
            this.obtenerBodegas();
          },
          error: (error) => {
            // Swal.fire({
            //   icon: 'error',
            //   title: 'Error',
            //   text: `No se pudo realizar la operación: ${error.message}`,
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
                      this.sacar(element.idBodega, cantidadASacar);
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



  sacar(element: any, cantidadASacar: any) {

    // const cantidadASacar = result.value as number;
    this._bodegaServicio.sacarProductos(element.idBodega, cantidadASacar).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Se sacaron ${cantidadASacar} productos exitosamente.`,
        });
        this.obtenerBodegas();
      },
      error: (error) => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error',
        //   text: `No se pudo realizar la operación: ${error.message}`,
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
                  this.sacar(element.idBodega, cantidadASacar);
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



ActualizarProductos(element: Bodega) {
    Swal.fire({
      title: '¿Cuántos productos desea sacar?',
      html: `
      <input id="cantidadInput" class="swal2-input" type="number" min="1" max="${element.cantidadEnBodega}" step="1" placeholder="Cantidad" style="width: 120px; height: 50px; font-size: 16px;">
    `,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sacar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const input = Swal.getPopup()!.querySelector('#cantidadInput') as HTMLInputElement;
        const cantidad = Number(input.value);
        if (!cantidad || isNaN(cantidad)) {
          Swal.showValidationMessage('Debe ingresar una cantidad válida');
          return false;
        }
        // if (cantidad > element.cantidadEnBodega) {
        //   Swal.showValidationMessage(`No puede sacar más de ${element.cantidadEnBodega} productos`);
        //   return false;
        // }
        return cantidad;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cantidadASacar = result.value as number;
        this._bodegaServicio.AcomodarProductos(element.idBodega, cantidadASacar).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: `Se acomodaron ${cantidadASacar} productos exitosamente.`,
            });
            this.obtenerBodegas();
          },
          error: (error) => {
            // Swal.fire({
            //   icon: 'error',
            //   title: 'Error',
            //   text: `No se pudo realizar la operación: ${error.message}`,
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
                      this.sacar(element.idBodega, cantidadASacar);
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



  Actualizar(element: any, cantidadASacar: any) {

    // const cantidadASacar = result.value as number;
    this._bodegaServicio.AcomodarProductos(element.idBodega, cantidadASacar).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Se acomodaron ${cantidadASacar} productos exitosamente.`,
        });
        this.obtenerBodegas();
      },
      error: (error) => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error',
        //   text: `No se pudo realizar la operación: ${error.message}`,
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
                  this.sacar(element.idBodega, cantidadASacar);
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


  onChangeTipoBusqueda2(event: any) {
    this.metodoBusqueda = event.value; // Actualiza el valor de tipoBusqueda

  }


  stockProductos(element: Bodega) {
    Swal.fire({
      title: '¿Cuál seria el nuevo stock?',
      html: `
      <input id="cantidadInput" class="swal2-input" type="number" min="1" max="${element.cantidadEnBodega}" step="1" placeholder="Cantidad" style="width: 120px; height: 50px; font-size: 16px;">
    `,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const input = Swal.getPopup()!.querySelector('#cantidadInput') as HTMLInputElement;
        const cantidad = Number(input.value);
        if (!cantidad || isNaN(cantidad)) {
          Swal.showValidationMessage('Debe ingresar una cantidad válida');
          return false;
        }
        // if (cantidad > element.cantidadEnBodega) {
        //   Swal.showValidationMessage(`No puede sacar más de ${element.cantidadEnBodega} productos`);
        //   return false;
        // }
        return cantidad;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cantidadASacar = result.value as number;
        this._bodegaServicio.AcomodarProductos(element.idBodega, cantidadASacar).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: `Se actualizaron ${cantidadASacar} productos exitosamente.`,
            });
            this.obtenerBodegas();
          },
          error: (error) => {
            // Swal.fire({
            //   icon: 'error',
            //   title: 'Error',
            //   text: `No se pudo realizar la operación: ${error.message}`,
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
                      this.ActualizarStock(element.idBodega, cantidadASacar);
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

    ActualizarStock(element: any, cantidadASacar: any) {

    // const cantidadASacar = result.value as number;
    this._bodegaServicio.AcomodarProductos(element.idBodega, cantidadASacar).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Se actualizaron ${cantidadASacar} productos exitosamente.`,
        });
        this.obtenerBodegas();
      },
      error: (error) => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error',
        //   text: `No se pudo realizar la operación: ${error.message}`,
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
                  this.ActualizarStock(element.idBodega, cantidadASacar);
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


  async generarPDF() {

    Swal.fire({
      icon: 'question',
      title: 'Descargar PDF',
      text: '¿Estás seguro de que deseas descargar el PDF?',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      confirmButtonText: 'Sí',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {

        this.empresaService.lista().subscribe({
          next: (response) => {
            if (response.status) {


              const empresas = response.value as Empresa[];
              // if (empresas.length > 0) {
              const empresa = empresas[0];

              // Extraer los datos de la empresa
              const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
              const direccion2 = empresa ? empresa.direccion : 'No disponible';
              const telefono2 = empresa ? empresa.telefono : 'No disponible';
              const correo = empresa ? empresa.correo : 'No disponible';
              const rut = empresa ? empresa.rut : 'No disponible';
              const logoBase64 = empresa ? empresa.logo : '';
              // Agregar prefijo al logo base64
              const logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;



              // Recuperar el nombre de usuario del localStorage
              const usuarioString = localStorage.getItem('usuario');
              const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
              const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
              // Verificar si usuarioString es nulo antes de parsearlo
              const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;

              // Obtener el nombre completo del usuario si existe
              const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

              const doc = new jsPDF();


              // Agregar información adicional antes de agregar cualquier página
              const additionalInfoX = doc.internal.pageSize.width - 130;
              const additionalInfoY = 7;
              const additionalInfoFontSize = 10;

              const additionalInfoX2 = doc.internal.pageSize.width - 130;
              const additionalInfoY2 = 12;
              const additionalInfoFontSize2 = 10;

              const additionalInfoX4 = doc.internal.pageSize.width - 130;
              const additionalInfoY4 = 17;
              const additionalInfoFontSize4 = 10;

              const additionalInfoX3 = doc.internal.pageSize.width - 130;
              const additionalInfoY3 = 22;
              const additionalInfoFontSize3 = 10;

              const additionalInfoX5 = doc.internal.pageSize.width - 130;
              const additionalInfoY5 = 27;
              const additionalInfoFontSize5 = 10;

              doc.setFontSize(additionalInfoFontSize);
              // doc.text('Número de contacto: 3012091145\nCorreo electrónico: carloscotes48@gmail.com', additionalInfoX, additionalInfoY);
              doc.text('Nombre de la Empresa : ' + nombreEmpresa, additionalInfoX, additionalInfoY);
              doc.setFontSize(additionalInfoFontSize4);
              doc.text('Nit : ' + rut, additionalInfoX2, additionalInfoY2);
              doc.setFontSize(additionalInfoFontSize2);
              doc.text('Direccion : ' + direccion2, additionalInfoX4, additionalInfoY4);
              doc.setFontSize(additionalInfoFontSize3);
              doc.text('Telefono : ' + telefono2, additionalInfoX3, additionalInfoY3);

              doc.setFontSize(additionalInfoFontSize5);
              doc.text('Correo : ' + correo, additionalInfoX5, additionalInfoY5);

              if (logoBase64WithPrefix && logoBase64WithPrefix.trim() !== 'data:image/png;base64,') {
                // Si hay un logo, agregarlo al array de información de la tienda
                const logo = logoBase64WithPrefix;
                const logoWidth = 30; // Adjust as needed
                const logoHeight = 35; // Adjust as needed
                doc.addImage(logo, 'PNG', 165, 10, logoWidth, logoHeight);
              }
              // Add logo to the PDF


              // Add title to the PDF
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(28);  // Increase the font size for the title
              doc.text('Listado de Productos', 60, 40);  // Adjust the position of the title

              // Add date to the PDF
              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(12);
              // doc.text(`Fecha de creación de la factura: ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 50);  // Adjust the position of the date
              doc.text(`Fecha de creación del reporte: ${moment().format('DD/MM/YYYY hh:mm A')}`, 20, 50);


              // Add a line separator after the header
              doc.setLineWidth(1);
              doc.line(20, 60, 190, 60);  // Adjust the line position

              const color = [0, 0, 0];

              // Crea la tabla con los productos en bodega
              // const productos = this.dataListaBodega.data.map(producto => [
              //   producto.nombreProducto ,
              //   producto.codigoBarra,
              //   producto.cantidadEnBodega
              // ]);


              const dataFormateada = this.dataListaBodega.data.map((producto: any, index: number) => {

                const color = [0, 0, 0];

                const nombreCortado = producto.nombreProducto.length > 40 ? producto.nombreProducto.substring(0, 40) + '...' : producto.nombreProducto;
                return [
                  { content: (index + 1).toString(), styles: { textColor: color } },
                  { content: nombreCortado, styles: { textColor: color } },
                  { content: producto.codigoBarra, styles: { textColor: color } },
                  { content: producto.cantidadEnBodega, styles: { textColor: color } },

                ];
              });


              (doc as any).autoTable({
                headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
                head: [['#', 'Nombre Producto', 'Código Barra', 'Cantidad en Bodega']],
                body: dataFormateada,
                startY: 70,
                didDrawPage: (dataArg: any) => {
                  // Añadir número de página al pie de página
                  const pageCount = doc.getNumberOfPages(); // Obtenemos el número total de páginas
                  const pageNumber = dataArg.pageNumber; // Obtenemos el número de página actual
                  doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);
                },
                styles: { halign: 'center' },
              });

              // Obtener las dimensiones del PDF
              const { height } = doc.internal.pageSize;

              const tableHeight = (doc as any).autoTable.previous.finalY;
              // Calcula la posición Y para la información adicional
              let infoY = tableHeight + 20; // Ajusta según sea necesario

              // Verifica si la información adicional se ajustará en la página actual
              if (infoY + 30 > 290) {
                doc.addPage();
                infoY = 20;
              }

              const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
              const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico
              const fileName = `Productos_${uniqueIdentifier}_${currentDate}.pdf`;

              // doc.save(fileName);
              // Obtener el base64 del PDF
              const pdfData = doc.output('datauristring');

              // Abrir el PDF en una nueva ventana del navegador
              const win = window.open();
              if (win) {
                win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

                // Esperar un breve momento antes de cargar el PDF en el iframe
                setTimeout(() => {
                  const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
                  if (pdfFrame) {
                    pdfFrame.src = pdfData;
                  } else {
                    console.error('No se pudo encontrar el iframe para cargar el PDF.');
                  }
                }, 1000);
              } else {
                console.error('No se pudo abrir la ventana del navegador.');
              }



            } else {
              console.error('La respuesta de la API indica un error:', response.msg);
            }
          },
          error: (error) => {
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
                      this.pdf();
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


  pdf() {

    this.empresaService.lista().subscribe({
      next: (response) => {
        if (response.status) {


          const empresas = response.value as Empresa[];
          // if (empresas.length > 0) {
          const empresa = empresas[0];

          // Extraer los datos de la empresa
          const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
          const direccion2 = empresa ? empresa.direccion : 'No disponible';
          const telefono2 = empresa ? empresa.telefono : 'No disponible';
          const correo = empresa ? empresa.correo : 'No disponible';
          const rut = empresa ? empresa.rut : 'No disponible';
          const logoBase64 = empresa ? empresa.logo : '';
          // Agregar prefijo al logo base64
          const logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;



          // Recuperar el nombre de usuario del localStorage
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          // Verificar si usuarioString es nulo antes de parsearlo
          const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;

          // Obtener el nombre completo del usuario si existe
          const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

          const doc = new jsPDF();


          const additionalInfoX = doc.internal.pageSize.width - 130;
          const additionalInfoY = 7;
          const additionalInfoFontSize = 10;

          const additionalInfoX2 = doc.internal.pageSize.width - 130;
          const additionalInfoY2 = 12;
          const additionalInfoFontSize2 = 10;

          const additionalInfoX4 = doc.internal.pageSize.width - 130;
          const additionalInfoY4 = 17;
          const additionalInfoFontSize4 = 10;

          const additionalInfoX3 = doc.internal.pageSize.width - 130;
          const additionalInfoY3 = 22;
          const additionalInfoFontSize3 = 10;

          const additionalInfoX5 = doc.internal.pageSize.width - 130;
          const additionalInfoY5 = 27;
          const additionalInfoFontSize5 = 10;

          doc.setFontSize(additionalInfoFontSize);
          // doc.text('Número de contacto: 3012091145\nCorreo electrónico: carloscotes48@gmail.com', additionalInfoX, additionalInfoY);
          doc.text('Nombre de la Empresa : ' + nombreEmpresa, additionalInfoX, additionalInfoY);
          doc.setFontSize(additionalInfoFontSize4);
          doc.text('Nit : ' + rut, additionalInfoX2, additionalInfoY2);
          doc.setFontSize(additionalInfoFontSize2);
          doc.text('Direccion : ' + direccion2, additionalInfoX4, additionalInfoY4);
          doc.setFontSize(additionalInfoFontSize3);
          doc.text('Telefono : ' + telefono2, additionalInfoX3, additionalInfoY3);

          doc.setFontSize(additionalInfoFontSize5);
          doc.text('Correo : ' + correo, additionalInfoX5, additionalInfoY5);

          if (logoBase64WithPrefix && logoBase64WithPrefix.trim() !== 'data:image/png;base64,') {
            // Si hay un logo, agregarlo al array de información de la tienda
            const logo = logoBase64WithPrefix;
            const logoWidth = 30; // Adjust as needed
            const logoHeight = 35; // Adjust as needed
            doc.addImage(logo, 'PNG', 165, 10, logoWidth, logoHeight);
          }
          // Add logo to the PDF


          // Add title to the PDF
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(28);  // Increase the font size for the title
          doc.text('Listado de Productos', 60, 40);  // Adjust the position of the title

          // Add date to the PDF
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(12);
          // doc.text(`Fecha de creación de la factura: ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 50);  // Adjust the position of the date
          doc.text(`Fecha de creación del reporte: ${moment().format('DD/MM/YYYY hh:mm A')}`, 20, 50);


          // Add a line separator after the header
          doc.setLineWidth(1);
          doc.line(20, 60, 190, 60);  // Adjust the line position

          const color = [0, 0, 0];

          // Crea la tabla con los productos en bodega
          // const productos = this.dataListaBodega.data.map(producto => [
          //   producto.nombreProducto ,
          //   producto.codigoBarra,
          //   producto.cantidadEnBodega
          // ]);


          const dataFormateada = this.dataListaBodega.data.map((producto: any, index: number) => {

            const color = [0, 0, 0];

            const nombreCortado = producto.nombreProducto.length > 40 ? producto.nombreProducto.substring(0, 40) + '...' : producto.nombreProducto;
            return [
              { content: (index + 1).toString(), styles: { textColor: color } },
              { content: nombreCortado, styles: { textColor: color } },
              { content: producto.codigoBarra, styles: { textColor: color } },
              { content: producto.cantidadEnBodega, styles: { textColor: color } },

            ];
          });


          (doc as any).autoTable({
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [['#', 'Nombre Producto', 'Código Barra', 'Cantidad en Bodega']],
            body: dataFormateada,
            startY: 70,
            didDrawPage: (dataArg: any) => {
              // Añadir número de página al pie de página
              const pageCount = doc.getNumberOfPages(); // Obtenemos el número total de páginas
              const pageNumber = dataArg.pageNumber; // Obtenemos el número de página actual
              doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);
            },
            styles: { halign: 'center' },
          });

          // Obtener las dimensiones del PDF
          const { height } = doc.internal.pageSize;

          const tableHeight = (doc as any).autoTable.previous.finalY;
          // Calcula la posición Y para la información adicional
          let infoY = tableHeight + 20; // Ajusta según sea necesario

          // Verifica si la información adicional se ajustará en la página actual
          if (infoY + 30 > 290) {
            doc.addPage();
            infoY = 20;
          }

          const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
          const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico
          const fileName = `Productos_${uniqueIdentifier}_${currentDate}.pdf`;

          // doc.save(fileName);
          // Obtener el base64 del PDF
          const pdfData = doc.output('datauristring');

          // Abrir el PDF en una nueva ventana del navegador
          const win = window.open();
          if (win) {
            win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

            // Esperar un breve momento antes de cargar el PDF en el iframe
            setTimeout(() => {
              const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
              if (pdfFrame) {
                pdfFrame.src = pdfData;
              } else {
                console.error('No se pudo encontrar el iframe para cargar el PDF.');
              }
            }, 1000);
          } else {
            console.error('No se pudo abrir la ventana del navegador.');
          }



        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => {
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
                  // this.generarPDFfinal();
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
  exportarProductosBodega() {
    this._bodegaServicio.exportarProductos().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Generar 4 números aleatorios
      const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      // Obtener la fecha y hora actual
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      const formattedTime = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

      // Crear el nombre del archivo
      a.download = `Productos_En_Bodega_${randomNumbers}_${formattedDate}_${formattedTime}.xlsx`;

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
                this.exportarProductosBodega();
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


  importarProductosBodega(): void {
    Swal.fire({
      title: 'Selecciona el archivo de productos en bodega',
      input: 'file',  // Tipo de input para archivo
      inputAttributes: {
        accept: '.xlsx,.xls',  // Aceptar solo archivos de Excel
        'aria-label': 'Sube tu archivo de productos en bodega'
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
          this._bodegaServicio.importarProductos(this.selectedFile).subscribe(
            (response) => {
              console.log('Productos importados correctamente:', response);
              Swal.fire('Éxito', 'Productos importados correctamente', 'success');
              this.obtenerBodegas();
            },
            (error) => {
              // console.error('Error al importar productos:', error); // Imprime el error completo
              // Swal.fire('Error', 'Hubo un error al importar los productos: ' + error.message, 'error');
              console.log('Error al importar productos:', error);
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
import2(selectedFile : any){

  this._bodegaServicio.importarProductos(selectedFile).subscribe(
    (response) => {
      console.log('Productos importados correctamente:', response);
      Swal.fire('Éxito', 'Productos importados correctamente', 'success');
      this.obtenerBodegas();
    },
    (error) => {
      // console.error('Error al importar productos:', error); // Imprime el error completo
      // Swal.fire('Error', 'Hubo un error al importar los productos: ' + error.message, 'error');
      console.log('Error al importar productos:', error);
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


  async generarExcel() {

    Swal.fire({
      icon: 'question',
      title: 'Descargar Excel',
      text: '¿Estás seguro de que deseas descargar el Excel?',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      confirmButtonText: 'Sí',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {

        this.empresaService.lista().subscribe({
          next: (response) => {
            if (response.status) {

              const empresas = response.value as Empresa[];
              const empresa = empresas[0];

              // Extraer los datos de la empresa
              const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
              const direccion2 = empresa ? empresa.direccion : 'No disponible';
              const telefono2 = empresa ? empresa.telefono : 'No disponible';
              const correo = empresa ? empresa.correo : 'No disponible';
              const rut = empresa ? empresa.rut : 'No disponible';
              // Recuperar el nombre de usuario del localStorage
              const usuarioString = localStorage.getItem('usuario');
              const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
              const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
              const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;
              const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

              // Crear el array de datos para el Excel
              const data = this.dataListaBodega.data.map((producto: any, index: number) => ({
                '#': index + 1,
                'Nombre Producto': producto.nombreProducto,
                'Código Barra': producto.codigoBarra,
                'Cantidad en Bodega': producto.cantidadEnBodega
              }));

              // Crear el libro de Excel
              const workbook = XLSX.utils.book_new();

              // Hoja con datos de productos
              const worksheetProductos = XLSX.utils.json_to_sheet(data);
              XLSX.utils.book_append_sheet(workbook, worksheetProductos, 'Productos en Bodega');

              // Hoja con datos de la empresa
              const datosEmpresa = [
                ['Nombre de la Empresa', nombreEmpresa],
                ['Nit', rut],
                ['Dirección', direccion2],
                ['Teléfono', telefono2],
                ['Correo', correo],
                ['Generado por', nombreUsuario],
                ['Fecha de Creación', moment().format('DD/MM/YYYY hh:mm A')]
              ];
              const worksheetEmpresa = XLSX.utils.aoa_to_sheet(datosEmpresa);
              XLSX.utils.book_append_sheet(workbook, worksheetEmpresa, 'Información Empresa');

              // Generar un nombre único para el archivo
              const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000);
              const currentDate = moment().format('YYYYMMDD-HHmmss');
              const fileName = `Productos_${uniqueIdentifier}_${currentDate}.xlsx`;

              // Guardar el archivo Excel
              XLSX.writeFile(workbook, fileName);

            } else {
              console.error('La respuesta de la API indica un error:', response.msg);
            }
          },
          error: (error) => {
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
                      this.Excel();
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



  Excel() {
    this.empresaService.lista().subscribe({
      next: (response) => {
        if (response.status) {

          const empresas = response.value as Empresa[];
          const empresa = empresas[0];

          // Extraer los datos de la empresa
          const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
          const direccion2 = empresa ? empresa.direccion : 'No disponible';
          const telefono2 = empresa ? empresa.telefono : 'No disponible';
          const correo = empresa ? empresa.correo : 'No disponible';

          // Recuperar el nombre de usuario del localStorage
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;
          const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

          // Crear el array de datos para el Excel
          const data = this.dataListaBodega.data.map((producto: any, index: number) => ({
            '#': index + 1,
            'Nombre Producto': producto.nombreProducto,
            'Código Barra': producto.codigoBarra,
            'Cantidad en Bodega': producto.cantidadEnBodega
          }));

          // Crear el libro de Excel
          const workbook = XLSX.utils.book_new();

          // Hoja con datos de productos
          const worksheetProductos = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheetProductos, 'Productos en Bodega');

          // Hoja con datos de la empresa
          const datosEmpresa = [
            ['Nombre de la Empresa', nombreEmpresa],
            ['Dirección', direccion2],
            ['Teléfono', telefono2],
            ['Correo', correo],
            ['Generado por', nombreUsuario],
            ['Fecha de Creación', moment().format('DD/MM/YYYY hh:mm A')]
          ];
          const worksheetEmpresa = XLSX.utils.aoa_to_sheet(datosEmpresa);
          XLSX.utils.book_append_sheet(workbook, worksheetEmpresa, 'Información Empresa');

          // Generar un nombre único para el archivo
          const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000);
          const currentDate = moment().format('YYYYMMDD-HHmmss');
          const fileName = `Productos_${uniqueIdentifier}_${currentDate}.xlsx`;

          // Guardar el archivo Excel
          XLSX.writeFile(workbook, fileName);

        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => {
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
                  this.Excel();
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
}
