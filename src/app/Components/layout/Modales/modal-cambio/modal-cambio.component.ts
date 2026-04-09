import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Producto } from '../../../../Interfaces/producto';
import { ProductoService } from '../../../../Services/producto.service';
import { CambioService } from '../../../../Services/cambio.service';
import Swal from 'sweetalert2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Caja } from '../../../../Interfaces/caja';
import { CajaService } from '../../../../Services/caja.service';
import { MatTableDataSource } from '@angular/material/table';
import { UsuariosService } from '../../../../Services/usuarios.service';
import { catchError, debounceTime, of, take } from 'rxjs';
import { Cambio } from '../../../../Interfaces/cambio';
import { int } from '@zxing/library/esm/customTypings';
import * as CryptoJS from 'crypto-js';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';

@Component({
  selector: 'app-modal-cambio',
  templateUrl: './modal-cambio.component.html',
  styleUrl: './modal-cambio.component.css'
})
export class ModalCambioComponent implements OnInit {

  productoActual: any; // Aquí puedes definir la estructura de tu producto
  nuevoProducto: any = {}; // Aquí puedes definir la estructura de tu nuevo producto
  valorInput: string = "";
  valorInputNumeroVenta: string = "";
  formularioProductoVenta: FormGroup;

  listaProducto: Producto[] = [];
  listaProductoFiltro: Producto[] = [];
  selectedDetalle: any = null; // Almacena el detalle seleccionado
  isDisabled: boolean = false; // Estado de deshabilitación de las filas
  seleccionado: any; // Variable para almacenar el detalle seleccionado
  productoSeleccionado!: Producto | null;
  imagenSeleccionada: string | null = null;
  precioProducto: string = '';
  precioPorCajaProducto: string = '';
  tipodePagoPorDefecto: string = "Efectivo";
  estadoProductoDevuelto: string = "Nuevo";
  dataInicio: Caja[] = [];
  dataListaCaja = new MatTableDataSource(this.dataInicio);
  dataListaCambios: MatTableDataSource<Cambio>;
  selectedCambio: any = null;
  seleccionadoCambio: any;
  cambioEsNuevo: boolean = true;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  columnasMostradas: string[] = ['select', 'idCambio', 'producto', 'nuevoProducto', 'cantidadCambiada', 'unidadMedida', 'diferenciaPrecio', 'fechaCambio'];
  unidaddePagoPorDefecto: string = "Unitario";

  constructor(
    private dialogRef: MatDialogRef<ModalCambioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private _productoServicio: ProductoService,
    private cambioService: CambioService,
    private snackBar: MatSnackBar,
    private cajaService: CajaService,
    private _usuarioServicio: UsuariosService,
    private dialog: MatDialog

  ) {

    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', Validators.required],
      motivo: ['', Validators.required],

    });

    this.dataListaCambios = new MatTableDataSource<Cambio>([]);


    this._productoServicio.lista().subscribe({

      next: (data) => {
        if (data.status) {

          this.listaProducto = data.value.sort((a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Producto[];
          this.listaProducto = lista.filter(p => p.esActivo == 1 && p.stock > 0)


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
                  this.lista();
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

    this.formularioProductoVenta.get('producto')?.valueChanges.subscribe(value => {
      this.listaProductoFiltro = this.retornarProductoPorFiltro(value)
    })


  }


  esNegativo(valor: number): boolean {
    return valor < 0;
  }
  lista() {
    this._productoServicio.lista().subscribe({

      next: (data) => {
        if (data.status) {

          this.listaProducto = data.value.sort((a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Producto[];
          this.listaProducto = lista.filter(p => p.esActivo == 1 && p.stock > 0)


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
                  this.lista();
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



  ngOnInit() {
    this.valorInput = this.data.idVenta;
    this.valorInputNumeroVenta = this.data.numeroDocumento;
    let idVenta: number = 0;

    idVenta = parseInt(this.valorInput);

    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', Validators.required],
      motivo: ['', Validators.required],
      estadoProductoDevuelto: ['', Validators.required],
      tipodePagoPorDefecto: ['', Validators.required],
    });


    this.cambioService.obtenerCambiosTodoIdVenta(idVenta).subscribe(
      (cambios: Cambio[]) => {
        // Asignar los cambios obtenidos al origen de datos de la tabla
        cambios.sort((a, b) => b.idCambio - a.idCambio);
        this.dataListaCambios.data = cambios;

      },
      (error) => {
        console.error('Error al obtener cambios por ID de Venta:', error);
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
                  this.obtenerCambiosTodoIdVenta(idVenta);
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


    this.inicializador();

  }

  inicializador() {

    this.formularioProductoVenta.get('producto')?.valueChanges.pipe(
      debounceTime(300) // Espera 300 ms después de que el usuario deja de escribir
    ).subscribe(value => {
      // this.validarCliente(value);
    });

    this.formularioProductoVenta.get('producto')?.valueChanges.subscribe(value => {
      this.listaProductoFiltro = this.retornarProductoPorFiltro(value)
    })


    this.actualizarListaProductos();


  }

  private actualizarListaProductos() {
    this._productoServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Producto[];
          this.listaProducto = lista.filter(p => p.esActivo == 1 && p.stock > 0);
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
                  this.actualizarListaProductos();
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

  verImagen(): void {
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenUrl: this.imagenSeleccionada
      }
    });
  }

  private cargarImagenProducto(idProducto: number) {
    this._productoServicio.obtenerImagenProducto(idProducto).subscribe(
      (response: any) => {
        if (response && response.imagenUrl) {
          // this.imagenSeleccionada = `data:image/png;base64,${response.imageData}`;
          this.imagenSeleccionada = `${response.imagenUrl}`;
        } else {
          console.error('Imagen no disponible');
          this.imagenSeleccionada = 'ruta/de/imagen/predeterminada.png'; // O deja nulo
        }
      },
      (error: any) => {
        console.error('Error al cargar la imagen:', error);
        this.imagenSeleccionada = 'ruta/de/imagen/predeterminada.png'; // Imagen predeterminada si falla
      }
    );
  }
  obtenerCambiosTodoIdVenta(idVenta: number) {

    this.cambioService.obtenerCambiosTodoIdVenta(idVenta).subscribe(
      (cambios: Cambio[]) => {
        // Asignar los cambios obtenidos al origen de datos de la tabla
        cambios.sort((a, b) => b.idCambio - a.idCambio);
        this.dataListaCambios.data = cambios;

      },
      (error) => {
        console.error('Error al obtener cambios por ID de Venta:', error);
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
                  this.obtenerCambiosTodoIdVenta(idVenta);
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


  // Función para cambiar el tipo de cambio
  cambiarTipoCambio(tipo: boolean): void {
    this.cambioEsNuevo = tipo;
  }


  realizarCambio(): void {
    let idUsuario: number = 0;
    let idCaja: number = 0;
    let saldoInicialTexto: string | undefined = "";
    let ingresosTexto: string | undefined = "";
    let gastosTexto: string | undefined = "";
    let prestamosTexto: string | undefined = "";
    // Obtener el idUsuario del localStorage
    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
    if (datosDesencriptados !== null) {
      const usuario = JSON.parse(datosDesencriptados);
      idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
    }

    Swal.fire({
      title: '¿Esta seguro en realizar el cambio?',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Sí',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No',
      allowOutsideClick: false,

    }).then((result) => {
      if (result.isConfirmed) {

        if (this.cambioEsNuevo) {

          let descuento = this.formularioProductoVenta.get('producto')!.value.descuentos;
          let precios = this.formularioProductoVenta.get('producto')!.value.precio;
          let preciosCaja = this.formularioProductoVenta.get('producto')!.value.precio;
          let total: number = parseInt(precios);
          let totalCaja: number = parseInt(preciosCaja);
          let descuentos: number = parseInt(descuento);
          let sumaDesco = total * (descuentos / 100);
          let sumaDescoCaja = totalCaja * (descuentos / 100);

          const precio: number = Math.round(total - sumaDesco);
          const precioCaja: number = Math.round(totalCaja - sumaDescoCaja);

          let cantidad = this.formularioProductoVenta.get('cantidad')!.value;
          let calculoPrecio: any;
          const precioProductoSeleccionado = this.obtenerPrecioSeleccionado();
          const cantidadProductoSeleccionado = this.obtenerCantidadSeleccionado();
          const nombreProductoSeleccionado = this.obtenerNombreSeleccionado();
          const UnidadMedidaSeleccionado = this.obtenerUnidadMedidaSeleccionado();

          // Accede a los datos subyacentes de MatTableDataSource
          const cambios = this.dataListaCambios.data; // Obtén la matriz de datos

          // Verifica si algún elemento cumple con la condición usando 'some' en la matriz de datos
          const productoExistente = cambios.some((cambio: Cambio) => cambio.producto === nombreProductoSeleccionado.toString());

          if (productoExistente) {
            // El producto ya ha sido cambiado anteriormente, muestra un mensaje de error
            Swal.fire({
              icon: 'error',
              title: 'Producto Existente',
              text: `El producto "${nombreProductoSeleccionado}" ya ha sido cambiado anteriormente.`,
            });
            return;
          }


          if (!this.seleccionado) {
            // Mostrar un mensaje de error
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Por favor, seleccione un detalle antes de realizar el cambio.',
            });
            return; // Detener el proceso de realizar el cambio
          }

          // Verificar que se haya obtenido el idUsuario
          if (idUsuario !== 0) {
            this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
              next: (caja: Caja | null) => {
                if (caja !== null) {
                  // Si se encuentra una caja abierta para el idUsuario
                  idCaja = caja.idCaja;
                  saldoInicialTexto = caja.saldoInicial;
                  ingresosTexto = caja.ingresos;
                  gastosTexto = caja.gastos;
                  prestamosTexto = caja.prestamos;

                } else {
                  // Manejar el caso en el que no se encuentre una caja abierta para el idUsuario
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontró una caja abierta para el usuario actual',
                    confirmButtonText: 'Aceptar'
                  });
                  // Detener la ejecución
                  return;
                }
              },
              error: (error) => {
                console.error('Error al obtener la caja abierta:', error);

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
                            this.realizarCambioSinMensaje();
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
                    title: 'Error',
                    text: 'Este usuario no tiene una caja definida, define una caja para poder realizar una venta ',
                    confirmButtonText: 'Aceptar'
                  });
                  // Detener la ejecución
                  return;

                }




              },
              complete: () => {

                if (cantidadProductoSeleccionado < cantidad) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: `La cantidad cambiada no puede superar a la cantidad seleccionada`,
                  });
                } else {

                  // const precioProductoSeleccionado = this.obtenerPrecioSeleccionado();
                  // const cantidadProductoSeleccionado = this.obtenerCantidadSeleccionado();
                  // const nombreProductoSeleccionado = this.obtenerNombreSeleccionado();
                  // const UnidadMedidaSeleccionado = this.obtenerUnidadMedidaSeleccionado();

                  // if (!this.seleccionadoCambio) {

                  //   Swal.fire({
                  //     icon: 'error',
                  //     title: 'Error!',
                  //     text: 'Por favor, seleccione un detalle antes de realizar el cambio.',
                  //   });
                  //   return; // Detener el proceso de realizar el cambio
                  // }

                  this._productoServicio.buscarPorNombre(nombreProductoSeleccionado.toString()).subscribe(
                    response => {
                      if (response.value && response.value.length > 0) {
                        // Extraer el primer elemento del arreglo (asumiendo que solo quieres el primero)
                        const producto = response.value[0];
                        // Asignar el precio del producto a la constante precioProducto
                        this.precioProducto = producto.precio;
                        this.precioPorCajaProducto = producto.precioPorCaja;
                        let PrecioProductoSeleccionado = parseInt(this.precioProducto).toFixed(0);
                        let PrecioCajaProductoSeleccionado = parseInt(this.precioPorCajaProducto).toFixed(0);
                        let PrecioSeleccionado = parseInt(PrecioProductoSeleccionado);
                        let PrecioCajaSeleccionado = parseInt(PrecioCajaProductoSeleccionado);
                        let descuento = this.formularioProductoVenta.get('producto')!.value.descuentos;
                        let precios = this.formularioProductoVenta.get('producto')!.value.precio;
                        let preciosCaja = this.formularioProductoVenta.get('producto')!.value.precioPorCaja;
                        let CantidadCaja = producto.cantidadPorCaja;
                        let calculoPrecio: any;
                        let total: number = parseInt(precios);
                        let totalCaja: number = parseInt(preciosCaja);
                        let descuentos: number = parseInt(descuento);
                        let sumaDesco = total * (descuentos / 100);
                        let sumaDescoCaja = totalCaja * (descuentos / 100);
                        let SinDecu = PrecioSeleccionado * (descuentos / 100);
                        let SinDecuCaja = PrecioCajaSeleccionado * (descuentos / 100);
                        let precio: number = Math.round(total - sumaDesco);
                        let precioCaja: number = Math.round(totalCaja - sumaDescoCaja);
                        let cantidad = this.formularioProductoVenta.get('cantidad')!.value;
                        let precioSinDecu: number = Math.round(PrecioSeleccionado - SinDecu);
                        let precioSinDecuCaja: number = Math.round(PrecioCajaSeleccionado - SinDecuCaja);
                        if (idUsuario !== 0) {
                          this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
                            next: (caja: Caja | null) => {
                              if (caja !== null) {
                                // Si se encuentra una caja abierta para el idUsuario
                                idCaja = caja.idCaja;
                                saldoInicialTexto = caja.saldoInicial;
                                ingresosTexto = caja.ingresos;
                                gastosTexto = caja.gastos;
                                prestamosTexto = caja.prestamos;


                              } else {
                                // Manejar el caso en el que no se encuentre una caja abierta para el idUsuario
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Error',
                                  text: 'No se encontró una caja abierta para el usuario actual',
                                  confirmButtonText: 'Aceptar'
                                });
                                // Detener la ejecución
                                return;
                              }
                            },
                            error: (error) => {


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
                                          this.realizarCambioSinMensaje();
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
                                console.error('Error al obtener la caja abierta:', error);
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Error',
                                  text: 'Este usuario no tiene una caja definida, define una caja para poder realizar una venta ',
                                  confirmButtonText: 'Aceptar'
                                });
                                // Detener la ejecución
                                return;

                              }



                            },
                            complete: () => {




                              if (cantidadProductoSeleccionado < cantidad) {
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Error!',
                                  text: `La cantidad cambiada no puede superar a la cantidad seleccionada`,
                                });
                              } else {


                                if (this.productoSeleccionado!.unidadMedida === 'Caja' && this.unidaddePagoPorDefecto !== 'Caja') {
                                  Swal.fire({
                                    icon: 'warning',
                                    title: 'Advertencia',
                                    text: `Este producto debe ser vendido por CAJAS.`,
                                  });
                                  return;
                                } else if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
                                  Swal.fire({
                                    icon: 'warning',
                                    title: 'Advertencia',
                                    text: `Este producto debe ser vendido por UNIDAD.`,
                                  });
                                  return;
                                }

                                if (precioSinDecu >= precio) {

                                  // Calcular el saldo disponible sumando el saldo inicial y los ingresos actuales
                                  const saldoDisponible = parseFloat(saldoInicialTexto || '0') +
                                    parseFloat(ingresosTexto || '0');
                                  const resta = parseFloat(gastosTexto || '0') +
                                    parseFloat(prestamosTexto || '0');
                                  const sumaSaldo = saldoDisponible - resta;
                                  const saldoDisponible2 = sumaSaldo;



                                  calculoPrecio = precio * cantidad;


                                  // let calculoPrecio = precio * cantidad;
                                  let calculoPrecioDetalle
                                  if (UnidadMedidaSeleccionado.toString() == "Caja") {
                                    calculoPrecioDetalle = precioSinDecuCaja * cantidadProductoSeleccionado;
                                  }
                                  else {
                                    calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                                  }

                                  //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                                  let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                                  let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                                  if (saldoDisponible2 < suma) {
                                    const saldoFormateado = saldoDisponible2.toLocaleString('es-CO');
                                    Swal.fire({
                                      icon: 'error',
                                      title: 'Saldo Insuficiente',
                                      text: `El saldo disponible $ ${saldoFormateado} no es suficiente para realizar el cambio.`
                                    });
                                    return

                                  } else {

                                    const cajaActualizada: Caja = {
                                      idCaja: idCaja,
                                      transaccionesTexto: suma.toString(),
                                      gastosTexto: suma.toString(),
                                      metodoPago: this.tipodePagoPorDefecto,
                                      estado: '',
                                      nombreUsuario: '',
                                      idUsuario: idUsuario
                                    };



                                    // Actualizar la caja
                                    this.actualizarCajaGastos(cajaActualizada);

                                    console.log('Estado del formulario:', this.formularioProductoVenta);
                                    const motivo = this.formularioProductoVenta.get('motivo')!.value;
                                    console.log('Motivo:', motivo);
                                    // Crear el objeto cambio con los datos necesarios
                                    const cambio = {
                                      idVenta: this.data.idVenta,
                                      producto: nombreProductoSeleccionado,
                                      cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                                      motivo: motivo,
                                      estadoProductoDevuelto: this.estadoProductoDevuelto,
                                      nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                                      diferenciaPrecio: Diferenciaprecio.toString(),
                                      numeroDocumento: this.data.numeroDocumento,
                                      unidadMedida: this.unidaddePagoPorDefecto,

                                    };
                                    console.log('Cambio:', cambio);

                                    this.cambioService.realizarCambio(cambio).subscribe(
                                      (response) => {

                                        Swal.fire({
                                          icon: 'success',
                                          title: 'Cambio Registrado',
                                          text: `El Cambio fue registrado`,
                                          showConfirmButton: false  // Evitar cerrar automáticamente
                                        });

                                        // this._utilidadServicio.mostrarAlerta("la categoria fue registrado","Exito");

                                      },
                                      (error) => {

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
                                                  //  this.realizarCambio();
                                                  Swal.fire({
                                                    icon: 'success',
                                                    title: 'Cambio Registrado',
                                                    text: `El Cambio fue registrado`,
                                                    showConfirmButton: false  // Evitar cerrar automáticamente
                                                  });


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

                                } else {


                                  if (this.productoSeleccionado!.unidadMedida === 'Caja' && this.unidaddePagoPorDefecto !== 'Caja') {
                                    Swal.fire({
                                      icon: 'warning',
                                      title: 'Advertencia',
                                      text: `Este producto debe ser vendido por CAJAS.`,
                                    });
                                    return;
                                  } else if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
                                    Swal.fire({
                                      icon: 'warning',
                                      title: 'Advertencia',
                                      text: `Este producto debe ser vendido por UNIDAD.`,
                                    });
                                    return;
                                  }


                                  calculoPrecio = precio * cantidad;


                                  // let calculoPrecio = precio * cantidad;
                                  let calculoPrecioDetalle
                                  if (UnidadMedidaSeleccionado.toString() == "Caja") {
                                    calculoPrecioDetalle = precioSinDecuCaja * cantidadProductoSeleccionado;
                                  }
                                  else {
                                    calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                                  }

                                  //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                                  let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                                  let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                                  const cajaActualizada: Caja = {
                                    idCaja: idCaja,
                                    transaccionesTexto: suma.toString(),
                                    ingresosTexto: suma.toString(),
                                    metodoPago: this.tipodePagoPorDefecto,
                                    estado: '',
                                    nombreUsuario: '',
                                    idUsuario: idUsuario
                                  };

                                  // Actualizar la caja
                                  this.actualizarCajaIngreso(cajaActualizada);

                                  console.log('Estado del formulario:', this.formularioProductoVenta);
                                  const motivo = this.formularioProductoVenta.get('motivo')!.value;
                                  console.log('Motivo:', motivo);
                                  // Crear el objeto cambio con los datos necesarios
                                  const cambio = {
                                    idVenta: this.data.idVenta,
                                    producto: nombreProductoSeleccionado,
                                    cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                                    motivo: motivo,
                                    estadoProductoDevuelto: this.estadoProductoDevuelto,
                                    nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                                    diferenciaPrecio: Diferenciaprecio.toString(),
                                    numeroDocumento: this.data.numeroDocumento,
                                    unidadMedida: this.unidaddePagoPorDefecto,

                                  };
                                  console.log('Cambio:', cambio);
                                  // Llamar al método realizarCambio() del servicio CambioService
                                  this.cambioService.realizarCambio(cambio).subscribe({
                                    next: (data) => {
                                      // Handle the success message here
                                      console.log('Cambio realizado correctamente:', data);
                                      Swal.fire({
                                        icon: 'success',
                                        title: 'Cambio Registrado',
                                        text: `El Cambio fue registrado`,
                                        showConfirmButton: false  // Evitar cerrar automáticamente
                                      });

                                    },
                                    error: (error) => {
                                      console.error('Error al realizar el cambio2:', error);

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
                                                // this.realizarCambio();
                                                Swal.fire({
                                                  icon: 'success',
                                                  title: 'Cambio Registrado',
                                                  text: `El Cambio fue registrado`,
                                                  showConfirmButton: false  // Evitar cerrar automáticamente
                                                });

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


                            }
                          });
                        } else {
                          console.log('No se encontró el idUsuario en el localStorage');
                        }



                      } else {
                        // No se encontró ningún producto con ese nombre
                        console.log(`No se encontró un producto con el nombre '${nombreProductoSeleccionado}'.`);
                      }
                    },
                    error => {
                      console.error('Error al buscar productos por nombre:', error);
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
                                this.realizarCambioSinMensaje();
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
            console.log('No se encontró el idUsuario en el localStorage');
          }

        } else {


          // const precioProductoSeleccionado = this.obtenerPrecioSeleccionado();
          const cantidadProductoSeleccionado = this.obtenerCantidadSeleccionadoCambios();
          const NombreProductoExistente = this.obtenerNombreSeleccionadoCambios();
          const UnidadMedidaSeleccionado = this.obtenerUnidadMedidaSeleccionadoCambios();
          // if (UnidadMedidaSeleccionado.toString() === "Caja") {
          //   Swal.fire({
          //     icon: 'error',
          //     title: 'Prueba',
          //     text: `Gokuuuu.`,
          //   });
          //   return;
          // }else if(UnidadMedidaSeleccionado.toString() === "Unitario"){
          //   Swal.fire({
          //     icon: 'error',
          //     title: 'Prueba',
          //     text: `Gokuuuu unitario.`,
          //   });
          //   return;

          // }
          if (!this.seleccionadoCambio) {

            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Por favor, seleccione un detalle antes de realizar el cambio.',
            });
            return; // Detener el proceso de realizar el cambio
          }

          this._productoServicio.buscarPorNombre(NombreProductoExistente.toString()).subscribe(
            response => {
              if (response.value && response.value.length > 0) {
                // Extraer el primer elemento del arreglo (asumiendo que solo quieres el primero)
                const producto = response.value[0];
                // Asignar el precio del producto a la constante precioProducto
                this.precioProducto = producto.precio;
                this.precioPorCajaProducto = producto.precioPorCaja;
                let PrecioProductoSeleccionado = parseInt(this.precioProducto).toFixed(0);
                let PrecioCajaProductoSeleccionado = parseInt(this.precioPorCajaProducto).toFixed(0);
                let PrecioSeleccionado = parseInt(PrecioProductoSeleccionado);
                let PrecioCajaSeleccionado = parseInt(PrecioCajaProductoSeleccionado);
                let descuento = this.formularioProductoVenta.get('producto')!.value.descuentos;
                let precios = this.formularioProductoVenta.get('producto')!.value.precio;
                let preciosCaja = this.formularioProductoVenta.get('producto')!.value.precioPorCaja;
                let CantidadCaja = producto.cantidadPorCaja;
                let calculoPrecio: any;
                let total: number = parseInt(precios);
                let totalCaja: number = parseInt(preciosCaja);
                let descuentos: number = parseInt(descuento);
                let sumaDesco = total * (descuentos / 100);
                let sumaDescoCaja = totalCaja * (descuentos / 100);
                let SinDecu = PrecioSeleccionado * (descuentos / 100);
                let SinDecuCaja = PrecioCajaSeleccionado * (descuentos / 100);
                let precio: number = Math.round(total - sumaDesco);
                let precioCaja: number = Math.round(totalCaja - sumaDescoCaja);
                let cantidad = this.formularioProductoVenta.get('cantidad')!.value;
                let precioSinDecu: number = Math.round(PrecioSeleccionado - SinDecu);
                let precioSinDecuCaja: number = Math.round(PrecioCajaSeleccionado - SinDecuCaja);
                if (idUsuario !== 0) {
                  this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
                    next: (caja: Caja | null) => {
                      if (caja !== null) {
                        // Si se encuentra una caja abierta para el idUsuario
                        idCaja = caja.idCaja;
                        saldoInicialTexto = caja.saldoInicial;
                        ingresosTexto = caja.ingresos;
                        gastosTexto = caja.gastos;
                        prestamosTexto = caja.prestamos;


                      } else {
                        // Manejar el caso en el que no se encuentre una caja abierta para el idUsuario
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: 'No se encontró una caja abierta para el usuario actual',
                          confirmButtonText: 'Aceptar'
                        });
                        // Detener la ejecución
                        return;
                      }
                    },
                    error: (error) => {


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
                                  this.realizarCambioSinMensaje();
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
                        console.error('Error al obtener la caja abierta:', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: 'Este usuario no tiene una caja definida, define una caja para poder realizar una venta ',
                          confirmButtonText: 'Aceptar'
                        });
                        // Detener la ejecución
                        return;

                      }



                    },
                    complete: () => {




                      if (cantidadProductoSeleccionado < cantidad) {
                        Swal.fire({
                          icon: 'error',
                          title: 'Error!',
                          text: `La cantidad cambiada no puede superar a la cantidad seleccionada`,
                        });
                      } else {


                        if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Advertencia',
                            text: `Este producto debe ser vendido por UNIDAD.`,
                          });
                          return;
                        }



                        if (precioSinDecu >= precio) {

                          // Calcular el saldo disponible sumando el saldo inicial y los ingresos actuales
                          const saldoDisponible = parseFloat(saldoInicialTexto || '0') +
                            parseFloat(ingresosTexto || '0');
                          const resta = parseFloat(gastosTexto || '0') +
                            parseFloat(prestamosTexto || '0');
                          const sumaSaldo = saldoDisponible - resta;
                          const saldoDisponible2 = sumaSaldo;



                          calculoPrecio = precio * cantidad;


                          // let calculoPrecio = precio * cantidad;
                          let calculoPrecioDetalle
                          if (UnidadMedidaSeleccionado.toString() == "Caja") {
                            calculoPrecioDetalle = precioSinDecuCaja * cantidadProductoSeleccionado;
                          }
                          else {
                            calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                          }

                          //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                          let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                          let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                          if (saldoDisponible2 < suma) {
                            const saldoFormateado = saldoDisponible2.toLocaleString('es-CO');
                            Swal.fire({
                              icon: 'error',
                              title: 'Saldo Insuficiente',
                              text: `El saldo disponible $ ${saldoFormateado} no es suficiente para realizar el cambio.`
                            });
                            return

                          } else {

                            const cajaActualizada: Caja = {
                              idCaja: idCaja,
                              transaccionesTexto: suma.toString(),
                              gastosTexto: suma.toString(),
                              metodoPago: this.tipodePagoPorDefecto,
                              estado: '',
                              nombreUsuario: '',
                              idUsuario: idUsuario
                            };



                            // Actualizar la caja
                            this.actualizarCajaGastos(cajaActualizada);

                            console.log('Estado del formulario:', this.formularioProductoVenta);
                            const motivo = this.formularioProductoVenta.get('motivo')!.value;
                            console.log('Motivo:', motivo);
                            // Crear el objeto cambio con los datos necesarios
                            const cambio = {
                              idVenta: this.data.idVenta,
                              producto: NombreProductoExistente,
                              cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                              motivo: motivo,
                              estadoProductoDevuelto: this.estadoProductoDevuelto,
                              nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                              diferenciaPrecio: Diferenciaprecio.toString(),
                              numeroDocumento: this.data.numeroDocumento,
                              unidadMedida: this.unidaddePagoPorDefecto,

                            };
                            console.log('Cambio:', cambio);

                            this.cambioService.realizarCambio(cambio).subscribe(
                              (response) => {

                                Swal.fire({
                                  icon: 'success',
                                  title: 'Cambio Registrado',
                                  text: `El Cambio fue registrado`,
                                  showConfirmButton: false  // Evitar cerrar automáticamente
                                });

                                // this._utilidadServicio.mostrarAlerta("la categoria fue registrado","Exito");

                              },
                              (error) => {

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
                                          //  this.realizarCambio();
                                          Swal.fire({
                                            icon: 'success',
                                            title: 'Cambio Registrado',
                                            text: `El Cambio fue registrado`,
                                            showConfirmButton: false  // Evitar cerrar automáticamente
                                          });


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

                        } else {


                          if (this.productoSeleccionado!.unidadMedida === 'Caja' && this.unidaddePagoPorDefecto !== 'Caja') {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Advertencia',
                              text: `Este producto debe ser vendido por CAJAS.`,
                            });
                            return;
                          } else if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Advertencia',
                              text: `Este producto debe ser vendido por UNIDAD.`,
                            });
                            return;
                          }




                          calculoPrecio = precio * cantidad;


                          // let calculoPrecio = precio * cantidad;
                          let calculoPrecioDetalle
                          if (UnidadMedidaSeleccionado.toString() == "Caja") {
                            calculoPrecioDetalle = precioSinDecuCaja * cantidadProductoSeleccionado;
                          }
                          else {
                            calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                          }

                          //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                          let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                          let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                          const cajaActualizada: Caja = {
                            idCaja: idCaja,
                            transaccionesTexto: suma.toString(),
                            ingresosTexto: suma.toString(),
                            metodoPago: this.tipodePagoPorDefecto,
                            estado: '',
                            nombreUsuario: '',
                            idUsuario: idUsuario
                          };

                          // Actualizar la caja
                          this.actualizarCajaIngreso(cajaActualizada);

                          console.log('Estado del formulario:', this.formularioProductoVenta);
                          const motivo = this.formularioProductoVenta.get('motivo')!.value;
                          console.log('Motivo:', motivo);
                          // Crear el objeto cambio con los datos necesarios
                          const cambio = {
                            idVenta: this.data.idVenta,
                            producto: NombreProductoExistente,
                            cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                            motivo: motivo,
                            estadoProductoDevuelto: this.estadoProductoDevuelto,
                            nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                            diferenciaPrecio: Diferenciaprecio.toString(),
                            numeroDocumento: this.data.numeroDocumento,
                            unidadMedida: this.unidaddePagoPorDefecto,

                          };
                          console.log('Cambio:', cambio);
                          // Llamar al método realizarCambio() del servicio CambioService
                          this.cambioService.realizarCambio(cambio).subscribe({
                            next: (data) => {
                              // Handle the success message here
                              console.log('Cambio realizado correctamente:', data);
                              Swal.fire({
                                icon: 'success',
                                title: 'Cambio Registrado',
                                text: `El Cambio fue registrado`,
                                showConfirmButton: false  // Evitar cerrar automáticamente
                              });

                            },
                            error: (error) => {
                              console.error('Error al realizar el cambio2:', error);

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
                                        // this.realizarCambio();
                                        Swal.fire({
                                          icon: 'success',
                                          title: 'Cambio Registrado',
                                          text: `El Cambio fue registrado`,
                                          showConfirmButton: false  // Evitar cerrar automáticamente
                                        });

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


                    }
                  });
                } else {
                  console.log('No se encontró el idUsuario en el localStorage');
                }



              } else {
                // No se encontró ningún producto con ese nombre
                console.log(`No se encontró un producto con el nombre '${NombreProductoExistente}'.`);
              }
            },
            error => {
              console.error('Error al buscar productos por nombre:', error);
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
                        this.realizarCambioSinMensaje();
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

      } else {
      }
    });
    // Lógica para guardar el cambio según el tipo seleccionado


  }

  // Función para verificar si un cambio está seleccionado
  isSelected2(cambio: any): boolean {
    return this.selectedCambio === cambio;
  }

  // Función para seleccionar un cambio
  selectCambio(cambio: any): void {
    if (this.selectedCambio === cambio) {
      // Si el cambio ya está seleccionado, deselecciónalo
      this.selectedCambio = null;
      this.seleccionadoCambio = cambio;
    } else {
      // Establece el nuevo cambio seleccionado
      this.selectedCambio = cambio;
      this.seleccionadoCambio = cambio;
    }
  }



  obtenerNombreSeleccionadoCambios(): number {
    if (this.seleccionadoCambio) {
      return this.seleccionadoCambio.nuevoProducto;
    }
    return 0;
  }
  obtenerUnidadMedidaSeleccionadoCambios(): number {
    if (this.seleccionadoCambio) {
      return this.seleccionadoCambio.unidadMedida;
    }
    return 0;
  }
  obtenerCantidadSeleccionadoCambios(): number {
    if (this.seleccionadoCambio) {
      return this.seleccionadoCambio.cantidadCambiada;
    }
    return 0;
  }
  // Función para realizar una acción basada en el cambio seleccionado
  realizarAccionSegunSeleccion(): void {
    if (this.selectedCambio) {
      // Aquí puedes implementar la lógica para la acción basada en el cambio seleccionado
      console.log('Cambio seleccionado:', this.selectedCambio);

      // Por ejemplo, muestra una alerta con el cambio seleccionado
      alert(`Se realizará una acción con el cambio seleccionado: ${this.selectedCambio.idCambio}`);
    } else {
      alert('Por favor, selecciona un cambio.');
    }
  }

  actualizarCajaIngreso(caja: Caja): void {
    this.cajaService.obtenerCajaPorUsuario(caja.idUsuario).subscribe(c => {
      if (c) {
        // Actualiza los valores de ingresosTexto y metodoPago en la caja encontrada
        c.ingresosTexto = caja.ingresosTexto;
        c.metodoPago = caja.metodoPago;
        c.transaccionesTexto = caja.transaccionesTexto;
        // Llama al servicio para actualizar la caja en la base de datos
        this.cajaService.editarIngreso(c).subscribe(() => {
          console.log(`Caja actualizada para el usuario ${caja.idUsuario}: ingresosTexto = ${caja.ingresosTexto}, metodoPago = ${caja.metodoPago}`);
        });
      } else {
        console.error(`No se encontró una caja para el usuario ${caja.idUsuario}`);
      }
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
                this.actualizarCajaIngreso(caja);
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
  actualizarCajaGastos(caja: Caja): void {
    this.cajaService.obtenerCajaPorUsuario(caja.idUsuario).subscribe(c => {
      if (c) {
        // Actualiza los valores de ingresosTexto y metodoPago en la caja encontrada
        c.gastosTexto = caja.gastosTexto;
        c.transaccionesTexto = caja.transaccionesTexto;
        c.metodoPago = caja.metodoPago;
        // Llama al servicio para actualizar la caja en la base de datos
        this.cajaService.editarGastos(c).subscribe(() => {
          console.log(`Caja actualizada para el usuario ${caja.idUsuario}: gastosTexto = ${caja.gastosTexto}`);
        });
      } else {
        console.error(`No se encontró una caja para el usuario ${caja.idUsuario}`);
      }
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
                this.actualizarCajaGastos(caja);
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

  // Método para seleccionar un detalle
  seleccionarDetalle(detalle: any): void {
    if (this.selectedDetalle === detalle) {
      // Si se selecciona el mismo detalle, deseleccionarlo y habilitar todas las filas
      this.selectedDetalle = null;
      this.isDisabled = false;
      this.seleccionado = detalle;
    } else {
      // Si se selecciona un nuevo detalle, desactivar todas las demás filas
      this.selectedDetalle = detalle;
      this.isDisabled = true;
      this.seleccionado = detalle;
    }
  }

  productoParaVenta(event: any) {
    // this.productoSeleccionado = event.option.value;
    const selectedProduct: Producto = event.option.value;
    this.productoSeleccionado = selectedProduct;


    // Verificar si la imagen está disponible y cargarla
    // if (selectedProduct.imageData) {
    //   this.imagenSeleccionada = `data:image/png;base64, ${selectedProduct.imageData}`;
    // } else {
    //   // Si la imagen no está disponible, establecerla como nula o cargar una imagen predeterminada
    //   this.imagenSeleccionada = null; // o cargar una imagen predeterminada
    // }
    this.cargarImagenProducto(selectedProduct.idProducto);



    // Actualizar el valor del campo de búsqueda por código con el código del producto seleccionado
    // this.formularioProductoVenta.get('producto')?.setValue(selectedProduct.nombre);
    // this.formularioProductoVenta.get('codigo')?.setValue(selectedProduct.codigo);
    // this.formularioProductoVenta.get('producto')?.setValue(selectedProduct.nombre);
    // Formatear el precio para mostrarlo con separadores de miles
    let descuento = this.productoSeleccionado!.descuentos;
    let precio = this.productoSeleccionado!.precio;
    let suma = parseInt(precio) * (parseInt(descuento) / 100);
    let total = parseInt(precio) - suma;
    const precioNumerico = parseFloat(total.toString().replace(',', '.')); // Reemplazar la coma con el punto
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP', // Código de moneda para Colombia
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });


    const precioFormateado = formatter.format(precioNumerico);



    // Mostrar mensaje con el stock disponible
    const mensajeStock = `Stock disponible: ${this.productoSeleccionado!.stock} ,
    Precio del Producto:  ${precioFormateado}`;
    this.snackBar.open(mensajeStock, 'Cerrar', {
      duration: 7000, // Duración en milisegundos (opcional)
    });


  }
  mostrarPrecioTooltip2(producto: Producto) {
    console.log('Producto:', producto);
    console.log('Precio sin descuento:', producto.precio);
    if (producto.precio) {
      // Asigna el precio del producto a la variable precioProducto
      let precio = producto.precio;
      let descuento = producto.descuentos;
      let suma = parseInt(precio) * (parseInt(descuento) / 100);
      let total = parseInt(precio) - suma;

      this.precioProducto = `Precio  : ${this.formatearNumero(total.toString())} $ \nCantidad Disponible: ${producto.stock} \nDescuento: ${this.formatearNumero(producto.descuentos)}%`;

    } else {
      // Si precioSinDescuento no está definido, muestra un mensaje indicando que el precio no está disponible
      this.precioProducto = "Precio no disponible";
    }


  }

  // Función para ocultar el tooltip
  ocultarPrecioTooltip() {
    this.precioProducto = '';
  }

  // Método para verificar si un detalle está seleccionado
  isSelected(detalle: any): boolean {
    // this.seleccionado === detalle;
    return this.selectedDetalle === detalle;
  }

  // Función para obtener el precio del detalle seleccionado
  obtenerPrecioSeleccionado(): number {
    if (this.seleccionado) {
      return parseFloat(this.seleccionado.precioTexto.replace(',', '.'));
    }
    return 0;
  }
  obtenerCantidadSeleccionado(): number {
    if (this.seleccionado) {
      return parseFloat(this.seleccionado.cantidad);
    }
    return 0;
  }
  obtenerNombreSeleccionado(): number {
    if (this.seleccionado) {
      return this.seleccionado.descripcionProducto;
    }
    return 0;
  }
  obtenerUnidadMedidaSeleccionado(): number {
    if (this.seleccionado) {
      return this.seleccionado.unidadMedidaTexto;
    }
    return 0;
  }
  // Método para cerrar el modal sin realizar cambios
  cerrarModal(): void {
    this.dialogRef.close();
  }
  mostrarProducto(producto: Producto): string {

    return producto.nombre;

  }
  retornarProductoPorFiltro(busqueda: any): Producto[] {
    const valorBuscado = typeof busqueda === "string" ? busqueda.toLocaleLowerCase() : busqueda.nombre.toLocaleLowerCase()
    return this.listaProducto.filter(item => item.nombre.toLocaleLowerCase().includes(valorBuscado));

  }
  mostrarListaProducto(): void {

    this.listaProductoFiltro = this.listaProducto;

  }
  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
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
  // Método para realizar el cambio de producto
  // realizarCambio(): void {
  //   // Aquí puedes implementar la lógica para realizar el cambio
  //   // Por ejemplo, podrías enviar una solicitud HTTP al servidor para actualizar los datos del producto
  //   console.log('Realizando el cambio con los siguientes datos:');
  //   console.log('Producto actual:', this.productoActual);
  //   console.log('Nuevo producto:', this.nuevoProducto);

  //   // Después de realizar el cambio, cierra el modal
  //   this.dialogRef.close();
  // }
  realizarCambioSinMensaje() {
    let idUsuario: number = 0;
    let idCaja: number = 0;
    let saldoInicialTexto: string | undefined = "";
    let ingresosTexto: string | undefined = "";
    let gastosTexto: string | undefined = "";
    let prestamosTexto: string | undefined = "";
    // Obtener el idUsuario del localStorage
    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
    if (datosDesencriptados !== null) {
      const usuario = JSON.parse(datosDesencriptados);
      idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
    }


    if (this.cambioEsNuevo) {

      let descuento = this.formularioProductoVenta.get('producto')!.value.descuentos;
      let precios = this.formularioProductoVenta.get('producto')!.value.precio;
      let total: number = parseInt(precios);
      let descuentos: number = parseInt(descuento);
      let sumaDesco = total * (descuentos / 100);

      const precio: number = Math.round(total - sumaDesco);

      let cantidad = this.formularioProductoVenta.get('cantidad')!.value;
      const precioProductoSeleccionado = this.obtenerPrecioSeleccionado();
      const cantidadProductoSeleccionado = this.obtenerCantidadSeleccionado();
      const nombreProductoSeleccionado = this.obtenerNombreSeleccionado();

      // Accede a los datos subyacentes de MatTableDataSource
      const cambios = this.dataListaCambios.data; // Obtén la matriz de datos

      // Verifica si algún elemento cumple con la condición usando 'some' en la matriz de datos
      const productoExistente = cambios.some((cambio: Cambio) => cambio.producto === nombreProductoSeleccionado.toString());

      if (productoExistente) {
        // El producto ya ha sido cambiado anteriormente, muestra un mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Producto Existente',
          text: `El producto "${nombreProductoSeleccionado}" ya ha sido cambiado anteriormente.`,
        });
        return;
      }


      if (!this.seleccionado) {
        // Mostrar un mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Por favor, seleccione un detalle antes de realizar el cambio.',
        });
        return; // Detener el proceso de realizar el cambio
      }

      // Verificar que se haya obtenido el idUsuario
      if (idUsuario !== 0) {
        this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
          next: (caja: Caja | null) => {
            if (caja !== null) {
              // Si se encuentra una caja abierta para el idUsuario
              idCaja = caja.idCaja;
              saldoInicialTexto = caja.saldoInicial;
              ingresosTexto = caja.ingresos;
              gastosTexto = caja.gastos;
              prestamosTexto = caja.prestamos;

            } else {
              // Manejar el caso en el que no se encuentre una caja abierta para el idUsuario
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró una caja abierta para el usuario actual',
                confirmButtonText: 'Aceptar'
              });
              // Detener la ejecución
              return;
            }
          },
          error: (error) => {
            console.error('Error al obtener la caja abierta:', error);

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
                        this.realizarCambioSinMensaje();
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
                title: 'Error',
                text: 'Este usuario no tiene una caja definida, define una caja para poder realizar una venta ',
                confirmButtonText: 'Aceptar'
              });
              // Detener la ejecución
              return;

            }




          },
          complete: () => {

            if (cantidadProductoSeleccionado < cantidad) {
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: `La cantidad cambiada no puede superar a la cantidad seleccionada`,
              });
            } else {

              if (precioProductoSeleccionado >= precio) {

                if (this.productoSeleccionado!.unidadMedida === 'Caja' && this.unidaddePagoPorDefecto !== 'Caja') {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Advertencia',
                    text: `Este producto debe ser vendido por CAJAS.`,
                  });
                  return;
                } else if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Advertencia',
                    text: `Este producto debe ser vendido por UNIDAD.`,
                  });
                  return;
                }



                // Calcular el saldo disponible sumando el saldo inicial y los ingresos actuales
                const saldoDisponible = parseFloat(saldoInicialTexto || '0') +
                  parseFloat(ingresosTexto || '0');
                const resta = parseFloat(gastosTexto || '0') +
                  parseFloat(prestamosTexto || '0');
                const sumaSaldo = saldoDisponible - resta;
                const saldoDisponible2 = sumaSaldo;

                let calculoPrecio = precio * cantidad;
                let calculoPrecioDetalle = precioProductoSeleccionado * cantidadProductoSeleccionado;
                //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                if (saldoDisponible2 < suma) {
                  const saldoFormateado = saldoDisponible2.toLocaleString('es-CO');
                  Swal.fire({
                    icon: 'error',
                    title: 'Saldo Insuficiente',
                    text: `El saldo disponible $ ${saldoFormateado} no es suficiente para realizar el cambio.`
                  });
                  return

                } else {

                  const cajaActualizada: Caja = {
                    idCaja: idCaja,
                    transaccionesTexto: suma.toString(),
                    gastosTexto: suma.toString(),
                    metodoPago: this.tipodePagoPorDefecto,
                    estado: '',
                    nombreUsuario: '',
                    idUsuario: idUsuario
                  };



                  // Actualizar la caja
                  this.actualizarCajaGastos(cajaActualizada);

                  console.log('Estado del formulario:', this.formularioProductoVenta);
                  const motivo = this.formularioProductoVenta.get('motivo')!.value;
                  console.log('Motivo:', motivo);
                  // Crear el objeto cambio con los datos necesarios
                  const cambio = {
                    idVenta: this.data.idVenta,
                    producto: nombreProductoSeleccionado,
                    cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                    motivo: motivo,
                    estadoProductoDevuelto: this.estadoProductoDevuelto,
                    nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                    diferenciaPrecio: Diferenciaprecio.toString(),
                    numeroDocumento: this.data.numeroDocumento,
                    unidadMedida: this.unidaddePagoPorDefecto,

                  };
                  console.log('Cambio:', cambio);

                  this.cambioService.realizarCambio(cambio).subscribe(
                    (response) => {

                      Swal.fire({
                        icon: 'success',
                        title: 'Cambio Registrado',
                        text: `El Cambio fue registrado`,
                        showConfirmButton: false  // Evitar cerrar automáticamente
                      });

                      // this._utilidadServicio.mostrarAlerta("la categoria fue registrado","Exito");

                    },
                    (error) => {

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
                                //  this.realizarCambio();
                                Swal.fire({
                                  icon: 'success',
                                  title: 'Cambio Registrado',
                                  text: `El Cambio fue registrado`,
                                  showConfirmButton: false  // Evitar cerrar automáticamente
                                });

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

              } else {

                let calculoPrecio = precio * cantidad;
                let calculoPrecioDetalle = precioProductoSeleccionado * cantidadProductoSeleccionado;
                //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                const cajaActualizada: Caja = {
                  idCaja: idCaja,
                  transaccionesTexto: suma.toString(),
                  ingresosTexto: suma.toString(),
                  metodoPago: this.tipodePagoPorDefecto,
                  estado: '',
                  nombreUsuario: '',
                  idUsuario: idUsuario
                };

                // Actualizar la caja
                this.actualizarCajaIngreso(cajaActualizada);

                console.log('Estado del formulario:', this.formularioProductoVenta);
                const motivo = this.formularioProductoVenta.get('motivo')!.value;
                console.log('Motivo:', motivo);
                // Crear el objeto cambio con los datos necesarios
                const cambio = {
                  idVenta: this.data.idVenta,
                  producto: nombreProductoSeleccionado,
                  cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                  motivo: motivo,
                  estadoProductoDevuelto: this.estadoProductoDevuelto,
                  nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                  diferenciaPrecio: Diferenciaprecio.toString(),
                  numeroDocumento: this.data.numeroDocumento,
                  unidadMedida: this.unidaddePagoPorDefecto,
                };
                console.log('Cambio:', cambio);
                // Llamar al método realizarCambio() del servicio CambioService
                this.cambioService.realizarCambio(cambio).subscribe({
                  next: (data) => {
                    // Handle the success message here
                    console.log('Cambio realizado correctamente:', data);
                    Swal.fire({
                      icon: 'success',
                      title: 'Cambio Registrado',
                      text: `El Cambio fue registrado`,
                      showConfirmButton: false  // Evitar cerrar automáticamente
                    });

                  },
                  error: (error) => {
                    console.error('Error al realizar el cambio2:', error);
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
                              // this.realizarCambio();
                              Swal.fire({
                                icon: 'success',
                                title: 'Cambio Registrado',
                                text: `El Cambio fue registrado`,
                                showConfirmButton: false  // Evitar cerrar automáticamente
                              });

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

          }
        });
      } else {
        console.log('No se encontró el idUsuario en el localStorage');
      }

    } else {
      // const precioProductoSeleccionado = this.obtenerPrecioSeleccionado();
      const cantidadProductoSeleccionado = this.obtenerCantidadSeleccionadoCambios();
      const NombreProductoExistente = this.obtenerNombreSeleccionadoCambios();
      if (!this.seleccionadoCambio) {

        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Por favor, seleccione un detalle antes de realizar el cambio.',
        });
        return; // Detener el proceso de realizar el cambio
      }

      this._productoServicio.buscarPorNombre(NombreProductoExistente.toString()).subscribe(
        response => {
          if (response.value && response.value.length > 0) {
            // Extraer el primer elemento del arreglo (asumiendo que solo quieres el primero)
            const producto = response.value[0];
            // Asignar el precio del producto a la constante precioProducto
            this.precioProducto = producto.precio;
            let PrecioProductoSeleccionado = parseInt(this.precioProducto).toFixed(0);
            let PrecioSeleccionado = parseInt(PrecioProductoSeleccionado);
            let descuento = this.formularioProductoVenta.get('producto')!.value.descuentos;
            let precios = this.formularioProductoVenta.get('producto')!.value.precio;
            let total: number = parseInt(precios);
            let descuentos: number = parseInt(descuento);
            let sumaDesco = total * (descuentos / 100);
            let SinDecu = PrecioSeleccionado * (descuentos / 100);
            const precio: number = Math.round(total - sumaDesco);
            let cantidad = this.formularioProductoVenta.get('cantidad')!.value;
            let precioSinDecu: number = Math.round(PrecioSeleccionado - SinDecu);
            if (idUsuario !== 0) {
              this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
                next: (caja: Caja | null) => {
                  if (caja !== null) {
                    // Si se encuentra una caja abierta para el idUsuario
                    idCaja = caja.idCaja;
                    saldoInicialTexto = caja.saldoInicial;
                    ingresosTexto = caja.ingresos;
                    gastosTexto = caja.gastos;
                    prestamosTexto = caja.prestamos;


                  } else {
                    // Manejar el caso en el que no se encuentre una caja abierta para el idUsuario
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'No se encontró una caja abierta para el usuario actual',
                      confirmButtonText: 'Aceptar'
                    });
                    // Detener la ejecución
                    return;
                  }
                },
                error: (error) => {


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
                              this.realizarCambioSinMensaje();
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
                    console.error('Error al obtener la caja abierta:', error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Este usuario no tiene una caja definida, define una caja para poder realizar una venta ',
                      confirmButtonText: 'Aceptar'
                    });
                    // Detener la ejecución
                    return;

                  }



                },
                complete: () => {




                  if (cantidadProductoSeleccionado < cantidad) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Error!',
                      text: `La cantidad cambiada no puede superar a la cantidad seleccionada`,
                    });
                  } else {


                    if (precioSinDecu >= precio) {

                      // Calcular el saldo disponible sumando el saldo inicial y los ingresos actuales
                      const saldoDisponible = parseFloat(saldoInicialTexto || '0') +
                        parseFloat(ingresosTexto || '0');
                      const resta = parseFloat(gastosTexto || '0') +
                        parseFloat(prestamosTexto || '0');
                      const sumaSaldo = saldoDisponible - resta;
                      const saldoDisponible2 = sumaSaldo;

                      let calculoPrecio = precio * cantidad;
                      let calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                      //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                      let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                      let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                      if (saldoDisponible2 < suma) {
                        const saldoFormateado = saldoDisponible2.toLocaleString('es-CO');
                        Swal.fire({
                          icon: 'error',
                          title: 'Saldo Insuficiente',
                          text: `El saldo disponible $ ${saldoFormateado} no es suficiente para realizar el cambio.`
                        });
                        return

                      } else {

                        const cajaActualizada: Caja = {
                          idCaja: idCaja,
                          transaccionesTexto: suma.toString(),
                          gastosTexto: suma.toString(),
                          metodoPago: this.tipodePagoPorDefecto,
                          estado: '',
                          nombreUsuario: '',
                          idUsuario: idUsuario
                        };



                        // Actualizar la caja
                        this.actualizarCajaGastos(cajaActualizada);

                        console.log('Estado del formulario:', this.formularioProductoVenta);
                        const motivo = this.formularioProductoVenta.get('motivo')!.value;
                        console.log('Motivo:', motivo);
                        // Crear el objeto cambio con los datos necesarios
                        const cambio = {
                          idVenta: this.data.idVenta,
                          producto: NombreProductoExistente,
                          cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                          motivo: motivo,
                          estadoProductoDevuelto: this.estadoProductoDevuelto,
                          nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                          diferenciaPrecio: Diferenciaprecio.toString(),
                          numeroDocumento: this.data.numeroDocumento

                        };
                        console.log('Cambio:', cambio);

                        this.cambioService.realizarCambio(cambio).subscribe(
                          (response) => {

                            Swal.fire({
                              icon: 'success',
                              title: 'Cambio Registrado',
                              text: `El Cambio fue registrado`,
                              showConfirmButton: false  // Evitar cerrar automáticamente
                            });

                            // this._utilidadServicio.mostrarAlerta("la categoria fue registrado","Exito");

                          },
                          (error) => {

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
                                      //  this.realizarCambio();
                                      Swal.fire({
                                        icon: 'success',
                                        title: 'Cambio Registrado',
                                        text: `El Cambio fue registrado`,
                                        showConfirmButton: false  // Evitar cerrar automáticamente
                                      });


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

                    } else {

                      let calculoPrecio = precio * cantidad;
                      let calculoPrecioDetalle = precioSinDecu * cantidadProductoSeleccionado;
                      //el resultado de suma siempre sera positivo no importa si el valor sea negativo o positivo
                      let suma = Math.abs(calculoPrecioDetalle - calculoPrecio);
                      let Diferenciaprecio = (calculoPrecio - calculoPrecioDetalle);

                      const cajaActualizada: Caja = {
                        idCaja: idCaja,
                        transaccionesTexto: suma.toString(),
                        ingresosTexto: suma.toString(),
                        metodoPago: this.tipodePagoPorDefecto,
                        estado: '',
                        nombreUsuario: '',
                        idUsuario: idUsuario
                      };

                      // Actualizar la caja
                      this.actualizarCajaIngreso(cajaActualizada);

                      console.log('Estado del formulario:', this.formularioProductoVenta);
                      const motivo = this.formularioProductoVenta.get('motivo')!.value;
                      console.log('Motivo:', motivo);
                      // Crear el objeto cambio con los datos necesarios
                      const cambio = {
                        idVenta: this.data.idVenta,
                        producto: NombreProductoExistente,
                        cantidadCambiada: this.formularioProductoVenta.get('cantidad')!.value,
                        motivo: motivo,
                        estadoProductoDevuelto: this.estadoProductoDevuelto,
                        nuevoProducto: this.formularioProductoVenta.get('producto')!.value.nombre,
                        diferenciaPrecio: Diferenciaprecio.toString(),
                        numeroDocumento: this.data.numeroDocumento

                      };
                      console.log('Cambio:', cambio);
                      // Llamar al método realizarCambio() del servicio CambioService
                      this.cambioService.realizarCambio(cambio).subscribe({
                        next: (data) => {
                          // Handle the success message here
                          console.log('Cambio realizado correctamente:', data);
                          Swal.fire({
                            icon: 'success',
                            title: 'Cambio Registrado',
                            text: `El Cambio fue registrado`,
                            showConfirmButton: false  // Evitar cerrar automáticamente
                          });

                        },
                        error: (error) => {
                          console.error('Error al realizar el cambio2:', error);

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
                                    // this.realizarCambio();
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'Cambio Registrado',
                                      text: `El Cambio fue registrado`,
                                      showConfirmButton: false  // Evitar cerrar automáticamente
                                    });

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


                }
              });
            } else {
              console.log('No se encontró el idUsuario en el localStorage');
            }



          } else {
            // No se encontró ningún producto con ese nombre
            console.log(`No se encontró un producto con el nombre '${NombreProductoExistente}'.`);
          }
        },
        error => {
          console.error('Error al buscar productos por nombre:', error);
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
                    this.realizarCambioSinMensaje();
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
}
