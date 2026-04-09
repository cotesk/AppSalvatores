
import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ModalProductoComponent } from '../../Modales/modal-producto/modal-producto.component';
import { Producto } from '../../../../Interfaces/producto';
import { ProductoService } from '../../../../Services/producto.service';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import Swal from 'sweetalert2';
import { Observable, Subscription } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ReponseApi } from './../../../../Interfaces/reponse-api';
import { CambiarImagenComponent } from '../../Modales/cambiar-imagen/cambiar-imagen.component';
import { ModalCaracteristicasProductoComponent } from '../../Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { MatTable } from '@angular/material/table';
import { VerImagenProductoModalComponent } from '../../Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';
import { ModalGenerarCodigoBarraComponent } from '../../Modales/modal-generar-codigo-barra/modal-generar-codigo-barra.component';
import { Categoria } from '../../../../Interfaces/categoria';
import { CategoriaService } from '../../../../Services/categoria.service';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'
})
export class ProductoComponent implements OnInit, AfterViewInit, OnDestroy {

  urlApi: string = environment.endpoint;
  // Variable para almacenar la suma total de los valores de los productos
  sumaTotal: number = 0;
  sumaTotalCompra: number = 0;
  Ganancia: number = 0;
  usuario: any; // Define una variable para almacenar la información del usuario
  productos: Producto[] = [];
  proveedores: any[] = []; // Variable para almacenar la lista de proveedores
  categorias: any[] = [];
  proveedorSeleccionado: number | null = null; // Variable para almacenar el ID del proveedor seleccionado
  categoria: Categoria[] = [];
  categoriaSeleccionada: number | null = null; // Variable para almacenar el ID de la categoría seleccionada
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  metodoBusqueda: string | null = '';


  columnasTabla: string[] = ['imagen', 'nombre', 'unidadMedida', 'categoria', 'stock', 'precio', 'estado', 'verCaracteristicas', 'acciones'];
  dataInicio: Producto[] = [];
  dataListaProductos = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  @ViewChild(MatTable) tabla!: MatTable<Producto>;


  page = 1;
  pageSize = 5;
  totalProductos = 0;
  totalPages = 0;
  searchTerm = '';
  selectedFile: File | null = null;

  private subscriptions: Subscription[] = [];
  private listeners: (() => void)[] = [];

  constructor(
    private dialog: MatDialog,
    private _productoServicio: ProductoService,
    private _utilidadServicio: UtilidadService, private http: HttpClient,
    private snackBar: MatSnackBar,

    private empresaService: EmpresaService,
    private _categoriaServicio: CategoriaService,
    private _usuarioServicio: UsuariosService,
    private signalRService: SignalRService,
    private router: Router
  ) {

    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
    if (datosDesencriptados !== null) {
      this.usuario = JSON.parse(datosDesencriptados);
    } else {
      // Manejar el caso en el que no se encuentra ningún usuario en el Local Storage
      // Por ejemplo, podrías asignar un valor por defecto o mostrar un mensaje de error
    }
  }

  ngAfterViewInit(): void {
    this.dataListaProductos.paginator = this.paginacionTabla;
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.obtenerProducto();
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

    this.obtenerProducto();
  }
  firstPage() {
    this.page = 1;
    this.obtenerProducto();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.obtenerProducto();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.obtenerProducto();
    }
  }

  lastPage() {
    this.page = this.totalPages;
    this.obtenerProducto();
  }
  pageSizeChange() {
    this.page = 1;
    this.obtenerProducto();
  }
  onChangeTipoBusqueda2(event: any) {
    this.metodoBusqueda = event.value; // Actualiza el valor de tipoBusqueda
    // if (this.metodoBusqueda === 'Pagado') {
    //   this.formularioProductoVenta.get('intereses')!.setValue('0'); // Establece el valor de intereses a vacío
    // } else {
    //   this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
    // }
  }

  obtenerProducto() {

    this._productoServicio.listaPaginada(this.page, this.pageSize, this.searchTerm).subscribe({
      next: (data) => {
        if (data && data.data && data.data.length > 0) {

          // console.log(data.data)
          // data.data.forEach((producto: Producto) => {
          //   if (producto.imageUrl) {
          //     // producto.imageData = this._usuarioServicio.decodeBase64ToImageUrl(producto.imageData);
          //     console.log('Imagen URL:', producto.imageUrl); // Verifica si la URL está correcta
          //     producto.imageUrl = producto.imageUrl;
          //   }
          // });
          this.totalProductos = data.total;
          this.totalPages = Math.ceil(this.totalProductos / this.pageSize);
          this.dataListaProductos = data.data;
        } else {
          this.totalProductos = 0; // Reinicia el total de categorías si no hay datos
          this.totalPages = 0; // Reinicia el total de páginas si no hay datos
          this.dataListaProductos.data = []; // Limpia los datos existentes
          // Swal.fire({
          //   icon: 'warning',
          //   title: 'Advertencia',
          //   text: 'No se encontraron datos',
          // });

        }
      },
      error: (e) => {
        console.log(e)
        this.totalProductos = 0; // Reinicia el total de categorías en caso de error
        this.totalPages = 0; // Reinicia el total de páginas en caso de error
        this.dataListaProductos.data = [];
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
                  this.obtenerProducto();
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
  private async calcularSumaYGanancia(productos: Producto[]) {
    // return new Promise<void>((resolve, reject) => {
    //   this.sumaTotal = 0;
    //   this.sumaTotalCompra = 0;

    //   productos.forEach((producto: Producto, index: number) => {
    //     if (producto.esActivo) {
    //       const precio = parseFloat(producto.precio);

    //       const precioFinal = precio - (precio * (parseFloat(producto.descuentos) || 0) / 100);
    //       const valorTotalPorProducto = precioFinal * producto.stock;
    //       const valorTotalCompraPorProducto = precioCompra * producto.stock;
    //       this.sumaTotal += valorTotalPorProducto;
    //       this.sumaTotalCompra += valorTotalCompraPorProducto;
    //     }

    //     if (index === productos.length - 1) { // Verificar si es el último producto
    //       resolve(); // Resolver la promesa cuando se procese el último producto
    //     }
    //   });

    //   this.Ganancia = this.sumaTotal - this.sumaTotalCompra;
    // });
  }
  obtenerCategorias() {
    this._categoriaServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          // this.categorias = data.value;
          // Ordenar alfabéticamente antes de asignar
          data.value.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)); // Tipos explícitos para 'a' y 'b'
          this.categorias = data.value;
        } else {
          // Manejar el caso en que no se encuentren categorías
        }
      },
      error: (error) => {
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
                  this.obtenerCategorias();
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

  formatearNumero(numero: string): string {
    // Convierte la cadena a número
    const valorNumerico = parseFloat(numero.replace(',', '.'));

    // Verifica si es un número válido
    if (!isNaN(valorNumerico)) {
      // Formatea el número con comas como separadores de miles y dos dígitos decimales
      return valorNumerico.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      // Devuelve la cadena original si no se puede convertir a número
      return numero;
    }
  }

  // formatNumber(price: any): string {
  //   // Asegúrate de que `price` sea un número antes de formatearlo
  //   const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  //   if (isNaN(numericPrice)) {
  //     return '0';
  //   }

  //   // Formatea el número usando toLocaleString
  //   let formattedPrice = numericPrice.toLocaleString('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   });

  //   // Quita los decimales si el precio es un número entero
  //   formattedPrice = formattedPrice.replace(/\.00$/, '');

  //   return formattedPrice;
  // }

  ngOnDestroy(): void {
    console.log('[PedidoComponent] Destruyendo...');

    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    // this.listeners.forEach(l => l());
    // this.listeners = [];

  }


  ngOnInit(): void {

    //Funcional
    // const sub = this.signalRService.eventosGlobales$.subscribe(evento => {

    //   const ruta = this.router.url;


    //   if (evento.tipo === "producto_guardado") {

    //     if (ruta === '/pages/productos') {
    //       // console.log("aquiii 222");


    //       this.obtenerProducto();

    //     } else {
    //       this.obtenerProducto();

    //     }
    //   }

    // });
    // this.subscriptions.push(sub);

    const sub = this.signalRService.eventosGlobales$.subscribe(evento => {

      const ruta = this.router.url;

      switch (evento.tipo) {

        case "producto_guardado":
        case "imagen_producto":
        case "producto_bodega":
        case "producto_editado":
        case "producto_eliminado":
          if (ruta === '/pages/productos') {
            this.obtenerProducto();
          }
          break;


      }

    });


    this.subscriptions.push(sub);


    this.obtenerProducto();
    this.obtenerCategorias();

  }


  CategoriaSeleccionada() {
    if (this.categoriaSeleccionada !== null) {
      Swal.fire({
        title: 'Selecciona el tipo de archivo',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Generar PDF',
        cancelButtonColor: '#32a852',
        cancelButtonText: 'Generar Excel',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.generarPDFPorCategoria();
        } else if (result.dismiss === Swal.DismissReason.cancel) {

          // this.generarExcelPorCategoria();

          this._productoServicio.obtenerProductosPorCategoria(this.categoriaSeleccionada!).subscribe({
            next: (data) => {
              if (data.status) {
                // Obtener el nombre del proveedor seleccionado

                const categoriaSeleccionado = this.proveedores.find(proveedor => proveedor.idProveedor === this.proveedorSeleccionado);
                const nombreCategoria = categoriaSeleccionado ? categoriaSeleccionado.nombre : 'Categoria no encontrado';
                // const nombreCategoria2 = data.value[0].descripcionCategoria;
                // Obtener los datos para exportar a partir de los productos obtenidos
                const dataParaExportar = this.obtenerDatosParaExportar2(data.value);
                // Generar el Excel con los datos obtenidos
                this.generarExcel2(dataParaExportar, nombreCategoria);

              } else {
                // Manejar el caso en que no se encuentren productos asociados al proveedor
              }
            },
            error: (error) => {
              // Manejar errores de la solicitud
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
                        this.repeticionCategoriaPdf();
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
    } else {
      // Manejar el caso en que no se haya seleccionado ningún proveedor
      // Swal.fire({
      //   icon: 'error',
      //   title: 'Oops...',
      //   text: 'Debes seleccionar un proveedor primero!'
      // });
    }


  }



  // generarPDFPorCategoria() {
  //   if (this.categoriaSeleccionada === null) {
  //     return;
  //   }

  //   // Encontrar el nombre de la categoría seleccionada
  //   const categoriaSeleccionadaNombre = this.categorias.find(categoria => categoria.idCategoria === this.categoriaSeleccionada)?.nombre;

  //   // Filtrar productos por categoría seleccionada
  //   const productosFiltrados = this.dataListaProductos.data.filter(producto => producto.idCategoria === this.categoriaSeleccionada);

  //   // Generar PDF con los productos filtrados
  //   this.generarPDFCategoria(productosFiltrados, categoriaSeleccionadaNombre!);
  // }
  repeticionCategoriaPdf() {
    this._productoServicio.obtenerProductosPorCategoria(this.categoriaSeleccionada!).subscribe({
      next: (data) => {
        if (data.status) {
          this.calcularSumaYGanancia(data.value);
          // Obtener el nombre del proveedor seleccionado
          const categoriaSeleccionado = this.categoria.find(categori => categori.idCategoria === this.categoriaSeleccionada);
          const nombreCategoria = categoriaSeleccionado ? categoriaSeleccionado.nombre : 'Categoria no encontrado';
          const nombreCategoria2 = data.value[0].descripcionCategoria;
          // Obtener los datos para exportar a partir de los productos obtenidos
          const header = ['#', 'Nombre', 'Categoría', 'Stock', 'Precio Compra', 'Precio', 'Descuentos', 'Estado'];
          const dataParaExportar = this.obtenerDatosParaExportar2(data.value);

          // Generar el PDF con los datos obtenidos
          this.generarPDFCategoria(header, dataParaExportar, nombreCategoria2);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No hay productos con esta categoria.'
          });
          return
        }
      },
      error: (error) => {

        if (error.status === 401) {
          // Manejar errores de la solicitud
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
                    this.repeticionCategoriaPdf();
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
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No hay productos con este proveedor.'
          });
          return

        }


      }
    });
  }

  generarPDFPorCategoria() {
    if (this.categoriaSeleccionada !== null) {
      this._productoServicio.obtenerProductosPorCategoria(this.categoriaSeleccionada!).subscribe({
        next: (data) => {
          if (data.status) {
            this.calcularSumaYGanancia(data.value);
            // Obtener el nombre del proveedor seleccionado
            const categoriaSeleccionado = this.categorias.find(categori => categori.idCategoria === this.categoriaSeleccionada);
            const nombreCategoria = categoriaSeleccionado ? categoriaSeleccionado.nombre : 'Categoria no encontrado';
            // const nombreCategoria2 = data.value[0].descripcionCategoria;
            // Obtener los datos para exportar a partir de los productos obtenidos
            const header = ['#', 'Nombre', 'Categoría', 'Stock', 'Unidad Medida', 'Precio', 'Estado'];
            const dataParaExportar = this.obtenerDatosParaExportar2(data.value);

            // Generar el PDF con los datos obtenidos
            this.generarPDFCategoria(header, dataParaExportar, nombreCategoria);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'No hay productos con esta categoria.'
            });
            return
          }
        },
        error: (error) => {

          // if (error.status === 401) {


          // } else {
          //   Swal.fire({
          //     icon: 'error',
          //     title: 'Oops...',
          //     text: 'No hay productos con este proveedor.'
          //   });
          //   return

          // }

          // Manejar errores de la solicitud
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
                    this.generarPDFPorCategoria();
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
    } else {
      // Manejar el caso en que no se haya seleccionado ningún proveedor
    }


  }

  generarPDFCategoria(header: string[], data: any[][], categoriaNombre: string) {

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
          doc.text('Rut : ' + rut, additionalInfoX2, additionalInfoY2);
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

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(12);
          doc.text('Categoria selecionada : ' + categoriaNombre, 20, 55);
          // Add a line separator after the header
          doc.setLineWidth(1);
          doc.line(20, 60, 190, 60);  // Adjust the line position


          // Add date to the PDF
          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(12);
          // doc.text(`Fecha de creación de este reporte : ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 10);

          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(20);
          // doc.text('Listado de Productos', 80, 30);



          // const doc = new jsPDF();

          let sumaTotal = 0;

          // Obtener la suma total formateada
          const sumaTotalFormateada = this.formatoNumero(this.sumaTotal.toString());
          // const sumaTotalCompraFormateada = this.formatoNumero(this.sumaTotalCompra.toString());
          // const Ganancia = this.formatoNumero(this.Ganancia.toString());

          const dataFormateada = data.map(fila => {
            // Si el producto no está activo (esActivo = 0), ignorarlo en la suma total
            if (fila[5] !== 'No Activo') {
              const precio = typeof fila[4] === 'string' ? parseFloat(fila[4].replace(',', '')) : fila[5];
              const stock = typeof fila[2] === 'string' ? parseFloat(fila[2].replace(',', '')) : fila[3];

            }

            // Si el producto no está activo (esActivo = 0), cambiar el color de los campos a rojo
            const color = fila[5] === 'No Activo' ? [255, 0, 0] : [0, 0, 0]; // Rojo si es "No Activo", negro si es "Activo"
            return fila.map(campo => ({ content: campo.toString(), styles: { textColor: color } }));
          });





          // Agregar encabezado y cuerpo de la tabla al PDF
          (doc as any).autoTable({
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [header],
            // body: data, // Aquí pasamos los datos del cuerpo de la tabla
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

          // // Obtener las dimensiones del PDF
          // const { height } = doc.internal.pageSize;

          // // Agregar fila con la suma total al final del PDF
          // doc.text(`Suma total Venta: ${sumaTotalFormateada}`, 20, height - 30);
          // doc.text(`Suma total Compra : ${sumaTotalCompraFormateada}`, 20, height - 20);
          // doc.text(`Ganancia : ${Ganancia}`, 20, height - 10);


          const tableHeight = (doc as any).autoTable.previous.finalY;
          // Calcula la posición Y para la información adicional
          let infoY = tableHeight + 20; // Ajusta según sea necesario

          // Verifica si la información adicional se ajustará en la página actual
          if (infoY + 30 > 290) {
            doc.addPage();
            infoY = 20;
          }



          doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(12);
          // doc.text(`Suma total Venta:        ${sumaTotalFormateada}  $`, 130, infoY + 7);
          // doc.text(`Suma total Compra :    ${sumaTotalCompraFormateada} $`, 130, infoY + 14);
          // doc.setLineWidth(0.5);
          // doc.line(130, infoY + 23, 195, infoY + 23);
          // doc.text(`Ganancia :                   ${Ganancia} $`, 130, infoY + 30);

          const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
          const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico
          const fileName = `Productos_${uniqueIdentifier}_${currentDate}.pdf`;

          // doc.save(fileName);
          const pdfData = doc.output('datauristring');

          // Abrir el PDF en una nueva ventana del navegador
          const win = window.open();
          if (win) {
            win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
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
                  this.generarPDFCategoria(header, data, categoriaNombre);
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
  // generarExcelPorCategoria() {
  //   const currentDate = moment().format('YYYY-MM-DD');

  //   if (this.categoriaSeleccionada === null) {
  //     return;
  //   }

  //   // Encontrar el nombre de la categoría seleccionada
  //   const categoriaSeleccionadaNombre = this.categorias.find(categoria => categoria.idCategoria === this.categoriaSeleccionada)?.nombre;

  //   // Filtrar productos por categoría seleccionada
  //   const productosFiltrados = this.dataListaProductos.data.filter(producto => producto.idCategoria === this.categoriaSeleccionada);

  //   // Crear un objeto de datos para el archivo Excel
  //   const data = this.formatDataForExcel(productosFiltrados);

  //   // Crear el libro de Excel
  //   const wb = XLSX.utils.book_new();
  //   const ws = XLSX.utils.json_to_sheet(data);
  //   XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  //   // Descargar el archivo Excel
  //   XLSX.writeFile(wb, `${categoriaSeleccionadaNombre}_productos_${currentDate}.xlsx`);
  // }

  formatDataForExcel(productos: Producto[]) {
    // Formatear los datos de los productos para el archivo Excel
    return productos.map((producto, index) => ({
      '#': index + 1,
      'Nombre': producto.nombre,
      'Stock': producto.stock,
      'Precio Venta': this.formatoNumero(producto.precio),
      'Descuento': `${this.formatoNumero(producto.descuentos)}%`,
      'Estado': producto.esActivo === 1 ? 'Activo' : 'No Activo'
    }));

  }


  PDFGeneration() {
    if (this.proveedorSeleccionado !== null) {
      this._productoServicio.obtenerProductosPorProveedor(this.proveedorSeleccionado).subscribe({
        next: (data) => {
          if (data.status) {
            this.calcularSumaYGanancia(data.value);
            // Obtener el nombre del proveedor seleccionado
            const proveedorSeleccionado = this.proveedores.find(proveedor => proveedor.idProveedor === this.proveedorSeleccionado);
            const nombreProveedor = proveedorSeleccionado ? proveedorSeleccionado.nombre : 'Proveedor no encontrado';

            // Obtener los datos para exportar a partir de los productos obtenidos
            const header = ['#', 'Nombre', 'Categoría', 'Stock', 'Unidad Medida', 'Precio Compra', 'Precio', 'Descuentos', 'Estado'];
            const dataParaExportar = this.obtenerDatosParaExportar2(data.value);

            // Generar el PDF con los datos obtenidos
            this.generarPDF2(header, dataParaExportar, nombreProveedor);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'No hay productos con este proveedor.'
            });
            return
          }
        },
        error: (error) => {
          // Manejar errores de la solicitud
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
                    this.PDFGeneration();
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
    } else {
      // Manejar el caso en que no se haya seleccionado ningún proveedor
    }


  }
  generarExcel2(data: any[], Nombre: string) {
    // Verificar el contenido de los datos
    // console.log('Datos recibidos para generar el Excel:', data);
    // console.log(data);
    // Obtener la fecha actual en el formato YYYY-MM-DD
    const currentDate = moment().format('YYYY-MM-DD');

    // Calcular totales formateados
    let sumaTotal = 0;
    let sumaTotalCompra = 0;

    data.forEach((item, index) => {
      // Extraer y convertir valores de las columnas correspondientes
      const stock = Number(String(item[3])) || 0; // Columna de stock
      const precio = Number(String(item[5]).replace(/\./g, '')) || 0; // Columna de precio
      // const precioCompra = Number(String(item[5]).replace(/\./g, '')) || 0; // Columna de precioCompra
      console.log(precio);
      // Multiplicar por el stock
      const totalPrecio = stock * precio;
      // const totalPrecioCompra = stock * precioCompra;

      sumaTotal += totalPrecio;
      console.log(sumaTotal);

    });


    // Formatear los totales
    const sumaTotalFormateada = this.formatoNumero(sumaTotal.toString());

    // Crear un objeto de trabajo de Excel
    const wb = XLSX.utils.book_new();

    // Especificar los encabezados de las columnas
    const headers = ['#', 'Nombre', 'Categoría', 'Stock', 'Unidad Medida', 'Precio', 'Estado'];

    // Agregar pie de página con los totales
    const footer = [
      [],
      [],
      ['Totales:', '', '', '', 'Suma Total :', sumaTotalFormateada],
      // ['', '', '', '', '', 'Suma Total Compra:', sumaTotalCompraFormateada],
      // ['', '', '', '', '', 'Ganancia:', gananciaFormateada],
    ];

    // Combinar encabezados, datos y pie
    const excelData = [headers, ...data, ...footer];

    // Crear la hoja de trabajo de Excel
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Agregar la hoja de trabajo al libro de Excel
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');

    // Crear el nombre del archivo con categoriaNombre y la fecha actual
    const fileName = `Productos_${Nombre}_${currentDate}.xlsx`;

    // Descargar el archivo Excel
    XLSX.writeFile(wb, fileName);
  }


  // Método para obtener los productos asociados al proveedor seleccionado
  // Método para obtener los productos asociados al proveedor seleccionado y generar el PDF

  IngresarProductos(element: Producto) {


    if (element.unidadMedida == "Comida") {
      Swal.fire({
        icon: 'warning',
        title: 'Informacion',
        text: `Los productos de tipo comida no pueden ser ingresado a bodega.`,
      });
      return
    } else {
      Swal.fire({
        title: '¿Cuántos cantidad desea ingresar a bodega?',
        html: `
      <input id="cantidadInput" class="swal2-input" type="number" min="1" max="${element.stock}" step="1" placeholder="Cantidad" style="width: 120px; height: 50px; font-size: 16px;">
    `,
        showCancelButton: true,
        confirmButtonColor: '#1337E8',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ingresar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const input = Swal.getPopup()!.querySelector('#cantidadInput') as HTMLInputElement;
          const cantidad = Number(input.value);
          if (!cantidad || isNaN(cantidad)) {
            Swal.showValidationMessage('Debe ingresar una cantidad válida');
            return false;
          }
          if (cantidad > element.stock) {
            Swal.showValidationMessage(`No puede ingresar más de ${element.stock} productos`);
            return false;
          }
          return cantidad;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const cantidadASacar = result.value as number;
          this._productoServicio.ingresarProductos(element.idProducto, cantidadASacar).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: `Se ingresaron ${cantidadASacar} productos exitosamente.`,
              });
              this.obtenerProducto();
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
                        this.ingresar(element.idProducto, cantidadASacar);
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

  }

  ingresar(element: any, cantidadASacar: any) {

    // const cantidadASacar = result.value as number;
    this._productoServicio.ingresarProductos(element.idProducto, cantidadASacar).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Se sacaron ${cantidadASacar} productos exitosamente.`,
        });
        this.obtenerProducto();
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
                  this.ingresar(element.idProducto, cantidadASacar);
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


  IngresarProductosVencidos(element: Producto) {


    if (element.unidadMedida == "Comida") {
      Swal.fire({
        icon: 'warning',
        title: 'Informacion',
        text: `Los productos de tipo comida no se le puedes ingresar un valor de stock.`,
      });
      return
    } else {
      Swal.fire({
        title: '¿Cuál seria la nueva cantidad a actualizar?',
        html: `
      <input id="cantidadInput" class="swal2-input" type="number" min="1" max="${element.stock}" step="1" placeholder="Cantidad" style="width: 120px; height: 50px; font-size: 16px;">
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
          // if (cantidad > element.stock) {
          //   Swal.showValidationMessage(`No puede ingresar más de ${element.stock} productos`);
          //   return false;
          // }
          return cantidad;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const cantidadASacar = result.value as number;
          this._productoServicio.stockProductos(element.idProducto, cantidadASacar).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: `Se actualizó ${cantidadASacar} productos exitosamente.`,
              });
              this.obtenerProducto();
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
                        this.ingresar(element.idProducto, cantidadASacar);
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



  }

  ingresarVencidos(element: any, cantidadASacar: any) {

    // const cantidadASacar = result.value as number;
    this._productoServicio.ingresarProductosVencidos(element.idProducto, cantidadASacar).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Se sacaron ${cantidadASacar} productos exitosamente.`,
        });
        this.obtenerProducto();
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
                  this.ingresarVencidos(element.idProducto, cantidadASacar);
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


  obtenerProductosPorProveedor() {
    if (this.proveedorSeleccionado !== null) {
      Swal.fire({
        title: 'Selecciona el tipo de archivo',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Generar PDF',
        cancelButtonColor: '#32a852',
        cancelButtonText: 'Generar Excel',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.PDFGeneration();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this._productoServicio.obtenerProductosPorProveedor(this.proveedorSeleccionado!).subscribe({
            next: (data) => {
              if (data.status) {
                // Obtener el nombre del proveedor seleccionado

                const proveedorSeleccionado = this.proveedores.find(proveedor => proveedor.idProveedor === this.proveedorSeleccionado);
                const nombreProveedor = proveedorSeleccionado ? proveedorSeleccionado.nombre : 'Proveedor no encontrado';
                // Obtener los datos para exportar a partir de los productos obtenidos
                const dataParaExportar = this.obtenerDatosParaExportar2(data.value);
                // Generar el Excel con los datos obtenidos
                this.generarExcel2(dataParaExportar, nombreProveedor);

              } else {
                // Manejar el caso en que no se encuentren productos asociados al proveedor
              }
            },
            error: (error) => {
              // Manejar errores de la solicitud
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
                        this.provesele();
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
    } else {
      // Manejar el caso en que no se haya seleccionado ningún proveedor
      // Swal.fire({
      //   icon: 'error',
      //   title: 'Oops...',
      //   text: 'Debes seleccionar un proveedor primero!'
      // });
    }
  }

  provesele() {
    this._productoServicio.obtenerProductosPorProveedor(this.proveedorSeleccionado!).subscribe({
      next: (data) => {
        if (data.status) {
          // Obtener el nombre del proveedor seleccionado

          const proveedorSeleccionado = this.proveedores.find(proveedor => proveedor.idProveedor === this.proveedorSeleccionado);
          const nombreProveedor = proveedorSeleccionado ? proveedorSeleccionado.nombre : 'Proveedor no encontrado';
          // Obtener los datos para exportar a partir de los productos obtenidos
          const dataParaExportar = this.obtenerDatosParaExportar2(data.value);
          // Generar el Excel con los datos obtenidos
          this.generarExcel2(dataParaExportar, nombreProveedor);

        } else {
          // Manejar el caso en que no se encuentren productos asociados al proveedor
        }
      },
      error: (error) => {
        // Manejar errores de la solicitud
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
                  this.provesele();
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

  // Método para obtener los datos para exportar a partir de los productos obtenidos
  obtenerDatosParaExportar2(productos: Producto[]) {
    let contador = 1;
    return productos.map(producto => {

      const precioFormateado = this.formatoNumero(producto.precio);
      const descuento = typeof producto.descuentos === 'string' ?
        parseFloat(producto.descuentos.replace(',', '.')) :
        producto.descuentos;
      const descuentoFormateado = !isNaN(descuento) && descuento !== null && descuento !== undefined ? descuento.toFixed(0) + ' %' : '0 %';
      const nombreCorto = producto.nombre.length > 40 ? producto.nombre.slice(0, 40) + '...' : producto.nombre;

      // Construir la fila con el contador
      const fila = [
        contador++,
        nombreCorto,
        producto.descripcionCategoria,
        producto.stock,
        producto.unidadMedida,

        precioFormateado, // Precio formateado
        // descuentoFormateado,
        producto.esActivo ? 'Activo' : 'No Activo'
      ];

      return fila;
    });
  }

  // Método para generar el PDF con los datos proporcionados
  generarPDF2(header: string[], data: any[][], nombreProveedor: string) {

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
          doc.text('Rut : ' + rut, additionalInfoX2, additionalInfoY2);
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

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(12);
          doc.text('Proveedor selecionado : ' + nombreProveedor, 20, 55);
          // Add a line separator after the header
          doc.setLineWidth(1);
          doc.line(20, 60, 190, 60);  // Adjust the line position


          // Add date to the PDF
          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(12);
          // doc.text(`Fecha de creación de este reporte : ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 10);

          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(20);
          // doc.text('Listado de Productos', 80, 30);



          // const doc = new jsPDF();

          let sumaTotal = 0;

          // Obtener la suma total formateada
          const sumaTotalFormateada = this.formatoNumero(this.sumaTotal.toString());
          const sumaTotalCompraFormateada = this.formatoNumero(this.sumaTotalCompra.toString());
          const Ganancia = this.formatoNumero(this.Ganancia.toString());

          const dataFormateada = data.map(fila => {
            // Si el producto no está activo (esActivo = 0), ignorarlo en la suma total
            if (fila[7] !== 'No Activo') {
              const precio = typeof fila[5] === 'string' ? parseFloat(fila[5].replace(',', '')) : fila[5];
              const stock = typeof fila[3] === 'string' ? parseFloat(fila[3].replace(',', '')) : fila[3];

            }

            // Si el producto no está activo (esActivo = 0), cambiar el color de los campos a rojo
            const color = fila[7] === 'No Activo' ? [255, 0, 0] : [0, 0, 0]; // Rojo si es "No Activo", negro si es "Activo"
            return fila.map(campo => ({ content: campo.toString(), styles: { textColor: color } }));
          });





          // Agregar encabezado y cuerpo de la tabla al PDF
          (doc as any).autoTable({
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [header],
            // body: data, // Aquí pasamos los datos del cuerpo de la tabla
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

          // // Obtener las dimensiones del PDF
          // const { height } = doc.internal.pageSize;

          // // Agregar fila con la suma total al final del PDF
          // doc.text(`Suma total Venta: ${sumaTotalFormateada}`, 20, height - 30);
          // doc.text(`Suma total Compra : ${sumaTotalCompraFormateada}`, 20, height - 20);
          // doc.text(`Ganancia : ${Ganancia}`, 20, height - 10);


          const tableHeight = (doc as any).autoTable.previous.finalY;
          // Calcula la posición Y para la información adicional
          let infoY = tableHeight + 20; // Ajusta según sea necesario

          // Verifica si la información adicional se ajustará en la página actual
          if (infoY + 30 > 290) {
            doc.addPage();
            infoY = 20;
          }



          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(12);
          doc.text(`Suma total Venta:        ${sumaTotalFormateada}  $`, 130, infoY + 7);
          doc.text(`Suma total Compra :    ${sumaTotalCompraFormateada} $`, 130, infoY + 14);
          doc.setLineWidth(0.5);
          doc.line(130, infoY + 23, 195, infoY + 23);
          doc.text(`Ganancia :                   ${Ganancia} $`, 130, infoY + 30);

          const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
          const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico
          const fileName = `Productos_${uniqueIdentifier}_${currentDate}.pdf`;

          // doc.save(fileName);
          const pdfData = doc.output('datauristring');

          // Abrir el PDF en una nueva ventana del navegador
          const win = window.open();
          if (win) {
            win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
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
                  this.generarPDF2(header, data, nombreProveedor);
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


  cambiarImagen(producto: Producto) {
    this.dialog.open(CambiarImagenComponent, {
      disableClose: true,
      data: { producto: producto } // Asegúrate de pasar correctamente el producto en la propiedad "data"
    }).afterClosed().subscribe(resultado => {
      if (resultado === true) {
        this.obtenerProducto();
      }
    });
  }
  verCaracteristicas(producto: Producto): void {
    this.dialog.open(ModalCaracteristicasProductoComponent, {
      data: {
        caracteristicas: producto.caracteristicas || 'No hay características disponibles',
        imagenUrl: producto.imagenUrl,
        nombre: producto.nombre
      }
    });
  }
  abrirModalCodigoBarras(producto: Producto) {

    if (producto.unidadMedida == "Comida") {
      Swal.fire({
        icon: 'warning',
        title: 'Informacion',
        text: `Los productos de tipo comida no se le pueden generar codigos de barra`,
      });
      return
    } else {
      this.dialog.open(ModalGenerarCodigoBarraComponent, {
        width: '600px', // Ancho del modal
        height: '300px',
        // disableClose: true,
        data: {
          nombre: producto.nombre || 'No hay nombre disponibles',
          codigo: producto.codigo
        }
      });

    }




  }
  // ngAfterViewInit(): void {
  //   this.dataListaProductos.paginator = this.paginacionTabla;
  // }

  // aplicarFiltroTabla(event: Event) {
  //   const filtreValue = (event.target as HTMLInputElement).value;
  //   this.dataListaProductos.filter = filtreValue.trim().toLocaleLowerCase();
  // }

  nuevoProducto() {

    this.dialog.open(ModalProductoComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerProducto();

    });
  }
  editarProducto(producto: Producto) {

    this.dialog.open(ModalProductoComponent, {
      disableClose: true,
      data: producto
    }).afterClosed().subscribe(resultado => {

      if (resultado === "true") this.obtenerProducto();

    });
  }
  exportarProductos() {

    Swal.fire({
      icon: 'question',
      title: 'Descargar Excel',
      text: '¿Estás seguro de que deseas descargar el archivo Excel?',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      confirmButtonText: 'Sí',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {



        this._productoServicio.exportarProductos().subscribe(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          // Generar 4 números aleatorios
          const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

          // Obtener la fecha y hora actual
          const now = new Date();
          const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
          const formattedTime = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

          // Crear el nombre del archivo
          a.download = `Productos_${randomNumbers}_${formattedDate}_${formattedTime}.xlsx`;

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
                    this.exportarProductos();
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
    });


  }


  importarProductos(): void {
    Swal.fire({
      title: 'Selecciona el archivo de productos',
      input: 'file',  // Tipo de input para archivo
      inputAttributes: {
        accept: '.xlsx,.xls',  // Aceptar solo archivos de Excel
        'aria-label': 'Sube tu archivo de productos'
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
          this._productoServicio.importarProductos(this.selectedFile).subscribe(
            (response) => {
              console.log('Productos importados correctamente:', response);
              Swal.fire('Éxito', 'Productos importados correctamente', 'success');
              this.obtenerProducto();
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
  import2(selectedFile: any) {

    this._productoServicio.importarProductos(selectedFile).subscribe(
      (response) => {
        console.log('Productos importados correctamente:', response);
        Swal.fire('Éxito', 'Productos importados correctamente', 'success');
        this.obtenerProducto();
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

  eliminarProducto(producto: Producto) {
    Swal.fire({
      title: "¿Desea eliminar el producto?",
      text: producto.nombre,
      icon: "warning",
      confirmButtonColor: '#3085d6',
      confirmButtonText: "Sí, eliminar",
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, volver'
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        // this.eliminarProductoLocal(producto);
        this.eliminarProductoServidor(producto);
      }
    });
  }

  eliminarProductoLocal(producto: Producto) {
    // Verificar que dataListaProductos.data sea un array válido
    if (Array.isArray(this.dataListaProductos?.data)) {
      const index = this.dataListaProductos.data.indexOf(producto);
      if (index !== -1) {
        this.dataListaProductos.data.splice(index, 1);
        // Actualizar la fuente de datos de la tabla después de eliminar el producto
        this.dataListaProductos.data = [...this.dataListaProductos.data];
      }
    }
  }

  eliminarProductoServidor(producto: Producto) {
    this._productoServicio.eliminar(producto.idProducto).subscribe({
      next: (data) => {
        if (data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Producto Eliminado',
            text: `El producto fue eliminado`,
          });
          this.obtenerProducto();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'ERROR',
            text: `No se pudo eliminar el producto`,
          });
        }
      },
      error: (e) => {
        this.manejarErrorEliminacion(producto);
      }
    });
  }

  manejarErrorEliminacion(producto: Producto) {
    let idUsuario: number = 0;

    // Obtener el idUsuario del localStorage
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const bytes = CryptoJS.AES.decrypt(usuarioString, this.CLAVE_SECRETA);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados) {
        const usuario = JSON.parse(datosDesencriptados);
        idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

        this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
          (usuario: any) => {
            console.log('Usuario obtenido:', usuario);
            let refreshToken = usuario.refreshToken;

            // Manejar la renovación del token
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                console.log('Token actualizado:', response.token);
                // Guardar el nuevo token de acceso en el almacenamiento local
                localStorage.setItem('authToken', response.token);
                // Volver a intentar eliminar el producto
                this.eliminarProductoServidor(producto);
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
  }


  CambiarIva() {
    Swal.fire({
      title: 'Ingrese el nuevo valor del iva',
      input: 'number',
      inputLabel: 'Nuevo Iva',
      inputPlaceholder: 'Ingrese el nuevo valor del iva',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un valor de iva';
        } else {
          return ''; // Retorna una cadena vacía si no hay problemas de validación
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const iva = result.value;
        // Swal.fire({
        //   title: 'Buscando...',
        //   allowOutsideClick: false,
        //   html: '<img src="assets/Images/bean-mr.gif" style="width: 200px; height: 200px;">',
        //   didOpen: () => {
        //     Swal.showLoading();
        //   }
        // });

        this._productoServicio.actualizarIva(iva).subscribe(
          (response: any) => {
            if (response.status) {
              Swal.fire('Éxito', 'Se ha cambiado el valor del iva a todos los productos', 'success');
              this.obtenerProducto();
            } else {
              Swal.fire('Error', response.msg, 'error');
            }
          },
          (error) => {
            // Swal.fire('Error', 'Hubo un error al cambiar el valor del iva.', 'error');
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
                      this.iva(iva);
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
    });
  }
  iva(iva: number) {

    this._productoServicio.actualizarIva(iva).subscribe(
      (response: any) => {
        if (response.status) {
          Swal.fire('Éxito', 'Se ha cambiado el valor del iva a todos los productos', 'success');
          this.obtenerProducto();
        } else {
          Swal.fire('Error', response.msg, 'error');
        }
      },
      (error) => {
        // Swal.fire('Error', 'Hubo un error al cambiar el valor del iva.', 'error');
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
                  this.iva(iva);
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

  verImagen(producto: Producto): void {
    console.log(producto);
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenes: producto.imagenUrl
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
              doc.text('Rut : ' + rut, additionalInfoX2, additionalInfoY2);
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

              this._productoServicio.lista().subscribe({
                next: (response) => {
                  if (response.status) {
                    // Verificar si la lista de productos está en la propiedad 'value' del objeto 'response'
                    const productos = response.value;

                    // Comprobar si 'productos' es un array
                    if (Array.isArray(productos)) {
                      // Asignar la lista de productos a 'data'
                      const data = productos;
                      productos.sort((a: any, b: any) => {
                        const nombreA = a.nombre.toLowerCase();
                        const nombreB = b.nombre.toLowerCase();
                        if (nombreA < nombreB) {
                          return -1;
                        }
                        if (nombreA > nombreB) {
                          return 1;
                        }
                        return 0;
                      });

                      this.calcularSumaYGanancia(data); // Esperar a que se resuelva la promesa




                      // Inicializar la suma total en 0
                      let sumaTotal = 0;

                      // Obtener la suma total formateada
                      const sumaTotalFormateada = this.formatoNumero(this.sumaTotal.toString());
                      const sumaTotalCompraFormateada = this.formatoNumero(this.sumaTotalCompra.toString());
                      const Ganancia = this.formatoNumero(this.Ganancia.toString());
                      // Formatear los datos para aplicar el color y calcular la suma total
                      const dataFormateada = productos.map((producto: any, index: number) => {
                        if (producto.esActivo) {
                          const precio = typeof producto.precio === 'string' ? parseFloat(producto.precio.replace(',', '')) : producto.precio;
                          const stock = typeof producto.stock === 'string' ? parseFloat(producto.stock.replace(',', '')) : producto.stock;
                          sumaTotal += precio * stock;
                        }

                        const color = producto.esActivo ? [0, 0, 0] : [255, 0, 0];
                        const color2 = producto.esActivo ? [0, 0, 255] : [255, 0, 0];
                        // const precioCompraFormateado = this.formatoNumero(producto.precioCompra.toString());
                        const precioFormateado = this.formatoNumero(producto.precio.toString());
                        const stockFormateado = this.formatoNumero(producto.stock.toString());
                        // const descuentoFormateado = this.formatoNumero(producto.descuentos.toString());
                        const nombreCortado = producto.nombre.length > 40 ? producto.nombre.substring(0, 40) + '...' : producto.nombre;
                        return [
                          { content: (index + 1).toString(), styles: { textColor: color2 } },
                          { content: nombreCortado, styles: { textColor: color } },
                          { content: producto.descripcionCategoria, styles: { textColor: color } },
                          { content: stockFormateado, styles: { textColor: color } },
                          { content: producto.unidadMedida, styles: { textColor: color } },
                          // { content: precioCompraFormateado, styles: { textColor: color } },
                          { content: precioFormateado, styles: { textColor: color } },
                          // { content: descuentoFormateado + ' %', styles: { textColor: color } },
                          { content: producto.esActivo ? 'Activo' : 'No Activo', styles: { textColor: color } },
                        ];
                      });





                      (doc as any).autoTable({
                        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
                        head: [['#', 'Nombre', 'Categoría', 'Stock', 'Unidad Medida', 'Precio', 'Estado']],
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
                      // const tableOptions = {

                      //   margin: { horizontal: 20 },
                      //   styles: { font: 'Helvetica', fontSize: 10 },
                      //   headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
                      // };
                      // Obtener las dimensiones del PDF
                      const { height } = doc.internal.pageSize;
                      // Agregar fila con la suma total al final del PDF
                      // doc.setFontSize(12);
                      // doc.text(`Suma total Venta: ${sumaTotalFormateada} $`, 20, height - 30);
                      // doc.text(`Suma total Compra : ${sumaTotalCompraFormateada} $`, 20, height - 20);
                      // doc.line(20, height - 16, 90, height - 16);
                      // doc.text(`Ganancia : ${Ganancia} $`, 20, height - 10);

                      const tableHeight = (doc as any).autoTable.previous.finalY;
                      // Calcula la posición Y para la información adicional
                      let infoY = tableHeight + 20; // Ajusta según sea necesario

                      // Verifica si la información adicional se ajustará en la página actual
                      if (infoY + 30 > 290) {
                        doc.addPage();
                        infoY = 20;
                      }



                      // doc.setFont('Helvetica', 'normal');
                      // doc.setFontSize(12);
                      // doc.text(`Suma total Venta:        ${sumaTotalFormateada}  $`, 130, infoY + 7);
                      // doc.text(`Suma total Compra :    ${sumaTotalCompraFormateada} $`, 130, infoY + 14);
                      // doc.setLineWidth(0.5);
                      // doc.line(130, infoY + 23, 195, infoY + 23);
                      // doc.text(`Ganancia :                   ${Ganancia} $`, 130, infoY + 30);


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
                      console.error('La lista de productos no es un array:', productos);
                    }
                  } else {
                    console.error('La respuesta de la API indica un error:', response.msg);
                  }
                },
                error: (error) => {
                  console.error('Error al obtener la lista de productos:', error);
                }
              });



              // // Add date to the PDF
              // doc.setFont('Helvetica', 'normal');
              // doc.setFontSize(12);
              // doc.text(`Fecha de creación de este reporte : ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 10);

              // doc.setFont('Helvetica', 'normal');
              // doc.setFontSize(20);
              // doc.text('Listado de Productos', 80, 30);


              // Obtener el base64 del PDF
              // const pdfData = doc.output('datauristring');

              // // Abrir el PDF en una nueva ventana del navegador
              // const win = window.open();
              // if (win) {
              //   win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

              //   // Esperar un breve momento antes de cargar el PDF en el iframe
              //   setTimeout(() => {
              //     const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
              //     if (pdfFrame) {
              //       pdfFrame.src = pdfData;
              //     } else {
              //       console.error('No se pudo encontrar el iframe para cargar el PDF.');
              //     }
              //   }, 1000);
              // } else {
              //   console.error('No se pudo abrir la ventana del navegador.');
              // }

              // Swal.fire({
              //   icon: 'success',
              //   title: 'Éxito',
              //   text: 'El archivo PDF ha sido descargado',
              // });


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
                      this.generarPDFfinal();
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

  generarPDFfinal() {
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
          doc.text('Rut : ' + rut, additionalInfoX2, additionalInfoY2);
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


          this.calcularSumaYGanancia(this.dataListaProductos.data); // Esperar a que se resuelva la promesa


          const data = this.obtenerDatosParaExportar();

          // Inicializar la suma total en 0
          let sumaTotal = 0;

          // Obtener la suma total formateada
          const sumaTotalFormateada = this.formatoNumero(this.sumaTotal.toString());
          const sumaTotalCompraFormateada = this.formatoNumero(this.sumaTotalCompra.toString());
          const Ganancia = this.formatoNumero(this.Ganancia.toString());
          // Formatear los datos para aplicar el color y calcular la suma total
          const dataFormateada = data.map(fila => {
            // Si el producto no está activo (esActivo = 0), ignorarlo en la suma total
            if (fila[7] !== 'No Activo') {
              const precio = typeof fila[5] === 'string' ? parseFloat(fila[5].replace(',', '')) : fila[5];
              const stock = typeof fila[3] === 'string' ? parseFloat(fila[3].replace(',', '')) : fila[3];

            }

            // Si el producto no está activo (esActivo = 0), cambiar el color de los campos a rojo
            const color = fila[7] === 'No Activo' ? [255, 0, 0] : [0, 0, 0]; // Rojo si es "No Activo", negro si es "Activo"
            return fila.map(campo => ({ content: campo.toString(), styles: { textColor: color } }));
          });


          // // Add date to the PDF
          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(12);
          // doc.text(`Fecha de creación de este reporte : ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 10);

          // doc.setFont('Helvetica', 'normal');
          // doc.setFontSize(20);
          // doc.text('Listado de Productos', 80, 30);

          (doc as any).autoTable({
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [['#', 'Nombre', 'Categoría', 'Stock', 'Precio Compra', 'Precio', 'Descuentos', 'Estado']],
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
          // const tableOptions = {

          //   margin: { horizontal: 20 },
          //   styles: { font: 'Helvetica', fontSize: 10 },
          //   headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
          // };
          // Obtener las dimensiones del PDF
          const { height } = doc.internal.pageSize;
          // Agregar fila con la suma total al final del PDF
          // doc.setFontSize(12);
          // doc.text(`Suma total Venta: ${sumaTotalFormateada} $`, 20, height - 30);
          // doc.text(`Suma total Compra : ${sumaTotalCompraFormateada} $`, 20, height - 20);
          // doc.line(20, height - 16, 90, height - 16);
          // doc.text(`Ganancia : ${Ganancia} $`, 20, height - 10);

          const tableHeight = (doc as any).autoTable.previous.finalY;
          // Calcula la posición Y para la información adicional
          let infoY = tableHeight + 20; // Ajusta según sea necesario

          // Verifica si la información adicional se ajustará en la página actual
          if (infoY + 30 > 290) {
            doc.addPage();
            infoY = 20;
          }



          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(12);
          doc.text(`Suma total Venta:        ${sumaTotalFormateada}  $`, 130, infoY + 7);
          doc.text(`Suma total Compra :    ${sumaTotalCompraFormateada} $`, 130, infoY + 14);
          doc.setLineWidth(0.5);
          doc.line(130, infoY + 23, 195, infoY + 23);
          doc.text(`Ganancia :                   ${Ganancia} $`, 130, infoY + 30);


          const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
          const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico
          const fileName = `Productos_${uniqueIdentifier}_${currentDate}.pdf`;

          doc.save(fileName);

          // Obtener el base64 del PDF
          // const pdfData = doc.output('datauristring');

          // // Abrir el PDF en una nueva ventana del navegador
          // const win = window.open();
          // if (win) {
          //   win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

          //   // Esperar un breve momento antes de cargar el PDF en el iframe
          //   setTimeout(() => {
          //     const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
          //     if (pdfFrame) {
          //       pdfFrame.src = pdfData;
          //     } else {
          //       console.error('No se pudo encontrar el iframe para cargar el PDF.');
          //     }
          //   }, 1000);
          // } else {
          //   console.error('No se pudo abrir la ventana del navegador.');
          // }

          // Swal.fire({
          //   icon: 'success',
          //   title: 'Éxito',
          //   text: 'El archivo PDF ha sido descargado',
          // });


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
                  this.generarPDFfinal();
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

  formatoNumero(numero: string): string {
    if (numero !== null) {
      const valorNumerico = parseFloat(numero.replace(',', '.'));
      if (!isNaN(valorNumerico)) {
        const opciones = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
        return valorNumerico.toLocaleString('es-CO', opciones);
      } else {
        return numero;
      }
    } else {
      return ''; // O devuelve un valor predeterminado, dependiendo de tus necesidades
    }
  }

  obtenerDatosParaExportar() {
    let contador = 1;
    return this.dataListaProductos.data.map(producto => {

      const precioFormateado = this.formatoNumero(producto.precio);
      const descuento = typeof producto.descuentos === 'string' ?
        parseFloat(producto.descuentos.replace(',', '.')) :
        producto.descuentos;
      const descuentoFormateado = !isNaN(descuento) && descuento !== 0 ? descuento.toFixed(0) + '%' : '0%';

      // Construir la fila con el contador
      const fila = [
        contador++,
        producto.nombre,
        producto.descripcionCategoria,
        producto.stock,
        precioFormateado, // Precio formateado
        descuentoFormateado,
        producto.esActivo ? 'Activo' : 'No Activo'
      ];

      return fila;
    });
  }

  generarExcel() {

    Swal.fire({
      icon: 'question',
      title: 'Descargar Excel',
      text: '¿Estás seguro de que deseas descargar el archivo Excel?',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      confirmButtonText: 'Sí',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {


        this._productoServicio.lista().subscribe({
          next: (response) => {
            if (response.status) {
              // Verificar si la lista de productos está en la propiedad 'value' del objeto 'response'
              const productos = response.value;

              // Comprobar si 'productos' es un array
              if (Array.isArray(productos)) {
                // Asignar la lista de productos a 'data'
                const data = productos;
                productos.sort((a: any, b: any) => {
                  const nombreA = a.nombre.toLowerCase();
                  const nombreB = b.nombre.toLowerCase();
                  return nombreA.localeCompare(nombreB);
                });

                this.calcularSumaYGanancia(data); // Esperar a que se resuelva la promesa




                // Inicializar la suma total en 0
                let sumaTotal = 0;


                // Formatear los datos para aplicar el color y calcular la suma total
                const dataFormateada = productos.map((producto: any, index: number) => {
                  const color = producto.esActivo ? [0, 0, 0] : [255, 0, 0];
                  return [
                    { content: (index + 1).toString(), styles: { textColor: color } },
                    { content: producto.nombre.length > 40 ? producto.nombre.substring(0, 40) + '...' : producto.nombre, styles: { textColor: color } },
                    { content: producto.descripcionCategoria, styles: { textColor: color } },
                    { content: this.formatoNumero(producto.stock.toString()), styles: { textColor: color } },
                    { content: (producto.unidadMedida), styles: { textColor: color } },
                    // { content: this.formatoNumero(producto.precioCompra.toString()), styles: { textColor: color } },
                    { content: this.formatoNumero(producto.precio.toString()), styles: { textColor: color } },
                    // { content: this.formatoNumero(producto.descuentos.toString()) + ' %', styles: { textColor: color } },
                    { content: producto.esActivo ? 'Activo' : 'No Activo', styles: { textColor: color } },
                  ];
                });

                // Obtener la suma total formateada
                const sumaTotalFormateada = this.formatoNumero(this.sumaTotal.toString());
                const sumaTotalCompraFormateada = this.formatoNumero(this.sumaTotalCompra.toString());
                const Ganancia = this.formatoNumero(this.Ganancia.toString());

                // const data = this.obtenerDatosParaExportar();
                const header = ['#', 'Nombre', 'Categoría', 'Stock', 'Unidad Medida', 'Precio', 'Estado'];
                const footer = [
                  [],
                  [],

                  ['', '', '', '', 'Suma Total:', sumaTotalFormateada],
                  ['', '', '', '', '', 'Ganancia:', Ganancia],
                ];

                // Combinar encabezado, datos y pie en un solo arreglo
                const dataFinal = [header, ...dataFormateada.map(row => row.map(cell => cell.content)), ...footer];

                // Crear y exportar archivo Excel
                const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // ID único
                const currentDate = moment().format('YYYYMMDD'); // Fecha actual
                const ws = XLSX.utils.aoa_to_sheet(dataFinal);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Productos');
                XLSX.writeFile(wb, `Productos_${uniqueIdentifier}_${currentDate}.xlsx`);

                Swal.fire({
                  icon: 'success',
                  title: 'Éxito',
                  text: 'El archivo Excel ha sido descargado',
                });

              } else {
                console.error('La lista de productos no es un array:', productos);
              }
            } else {
              console.error('La respuesta de la API indica un error:', response.msg);
            }
          },
          error: (error) => {
            console.error('Error al obtener la lista de productos:', error);
          }
        });





      }
    });



  }


}
