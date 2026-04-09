import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Producto } from '../../../../Interfaces/producto';
import { ProductoService } from '../../../../Services/producto.service';
import { ReponseApi } from '../../../../Interfaces/reponse-api';
import { VerImagenProductoModalComponent } from '../../Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Categoria } from '../../../../Interfaces/categoria';
import { Pedido } from '../../../../Interfaces/pedido';
import { CategoriaService } from '../../../../Services/categoria.service';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalCaracteristicasProductoComponent } from '../../Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';
import Swal from 'sweetalert2';
import { interval, of, Subscription, switchMap } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { CartService } from '../../../../Services/cart.service';
import { ImageDialogService } from '../../../../Services/image-dialog.service';
import { EmpresaDataService } from '../../../../Services/EmpresaData.service';
import { CarritoModalComponent } from '../../Modales/carrito-modal/carrito-modal.component';
import { PaymentService } from '../../../../Services/payment.service';
import { MatSelectChange } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
// import { ExchangeRateService } from '../../../../Services/ExchangeRateService.service';
import { environment } from '../../../../environments/environment';
import { MercadoPagoService } from '../../../../Services/mercadoPago.service';
import { CustomPreferenceRequest } from '../../../../Interfaces/CustomPreferenceRequest';
import { MatTableDataSource } from '@angular/material/table';

import { Venta } from '../../../../Interfaces/venta';

import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VentaService } from '../../../../Services/venta.service';

import { CajaService } from '../../../../Services/caja.service';
import { FileFacturaService } from '../../../../Services/file-factura.service';

import moment from 'moment';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { createNumberMask } from 'text-mask-addons';
import JsBarcode from 'jsbarcode';
import { from } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Caja } from '../../../../Interfaces/caja';
import { HttpErrorResponse } from '@angular/common/http';

import * as QRCode from 'qrcode';
import { MesaService } from '../../../../Services/mesa.service';
import { PedidoService } from '../../../../Services/pedido.service';
import { Mesa } from '../../../../Interfaces/mesa';
import { ModalMesasComponent } from '../../Modales/modal-mesas/modal-mesas.component';
import { DetallePedido } from '../../../../Interfaces/detalle-pedido';
import { Router } from '@angular/router';
import { SignalRService } from '../../../../Services/signalr.service';
import { ModalDomicilioComponent } from '../../Modales/modal-domicilio/modal-domicilio.component';



@Component({
  selector: 'app-prueba',
  templateUrl: './prueba.component.html',
  styleUrl: './prueba.component.css'
})
export class PruebaComponent implements OnInit, OnDestroy {

  products: Producto[] = [];
  categorias: Categoria[] = [];
  indiceCategoriaSeleccionada: number = 0;
  categoriaSeleccionada: number | null = null;

  precioFiltro: number | null = null;
  descuentoFiltro: number | null = null;
  PrecioConDescuento: number | null = null;
  nombreFiltro: string | null = null;
  metodo: string | null = null;
  codigoFiltro: string | null = null;
  productosFiltrados: Producto[] = [];
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  metodoBusqueda: string | null = 'Nombre';
  metodoBusquedaPago: string | null = 'Pagado';
  metodoTipo: string | null = '';
  // formularioProducto: FormGroup;
  pageSize: number = 8;
  page: number = 1;
  totalPages: number = 1;
  searchTerm: string = ''; // Término de búsqueda, si aplica
  totalProductos: number = 0;
  currentPage: number = 1;
  pagesArray: number[] = [];
  precioPorPorcionSeleccionado: { [key: number]: boolean } = {};
  ///
  nombreEmpresa: string = '';
  empresa: any;

  selectedColor: string = '';
  listaCategoriaFiltro: Categoria[] = [];
  listaCategoria: Categoria[] = [];
  categoriaControl = new FormControl('');
  private mercadopago: any;
  clienteFiltrado: string = '';

  //Venta

  claveSecreta: string | null = null;
  error: string | null = null;

  listaProducto: Producto[] = [];
  listaProductoFiltro: Producto[] = [];
  listaProductoParaPedido: DetallePedido[] = [];
  listaProductoFiltroCodigo: Producto[] = [];
  listaclienteParaPedido: Pedido[] = [];
  venta: any;

  bloquearBotonRegistrar: boolean = false;
  productoSeleccionado!: Producto | null;
  mesaSeleccionado!: Mesa | null;
  mesaSeleccionadoTemporal: any;
  interesesSeleccionadoTemporal: any;
  productoSeleccionadoTemporal: any;
  ListaproductoSeleccionadoTemporal: any[] = [];
  mesaSeleccionado2: Mesa | null = null;

  unidaddePagoPorDefecto: string = "Unitario";
  tipodeFacturaPorDefecto: string = "Ticket";
  tipodePedido: string = "Local";


  totalPagar: number = 0;
  GanaciaPagar: number = 0;
  CantidadPagar: number = 0;
  total: string = "";
  formularioProductoVenta: FormGroup;
  columnasTabla: string[] = ['imagen', 'producto', 'porcion', 'mesa', 'cantidad',
    'precio', 'total', 'accion',];

  datosDetallePedido = new MatTableDataSource(this.listaProductoParaPedido);
  imagenSeleccionada: string | null = null;
  imagenLocalStorage: string | null = null;
  imagenPorProducto: { [idProducto: number]: string | null } = {};
  // formularioCliente: FormGroup;
  listaMesas: Mesa[] = [];
  listaMesasFiltrada: Mesa[] = [];
  dataSource = new MatTableDataSource<Mesa>();
  form: FormGroup = new FormGroup({});

  numeroFormateado: string = '';
  tipoBusqueda: string | null = '';

  hayCajaAbierta: boolean = false;
  // Variable para almacenar el precio del producto
  precioProducto: string = '';
  // Declaración de la variable para almacenar el tipo de pago seleccionado
  mostrarInteres: boolean = false;
  totalConDescuento: number = this.totalPagar;
  Vueltos: number = 0;
  filtroActivos: 'Nombre' | 'Precio' | 'Descuento' = 'Nombre';
  isInicio: boolean = true;

  public comentarioGeneralPedido: string = '';


  get cantidad() { return this.formularioProductoVenta.get('cantidad'); }
  constructor(
    private productoService: ProductoService,
    private dialog: MatDialog,
    private _categoriaServicio: CategoriaService,
    private _usuarioServicio: UsuariosService,
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private empresaDataService: EmpresaDataService,
    private cartService: CartService,
    private imageDialogService: ImageDialogService,
    private paymentService: PaymentService,
    private mercadoPagoService: MercadoPagoService,
    //Venta
    private _productoServicio: ProductoService,
    private _pedidoServicio: PedidoService,
    private _utilidadServicio: UtilidadService,
    private mesasService: MesaService,
    private cajaService: CajaService,
    private snackBar: MatSnackBar,
    private pdfService: FileFacturaService,
    private signalRService: SignalRService,
    private router: Router

    // private exchangeRateService: ExchangeRateService
  ) {



    // this.formularioProducto = this.fb.group({

    //   categoria: ['',],
    //   precioFiltro: [''],
    //   nombreFiltro: ['']
    // });
    this.formularioProductoVenta = new FormGroup({
      // Otros controles del formulario
      metodoPago: new FormControl(''), // Asegúrate de que este control refleje el valor seleccionado en tu mat-select
      intereses: new FormControl(''),
    });

    // Establecer un intervalo para actualizar la lista de productos cada 5 minutos (puedes ajustar el tiempo según tus necesidades)
    // interval(1000) // 300,000 milisegundos = 5 minutos
    //   .subscribe(() => {
    //     this.cargarProductos();
    //   });
    // interval(1000) // 300,000 milisegundos = 5 minutos
    //   .subscribe(() => {
    //     this.actualizarListaMesas();
    //   });


    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      mesa: ['', [Validators.maxLength(35)]],
      mesaId: [''],

      tipoBusqueda: ['',],
      metodoBusqueda: ['Pagado'],
      // intereses: ['0',],
      categoria: ['',],
      precioFiltro: [''],
      nombreFiltro: ['']
    });



    this.formularioProductoVenta.get('categoria')?.valueChanges.subscribe(value => {
      // console.log('Valor de búsqueda:', value); // Log del valor de búsqueda
      this.listaCategoriaFiltro = this.retornarProductoPorFiltro(value); // Filtrar lista
      // console.log('Lista de categorías filtradas:', this.listaCategoriaFiltro); // Log de categorías filtradas
    });

    this.formularioProductoVenta.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesasFiltrada = this.filtrarMesas(value);
    });




    // Establecer un intervalo para actualizar la lista de productos cada 5 minutos (puedes ajustar el tiempo según tus necesidades)
    // interval(1000) // 300,000 milisegundos = 5 minutos
    //   .subscribe(() => {
    //     this.actualizarListaProductos();
    //   });
  }

  private subscriptions: Subscription[] = [];
  private listeners: (() => void)[] = [];

  ngOnDestroy(): void {
    console.log('[HistorialPedidoComponent] Destruyendo listeners...');

    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    // this.listeners.forEach(l => l());
    // this.listeners = [];
  }



  ngOnInit(): void {
    // this.mercadopago = new MercadoPago('TEST-025cffe8-e00d-4714-884a-0fd2dc165fd8', {
    //   locale: 'es-CO' // Cambia esto según la localización deseada
    // });
    //this.loadProducts();

    this.ajustarPageSize();

    // Escuchar si cambia el tamaño de la ventana (ej: girar móvil)
    window.addEventListener('resize', () => {
      this.ajustarPageSize();
    });


    const usuarioAdmin = this._utilidadServicio.obtenerSesionUsuario();

    const sub = this.signalRService.eventosGlobales$.subscribe(evento => {

      const ruta = this.router.url;
      const esAdmin = usuarioAdmin.rolDescripcion === 'Administrador';
      const esRealizarPedidos = ruta === '/pages/realizarPedidos';

      // ----------------------------------------------
      // EVENTOS QUE RECARGAN PRODUCTOS Y/O MESAS
      // ----------------------------------------------

      switch (evento.tipo) {

        // ====== PEDIDOS ======
        case "pedido_registrado":
        case "pedido_actualizado":
        case "pedido_editado":
        case "pedido_anulado":
        case "venta_anulada":

          if (esAdmin && esRealizarPedidos) {
            this.cargarProductos();
            this.actualizarListaMesas();
          } else {
            this.cargarProductos();
            this.actualizarListaMesas();
          }
          break;


        // ====== PRODUCTOS ======
        case "imagen_producto":
        case "producto_bodega":
        case "producto_editado":
        case "producto_eliminado":
        case "producto_guardado":
        case "producto_vencido":
        case "producto_nueva_imagen":

          if (esAdmin && esRealizarPedidos) {
            this.cargarProductos();
          } else {
            this.cargarProductos();
          }
          break;


        // ====== MESAS ======
        case "mesa_guardada":
        case "mesa_editada":
        case "mesa_eliminada":

          if (esAdmin && esRealizarPedidos) {
            this.actualizarListaMesas();
          } else {
            this.actualizarListaMesas();
          }
          break;

      }

    });

    this.subscriptions.push(sub);




    this.inicializar
    this.cargarProductos();
    this.actualizarListaMesas();
    this.CategoriaCompleta();
    // this.obtenerCategorias();
    // this.fetchProductos();


    this.obtenerCajasAbiertas();

    this.agregarObservadorCantidad();


  }

  ajustarPageSize(): void {
    if (window.innerWidth <= 768) {
      this.pageSize = 6; // Vista móvil
    } else {
      this.pageSize = 8; // Escritorio
    }

    this.calcularTotalPaginas();
  }

  calcularTotalPaginas(): void {
    const total = this.totalProductos || 0; // 🔑 usar lo que devuelve el backend
    this.totalPages = Math.ceil(total / this.pageSize);
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }


  filtrarEntradaMesa(event: any): void {
    const inputCliente = event.target.value;

    // if (/^\d + $ /.test(inputCliente)) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Advertencia',
    //     text: `No se puede digitar numero.`,
    //   });
    //   // Aquí, se puede mostrar una alerta o desactivar el botón de agregar.
    //   // this._utilidadServicio.mostrarAlerta('No se puede digitar numero.', 'ERROR!');
    //   this.mesaSeleccionado = null!;
    //   this.formularioProductoVenta.patchValue({
    //     mesa: null,
    //     mesaId: null,
    //   });

    //   // Limpiar el texto del cliente seleccionado
    //   this.formularioProductoVenta.get('mesa')?.setValue('');
    // }

    // const soloLetras = inputCliente.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '');

    // Almacena el valor filtrado en la variable clienteFiltrado
    this.clienteFiltrado = inputCliente;

    // Establece el valor en el control del formulario
    this.formularioProductoVenta.get('mesa')?.setValue(this.clienteFiltrado);
  }


  deseleccionarMesa() {
    // Puedes realizar acciones adicionales aquí antes de deseleccionar
    this.mesaSeleccionado = null;
  }

  inicializar() {


    // this.formularioProducto = this.fb.group({

    //   categoria: ['',],
    //   precioFiltro: [''],
    //   nombreFiltro: ['']
    // });


    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      mesa: ['', [Validators.maxLength(35)]],
      mesaId: [''],
      // precioPagadoTexto: ['0', Validators.required],
      tipoBusqueda: ['',],
      metodoBusqueda: [''],
      // intereses: ['0',],
      categoria: ['',],
      precioFiltro: [''],
      nombreFiltro: ['']
    });



    this.formularioProductoVenta.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesasFiltrada = this.filtrarMesas(value);
    });

    this.formularioProductoVenta.get('categoria')?.valueChanges.subscribe(value => {
      this.listaCategoriaFiltro = this.retornarProductoPorFiltro(value); // Filtrar lista
    });

    // this.actualizarListaProductos();
    this.actualizarListaMesas();

  }


  CategoriaCompleta() {
    this._categoriaServicio.listaCard().subscribe({
      next: (data) => {
        // console.log('Datos recibidos:', data);
        if (data.status) {


          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));
          this.listaCategoria = data.value as Categoria[];
          this.listaCategoriaFiltro = [...this.listaCategoria];

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


              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  // console.log('Token actualizado:', response.token);
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

  agregarObservadorCantidad() {
    this.formularioProductoVenta.get('cantidad')?.valueChanges.subscribe((value) => {
      // Llamar a la función para actualizar el total cuando cambie la cantidad
      this.actualizarTotal();
    });
  }

  actualizarTotal() {

    let total = 0;
    // Iterar sobre la lista de productos para calcular el total
    this.listaProductoParaPedido.forEach(producto => {
      const cantidad = producto.cantidad;
      const precioFinal = parseFloat(producto.precio!.replace(/\./g, ''));
      const nuevoTotal = cantidad * precioFinal;
      producto.totalTexto = nuevoTotal.toFixed(0); // Actualizar el totalTexto
      total += nuevoTotal;
    });
    // Actualizar el total en tu modelo de datos
    // this.totalPagar = total;
    this.totalPagar = total;
    // this.totalConDescuento = this.totalPagar ;
    // console.log(this.totalPagar);



  }
  // Añade un nuevo método para filtrar clientes
  filtrarMesas(nombre: any): Mesa[] {
    // Verificar si nombre es una cadena antes de llamar a trim()

    const valorBuscado = typeof nombre === "string" ? nombre.toLocaleLowerCase() : nombre.nombreMesa.toLocaleLowerCase();
    const mesasFiltrados = this.listaMesas.filter(item => item.nombreMesa.toLocaleLowerCase().includes(valorBuscado));
    // console.log('Mesas filtrados:', mesasFiltrados);
    return mesasFiltrados;
  }



  obtenerCajasAbiertas() {
    this.cajaService.listaSoloGeneral().subscribe({
      next: (data) => {
        // console.log(data);
        if (data && Array.isArray(data.value) && data.value.length > 0) {

          // Verificar si al menos una caja está abierta
          const cajaAbierta = data.value.find((caja: any) => caja.estado === 'Abierto');

          if (cajaAbierta) {
            this.hayCajaAbierta = true;

            // // Si se encuentra al menos una caja abierta
            // // Verificar si la fecha de inicio de la caja abierta coincide con la fecha actual
            // const fechaInicioCaja = moment(cajaAbierta.fechaApertura);
            // const fechaHoy = moment();
            // if (fechaInicioCaja.isSame(fechaHoy, 'day')) {
            //   // Si la fecha de inicio coincide con la fecha actual, se puede proceder con la venta
            //   this.hayCajaAbierta = true;

            // } else {
            //   // Si la fecha de inicio no coincide con la fecha actual, mostrar un mensaje de error
            //   Swal.fire({
            //     icon: 'error',
            //     title: '¡ ERROR !',
            //     text: 'Primero debe cerrar la caja antes de iniciar una nueva venta.'
            //   });
            //   this.bloquearBotonRegistrar = false;
            //   this.hayCajaAbierta = false;

            // }
          } else {
            // Si no se encuentra ninguna caja abierta
            Swal.fire({
              icon: 'warning',
              title: 'Atención',
              text: 'No hay cajas abiertas'
            });
            this.hayCajaAbierta = false;
          }
        } else {
          this.hayCajaAbierta = false;
          Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'No hay cajas abiertas'
          });
        }
      },
      error: (error) => {
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              // console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  // console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.obtenerCajasAbiertas();
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

  // verImagen2(): void {
  //   this.imageDialogService.openImageDialog(
  //     'data:image/png;base64,' + this.empresa.logo
  //   );
  // }


  verImagen2(producto: Producto): void {
    // Verificar si el producto tiene imageData
    if (producto.imagenUrl) {
      // console.log('Image Data:', producto.imagenUrl);
      this.dialog.open(VerImagenProductoModalComponent, {
        data: {
          // imageData: `data:image/png;base64, ${producto.imageData}`
          //funcional
          // imageData: `${producto.imageData}`
          imagenes: producto.imagenUrl
        }
      });
    } else {
      // Si no hay imageData, mostrar un mensaje de error o manejarlo según sea necesario
      console.error('No hay imageData disponible para el producto seleccionado.');
      // Puedes mostrar un snackbar, alerta u manejarlo de cualquier otra manera según tus requisitos.

    }
  }


  eliminarProducto(detalle: DetallePedido) {

    this.totalPagar -= parseFloat(detalle.totalTexto);


    // Obtener la posición del producto en la lista
    const index = this.listaProductoParaPedido.findIndex(p => p === detalle);

    // Eliminar solo el producto seleccionado de la lista
    this.listaProductoParaPedido = this.listaProductoParaPedido.filter(p => p !== detalle);

    this.datosDetallePedido = new MatTableDataSource(this.listaProductoParaPedido);


    this.actualizarTotal();

  }


  mostrarTooltip(tooltip: MatTooltip) {
    tooltip.show();
    // Ocultar el tooltip después de un tiempo
    setTimeout(() => tooltip.hide(), 2000); // Por ejemplo, ocultarlo después de 2 segundos
  }

  retornarProductoPorFiltro(value: string): Categoria[] {
    // console.log('Filtrando con valor:', value);
    // console.log('Categorías disponibles:', this.listaCategoria);

    if (!value) {
      return this.listaCategoria; // Si no hay valor, retornar todas las categorías
    }

    const lowerCaseValue = value.toLowerCase(); // Normaliza el valor de búsqueda
    const filteredList = this.listaCategoria.filter(categoria =>
      categoria.nombre.toLowerCase().includes(lowerCaseValue)
    );

    // console.log('Categorías filtradas:', filteredList);
    return filteredList;
  }


  // Método para calcular el subtotal
  calcularSubtotal(producto: Producto): number {
    // Verifica si se ha seleccionado 'precioPorCaja' para este producto
    let precio = this.precioPorPorcionSeleccionado[producto.idProducto]
      ? parseFloat(producto.precioPorPorcionTexto!) || 0  // Usa precioPorCaja si está seleccionado
      : parseFloat(producto.precio) || 0;         // Si no, usa el precio unitario

    let descuento = parseFloat(producto.descuentos) || 0;
    let precioConDescuento = precio * (1 - descuento / 100);
    return precioConDescuento * producto.stock;
  }



  calcularPrecioConDescuento(producto: Producto): string {
    const precio = parseFloat(producto.precio.replace(',', '.')); // Convertir precio a número
    const descuento = parseFloat(producto.descuentos.replace(',', '.')); // Convertir descuento a número
    const precioConDescuento = precio - (precio * (descuento / 100)); // Calcular precio con descuento
    return precioConDescuento.toString(); // Convertir el resultado a cadena
  }
  calcularPrecioConDescuentoPorcion(producto: Producto): string {
    const precio = parseFloat(producto.precioPorPorcionTexto!.replace(',', '.')); // Convertir precio a número
    const descuento = parseFloat(producto.descuentos.replace(',', '.')); // Convertir descuento a número
    const precioConDescuento = precio - (precio * (descuento / 100)); // Calcular precio con descuento
    return precioConDescuento.toString(); // Convertir el resultado a cadena
  }

  hasDescuento(producto: Producto): boolean {
    const descuento = parseFloat(producto.descuentos.replace(',', '.')); // Obtener descuento como número
    const precioConDescuento = this.calcularPrecioConDescuento(producto); // Calcular precio con descuento
    return descuento > 0 && parseInt(precioConDescuento) > 0; // Verificar si hay descuento y precio con descuento es mayor que cero
  }



  loadProducts(): void {
    this.productoService.listaCard().subscribe(
      (response: ReponseApi) => {
        if (response && response.status && response.value) {
          response.value.sort((a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre));
          const lista = response.value as Producto[];
          this.products = lista.filter(p => p.esActivo === 1 && p.stock > 0);
          this.aplicarFiltro();
          this.calculateTotalPages();
        } else {
          this.products = [];
          this.aplicarFiltro();
        }
      },
      (error) => {
        this.handleTokenError(() => this.loadProducts());
      }
    );
  }

  // desc y asc
  cargarProductos(): void {
    const pagina = this.currentPage;
    const tamanoPagina = this.pageSize;
    const metodo = this.metodoBusqueda!;
    const filtro = this.filtroActivo();
    const orden = "";

    // console.log("📦 Enviando al servicio listaPaginadaCards:", {
    //   pagina,
    //   tamanoPagina,
    //   metodo,
    //   filtro,
    //   orden
    // });

    this.productoService.listaPaginadaCards(
      pagina,
      tamanoPagina,
      metodo,
      filtro,
      orden
    ).subscribe({
      next: (data: any) => {
        this.productosFiltrados = data.data || [];
        // console.log("📥 Productos recibidos:", this.productosFiltrados);
        this.totalProductos = data.total || 0;
        this.totalPages = Math.ceil(this.totalProductos / this.pageSize);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
      }
    });
  }


  ocultarPrecioTooltip() {
    this.precioProducto = '';
  }

  mostrarPrecioTooltip(element: any) {
    this.precioProducto = `Precio : ${this.formatearNumero(element.precioSinDescuento)} $ \n
    Cantidad Dispo : ${element.cantidadDisponible} \n`;

  }
  mostrarPrecioTooltip2(producto: Producto) {
    // console.log('Producto:', producto);
    // console.log('Precio sin descuento:', producto.precio);
    if (producto.precio) {
      // Asigna el precio del producto a la variable precioProducto
      this.precioProducto = `Precio : ${this.formatearNumero(producto.precio)} $  \n
      Cantidad Dispo : ${producto.stock}  \n
        Descuento : ${this.formatearNumero(producto.descuentos)}% `;
    } else {
      // Si precioSinDescuento no está definido, muestra un mensaje indicando que el precio no está disponible
      this.precioProducto = "Precio no disponible";
    }
  }

  filtroActivo(): any {
    let filtro: any = {};

    if (this.metodoBusqueda === 'Precio' && this.precioFiltro !== undefined) {
      filtro.searchTerm = this.precioFiltro;
    } else if (this.metodoBusqueda === 'Nombre' && this.nombreFiltro) {
      filtro.searchTerm = this.nombreFiltro;
    } else if (this.metodoBusqueda === 'Descuento' && this.descuentoFiltro !== undefined) {
      filtro.searchTerm = this.descuentoFiltro;
    } else if (this.metodoBusqueda === 'Categoria' && this.categoriaSeleccionada !== null) {
      filtro.searchTerm = this.categoriaSeleccionada;
      // console.log(filtro.searchTerm);
    }
    else if (this.metodoBusqueda === 'Codigo' && this.codigoFiltro) {
      filtro.searchTerm = this.codigoFiltro;
    }

    return filtro;
  }

  mostrarListaCategoria(): void {


    this.listaCategoriaFiltro = this.listaCategoria;

  }

  onChangeTipoBusqueda(event: any) {
    this.tipoBusqueda = event.value; // Actualiza el valor de tipoBusqueda
    this.productoSeleccionado = null;
    this.imagenSeleccionada = null;

  }

  formatearNumero4(event: any, campo: string): void {
    let valorInput = event.target.value.replace(/\./g, ''); // Elimina los puntos existentes

    // Verifica si el valor es un número válido antes de formatear
    if (valorInput !== '' && !isNaN(parseFloat(valorInput))) {
      valorInput = parseFloat(valorInput).toLocaleString('es-CO', { maximumFractionDigits: 2 });
      this.numeroFormateado = valorInput;

      // Actualiza el valor formateado en el formulario
      this.formularioProductoVenta.get(campo)?.setValue(valorInput);

    } else {
      // Si el valor no es un número válido o está vacío, establece el valor en cero en el formulario
      this.numeroFormateado = '0';
      this.formularioProductoVenta.get(campo)?.setValue('0');
    }
  }

  filtrarEntrada(event: any): void {
    const inputCliente = event.target.value;

    if (/^\d+$/.test(inputCliente)) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `No se puede digitar numero.`,
      });
      // Aquí, se puede mostrar una alerta o desactivar el botón de agregar.
      // this._utilidadServicio.mostrarAlerta('No se puede digitar numero.', 'ERROR!');
      // this.mesaSeleccionado = null!;
      this.formularioProductoVenta.patchValue({
        cliente: null,
        clienteId: null,
      });

      // Limpiar el texto del cliente seleccionado
      this.formularioProductoVenta.get('categoria')?.setValue('');
    }
    if (inputCliente == "") {

      this.categoriaSeleccionada = inputCliente;  // Guardar la categoría seleccionada
      this.aplicarFiltroCard();
    }

    const soloLetras = inputCliente.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '');

    // Almacena el valor filtrado en la variable clienteFiltrado
    this.clienteFiltrado = soloLetras;

    // Establece el valor en el control del formulario
    this.formularioProductoVenta.get('categoria')?.setValue(this.clienteFiltrado);
  }


  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
  }
  mostrarCategoria(categoria: Categoria): string {

    return categoria.nombre;

  }
  aplicarFiltroCard(): void {

    // console.log(this.metodoBusqueda);
    this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
    this.currentPage = 1;
    this.cargarProductos();
    //this.loadProducts();
    // this.currentPage = 1;
    // this.fetchProductos();
  }
  aplicarFiltroCardNombre(): void {
    // console.log(this.metodoBusqueda);
    const filtro = this.nombreFiltro!.trim().toLowerCase();


    if (this.isInicio == false) {
      if (filtro == "") {

        this.metodoBusqueda = "Categoria"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();

      } else {

        this.metodoBusqueda = "Nombre"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      }
    } else {

      if (filtro == "") {


        this.metodoBusqueda = ""

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();

      } else {

        this.metodoBusqueda = "Nombre"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      }

    }


  }

  aplicarFiltroCardPrecio(): void {


    if (this.isInicio == false) {
      if (this.precioFiltro == 0 || this.precioFiltro == null) {

        this.metodoBusqueda = "Categoria"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      } else {

        this.metodoBusqueda = "Precio"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      }

    } else {
      if (this.precioFiltro == 0 || this.precioFiltro == null) {

        this.metodoBusqueda = ""

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      } else {

        this.metodoBusqueda = "Precio"

        this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
        this.currentPage = 1;
        this.cargarProductos();
        //this.loadProducts();
        // this.currentPage = 1;
        // this.fetchProductos();
      }
    }

  }

  onPageChangeCard(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.cargarProductos();
    //this.loadProducts();
    // this.fetchProductos();
  }

  onChangeTipoBusqueda4(event: any): void {
    this.metodoBusqueda = event.value;
    if (this.metodoBusqueda == "Precio") {
      this.nombreFiltro = "";
      this.descuentoFiltro = 0;
      this.codigoFiltro = "";
      this.listaCategoriaFiltro.forEach(categoria => categoria.seleccionada = false); // Desmarcar las categorías

      this.aplicarFiltroCard();
    }
    else {
      this.codigoFiltro = "";
      this.descuentoFiltro = 0;
      this.precioFiltro = null;
      this.listaCategoriaFiltro.forEach(categoria => categoria.seleccionada = false); // Desmarcar las categorías

      this.aplicarFiltroCard();
    }
  }
  onPageSelected(event: MatSelectChange) {
    // Handle selection change from mat-select
    // Call your method to fetch data based on this.currentPage
    this.currentPage = event.value;
    this.fetchProductos();


  }

  fetchProductos() {
    // Call your service method to fetch productos based on currentPage, pageSize, metodoBusqueda, searchTerm
    this.productoService.listaPaginadaCards(this.currentPage, this.pageSize, this.metodoBusqueda!, this.searchTerm)
      .subscribe(response => {
        this.productosFiltrados = response.data; // Update productos array with new data
        this.totalProductos = response.total; // Update totalProductos with new total count
        this.updatePagesArray(); // Update pagesArray based on new totalProductos and pageSize
      }, error => {
        console.error('Error fetching productos:', error);
      });
  }


  updatePagesArray() {
    this.pagesArray = []; // Limpiar el arreglo de páginas

    if (this.totalProductos > 0) {
      const totalPages = Math.ceil(this.totalProductos / this.pageSize);

      for (let i = 1; i <= totalPages; i++) {
        this.pagesArray.push(i);
      }
    }
  }
  verCaracteristicas(producto: Producto): void {
    // const imageUrl = this.productoService.decodeBase64ToImageUrl(producto.imageData!);
    this.dialog.open(ModalCaracteristicasProductoComponent, {
      data: {
        caracteristicas: producto.caracteristicas || 'No hay características disponibles',
        nombre: producto.nombre,
        // imageData: imageUrl
        imagenUrl: producto.imagenUrl
      }
    });
  }

  onChangeTipoBusqueda17(event: any) {
    this.metodoBusquedaPago = event.value; // Actualiza el valor de tipoBusqueda

    // if (this.metodoBusquedaPago === 'Pagado') {
    //   this.formularioProductoVenta.get('intereses')!.setValue('0'); // Establece el valor de intereses a vacío

    // } else {



    //   this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
    //   this.Vueltos = 0;
    // }
  }

  onChangeTipoBusqueda19(event: any) {
    this.metodoTipo = event.value; // Actualiza el valor de tipoBusqueda

    // if (this.metodoTipo === 'Efectivo') {
    //   this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0'); // Establece el valor de intereses a vacío
    //   this.actualizarTotal();

    // } else {



    //   this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
    //   this.Vueltos = 0;
    // }
  }

  private actualizarListaMesas() {
    this.mesasService.lista().subscribe({
      next: (data) => {

        if (data.status) {
          data.value.sort((a: Mesa, b: Mesa) =>
            a.nombreMesa.localeCompare(b.nombreMesa)
          );

          const lista = data.value as Mesa[];
          this.listaMesas = lista.filter(p => p.ocupada == 0);

          // 🔹 REACTIVAR FILTRADO SI EL USUARIO ESTÁ ESCRIBIENDO EN EL INPUT
          const textoActual = this.formularioProductoVenta.get('mesa')?.value;

          if (textoActual && textoActual !== '') {
            this.filtrarEntradaMesaManual(textoActual);
          } else {
            this.listaMesasFiltrada = [...this.listaMesas];
          }

          // 🔹 Forzar actualización del autocomplete
          this.listaMesasFiltrada = [...this.listaMesasFiltrada];
        }
      },
      error: (e) => {
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              // console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  // console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.actualizarListaMesas();
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


  filtrarEntradaMesaManual(texto: string) {
    const filtro = texto.toLowerCase();

    this.listaMesasFiltrada = this.listaMesas.filter(m =>
      m.nombreMesa.toLowerCase().includes(filtro)
    );
  }


  validacion(producto: Producto[]): void {
    const totalesPorProducto = new Map<number, number>();
    let todosConSuficienteStock = true;
    const productosConStockInsuficiente: string[] = [];
    const productosConStockInsuficiente2: number[] = [];

    // Calcular los totales por producto
    for (const item of this.listaProductoParaPedido) {
      const totalProducto = item.cantidad;
      if (totalesPorProducto.has(item.idProducto)) {
        totalesPorProducto.set(item.idProducto, totalesPorProducto.get(item.idProducto)! + totalProducto);
      } else {
        totalesPorProducto.set(item.idProducto, totalProducto);
      }
    }

    // Verificar si hay suficiente stock para cada producto
    for (const [id, total] of totalesPorProducto.entries()) {
      const productoCorrespondienteBD = this.listaProducto.find(producto => producto.idProducto === id);
      if (productoCorrespondienteBD && productoCorrespondienteBD.stock !== undefined && total > productoCorrespondienteBD.stock) {
        todosConSuficienteStock = false;
        const nombreProducto = productoCorrespondienteBD.nombre.length > 40
          ? productoCorrespondienteBD.nombre.substring(0, 40) + '...'
          : productoCorrespondienteBD.nombre;
        productosConStockInsuficiente.push(`<span style="color: red;">${nombreProducto}</span>`);
        productosConStockInsuficiente2.push(productoCorrespondienteBD.stock);
      }
    }

    if (todosConSuficienteStock) {
      this.registrarVenta();
    } else {

      Swal.fire({
        icon: 'error',
        title: 'Error de Stock',
        html: `Uno o más productos no tienen suficiente stock para la venta:
            <br>${productosConStockInsuficiente.join('<br>')} <br> Con un Stock de : <br>${productosConStockInsuficiente2.join('<br>')}   `,
      });
    }
  }



  resetFiltros(): void {
    this.categoriaSeleccionada = null;
    this.precioFiltro = null;
    this.descuentoFiltro = null;
    this.nombreFiltro = null;
    this.page = 1;
  }
  onChangeTipoBusqueda2(event: any): void {
    this.metodoBusqueda = event.value;
    this.resetFiltros();
    this.aplicarFiltro();
  }
  aplicarFiltro(): void {
    if (this.descuentoFiltro !== null && (this.descuentoFiltro < 0 || this.descuentoFiltro > 100)) {
      this.descuentoFiltro = null;
    } else {
      switch (this.metodoBusqueda) {
        case 'Categoria':
          this.productosFiltrados = this.categoriaSeleccionada !== null
            ? this.products.filter(producto => producto.idCategoria === this.categoriaSeleccionada)
            : [...this.products];
          break;
        case 'Precio':
          if (this.precioFiltro !== null) {
            const precioFiltroNumber = parseFloat(this.precioFiltro.toString().replace(',', '.'));
            this.productosFiltrados = this.products.filter(producto => {
              const precioProductoNumber = parseFloat(producto.precio.replace(',', '.'));
              return !isNaN(precioProductoNumber) && precioProductoNumber <= precioFiltroNumber;
            });
          } else {
            this.productosFiltrados = [...this.products];
          }
          break;
        case 'Descuento':
          if (this.descuentoFiltro !== null) {
            const descuentoFiltroNumber = parseFloat(this.descuentoFiltro.toString().replace(',', '.'));
            this.productosFiltrados = this.products.filter(producto => {
              const descuentoProductoNumber = parseFloat(producto.descuentos.replace(',', '.'));
              return !isNaN(descuentoProductoNumber) && descuentoProductoNumber == descuentoFiltroNumber;
            });
          } else {
            this.productosFiltrados = [...this.products];
          }
          break;
        case 'Nombre':
          this.productosFiltrados = this.nombreFiltro !== null
            ? this.products.filter(producto => producto.nombre.toLowerCase().includes(this.nombreFiltro!.toLowerCase()))
            : [...this.products];
          break;
        default:
          this.productosFiltrados = [...this.products];
          break;
      }
      this.calculateTotalPages();
    }
  }
  private actualizarListaProductos() {
    this.productoService.listaCard().subscribe(
      (response: ReponseApi) => {
        if (response && response.status && response.value) {
          response.value.sort((a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre));
          const lista = response.value as Producto[];
          this.products = lista.filter(p => p.esActivo === 1 && p.stock > 0);
          this.productosFiltrados = this.products;
        } else {
          this.products = [];
          this.aplicarFiltro();
        }
      },
      (error) => {
        this.handleTokenError(() => this.actualizarListaProductos());
      }
    );
  }

  handleTokenError(retryCallback: () => void): void {
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const bytes = CryptoJS.AES.decrypt(usuarioString, this.CLAVE_SECRETA);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados) {
        const usuario = JSON.parse(datosDesencriptados);
        this._usuarioServicio.obtenerUsuarioPorId(usuario.idUsuario).subscribe(
          (usuario: any) => {
            const refreshToken = usuario.refreshToken;
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('refreshToken', response.refreshToken);
                retryCallback();
              },
              (error: any) => {
                // Manejar error de renovación de token
              }
            );
          },
          (error: any) => {
            // Manejar error al obtener usuario por ID
          }
        );
      }
    }
  }


  get showNoResultsMessage(): boolean {
    return this.products.length > 0 && this.productosFiltrados.length === 0;
  }

  verImagen(product: Producto): void {
    // const imageUrl = this.productoService.decodeBase64ToImageUrl(product.imageData!);
    // console.log('URL de la imagen:', imageUrl); // Verificar la URL de la imagen en la consola
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        // imageData: imageUrl
        imagenes: product.imagenUrl
      }
    });
  }
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.productosFiltrados.length / this.pageSize);
  }
  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.aplicarFiltro();
  }
  trackByProducto(index: number, item: Producto): number {
    return item.idProducto;
  }

  decodeBase64ToImageUrl(base64String: string): string {
    // Implement this method from your service to decode base64 string to image URL
    return this.productoService.decodeBase64ToImageUrl(base64String);
  }

  formatearNumeroMostrado(valor: string): string {
    const numero = Number(valor);

    if (!isNaN(numero) && isFinite(numero)) {
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 });
    } else {
      return '';
    }
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
  formatearNumero2(numero: any): string {
    if (typeof numero === 'number' && !isNaN(numero)) {
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } else {
      return 'N/A';
    }
  }




  firstPage() {
    this.currentPage = 1;
    this.cargarProductos();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarProductos();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarProductos();
    }
  }

  lastPage() {
    this.currentPage = this.totalPages;
    this.cargarProductos();
  }
  pageSizeChange() {
    this.currentPage = 1;
    this.cargarProductos();
  }

  // nuevoCliente(event: any) {



  // }
  nuevoCliente(event: MouseEvent): void {
    event.stopPropagation();
    this.dialog.open(ModalMesasComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {
      this.actualizarListaMesas();
    });
  }
  validarAgregarProductoParaVenta(): boolean {
    // Verificar si hay al menos una caja abierta y si tanto productoSeleccionado como mesaSeleccionado no son nulos
    return this.hayCajaAbierta && !!this.productoSeleccionado && !!this.mesaSeleccionado;
  }

  private mostrarAlerta(titulo: string, mensaje: string) {
    Swal.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje
    });
  }

  calcularTotalPagar(listaProductos: any[]): number {
    let total = 0;
    for (const producto of listaProductos) {
      total += parseFloat(producto.totalTexto);
    }
    return total;
  }


  private validarMesas(mesaIngresado: any): boolean {
    // console.log(mesaIngresado);
    // console.log(this.mesaSeleccionado!.nombreMesa);
    if (mesaIngresado && mesaIngresado !== this.mesaSeleccionado!.nombreMesa) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'La mesa ingresada no coincide con la mesa seleccionada.',
      });
      this.mesaSeleccionado = null!;
      this.formularioProductoVenta.patchValue({
        mesa: null,
        mesaId: null,
      });
      this.formularioProductoVenta.get('mesa')?.setValue('');
      return false;
    }

    if (this.mesaSeleccionado && this.listaProductoParaPedido.length > 0) {
      const clienteEnTabla = this.listaProductoParaPedido[0].idMesa;

      // console.log(clienteEnTabla);
      // console.log(this.mesaSeleccionado!.idMesa)

      if (clienteEnTabla !== this.mesaSeleccionado.idMesa) {
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se puede agregar un producto con una mesa diferente.',
        });
        return false;
      }
    }
    return true;
  }


  productoParaVenta(product: Producto) {


    // this.productoSeleccionado = event.option.value;
    const selectedProduct: Producto = product;
    this.productoSeleccionado = selectedProduct;
    // console.log(this.productoSeleccionado)

    let cantidadInvalida = false; // Bandera para indicar si la cantidad es inválida
    this.cajaService.listaSoloGeneral().subscribe({
      next: (data) => {
        if (data && Array.isArray(data.value) && data.value.length > 0) {
          // Verificar si al menos una caja está abierta
          this.hayCajaAbierta = data.value.some((caja: any) => caja.estado === 'Abierto');
          if (this.hayCajaAbierta) {


            // Verificar si se ha seleccionado un cliente
            const mesaIngresado = this.formularioProductoVenta.value.mesa;


            let _precio: number;
            let _precioPorcion: number;
            let unidad: number;


            // Si tiene porción, usar el precio de porción
            // if (this.productoSeleccionado!.tienePorcion == 1 && this.productoSeleccionado!.tienePorcion > 0) {
            //   unidad = Number(this.productoSeleccionado?.precioPorPorcionTexto);
            // } else {
            //   // si no tiene porción, precio normal
            //   unidad = Number(this.productoSeleccionado!.precio);
            // }
            // SI EL CHECKBOX ESTÁ ACTIVADO → usar precio por porción
            const esPorcion = this.precioPorPorcionSeleccionado[this.productoSeleccionado!.idProducto] === true;

            if (esPorcion) {
              unidad = Number(this.productoSeleccionado!.precioPorPorcionTexto);
            } else {
              unidad = Number(this.productoSeleccionado!.precio);
            }

            let cantidadIngresada = parseInt(this.formularioProductoVenta.get('cantidad')?.value);

            if (cantidadIngresada < 1 || cantidadIngresada === null) {
              Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: `La cantidad debe ser mayor que 0.`,
              });
              // this._utilidadServicio.mostrarAlerta('La cantidad debe ser mayor que 0.', 'ERROR');
              return;
            }



            if (cantidadIngresada > 1) {
              const cant = parseInt(this.formularioProductoVenta.get('cantidad')?.value);
              cantidadIngresada = cant

            } else {

              cantidadIngresada = 1;
            }



            // Validar si unidadMedida es correcta
            // if (this.productoSeleccionado!.unidadMedida === 'Comida' && this.unidaddePagoPorDefecto !== 'Comida') {
            //   Swal.fire({
            //     icon: 'warning',
            //     title: 'Advertencia',
            //     text: `Este producto debe ser vendido por Comida.`,
            //   });
            //   return;
            // } else if (this.productoSeleccionado!.unidadMedida === 'Unitario' && this.unidaddePagoPorDefecto !== 'Unitario') {
            //   Swal.fire({
            //     icon: 'warning',
            //     title: 'Advertencia',
            //     text: `Este producto debe ser vendido por UNIDAD.`,
            //   });
            //   return;
            // }

            if (this.productoSeleccionado!.unidadMedida === "Untario" && this.unidaddePagoPorDefecto === 'Untario') {

              if (this.productoSeleccionado!.stock <= 0) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Advertencia',
                  text: `Este producto no tiene las unidades suficiente para la venta de una caja de ${this.productoSeleccionado!.stock!}.`,
                });
                return;

              }

            }

            //Validar la cantidad de caja 



            if (this.productoSeleccionado!.unidadMedida === "Unitario" && this.unidaddePagoPorDefecto === 'Unitario') {

              if (this.productoSeleccionado!.precio! == "0.00") {
                Swal.fire({
                  icon: 'warning',
                  title: 'Advertencia',
                  text: `Este producto tiene un precio unitario de ${this.formatearNumero(this.productoSeleccionado!.precio!)} debes agregarle un precio unitario.`,
                });
                return;

              }

            }
            //Fin de validacion




            // Verificar si la cantidad ingresada es un número válido
            if (!cantidadInvalida && !isNaN(cantidadIngresada) && cantidadIngresada > 0) {

              if (!this.mesaSeleccionado) {
                this.mostrarAlerta('Advertencia', 'Por favor, seleccione una mesa antes de agregar un producto.');
                return;
              }



              // Validar el cliente seleccionado
              if (!this.validarMesas(mesaIngresado)) {
                return;
              }

              const productosMismoID = this.listaProductoParaPedido.filter(
                detalle => detalle.idProducto === this.productoSeleccionado!.idProducto
              );

              // Total de unidades ya agregadas
              let totalUnidadesAgregadas = 0;
              productosMismoID.forEach(prod => {

                totalUnidadesAgregadas += prod.cantidad;

              });




              if (this.productoSeleccionado!.unidadMedida === 'Unitario') {
                // Validación de stock
                if (totalUnidadesAgregadas + cantidadIngresada > this.productoSeleccionado!.stock) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Stock insuficiente',
                    text: `Stock disponible: ${this.productoSeleccionado!.stock} Unidad. Ya agregaste: ${totalUnidadesAgregadas} unidad. y quieres agregar ${cantidadIngresada} unidad mas.`,
                  });
                  return;
                }

              }




              const productoExistenteIndex = this.listaProductoParaPedido.findIndex(detalle =>
                detalle.idProducto === this.productoSeleccionado!.idProducto &&
                detalle.precio === String(unidad.toFixed(0)) // diferencia porción vs entero
              );

              // console.log(productoExistenteIndex);

              if (productoExistenteIndex !== -1) {
                const descuent: string = this.formularioProductoVenta.value.intereses;
                // Si el producto ya existe, simplemente actualizamos su cantidad
                this.listaProductoParaPedido[productoExistenteIndex].cantidad += cantidadIngresada;

                // Obtenemos el producto existente
                const producto = this.listaProductoParaPedido[productoExistenteIndex];

                let gananciaIndividual: any

                gananciaIndividual = 0;



                // Sumamos la ganancia individual a la ganancia total
                this.GanaciaPagar += gananciaIndividual;

                // Recalcular el total basado en la nueva cantidad
                const cantidadActualizada = this.listaProductoParaPedido[productoExistenteIndex].cantidad;
                const precioProducto = parseFloat(this.listaProductoParaPedido[productoExistenteIndex].precio!);

                const totalActualizado = cantidadActualizada * precioProducto;
                this.listaProductoParaPedido[productoExistenteIndex].totalTexto = String(totalActualizado.toFixed(0));

                // Actualizar el total a pagar
                this.totalPagar = this.calcularTotalPagar(this.listaProductoParaPedido);
                this.totalConDescuento = this.totalPagar + (this.totalPagar * (parseInt(descuent) / 100));



              } else {

                // Verificar si el producto ya está en la lista
                const productoExistente = this.listaProductoParaPedido.find(
                  detalle =>
                    detalle.idProducto === this.productoSeleccionado!.idProducto &&
                    detalle.precio === String(unidad.toFixed(0)) // diferencia porción vs entero
                );


                if (productoExistente) {
                  // Solo si es la misma unidad de medida se actualiza el precio del producto seleccionado
                  const precioTextoTabla = productoExistente.precioUnitarioTexto;
                  this.productoSeleccionado!.precio = precioTextoTabla;
                }


                // Actualizar Precio Pagado para todos los productos en la tabla
                if (this.mesaSeleccionado) {

                  let precio: number;

                  _precio = parseFloat(this.productoSeleccionado!.precio);
                  _precioPorcion = parseFloat(this.productoSeleccionado!.precioPorPorcionTexto!);
                  const precioConDescuento = _precio;
                  let unidad2: number = parseFloat(this.productoSeleccionado!.precio);



                  const _cantidad: number = cantidadIngresada;
                  const _cantidadDisponible: number = this.productoSeleccionado!.stock;

                  const _precioSindescuento = _precio;
                  const _cantidadStock = _cantidadDisponible;

                  const precioConDescuentoRedondeado = precioConDescuento.toFixed(0);
                  this.productoSeleccionado!.precio = precioConDescuentoRedondeado;
                  this.productoSeleccionado!.cantidadDisponible = _cantidadStock.toString();
                  const _total: number = _cantidad * precioConDescuento;



                  this.GanaciaPagar = 0;
                  this.totalPagar = this.totalPagar + _total;
                  this.Vueltos = 0;


                  this.CantidadPagar = this.CantidadPagar + _cantidad;


                  const tienePorcion = this.productoSeleccionado?.tienePorcion == 1;
                  const porcionSeleccionada = this.precioPorPorcionSeleccionado[this.productoSeleccionado!.idProducto] === true;

                  // if (!tienePorcion) {
                  //   // No tiene porción → siempre precio normal
                  //   unidad = precioConDescuento;
                  // } else if (porcionSeleccionada) {
                  //   // Tiene porción y está seleccionada → precio por porción
                  //   unidad = _precioPorcion;
                  // } else {
                  //   // Tiene porción pero NO está seleccionada → precio normal
                  //   unidad = precioConDescuento;
                  // }


                  // Agregar el producto a la lista de productos para venta
                  this.listaProductoParaPedido.push({
                    idProducto: this.productoSeleccionado!.idProducto,
                    descripcionProducto: this.productoSeleccionado!.nombre,
                    cantidad: _cantidad,
                    precioUnitarioTexto: String(unidad.toFixed(0)),
                    totalTexto: String(_total.toFixed(0)),
                    nombre: this.productoSeleccionado!.nombre,
                    idCategoria: this.productoSeleccionado!.idCategoria,
                    descripcionCategoria: this.productoSeleccionado!.descripcionCategoria,
                    stock: this.productoSeleccionado!.stock,
                    precio: String(unidad.toFixed(0)),
                    esActivo: this.productoSeleccionado!.esActivo,
                    // imageData: [this.imagenSeleccionada!],
                    imagenUrl: this.productoSeleccionado!.imagenUrl,
                    nombreImagen: this.productoSeleccionado!.nombreImagen,
                    caracteristicas: this.productoSeleccionado!.caracteristicas,
                    cantidadDisponible: String(_cantidadStock.toFixed(0)),
                    comentario: '', // or any appropriate value
                    descuentos: this.productoSeleccionado!.descuentos ?? '0',
                    codigo: this.productoSeleccionado!.codigo ?? '',
                    iva: this.productoSeleccionado!.iva ?? 0,
                    precioSinDescuento: String(_precioSindescuento.toFixed(0)),
                    // Add missing DetallePedido properties
                    unidadMedida: this.productoSeleccionado!.unidadMedida ?? '',
                    unidadMedidaTexto: this.productoSeleccionado!.unidadMedida ?? '',
                    nombreMesa: this.mesaSeleccionado.nombreMesa,
                    tipoMesa: this.mesaSeleccionado.tipo,
                    idMesa: this.mesaSeleccionado.idMesa,
                    tienePorcion: esPorcion ? 1 : 0
                    // imagenes: [
                    //   {
                    //     nombreImagen: "",
                    //     imageData: this.imagenSeleccionada,
                    //     imagenUrl: null
                    //   }
                    // ]
                  });

                  // console.log(this.listaProductoParaPedido);
                  this.datosDetallePedido = new MatTableDataSource(this.listaProductoParaPedido);
                } else {
                  console.error("No se ha seleccionado un cliente");
                  this.mostrarAlerta('Advertencia', 'No se puede agregar el producto hasta que seleccione un producto o un cliente.');
                  this.totalPagar = 0;
                }
                this.actualizarTotal();



              }


              // // Imprimir el estado del formulario
              // console.log('Estado del formulario:', this.formularioProductoVenta);

              // // Validar si el formulario es válido antes de habilitar el botón
              // console.log('¿Es el formulario válido?', this.formularioProductoVenta.valid);

              // // Imprimir los errores del formulario, si los hay
              // console.log('Errores del formulario:', this.formularioProductoVenta.errors);



              this.bloquearBotonRegistrar = false;

              this.formularioProductoVenta.patchValue({
                produto: "",
                cantidad: "",
                // cliente: "",
              });

              // console.log('Salió de agregarProductoParaVenta');




              // Establecer la bandera de cantidadInvalida en true
              cantidadInvalida = true;


            } else {
              // Mostrar un mensaje de advertencia si la cantidad ingresada no es válida
              // Swal.fire({
              //   icon: 'warning',
              //   title: 'Advertencia',
              //   text: 'Ingrese una cantidad válida mayor que cero.'
              // });
              cantidadInvalida = true; // Establecer la bandera en true para evitar repeticiones
            }


          } else {
            // Si no se encuentra ninguna caja abierta
            Swal.fire({
              icon: 'warning',
              title: 'Atención',
              text: 'No hay cajas abiertas'
            });

            return;
          }
        } else {
          this.hayCajaAbierta = false;

        }
      },
      error: (error) => {

        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {


              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {

                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.productoParaVenta(product);
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


  private continuarConAccionNormal(selectedProduct: Producto) {

    // Verificar si la imagen está disponible y cargarla
    // if (selectedProduct.imagenUrl) {
    //   this.imagenSeleccionada = `${selectedProduct.imagenUrl}`;
    // } else {
    //   // Si la imagen no está disponible, establecerla como nula o cargar una imagen predeterminada
    //   this.imagenSeleccionada = null; // o cargar una imagen predeterminada
    // }
    this.cargarImagenProducto(selectedProduct.idProducto);

    // Actualizar el valor del campo de búsqueda por código con el código del producto seleccionado
    this.formularioProductoVenta.get('producto')?.setValue(selectedProduct.nombre);
    this.formularioProductoVenta.get('codigo')?.setValue(selectedProduct.codigo);

    // Formatear el precio para mostrarlo con separadores de miles
    const precioNumerico = parseFloat(this.productoSeleccionado!.precio.replace('.', '.')); // Reemplazar la coma con el punto
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP', // Código de moneda para Perú
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });


    const precioFormateado = formatter.format(precioNumerico);

    this.mostrarPrecioTooltip2(selectedProduct);

    // Mostrar mensaje con el stock disponible
    const mensajeStock = `Stock disponible: ${this.productoSeleccionado!.stock} ,
    Precio del Producto:  ${precioFormateado}`;
    this.snackBar.open(mensajeStock, 'Cerrar', {
      duration: 7000, // Duración en milisegundos (opcional)
    });

  }

  get clienteControl() {
    return this.form.get('cliente');
  }

  mostrarClientes(cliente: Mesa): string {

    return cliente.nombreMesa;

  }
  mostrarlistaMesas(): void {
    this.listaMesasFiltrada = this.listaMesas;
  }

  mesaParaVenta(event: any) {

    this.mesaSeleccionado = event.option.value;

    // Verificar si el token está vigente o ha expirado
    if (this.tokenExpiradoMesa()) {
      // Token expirado, renovar token y continuar
      this.renovarTokenYContinuarMesa();
    } else {
      // Token válido, continuar con la acción normal
      this.continuarConAccionNormalMesa();
    }
  }

  private tokenExpiradoMesa(): boolean {
    // Lógica para verificar si el token ha expirado
    // Por ejemplo, comparar la fecha de expiración del token con la fecha actual
    const token = localStorage.getItem('authToken');
    if (!token) {
      return true; // No hay token, considerarlo expirado
    }

    // Decodificar el token JWT para obtener la fecha de expiración
    const tokenInfo = JSON.parse(atob(token.split('.')[1]));
    const expiration = new Date(tokenInfo.exp * 1000); // Convertir a milisegundos

    return expiration < new Date(); // Si la fecha de expiración es anterior a la fecha actual, el token ha expirado
  }

  private renovarTokenYContinuarMesa() {
    // Obtener el refreshToken del usuario del localStorage
    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

    if (datosDesencriptados !== null) {
      const usuario = JSON.parse(datosDesencriptados);
      const refreshToken = usuario.refreshToken;

      // Manejar la renovación del token
      this._usuarioServicio.renovarToken(refreshToken).subscribe(
        (response: any) => {

          // Guardar el nuevo token de acceso en el almacenamiento local
          localStorage.setItem('authToken', response.token);

          // Después de renovar el token, continuar con la acción normal
          this.continuarConAccionNormalMesa();
        },
        (error: any) => {
          console.error('Error al actualizar el token:', error);
          // Manejar el error según sea necesario
        }
      );
    }
  }

  private continuarConAccionNormalMesa() {
    // Actualiza el valor del control 'cliente' en el formulario
    this.formularioProductoVenta.get('mesa')?.setValue(this.mesaSeleccionado!.nombreMesa);

    // Actualiza el valor del control 'clienteId' en el formulario
    this.formularioProductoVenta.get('mesaId')?.setValue(this.mesaSeleccionado!.idMesa);



    // Aquí puedes realizar cualquier otra acción necesaria después de seleccionar el cliente
  }

  registrarVenta() {
    if (this.listaProductoParaPedido.length > 0) {
      // Obtener el total de la venta
      const totalVentaDecimal: number = parseFloat(this.totalPagar.toFixed(2));
      const totalVenta: string = totalVentaDecimal.toString();

      // Inicializar las variables
      let idUsuario: number = 0;
      let idCaja: number = 0;

      // Obtener el idUsuario del localStorage
      const usuarioString = localStorage.getItem('usuario');
      const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados !== null) {
        const usuario = JSON.parse(datosDesencriptados);
        idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
      }
      if (idUsuario !== 0) {
        this.validarMontoYPagar(idUsuario, totalVenta);

      } else {

      }

    }

  }

  validarMontoYPagar(idUsuario: number, totalVenta: string) {

    let metodos: string = this.formularioProductoVenta.value.metodoBusqueda;
    let intereses: string = this.formularioProductoVenta.value.intereses;
    let interes: number = parseInt(intereses)


    // console.log('Tipo de pedido:', this.tipodePedido);
    // console.log('Tipo de mesa seleccionada:', this.mesaSeleccionado?.tipo);

    if (
      this.tipodePedido?.toLowerCase().trim() === 'local' &&
      this.mesaSeleccionado?.tipo?.toLowerCase().trim() === 'local'
    ) {
      this.bloquearBotonRegistrar = true;
      this.calcularInteresesYRegistrarVenta(idUsuario, totalVenta);
    } else if (
      this.tipodePedido?.toLowerCase().trim() === 'domicilio' &&
      this.mesaSeleccionado?.tipo?.toLowerCase().trim() === 'de paso'
    ) {
      this.bloquearBotonRegistrar = true;
      this.calcularInteresesYRegistrarVenta(idUsuario, totalVenta);
    } else if (
      this.tipodePedido?.toLowerCase().trim() === 'recoger' &&
      this.mesaSeleccionado?.tipo?.toLowerCase().trim() === 'de paso'
    ) {
      this.bloquearBotonRegistrar = true;
      this.calcularInteresesYRegistrarVenta(idUsuario, totalVenta);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error en el tipo de pedido',
        text: `El tipo de pedido "${this.tipodePedido}" no se puede realizar para este tipo de mesa "${this.mesaSeleccionado?.tipo}".`,
      });
      return;
    }


  }


  incrementarCantidad(element: any) {
    const productosMismoID = this.listaProductoParaPedido.filter(
      detalle => detalle.idProducto === element.idProducto
    );

    // Suma total de unidades antes del incremento
    let totalUnidadesAgregadas = productosMismoID.reduce((total, prod) => total + prod.cantidad, 0);

    // El incremento será de 1 unidad
    const incremento = 1;

    if (element.unidadMedidaTexto === 'Unitario') {
      // Validar si el incremento rebasa el stock
      if (totalUnidadesAgregadas + incremento > element.stock) {
        Swal.fire({
          icon: 'error',
          title: 'Stock insuficiente',
          text: `Stock disponible: ${element.stock} unidades. Ya agregaste: ${totalUnidadesAgregadas} unidades.  y quieres agregar ${incremento} unidad mas.`,
        });
        return;
      }
    }

    element.cantidad += incremento;
    this.actualizarTotal();
  }


  decrementarCantidad(element: any) {
    // Verificar que la cantidad no sea menor que 1
    if (element.cantidad > 1) {
      element.cantidad--;
      this.actualizarTotal();
    } else {
      this.mostrarSnackBar('La cantidad mínima es 1');
    }
  }

  mostrarSnackBar(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2000,
    });
  }


  public editarCantidad(detalle: DetallePedido): void {
    Swal.fire({
      title: 'Editar Detalle',
      html: `
  <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px">
    <button id="btnCantidad"
      class="swal2-styled"
      style="background:#2196f3;color:white">Cantidad</button>

    <button id="btnComentario"
      class="swal2-styled"
      style="background:#4caf50;color:white">Comentario</button>

    <button id="btnComentarioGeneral"
      class="swal2-styled"
      style="background:#ff9800;color:white">Comentario General</button>
    <button id="btnMesa"
      class="swal2-styled"
      style="background:#9c27b0;color:white">Cambiar Mesa</button>
  </div>
`,

      showConfirmButton: false,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      denyButtonColor: '#135207',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      didOpen: () => {

        document.getElementById('btnCantidad')?.addEventListener('click', () => {
          Swal.close();
          this.editarCantidadSwal(detalle);
        });

        document.getElementById('btnComentario')?.addEventListener('click', () => {
          Swal.close();

          if (detalle.unidadMedidaTexto === 'Unitario') {
            Swal.fire({
              icon: 'error',
              title: 'Productos Unitarios',
              text: 'Los productos unitarios no se les puede agregar comentarios.'
            });
          } else {
            this.editarComentario(detalle);
          }
        });

        document.getElementById('btnComentarioGeneral')?.addEventListener('click', () => {
          Swal.close();
          this.editarComentarioGeneral();
        });

        document.getElementById('btnMesa')?.addEventListener('click', () => {
          Swal.close();
          this.cambiarMesa(detalle);
        });
      }
    });
  }





  private cambiarMesa(detalle: DetallePedido): void {

    // Crear opciones para el select
    const opcionesMesas: Record<string, string> = {};

    // Mesa actual (para que quede seleccionada)
    if (detalle.idMesa && detalle.nombreMesa) {
      opcionesMesas[detalle.idMesa.toString()] =
        `Mesa actual: ${detalle.nombreMesa}`;
    }

    // Mesas disponibles
    this.listaMesas.forEach(mesa => {
      // Evitar duplicar la mesa actual
      if (mesa.idMesa !== detalle.idMesa) {
        opcionesMesas[mesa.idMesa.toString()] = mesa.nombreMesa;
      }
    });

    Swal.fire({
      title: 'Cambiar Mesa',
      input: 'select',
      inputOptions: opcionesMesas,
      inputValue: detalle.idMesa?.toString(), // queda seleccionada
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#1337E8',
      denyButtonColor: '#135207',
      cancelButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe seleccionar una mesa';
        }
        return null;
      }
    }).then(result => {
      if (result.isConfirmed) {

        const idMesaSeleccionada = Number(result.value);
        const mesaSeleccionada = this.listaMesas.find(
          m => m.idMesa === idMesaSeleccionada
        );

        if (!mesaSeleccionada && idMesaSeleccionada !== detalle.idMesa) {
          Swal.fire('Error', 'Mesa no válida', 'error');
          return;
        }


        this.listaProductoParaPedido = this.listaProductoParaPedido.map(d => ({
          ...d,
          idMesa: idMesaSeleccionada,
          nombreMesa: mesaSeleccionada?.nombreMesa ?? d.nombreMesa
        }));

        this.datosDetallePedido.data = [...this.listaProductoParaPedido];

      }
    });
  }



  public editarComentario(detalle: DetallePedido): void {
    Swal.fire({
      title: 'Editar Comentario',
      input: 'textarea',
      inputLabel: 'Ingrese el nuevo comentario:',
      inputValue: detalle.comentario?.toString() || '',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        cancelButton: 'swal2-cancel',
      },
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'El comentario no puede estar vacío.';
        }
        return undefined;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Comentario Guardado',
          text: `Comentario Guardado`,
        });
        detalle.comentario = result.value.trim(); // Asignar el nuevo comentario
        this.actualizarTotales(); // Actualizar si es necesario
      }
    });
  }

  public editarComentarioGeneral(): void {
    Swal.fire({
      title: 'Editar Comentario General',
      input: 'textarea',
      inputLabel: 'Ingrese el nuevo comentario general:',
      inputValue: this.comentarioGeneralPedido?.toString() || '',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        cancelButton: 'swal2-cancel',
      },
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'El comentario general no puede estar vacío.';
        }
        return undefined;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Comentario General Guardado',
          text: `Comentario General Guardado`,
        });
        this.comentarioGeneralPedido = result.value.trim(); // Asignar el nuevo comentario
        this.actualizarTotales(); // Actualizar si es necesario
      }
    });
  }


  public editarCantidadSwal(detalle: DetallePedido): void {
    Swal.fire({
      title: 'Editar Cantidad',
      text: 'Ingrese la nueva cantidad:',
      input: 'number',
      inputAttributes: {
        min: '1',
      },
      inputValue: detalle.cantidad.toString(),
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        cancelButton: 'swal2-cancel',
      },
      inputValidator: (value) => {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue) || parsedValue < 1) {
          return 'Ingrese un número válido mayor o igual a 1.';
        }
        return undefined;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevaCantidad = parseInt(result.value, 10);

        // Utilizar el precio del producto en la tabla
        // const precioProductoTabla: number = parseFloat(detalle.precio);
        // const descuento: number = parseFloat(this.productoSeleccionado!.descuentos);
        // const precioConDescuento = precioProductoTabla - (precioProductoTabla * (descuento / 100));

        // detalle.cantidad = nuevaCantidad;
        // detalle.totalTexto = (detalle.cantidad * precioConDescuento).toFixed(0);

        const precioProductoTabla: number = parseFloat(detalle.precio!);
        const descuento: number = parseFloat(this.productoSeleccionado!.descuentos);

        detalle.cantidad = nuevaCantidad;
        detalle.totalTexto = (detalle.cantidad * precioProductoTabla).toFixed(0);

        this.actualizarTotales();

      }
    });
  }


  onCategoriaTabChanged(index: number): void {
    this.isInicio = index === 0;
    if (index === 0) {
      // Tab "Inicio" seleccionado → sin filtros
      this.metodo = null;
      // this.nombreFiltro = "";
      // this.precioFiltro = null;
      this.metodoBusqueda = "";
      this.categoriaSeleccionada = 0;

      this.aplicarFiltroCard();
    } else {
      const categoria = this.listaCategoriaFiltro[index - 1]; // Resta 1 porque "Inicio" es el tab 0
      // console.log(categoria);
      this.onCategoriaSelected(categoria);
    }
  }
  onCategoriaSelected(categoria: any) {
    // this.listaCategoriaFiltro.forEach(cat => {
    //   cat.seleccionada = cat.idCategoria === categoria.idCategoria;
    // });

    // this.categoriaSeleccionada = categoria.idCategoria;

    let metodoBusqueda: any = this.metodo;
    if (metodoBusqueda! == "Nombre") {
      // Evento cuando el checkbox es seleccionado

      this.nombreFiltro = "";
      this.metodo = null;
      this.metodoBusqueda = "Categoria"
      this.categoriaSeleccionada = categoria.idCategoria;
    } else if (metodoBusqueda! == "Precio") {
      // Evento cuando el checkbox es seleccionado

      this.precioFiltro = null;
      this.metodo = null;
      this.metodoBusqueda = "Categoria"
      this.categoriaSeleccionada = categoria.idCategoria;
    } else {
      // Evento cuando el checkbox es seleccionado

      this.metodoBusqueda = "Categoria"
      this.categoriaSeleccionada = categoria.idCategoria;

    }

    this.aplicarFiltroCard();
  }



  actualizarTotales(): void {
    // this.totalPagar = this.listaProductoParaVenta.reduce((total, detalle) => total + parseFloat(detalle.totalTexto), 0);
    // this.datosDetalleVenta = new MatTableDataSource(this.listaProductoParaVenta);

    // Recalcular el total a pagar sumando los totales de cada producto
    this.totalPagar = this.listaProductoParaPedido.reduce((total, detalle) => total + parseFloat(detalle.totalTexto), 0);



    // Actualizar la fuente de datos de la tabla
    this.datosDetallePedido = new MatTableDataSource(this.listaProductoParaPedido);

  }

  async calcularInteresesYRegistrarVenta(idUsuario: number, totalVenta: string) {
    const intereses: number = this.formularioProductoVenta.value.intereses;
    const metodo: string = this.formularioProductoVenta.value.metodoBusqueda;
    let suma: string = "0";
    // if (metodo == "Pendiente") {
    //   const deuda: string = String(this.totalPagar.toFixed(0));
    //   suma = deuda;
    //   const sumaInter = parseInt(suma) * (intereses / 100);
    //   suma = (parseInt(suma) + sumaInter).toFixed(0);
    //   this.totalPagar = parseInt(suma);
    // }
    // console.log(this.listaProductoParaPedido);

    const detallesVenta: DetallePedido[] = this.listaProductoParaPedido.map(detalle => ({
      ...detalle,
      totalTexto: String(this.totalPagar.toFixed()),


    }));


    // console.log(detallesVenta);

    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

    const usuario = JSON.parse(datosDesencriptados);
    // console.log(usuario);
    idUsuario = usuario.idUsuario;



    const request: Pedido = {
      idPedido: 0,
      cancelado: false,
      idUsuario: idUsuario,
      nombreUsuario: usuario.nombreCompleto,
      // comentarioGeneral: this.listaProductoParaPedido
      //   .filter(p => p.comentario && p.comentario.trim() !== '')
      //   .map(p => `${p.comentario}`)
      //   .join(' | '),
      comentarioGeneral: this.comentarioGeneralPedido || '', // usar el comentario general editado

      totalTexto: String(this.totalPagar.toFixed()),
      idMesa: this.mesaSeleccionado!.idMesa,
      nombreMesa: this.mesaSeleccionado!.nombreMesa,
      cantidadProductoTexto: String(this.CantidadPagar.toFixed()),
      pagado: false,
      estadoPedido: "Pendiente",
      tipoPedido: this.tipodePedido,
      detallePedidos: detallesVenta,
      domicilio: null
    };
    // console.log(this.listaProductoParaPedido);
     console.log(request);
    this.confirmarGeneracionFactura(request);



  }


  confirmarGeneracionFactura(request: Pedido) {
    // Swal.fire({
    //   title: '¿Desea generar factura?',
    //   text: 'Si generas la factura esta será almacenada en el servidor.',
    //   showCancelButton: true,
    //   confirmButtonColor: '#3085d6',
    //   confirmButtonText: 'Sí',
    //   cancelButtonColor: '#d33',
    //   cancelButtonText: 'No',
    //   allowOutsideClick: false,
    // }).then(async (result) => {
    //   if (result.isConfirmed) {

    //     this.procesarRegistroVenta(request);


    //   } else {

    //     this.confirmarCancelacionFactura(request);

    //   }
    // });
    this.registrarPedido(request);
  }

  private actualizarListaProductosDespuesVenta(): Observable<ReponseApi> {
    return new Observable<ReponseApi>((observer) => {
      this._productoServicio.lista().subscribe({
        next: (data) => {
          if (data.status) {
            const lista = data.value as Producto[];
            this.listaProducto = lista.filter(p => p.esActivo == 1 && p.stock > 0);
          }
          observer.next(data); // Notificar que la operación ha terminado
          observer.complete();
        },
        error: (e) => {
          console.error('Error al actualizar la lista de productos:', e);
          observer.error(e);
          let idUsuario: number = 0;


          // Obtener el idUsuario del localStorage
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          if (datosDesencriptados !== null) {
            const usuario = JSON.parse(datosDesencriptados);
            idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

            this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
              (usuario: any) => {

                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {

                    // Guardar el nuevo token de acceso en el almacenamiento local
                    localStorage.setItem('authToken', response.token);
                    this.actualizarListaProductosDespuesVenta();
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
    });
  }


  async registrarPedido(request: Pedido) {
    const tipoPedido = this.tipodePedido;

    // ==== SI EL PEDIDO ES DOMICILIO, ABRIR EL MODAL MATERIAL =====
    if (tipoPedido === 'Domicilio') {

      const dialogRef = this.dialog.open(ModalDomicilioComponent, {
        width: "auto",
        maxWidth: "600px",
        height: "auto",
        maxHeight: "90vh",
        disableClose: true
      });

      const resultado = await dialogRef.afterClosed().toPromise();

      // si el usuario cancela, no registra el pedido
      this.bloquearBotonRegistrar = false;
      if (!resultado) return;

      // guardamos los datos del modal en el request
      request.domicilio = {
        nombre: resultado.nombre,
        direccion: resultado.direccion,
        telefono: resultado.telefono,
        referencia: resultado.referencia,

      };
    }

    // ==== CONTINÚA EL FLUJO DE REGISTRO ====
    this.bloquearBotonRegistrar = false;
    this.procesarRegistroVenta(request, tipoPedido);
  }


  async procesarRegistroVenta(request: Pedido, tipo: any) {
    // this.bloquearBotonRegistrar = true;
    // Guardar el cliente seleccionado actual antes de la validación
    this.mesaSeleccionadoTemporal = this.mesaSeleccionado;
    // this.interesesSeleccionadoTemporal = this.formularioProductoVenta.value.intereses;
    //funciona
    // this.ListaproductoSeleccionadoTemporal = JSON.parse(JSON.stringify(this.listaProductoParaPedido));
    this.ListaproductoSeleccionadoTemporal = [...this.listaProductoParaPedido];
    // console.log(request);
    this._pedidoServicio.registrar(request, tipo).pipe(

      tap((response: ReponseApi) => {

        if (!this.mesaSeleccionado || !this.mesaSeleccionado.nombreMesa) {
          this.mesaSeleccionado = this.mesaSeleccionadoTemporal;
          this.formularioProductoVenta.value.intereses = this.interesesSeleccionadoTemporal;
          this.listaProductoParaPedido = [...this.ListaproductoSeleccionadoTemporal];
        }


        Swal.fire({
          icon: 'success',
          title: 'Pedido Registrado.',
          text: `Pedido Registrado`,
        });

      })

    ).subscribe({
      next: () => {

        this.reiniciarCampos();
        // this.cargarProductos();
      },
      error: (error) => {
        if (error === 401) {
          let idUsuario: number = 0;
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          if (datosDesencriptados !== null) {
            const usuario = JSON.parse(datosDesencriptados);
            idUsuario = usuario.idUsuario;
            this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
              (usuario: any) => {
                let refreshToken = usuario.refreshToken;
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    localStorage.setItem('authToken', response.token);
                    this.procesarRegistroVenta(request, tipo);
                  },
                  (error: any) => console.error('Error al actualizar el token:', error)
                );
              },
              (error: any) => console.error('Error al obtener el usuario:', error)
            );
          }
        } else {
          this.handleErrorResponse(error);
        }
      },
    });




  }

  handleErrorResponse(error: any) {
    console.error('Error al registrar la venta:', error);

    if (error && error.errors) {
      console.error('Detalles del error en el servidor:', error.errors);

      for (const key of Object.keys(error.errors)) {
        const errorMessage = error.errors[key];
        console.error(`Error en ${key}: ${errorMessage}`);
      }
    } else {
      console.error('Detalles del error desconocido:', error);
    }
  }


  procesarRegistroVenta2(request: Pedido, tipo: any) {
    this.bloquearBotonRegistrar = true;
    // Guardar el cliente seleccionado actual antes de la validación
    this.mesaSeleccionadoTemporal = this.mesaSeleccionado;
    this.interesesSeleccionadoTemporal = this.formularioProductoVenta.value.intereses;
    //funciona
    // this.ListaproductoSeleccionadoTemporal = JSON.parse(JSON.stringify(this.listaProductoParaPedido));
    this.ListaproductoSeleccionadoTemporal = [...this.listaProductoParaPedido];
    // console.log(request);
    this._pedidoServicio.registrar(request, tipo).pipe(

      tap((response: ReponseApi) => {

        if (!this.mesaSeleccionado || !this.mesaSeleccionado.nombreMesa) {
          this.mesaSeleccionado = this.mesaSeleccionadoTemporal;
          this.formularioProductoVenta.value.intereses = this.interesesSeleccionadoTemporal;
          this.listaProductoParaPedido = [...this.ListaproductoSeleccionadoTemporal];
        }


        Swal.fire({
          icon: 'success',
          title: 'Pedido Registrado.',
          text: `Pedido Registrado`,
        });

      })

    ).subscribe({
      next: () => {

        this.reiniciarCampos();
        // this.cargarProductos();
      },
      error: (error) => {
        if (error === 401) {
          let idUsuario: number = 0;
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          if (datosDesencriptados !== null) {
            const usuario = JSON.parse(datosDesencriptados);
            idUsuario = usuario.idUsuario;
            this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
              (usuario: any) => {
                let refreshToken = usuario.refreshToken;
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    localStorage.setItem('authToken', response.token);
                    this.procesarRegistroVenta(request, tipo);
                  },
                  (error: any) => console.error('Error al actualizar el token:', error)
                );
              },
              (error: any) => console.error('Error al obtener el usuario:', error)
            );
          }
        } else {
          this.handleErrorResponse(error);
        }
      },
    });





  }
  confirmarCancelacionFactura(request: Pedido) {
    const tipoPedido = this.tipodePedido;
    Swal.fire({
      title: 'Cancelar generación de factura',
      text: '¿Estás seguro de que no deseas generar la factura?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
    }).then((confirmResult) => {
      if (confirmResult.isConfirmed) {
        Swal.fire('Cancelado', 'No se generará la factura.', 'success');
        this.bloquearBotonRegistrar = false;
      } else {
        this.procesarRegistroVenta2(request, tipoPedido);
      }
    });
  }



  reiniciarCampos(): void {
    // this.totalConDescuento=0;
    this.totalPagar = 0.00;
    this.listaProductoParaPedido = [];

    this.datosDetallePedido = new MatTableDataSource(this.listaProductoParaPedido);
    //  this.mesaSeleccionadoTemporal= null;
    //  this.ListaproductoSeleccionadoTemporal= [];
    //  this.interesesSeleccionadoTemporal=null;
    this.mesaSeleccionado = null;
    this.productoSeleccionado = null;
    this.imagenSeleccionada = null;
    this.comentarioGeneralPedido = "";

    // Asegúrate de que formularioProductoVenta no sea nulo antes de acceder a sus propiedades
    if (this.formularioProductoVenta) {
      const productoControl = this.formularioProductoVenta.get('producto');

      // Asegúrate de que productoControl no sea nulo antes de llamar a setValue
      if (productoControl) {
        productoControl.setValue('');
      }
    }

    if (this.formularioProductoVenta) {
      // Asegúrate de que el control del cliente no sea nulo antes de acceder a setValue
      const clienteControl = this.formularioProductoVenta.get('cliente');

      if (clienteControl) {
        clienteControl.setValue('');
      }
    }
  }



  async generarTicket(pedidoData: any) {




    // Llamada al servicio para obtener la información de la empresa
    this.empresaService.lista().subscribe({
      next: (response) => {
        // Verificar si la respuesta tiene éxito (status = true)
        if (response.status) {

          // Mostrar SweetAlert2 para preguntar por el tamaño del ticket
          Swal.fire({
            title: 'Seleccionar Tamaño del Ticket',
            input: 'radio',
            inputOptions: {
              '58': '58mm',
              '80': '80mm',
            },
            inputValidator: (value) => {
              if (!value) {
                return 'Por favor selecciona un tamaño de ticket';
              }
              return null;
            },
            showCancelButton: true,
            confirmButtonColor: '#1337E8',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: false,
          }).then(async (result) => {

            if (result.isConfirmed) {
              // Capturar el valor seleccionado
              const tamañoTicket = result.value;

              // Configurar el tamaño de página basado en la selección
              const pageSize = tamañoTicket === '58' ? { width: 58, height: 'auto' } : { width: 80, height: 'auto' };

              // console.log('Tamaño del ticket seleccionado:', tamañoTicket);
              // console.log('Configuración del tamaño de página:', pageSize);

              // Ajustar el tamaño del texto del encabezado
              const headerStyle = tamañoTicket === '58'
                ? { fontSize: '1' }  // Tamaño de fuente para 58mm
                : { fontSize: '2' }; // Tamaño de fuente para 80mm

              const mensaje = tamañoTicket === '58' ?
                "***** Ticket de Pedido *****"
                :
                "********** Ticket de Pedido **********"

              const rayas = tamañoTicket === '58' ?
                "---------------------------------------------------------------------------"
                :
                "-----------------------------------------------------------------------------------------------------------"



              const empresas = response.value as Empresa[];
              // if (empresas.length > 0) {

              // Inicializar las variables
              let idUsuario: number = 0;
              let idCaja: number = 0;

              // Obtener el idUsuario del localStorage
              const usuarioString = localStorage.getItem('usuario');
              const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
              const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
              if (datosDesencriptados !== null) {
                const usuario = JSON.parse(datosDesencriptados);
                idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
              }
              if (idUsuario !== 0) {


                let MesaDatosTemporal: any;
                // Verificar si this.mesaSeleccionado es válido antes de continuar
                if (!this.mesaSeleccionado || !this.mesaSeleccionado.nombreMesa) {
                  // throw new Error('No se ha seleccionado un cliente válido.');
                  // this.mesaSeleccionado = this.mesaSeleccionadoTemporal;
                  MesaDatosTemporal = this.mesaSeleccionadoTemporal;
                  this.listaProductoParaPedido = [...this.ListaproductoSeleccionadoTemporal];
                  // console.log(this.listaProductoParaPedido);
                }

                MesaDatosTemporal = this.mesaSeleccionadoTemporal;
                this.listaProductoParaPedido = [...this.ListaproductoSeleccionadoTemporal];

                const nombreMesa = MesaDatosTemporal!.nombreMesa! || 'No disponible';
                const tipo = MesaDatosTemporal!.tipo || 'No disponible';


                const numeroDocumento = pedidoData.value.idPedido != null ? pedidoData.value.idPedido : 'No disponible';
                const usuarioString = localStorage.getItem('usuario');
                const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
                const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
                // Verificar si usuarioString es nulo antes de parsearlo
                const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;
                // Obtener el nombre completo del usuario si existe
                const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';



                // Obtener la fecha y hora actual para mostrarla en el ticket
                const fechaActual = new Date().toLocaleString('es-CO', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                });
                const detallesProductos = this.listaProductoParaPedido.map(detalle => {
                  const descripcionCortada = detalle.descripcionProducto.substring(0, 30); // Obtener los primeros 15 caracteres
                  // const precioSinIva = parseFloat(detalle.precioSinDescuento!) - parseFloat(detalle.precioDelIva!);
                  // Crear la fila inicial del producto
                  const filaProducto: any[] = [
                    ...(tamañoTicket === '80' ? [
                      { text: descripcionCortada, alignment: 'center', style: 'subheader' },

                    ] : [

                      { text: descripcionCortada, alignment: 'center', style: 'peque' },

                    ]),

                  ];
                  // Condicionalmente agregar columnas de IVA y Precio sin IVA si el tamaño del ticket es 80mm
                  if (tamañoTicket === '80') {
                    // Agregar las columnas comunes
                    filaProducto.push(
                      { text: this.formatearNumero(detalle.precioSinDescuento!.toString()), alignment: 'center', style: 'subheader' },
                      { text: this.formatearNumero(detalle.unidadMedidaTexto!.toString()), alignment: 'center', style: 'subheader' },
                      // { text: this.formatearNumero(detalle.precio!.toString()), alignment: 'center', style: 'peque' },
                      { text: detalle.cantidad.toString(), alignment: 'center', style: 'subheader' },
                      { text: this.formatearNumero(detalle.totalTexto), alignment: 'center', style: 'subheader' }
                    );

                  } else {

                    // Agregar las columnas comunes
                    filaProducto.push(
                      { text: this.formatearNumero(detalle.precioSinDescuento!.toString()), alignment: 'center', style: 'peque' },
                      { text: this.formatearNumero(detalle.unidadMedidaTexto!.toString()), alignment: 'center', style: 'peque' },
                      // { text: this.formatearNumero(detalle.precio!.toString()), alignment: 'center', style: 'peque' },
                      { text: detalle.cantidad.toString(), alignment: 'center', style: 'peque' },
                      { text: this.formatearNumero(detalle.totalTexto), alignment: 'center', style: 'peque' }
                    );

                  }

                  return filaProducto;
                });

                // Crear un array para almacenar la información de la tienda
                let informacionTienda: any[] = [

                ];



                const documentDefinition: any = {
                  pageSize,
                  // pageSize: { width: 80, height: 297 }, // Tamaño típico de un ticket
                  pageMargins: [2, 3, 5, 1], // Márgenes [izquierda, arriba, derecha, abajo]
                  content: [
                    ...informacionTienda,


                    // Agregar el nombre de usuario
                    { text: mensaje, style: 'header' },

                    ...(tamañoTicket === '80' ? [
                      { text: `Atendido por: ${nombreUsuario}`, style: 'subheader' },
                      { text: `Fecha de emisión: ${fechaActual}`, style: 'subheader' },
                      { text: `# de pedido: ${numeroDocumento}`, style: 'subheader' },
                      { text: `Nombre de la mesa: ${nombreMesa}`, style: 'subheader' },
                      { text: `Tipo mesa: ${tipo}`, style: 'subheader' },
                      { text: `Tipo de pedido: ${this.tipodePedido}`, style: 'subheader' },

                      { text: '' }, // Espacio en blanco
                      {
                        text: rayas, style: 'peque'
                      },
                    ] : [


                      { text: `Atendido por: ${nombreUsuario}`, style: 'peque' },
                      { text: `Fecha de emisión: ${fechaActual}`, style: 'peque' },
                      { text: `# de pedido: ${numeroDocumento}`, style: 'peque' },
                      { text: `Nombre de la mesa: ${nombreMesa}`, style: 'peque' },
                      { text: `Tipo mesa: ${tipo}`, style: 'peque' },
                      { text: `Tipo de pedido: ${this.tipodePedido}`, style: 'peque' },

                      { text: '' }, // Espacio en blanco
                      {
                        text: rayas, style: 'peque'
                      },


                    ]),

                    // Tabla de detalles de productos vendidos
                    {
                      table: {
                        headerRows: 1,
                        widths: tamañoTicket === '80' ? ['*', 'auto', 'auto', 'auto', 'auto'] : ['*', 'auto', 'auto', 'auto', 'auto'],
                        alignment: 'center',
                        body: [

                          ...(tamañoTicket === '80' ? [

                            [{ text: 'Prod.', style: 'tableHeaderGrande', alignment: 'center' },
                            { text: 'P. Unit.', style: 'tableHeaderGrande', alignment: 'center' },
                            { text: 'Med.', style: 'tableHeaderGrande', alignment: 'center' },
                            { text: 'Cant', style: 'tableHeaderGrande', alignment: 'center' },
                            { text: 'Total', style: 'tableHeaderGrande', alignment: 'center' }],
                          ] : [
                            [{ text: 'Prod.', style: 'tableHeader', alignment: 'center' },
                            { text: 'P. Unit.', style: 'tableHeader', alignment: 'center' },
                            { text: 'Med.', style: 'tableHeader', alignment: 'center' },
                            { text: 'Cant', style: 'tableHeader', alignment: 'center' },
                            { text: 'Total', style: 'tableHeader', alignment: 'center' }],
                          ]),

                          ...detallesProductos
                        ],

                      },
                      layout: {
                        // Reducir el tamaño de fuente y el tamaño de las celdas para acercarlas
                        defaultBorder: false,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        paddingLeft: () => 0, // Reducir el espacio interno a la izquierda de las celdas
                        paddingRight: () => 0.5, // Reducir el espacio interno a la derecha de las celdas
                        paddingTop: () => 0, // Reducir el espacio superior, le quita espacio de uno arriba de otro
                        paddingBottom: () => 0, // Reducir el espacio inferior
                      },
                      margin: [0, 0, 0, 0]
                    },


                    ...(tamañoTicket === '80' ? [
                      {
                        text: rayas,
                        style: 'peque'
                      },
                      {
                        text: `Comentario: ${pedidoData.value.comentarioGeneral ?? "sin coment"}`,
                        alignment: 'right',
                        style: 'subheader'
                      },
                      {
                        text: '-----------------------------------------------',
                        alignment: 'right',
                        style: 'subheader',

                      },
                      {
                        text: '\n', // 3 saltos de línea adicionales (puedes ajustar)
                      },
                    ] : [
                      {
                        text: rayas,
                        style: 'peque'
                      },
                      {
                        text: `Comentario: ${pedidoData.value.comentarioGeneral ?? "sin coment"}`,
                        alignment: 'right',
                        style: 'peque'
                      },
                      {
                        text: '-----------------------------------------------',
                        alignment: 'right',
                        style: 'peque',

                      },
                      {
                        text: '\n', // 3 saltos de línea adicionales (puedes ajustar)
                      },
                    ]),


                  ],
                  styles: {
                    header: {
                      fontSize: 4,
                      bold: true,
                      alignment: 'center',
                      margin: [0, 0, 0, 2] // Margen inferior de 20 unidades
                    },
                    subheader: {
                      fontSize: 3,
                      bold: true,
                      // margin: [0, 0, 0, 1] // Margen inferior de 10 unidades
                    },
                    tableHeader: {
                      bold: true,
                      fontSize: 2, // Reducir el tamaño de fuente a 5
                      color: 'black',
                    },
                    tableHeaderGrande: {
                      bold: true,
                      fontSize: 3, // Reducir el tamaño de fuente a 5
                      color: 'black',
                    },
                    peque: {

                      fontSize: 2,
                      bold: true,
                      // margin: [0, 0, 0, 1]
                    },
                  }
                };
                this.cargarProductos();
                this.reiniciarCampos();
                Swal.fire({
                  icon: 'success',
                  title: 'Pedido Registrado.',
                  text: `Pedido Registrado`,
                });

                pdfMake.vfs = pdfFonts.pdfMake.vfs;
                const pdfDoc = pdfMake.createPdf(documentDefinition);

                pdfDoc.getBase64((data) => {
                  // Abrir el PDF en una nueva ventana del navegador
                  const win = window.open();
                  if (win) {
                    win.document.write('<iframe width="100%" height="100%" src="data:application/pdf;base64,' + data + '"></iframe>');
                  } else {
                    console.error('No se pudo abrir la ventana del navegador.');
                  }
                });




              } else {
                // console.log('No se encontró el idUsuario en el localStorage');
              }


            } else {
              const numeroDocumento = pedidoData.value.numeroDocumento != null ? pedidoData.value.numeroDocumento : 'No disponible';

              // El usuario canceló la operación
              Swal.fire('Cancelado', `Venta Registrada, pero no se generó el ticket. Número de venta: ${numeroDocumento}`, 'info');
              this.bloquearBotonRegistrar = true;
            }
          });




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

              // console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  // console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.generarTicket(pedidoData);
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
