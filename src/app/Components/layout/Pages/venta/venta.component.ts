import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Producto } from '../../../../Interfaces/producto';
import { ProductoService } from '../../../../Services/producto.service';
import { ReponseApi } from '../../../../Interfaces/reponse-api';
import { VerImagenProductoModalComponent } from '../../Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Categoria } from '../../../../Interfaces/categoria';
import { CategoriaService } from '../../../../Services/categoria.service';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalCaracteristicasProductoComponent } from '../../Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';
import Swal from 'sweetalert2';
import { interval, of, Subscription, switchMap } from 'rxjs';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
import { Mesa } from '../../../../Interfaces/mesa';
import { DetalleVenta } from '../../../../Interfaces/detalle-venta';
import { Venta } from '../../../../Interfaces/venta';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VentaService } from '../../../../Services/venta.service';
import { MesaService } from '../../../../Services/mesa.service';
import { CajaService } from '../../../../Services/caja.service';
import { FileFacturaService } from '../../../../Services/file-factura.service';
import moment from 'moment';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { createNumberMask } from 'text-mask-addons';
import JsBarcode from 'jsbarcode';
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Caja } from '../../../../Interfaces/caja';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalMesasComponent } from '../../Modales/modal-mesas/modal-mesas.component';
import * as QRCode from 'qrcode';
import { Pedido } from '../../../../Interfaces/pedido';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PedidoService } from '../../../../Services/pedido.service';
import { PedidosPorMesaResponse } from '../../../../Interfaces/pedidosPorMesaResponse ';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';
import { DomicilioService } from '../../../../Services/domicilio.service';

declare var qz: any;

@Component({
  selector: 'app-venta',
  templateUrl: './venta.component.html',
  styleUrl: './venta.component.css',

})


export class VentaComponent implements OnInit, OnDestroy {



  products: Producto[] = [];
  categorias: Categoria[] = [];

  metodo: string | null = null;
  codigoFiltro: string | null = null;
  productosFiltrados: Producto[] = [];
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  metodoBusqueda: string | null = 'Nombre';
  metodoBusquedaPago: string | null = 'Pagado';
  metodoTipo: string | null = '';
  // formularioProducto: FormGroup;
  pageSize: number = 6;
  page: number = 1;
  totalPages: number = 1;
  searchTerm: string = ''; // Término de búsqueda, si aplica
  totalProductos: number = 0;
  currentPage: number = 1;
  pagesArray: number[] = [];
  precioPorCajaSeleccionado: { [key: number]: boolean } = {};
  ///
  nombreEmpresa: string = '';
  empresa: any;

  carritoProductos: Producto[] = [];
  selectedColor: string = '';
  listaCategoriaFiltro: Categoria[] = [];
  listaCategoria: Categoria[] = [];
  categoriaControl = new FormControl('');
  private mercadopago: any;
  mesaFiltrado: string = '';

  //Venta

  claveSecreta: string | null = null;
  error: string | null = null;

  listaProducto: Producto[] = [];
  listaProductoFiltro: Producto[] = [];
  listaProductoParaVenta: DetalleVenta[] = [];
  listaProductoFiltroCodigo: Producto[] = [];
  listamesaParaVenta: Venta[] = [];
  venta: any;

  bloquearBotonRegistrar: boolean = false;
  productoSeleccionado!: Producto | null;
  mesaSeleccionado!: Mesa | null;
  mesaSeleccionadoTemporal: any;

  productoSeleccionadoTemporal: any;
  ListaproductoSeleccionadoTemporal: any[] = [];
  mesaSeleccionado2: Mesa | null = null;
  tipodePagoPorDefecto: string = "Efectivo";
  tipodePago: string = "Nequi";
  tipodePagoSegundo: string = "Nequi/Daviplata";
  metododePagoPorDefecto: string = "Pagado";
  unidaddePagoPorDefecto: string = "Unitario";
  tipodeFacturaPorDefecto: string = "Ticket";

  totalPagar: number = 0;
  GanaciaPagar: number = 0;
  CantidadPagar: number = 0;
  total: string = "";
  formularioProductoVenta: FormGroup;
  // columnasTabla: string[] = ['imagen', 'producto', 'cliente', 'cantidad', 'unidadMedida',
  //   'precio', 'total', 'valorPagado', 'accion',];
  columnasTabla: string[] = ['idPedido', 'nombreUsuario', 'fecha', 'tipo', 'cantidadProducto',
    'total', 'estado', 'pagado', 'cancelado', 'verDetalle'];


  totalItems = 0;
  paginaActual = 1;
  tamanioPagina = 15;
  // idMesaSeleccionada = 1;
  dataSource = new MatTableDataSource<Pedido>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  // formularioCliente: FormGroup;
  listaMesas: Mesa[] = [];
  listaMesaFiltrada: Mesa[] = [];

  form: FormGroup = new FormGroup({});

  numeroFormateado: string = '';
  tipoBusqueda: string | null = '';

  hayCajaAbierta: boolean = false;
  // Variable para almacenar el precio del producto
  precioProducto: string = '';
  // Declaración de la variable para almacenar el tipo de pago seleccionado
  public tipoPagoSeleccionado: string = this.tipodePagoPorDefecto;

  totalConDescuento: number = this.totalPagar;
  Vueltos: number = 0;
  PrecioEfectivo: number | null = null;
  PrecioTransferencia: number | null = null;
  PrecioTransferenciaSegundo: number | null = null;
  pedidosDeMesa: Pedido[] = [];
  pedidoSeleccionado: any = null;


  private subscriptions: Subscription[] = [];

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
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService,
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private cajaService: CajaService,
    private snackBar: MatSnackBar,
    private pdfService: FileFacturaService,
    private signalRService: SignalRService,
    private router: Router,
    private domicilioService: DomicilioService,

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
    //     this.actualizarListaMesa();
    //   });


    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      mesa: ['', [Validators.maxLength(35)]],
      mesaId: [''],
      precioPagadoTexto: ['0', Validators.required],
      tipoBusqueda: ['',],
      metodoBusqueda: ['Pagado'],

    });


    this.formularioProductoVenta.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesaFiltrada = this.filtrarMesa(value);
    });





  }

  ngOnDestroy(): void {
    console.log('[PedidoComponent] Destruyendo...');

    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    // this.signalRService.stopConnection(); // si aplica
  }
  private listeners: (() => void)[] = [];

  ngOnInit(): void {

    const sub = this.signalRService.eventosGlobales$.subscribe(evento => {

      const ruta = this.router.url;

      // Solo escuchar eventos si estamos en /pages/venta
      if (ruta !== '/pages/venta') return;

      switch (evento.tipo) {

        // ====== VENTAS ======
        case "venta_anulada":
        case "venta_registrada":
          this.cargarPedidosDeMesa();
          break;

        // ====== PEDIDOS ======
        case "pedido_anulado":
        case "pedido_actualizado":
          this.cargarPedidosDeMesa();
          break;





      }

    });

    this.subscriptions.push(sub);

    // ============================================
    //  RESTO DE TU INICIALIZACIÓN
    // ============================================

    this.actualizarListaMesa();
    this.obtenerCajasAbiertas();

    this.formularioProductoVenta.get('precioPagadoTexto')!
      .valueChanges
      .subscribe(value => this.aplicarVueltos(value));

  }


  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;

  }


  onPageChange(event: PageEvent) {
    this.paginaActual = event.pageIndex + 1; // Angular empieza desde 0
    this.tamanioPagina = event.pageSize;

    console.log("Página actual:", this.paginaActual);
    console.log("Tamaño página:", this.tamanioPagina);

    this.cargarPedidosDeMesa();
  }



  // cargarPedidosDeMesa() {
  //   if (!this.mesaSeleccionado) return;

  //   this.pedidoService.obtenerPedidosPorMesa(
  //     this.mesaSeleccionado.idMesa,
  //     this.paginaActual,
  //     this.tamanioPagina
  //   ).subscribe({
  //     next: (respuesta: any) => {

  //       if (respuesta?.status && respuesta?.value) {

  //         // Lista original de pedidos
  //         const pedidos = Array.isArray(respuesta.value.pedidos)
  //           ? respuesta.value.pedidos
  //           : [];

  //         // Ordenar por nombre de mesa
  //         const pedidosOrdenados = [...pedidos].sort((a: Pedido, b: Pedido) =>
  //           (a.nombreMesa ?? '').localeCompare(b.nombreMesa ?? '')
  //         );

  //         // Asignaciones principales
  //         this.pedidosDeMesa = pedidosOrdenados;

  //         // Asignar total REAL que viene del backend (necesario para paginación)
  //         this.totalItems =
  //           typeof respuesta.value.total === 'number'
  //             ? respuesta.value.total
  //             : pedidosOrdenados.length;

  //         // Actualizar tabla
  //         this.dataSource.data = this.pedidosDeMesa;

  //         console.log('Pedidos recibidos:', pedidosOrdenados);
  //         console.log('Total items:', this.totalItems);

  //         // --------------------------------------------------
  //         // 🔎 LÓGICA DE FILTRADO DEL INPUT "mesa"
  //         // --------------------------------------------------
  //         const textoActualRaw = this.formularioProductoVenta.get('mesa')?.value;
  //         const textoActual =
  //           typeof textoActualRaw === 'string'
  //             ? textoActualRaw.trim()
  //             : textoActualRaw;

  //         if (textoActual && textoActual !== '') {
  //           this.filtrarEntradaMesaManual(textoActual); // Filtrado manual si el usuario está escribiendo
  //         } else {
  //           this.listaMesaFiltrada = Array.isArray(this.listaMesas)
  //             ? [...this.listaMesas]
  //             : [];
  //         }

  //         // Refrescar UI si es necesario
  //         this.listaMesaFiltrada = [...this.listaMesaFiltrada];
  //       }

  //       // Si la respuesta NO es válida
  //       else {
  //         this.pedidosDeMesa = [];
  //         this.totalItems = 0;
  //         this.dataSource.data = [];
  //         this.listaMesaFiltrada = Array.isArray(this.listaMesas)
  //           ? [...this.listaMesas]
  //           : [];
  //       }
  //     },

  //     error: (err) => {
  //       console.error('Error al cargar pedidos por mesa:', err);
  //       this.pedidosDeMesa = [];
  //       this.totalItems = 0;
  //       this.dataSource.data = [];
  //     }
  //   });
  // }


  cargarPedidosDeMesa() {
    if (!this.mesaSeleccionado) return;

    this.pedidoService.obtenerPedidosPorMesa(
      this.mesaSeleccionado.idMesa,
      this.paginaActual,
      this.tamanioPagina
    ).subscribe((respuesta: any) => {
      console.log(respuesta);
      if (respuesta.status && respuesta.value) {

        this.dataSource = respuesta.value.pedidos;
        this.totalItems = respuesta.value.total;

        // console.log("Total Items:", this.totalItems);
        // console.log("Página Actual:", this.paginaActual);
      }
    });
  }



  filtrarEntradaMesaManual(texto: string) {
    const filtro = texto.toLowerCase();

    this.listaMesaFiltrada = this.listaMesas.filter(m =>
      m.nombreMesa.toLowerCase().includes(filtro)
    );
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
      precioPagadoTexto: ['0', Validators.required],
      tipoBusqueda: ['',],
      metodoBusqueda: [''],

    });



    this.formularioProductoVenta.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesaFiltrada = this.filtrarMesa(value);
    });



    // this.actualizarListaProductos();
    this.actualizarListaMesa();

  }


  private actualizarListaMesa() {
    this.mesaService.lista().subscribe({
      next: (data) => {
        // console.log(data)
        if (data.status) {
          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Mesa, b: Mesa) => a.nombreMesa.localeCompare(b.nombreMesa));
          const lista = data.value as Mesa[];
          this.listaMesas = lista
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

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.actualizarListaMesa();
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

  aplicarVueltos(vueltos: string) {
    // console.log(vueltos);

    if (vueltos == "0") {

      this.Vueltos = 0;

    } else {

      // Eliminar los puntos de separación de miles
      const limpio = vueltos.replace(/\./g, '');

      // Convertir el string limpio a número
      const vuelto: number = parseInt(limpio, 10) || 0;
      console.log(vuelto);

      // Calcular el vuelto
      this.Vueltos = vuelto - this.totalConDescuento;

    }


  }



  filtrarMesa(nombre: any): Mesa[] {

    const valorBuscado = typeof nombre === "string" ? nombre.toLocaleLowerCase() : nombre.nombreMesa.toLocaleLowerCase();
    const mesaFiltrados = this.listaMesas.filter(item => item.nombreMesa.toLocaleLowerCase().includes(valorBuscado));
    // console.log('Mesa filtrados:', mesaFiltrados);
    return mesaFiltrados;
  }


  obtenerCajasAbiertas() {
    this.cajaService.listaSoloHoy().subscribe({
      next: (data) => {
        if (data && Array.isArray(data.value) && data.value.length > 0) {

          // Buscar caja abierta
          const cajaAbierta = data.value.find((caja: any) => caja.estado === 'Abierto');

          if (cajaAbierta) {
            const fechaApertura = moment(cajaAbierta.fechaApertura);
            const ahora = moment();

            // 📌 Permitir caja hasta las 2:00 AM del día siguiente
            const limite = fechaApertura.clone().endOf("day").add(2, "hours");

            // ✔ Si se abrió hoy → válido
            // ✔ Si se abrió ayer y estamos antes de las 2 AM → válido
            if (ahora.isSame(fechaApertura, "day") || ahora.isBefore(limite)) {
              this.hayCajaAbierta = true;
              this.bloquearBotonRegistrar = true;
            } else {
              Swal.fire({
                icon: 'error',
                title: '¡ ERROR !',
                text: 'Primero debe cerrar la caja antes de iniciar una nueva venta.'
              });
              this.bloquearBotonRegistrar = false;
              this.hayCajaAbierta = false;
            }

          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Atención',
              text: 'No hay cajas abiertas'
            });
            this.hayCajaAbierta = false;
            this.bloquearBotonRegistrar = false;
          }

        } else {
          this.hayCajaAbierta = false;
          this.bloquearBotonRegistrar = false;
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
          idUsuario = usuario.idUsuario;

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              let refreshToken = usuario.refreshToken;

              // Renovar token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
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

  onChangeTipoBusqueda19(event: any) {
    this.metodoTipo = event.value; // Actualiza el valor de tipoBusqueda

    if (this.metodoTipo === 'Efectivo') {
      this.formularioProductoVenta.get('precioPagadoTexto')?.enable();
      this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0'); // Establece el valor de intereses a vacío
      // this.actualizarTotal();

    } else {

      // Si no es 'Efectivo', establece 'precioPagadoTexto' a cero en todos los productos de la lista
      this.listaProductoParaVenta.forEach(producto => {
        producto.precioPagadoTexto = '0'; // Establece el precioPagadoTexto a cero para cada producto
      });


      this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
      this.Vueltos = 0;
      this.formularioProductoVenta.get('precioPagadoTexto')?.disable();
    }
  }

  onChangeTipoBusqueda17(event: any) {
    this.metodoBusquedaPago = event.value; // Actualiza el valor de tipoBusqueda

    if (this.metodoBusquedaPago === 'Pagado') {

    } else {

      // Si no es 'Efectivo', establece 'precioPagadoTexto' a cero en todos los productos de la lista
      this.listaProductoParaVenta.forEach(producto => {
        producto.precioPagadoTexto = '0'; // Establece el precioPagadoTexto a cero para cada producto
      });


      this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
      this.Vueltos = 0;
    }
  }


  mostrarMesas(cliente: Mesa): string {

    return cliente.nombreMesa;

  }
  mostrarListaMesa(): void {
    this.listaMesaFiltrada = this.listaMesas;
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

  formatearNumero3(numero: number | string): string {

    let valorNumerico: number;

    if (typeof numero === 'string') {
      valorNumerico = parseFloat(numero.replace(',', '.'));
    } else {
      valorNumerico = numero;
    }

    if (!isNaN(valorNumerico)) {
      return valorNumerico.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } else {
      return numero.toString();
    }
  }

  mesaParaVenta(event: MatAutocompleteSelectedEvent) {
    this.mesaSeleccionado = event.option.value;
    this.paginaActual = 1;

    this.cargarPedidosDeMesa();
  }





  seleccionarPedidoUnico(pedido: any): void {
    // Si ya está seleccionado, desmarcarlo
    if (this.pedidoSeleccionado?.idPedido === pedido.idPedido) {
      this.pedidoSeleccionado = null;
    } else {
      this.pedidoSeleccionado = pedido;
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

    // Almacena el valor filtrado en la variable mesaFiltrado
    this.mesaFiltrado = inputCliente;

    // Establece el valor en el control del formulario
    this.formularioProductoVenta.get('mesa')?.setValue(this.mesaFiltrado);
  }



  nuevaMesa(event: MouseEvent): void {
    event.stopPropagation();
    this.dialog.open(ModalMesasComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {
      this.actualizarListaMesa();
    });
  }

  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
  }


  formatearNumero2(numero: number): string {
    return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }


  calcularTotalCaja(element: any): string {
    const precio = parseFloat(element.precioUnitarioTexto || '0');
    const cantidad = parseFloat(element.cantidad || '0');


    // console.log(saldoInicial);
    const total = precio * cantidad;

    // console.log(suma);
    return this.formatearNumero2(total);
  }

  verDetallePedido(pedido: any): void {

    const productos = pedido.detallePedidos.map((d: any, i: number) => `
    <tr>
      <td style="padding:4px; border: 1px solid #ccc;">${i + 1}</td>

      <td style="padding:4px; border: 1px solid #ccc;">
        <input type="checkbox" class="check-producto" data-index="${i}">
      </td>

      <td style="padding:4px; border: 1px solid #ccc;">
        ${d.descripcionProducto}
      </td>

      <td style="padding:4px; border: 1px solid #ccc;">
        ${d.cantidad}
      </td>

      <td style="padding:4px; border: 1px solid #ccc;">
        <input 
          type="number" 
          class="input-cantidad" 
          data-index="${i}" 
          min="1" 
          max="${d.cantidad}" 
          value="${d.cantidad}" 
          style="width:60px;">
      </td>

      <td style="padding:4px; border: 1px solid #ccc;">
        ${this.formatearNumero(d.precioUnitarioTexto)}
      </td>

      <td style="padding:4px; border: 1px solid #ccc;" id="subtotal-${i}">
        ${this.calcularTotalCaja(d)}
      </td>
    </tr>
  `).join('');

    const htmlDetalle = `
    <strong>Mesa:</strong> ${pedido.nombreMesa}<br/>
    <strong>Tipo de Mesa:</strong> ${pedido.detallePedidos[0].tipoMesa}<br/>
    <strong>Atendido por:</strong> ${pedido.nombreUsuario}<br/>
    <strong>Tipo de Pedido:</strong> ${pedido.tipoPedido}<br/>
    <strong>Comentario:</strong> ${pedido.comentarioGeneral}<br/>

    <br/>
    <strong>Total Seleccionado: </strong> 
    <span id="totalSeleccionado">0</span>

    <br/><br/>

    <table style="width:100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr>
          <th>#</th>
          <th>✔</th>
          <th>Producto</th>
          <th>Cant.</th>
          <th>Usar</th>
          <th>Precio</th>
          <th>Sub Total</th>
        </tr>
      </thead>
      <tbody>${productos}</tbody>
    </table>
  `;

    Swal.fire({
      title: `Detalle del Pedido #${pedido.idPedido}`,
      html: htmlDetalle,
      width: '700px',
      confirmButtonText: 'Cerrar',
      didOpen: () => {

        const checkboxes = document.querySelectorAll('.check-producto');
        const inputs = document.querySelectorAll('.input-cantidad');

        const calcularTotal = () => {
          let total = 0;

          checkboxes.forEach((check: any, i: number) => {
            const input: any = inputs[i];
            const detalle = pedido.detallePedidos[i];

            let cantidad = parseInt(input.value) || 0;
            const max = detalle.cantidad;

            // 🔥 VALIDAR QUE NO SUPERE
            if (cantidad > max) {
              cantidad = max;
              input.value = max;
            }

            const precio = parseFloat(detalle.precioUnitarioTexto);
            const subtotal = cantidad * precio;

            // actualizar subtotal visual
            const subTd = document.getElementById(`subtotal-${i}`);
            if (subTd) subTd.innerText = this.formatearNumero3(subtotal);

            // sumar solo si está seleccionado
            if (check.checked) {
              total += subtotal;
            }
          });

          const totalSpan = document.getElementById('totalSeleccionado');
          if (totalSpan) totalSpan.innerText = this.formatearNumero3(total);
        };

        // eventos
        checkboxes.forEach((c: any) => c.addEventListener('change', calcularTotal));
        inputs.forEach((i: any) => i.addEventListener('input', calcularTotal));
      }
    });
  }


  verDomicilio(pedido: any) {

    // console.log(pedido);
    this.domicilioService.obtenerPorIdPedido(pedido.idPedido).subscribe({
      next: (response) => {
        // console.log(response.value);
        if (response.status == true) {
          // console.log(response.value);

          Swal.fire({
            title: 'Datos de domicilio',
            html: `
      <div style="text-align:left; font-size:16px;">
        <p><strong>Nombre:</strong> ${response.value.nombre}</p>
        <p><strong>Dirección:</strong> ${response.value.direccion}</p>
        <p><strong>Teléfono:</strong> ${response.value.telefono}</p>
        <p><strong>Referencia:</strong> ${response.value.referencia || 'Ninguna'}</p>
      </div>
    `,
            confirmButtonText: 'Cerrar',
            width: '400px'
          });

        } else {

        }
      },
      error: (error) => this.handleTokenError(() => this.verDomicilio(pedido))

    });




  }

  handleTokenError(retryCallback: () => void): void {

    this.totalPages = 0;

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

  getMediosCombinadoDos() {
    const tipo = this.tipodePagoSegundo;

    if (!tipo) return { medio1: "Medio #1", medio2: "Medio #2" };

    const partes = tipo.split("/");
    return {
      medio1: partes[0] ?? "Medio #1",
      medio2: partes[1] ?? "Medio #2",
    };
  }

  async confirmarPagoYContinuar(pedido: Pedido) {

    const recibidoTexto = this.formularioProductoVenta.get('precioPagadoTexto')?.value;

    // Si no han digitado nada en recibido → NO mostrar Swal
    if (!recibidoTexto || recibidoTexto.trim() === "") {
      this.pagarPedido(pedido);
      return;
    }

    const recibido = Number(recibidoTexto.replace(/\./g, ""));
    const total = parseFloat(pedido.totalTexto);

    if (recibido == 0) {

    } else {
      if (recibido < total) {
        Swal.fire({
          icon: 'error',
          title: 'Pago insuficiente',
          text: 'El valor recibido es menor al total de la venta.'
        });
        return;
      }
    }

    let vueltos;
    if (recibido == 0) {
      vueltos = recibido;
    } else {
      vueltos = recibido - total;
    }

    if (this.tipodePagoPorDefecto == "Efectivo") {
      if (pedido.estadoPedido == "Pendiente") {
        const resultado = await Swal.fire({
          title: 'Productos Heladeria por pagar',
          html: `
         <h3>Recibido: <strong>${this.formatearNumero(recibido.toString())}</strong></h3>
         <h3>Total: <strong>${this.formatearNumero(total.toString())}</strong></h3>
         <h2 style="margin-top:10px;">VUELTOS: <strong>${this.formatearNumero(vueltos.toString())}</strong></h2>
         <p>¿Deseas continuar con la venta?</p>
         `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#1337E8',
          cancelButtonColor: '#d33',
        });

        if (resultado.isConfirmed) {
          this.pagarPedido(pedido);
        }
      } else {

        const totalHeladeria = this.calcularTotalHeladeriaPedido(pedido);

        const resultado = await Swal.fire({
          title: 'Confirmar pago',
          html: `
         <h3>Total Heladería: 
         <strong>${this.formatearNumero(totalHeladeria.toString())}</strong>
         </h3>
         <h3>Total Pedido: 
         <strong>${this.formatearNumero(total.toString())}</strong>
         </h3>
         <h2 style="margin-top:10px;">
         VUELTOS: <strong>${this.formatearNumero(vueltos.toString())}</strong>
         </h2>
         <p>¿Deseas continuar con la venta?</p>
         `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#1337E8',
          cancelButtonColor: '#d33',
        });

        if (resultado.isConfirmed) {
          this.pagarPedido(pedido);
        }
      }

    } else {
      this.pagarPedido(pedido);
    }

  }


  calcularTotalHeladeriaPedido(pedido: Pedido): number {

    console.log("🧾 Pedido completo:", pedido);

    const detalles = pedido.detallePedidos || [];

    const itemsHeladeria = detalles.filter((item: any) => {

      const unidad = item.unidadMedidaTexto?.toLowerCase().trim();

      const esHeladeria = unidad === 'heladeria';

      console.log("🔍 Item:", item.descripcionProducto);
      console.log("👉 unidadMedidaTexto:", unidad);
      console.log("✅ ¿Es heladería?:", esHeladeria);

      return esHeladeria;
    });

    console.log("🍦 Items de heladería:", itemsHeladeria);

    const totalHeladeria = itemsHeladeria.reduce((total: number, item: any) => {

      const valor = Number(
        item.precioUnitarioTexto.replace(/\./g, '').replace(',', '.')
      ) || 0;

      console.log("💰 Sumando:", item.descripcionProducto);
      console.log("➡️ Valor convertido:", valor);

      return total + valor;

    }, 0);

    console.log("🔥 TOTAL HELADERÍA FINAL:", totalHeladeria);

    return totalHeladeria;
  }

  pagarPedido(pedido: Pedido) {


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
      this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
        next: (caja: Caja | null) => {
          if (caja !== null) {
            // Si se encuentra una caja abierta para el idUsuario
            idCaja = caja.idCaja;
            let cajaActualizada: Caja = {
              idCaja: idCaja,
              transaccionesTexto: pedido.totalTexto,
              ingresosTexto: pedido.totalTexto,
              metodoPago: this.tipodePagoPorDefecto,
              estado: '',
              nombreUsuario: '',
              idUsuario: idUsuario
            };

            // console.log(cajaActualizada);
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
          // Manejo de error y renovación de token si es necesario
          if (error === "Error al realizar la solicitud. Por favor, inténtalo de nuevo más tarde.") {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró una caja abierta para el usuario actual',
              confirmButtonText: 'Aceptar'
            });
            return
            // this.renovarTokenYSolicitarVenta();

          } else {
            this.renovarTokenYSolicitarVenta(pedido);
          }
        },
        complete: async () => {

          let TipoPago: any
          // const metodo: string = this.formularioProductoVenta.value.metodoBusqueda;

          let metodo: string;
          if (pedido.estadoPedido == "Pendiente") {
            metodo = 'Pagado'
          } else {
            metodo = pedido.estadoPedido
          }


          const PrecioPagado: string = this.formularioProductoVenta.value.precioPagadoTexto ?? "0";
          // console.log(PrecioPagado);
          if (this.tipodePagoPorDefecto == 'Transferencia' || this.tipodePagoPorDefecto == 'Combinado' || this.tipodePagoPorDefecto == 'CombinadoDos') {
            if (PrecioPagado != "0") {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Precio pagado no puede tener ningun valor porque es por ${this.tipodePagoPorDefecto}`,

                confirmButtonText: 'Aceptar'
              });
              return
            }

            if (this.tipodePagoPorDefecto == 'Combinado') {
              TipoPago = this.tipodePago;
            } else if (this.tipodePagoPorDefecto == 'CombinadoDos') {
              TipoPago = this.tipodePagoSegundo;
            } else {
              TipoPago = this.tipodePago;
            }


          } else {

            TipoPago = "Sin ningún tipo de pago";
          }

          // console.log(this.tipodePagoPorDefecto);
          if (this.tipodePagoPorDefecto === 'Combinado') {

            const totalVenta = parseFloat(pedido.totalTexto);

            const { value: formValues } = await Swal.fire({
              width: '650px',
              title: `Pago combinado<br><small>Total: $${totalVenta.toLocaleString()}</small>`,

              html: `
      <style>
        .fila { display: flex; gap: 5px; margin-bottom: 5px; align-items:center; }
        .btnAdd { background:#1337E8;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer; }
        .btnDel { background:#d33;color:#fff;border:none;padding:3px 6px;border-radius:4px;cursor:pointer; }
      </style>

      <div style="text-align:left;">

        <h4>💵 Efectivo & 🏦 Transferencia</h4>

        <div id="contenedorPagos"></div>

        <button id="btnAgregar" type="button" class="btnAdd">+ Agregar pago</button>

        <hr>
        <div id="totalParcial" style="font-size:18px;font-weight:bold;margin-top:10px;">
          Total ingresado: $0
        </div>

      </div>
    `,

              focusConfirm: false,
              showCancelButton: true,
              confirmButtonColor: '#1337E8',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Aceptar',
              cancelButtonText: 'Cancelar',

              didOpen: () => {
                const contenedor = document.getElementById("contenedorPagos")!;
                const btnAgregar = document.getElementById("btnAgregar")!;
                const totalParcial = document.getElementById("totalParcial")!;

                function actualizarTotal() {
                  const valores = Array.from(document.querySelectorAll('.valorPago')) as HTMLInputElement[];

                  let total = 0;
                  valores.forEach(v => total += parseFloat(v.value) || 0);

                  totalParcial.innerHTML = `Total ingresado: $${total.toLocaleString()}`;
                  totalParcial.style.color = (total === totalVenta ? "green" : "red");
                }

                function agregarFila() {
                  const fila = document.createElement("div");
                  fila.className = "fila";

                  fila.innerHTML = `
          <select class="swal2-input tipoPago">
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
          </select>

          <input type="number" class="swal2-input valorPago" placeholder="Valor">

          <button class="btnDel">X</button>
        `;

                  fila.querySelector(".btnDel")!.addEventListener("click", () => {
                    fila.remove();
                    actualizarTotal();
                  });

                  fila.querySelector(".valorPago")!.addEventListener("input", actualizarTotal);
                  fila.querySelector(".tipoPago")!.addEventListener("change", actualizarTotal);

                  contenedor.appendChild(fila);
                }

                agregarFila();

                btnAgregar.addEventListener("click", () => agregarFila());
              },

              preConfirm: () => {
                const tipos = Array.from(document.querySelectorAll('.tipoPago')) as HTMLSelectElement[];
                const valores = Array.from(document.querySelectorAll('.valorPago')) as HTMLInputElement[];

                const efectivo: number[] = [];
                const transferencia: number[] = [];

                valores.forEach((input, i) => {
                  const tipo = tipos[i].value;
                  const valor = parseFloat(input.value) || 0;

                  if (tipo === "Efectivo") efectivo.push(valor);
                  else transferencia.push(valor);
                });

                const totalEfectivo = efectivo.reduce((a: number, b: number) => a + b, 0);
                const totalTransferencia = transferencia.reduce((a: number, b: number) => a + b, 0);
                const totalIngresado = totalEfectivo + totalTransferencia;

                if (totalEfectivo === 0 || totalTransferencia === 0) {
                  Swal.showValidationMessage(
                    `Debe ingresar al menos un pago en EFECTIVO y otro en TRANSFERENCIA.`
                  );
                  return;
                }

                if (totalIngresado !== totalVenta) {
                  Swal.showValidationMessage(
                    `El total ingresado ($${totalIngresado.toLocaleString()}) debe ser EXACTAMENTE igual al total de la venta ($${totalVenta.toLocaleString()})`
                  );
                  return;
                }

                return { efectivo, transferencia };
              }
            });

            if (formValues) {

              const totalEfectivo = formValues.efectivo.reduce((a: number, b: number) => a + b, 0);
              const totalTransferencia = formValues.transferencia.reduce((a: number, b: number) => a + b, 0);

              this.PrecioEfectivo = totalEfectivo;
              this.PrecioTransferencia = totalTransferencia;

              const venta: Venta = {
                // idVenta: 0,
                idCaja: idCaja,
                idPedido: pedido.idPedido,
                totalTexto: pedido.totalTexto,
                fechaRegistro: new Date().toLocaleString(),
                anulada: false,
                tipoPago: this.tipodePagoPorDefecto,
                tipoTranferencia: TipoPago,
                estadoVenta: metodo,
                cantidadProductoTexto: pedido.cantidadProductoTexto,
                gananciaTexto: '0',
                precioEfectivoTexto: (this.PrecioEfectivo!).toString(),
                precioTransferenciaTexto: (this.PrecioTransferencia!).toString(),
                precioTransferenciaSegundoTexto: "0",
                detalleVenta: pedido.detallePedidos.map(detalle => ({
                  idProducto: detalle.idProducto,
                  nombre: detalle.descripcionProducto ?? '',
                  idCategoria: detalle.idCategoria ?? 0,
                  descripcionCategoria: detalle.descripcionCategoria ?? '',
                  stock: detalle.stock ?? 0,
                  descripcionProducto: detalle.descripcionProducto,
                  cantidad: detalle.cantidad,
                  precioTexto: detalle.precioUnitarioTexto,
                  totalTexto: detalle.totalTexto,
                  unidadMedidaTexto: detalle.unidadMedidaTexto,
                  descripcionCaracteristica: detalle.caracteristicas! ?? "",
                  descuentosTexto: '0',
                  ivaTexto: '19',
                  precioPagadoTexto: PrecioPagado,
                  precioUnitarioTexto: detalle.precioUnitarioTexto ?? '',
                  gananciaTexto: '',
                  precio: detalle.precio ?? '',
                  esActivo: detalle.esActivo ? 1 : 0,
                  imageData: [],
                  caracteristicas: detalle.caracteristicas ?? "",
                  idDetalleVenta: 0,
                  idVenta: 0,
                  idDetallePedido: 0,
                  comentario: detalle.comentario ?? '',
                  unidadMedida: detalle.unidadMedida ?? '',
                  descuentos: '0',
                  codigo: '',
                  iva: '0',
                  imagenUrl: [],
                  nombreImagen: [],

                  imagenes: [
                    {
                      nombreImagen: "",
                      imageData: "",
                      imagenUrl: null
                    }
                  ]

                }))
              };




              console.log(venta);
              this.confirmarGeneracionFactura(venta, idCaja);
            } else {
              this.bloquearBotonRegistrar = true;
              console.log('El usuario canceló el pago combinado');
            }
          }
          else if (this.tipodePagoPorDefecto === 'CombinadoDos') {

            const totalVenta = parseFloat(pedido.totalTexto);
            const medios = this.getMediosCombinadoDos();

            const { value: formValues } = await Swal.fire({
              width: '600px',
              title: `Pago combinado<br><small>Total: $${totalVenta.toLocaleString()}</small>`,
              html: `
      <style>
        .fila { display: flex; gap: 5px; margin-bottom: 5px; align-items:center; }
        .btnAdd { background:#1337E8;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer; }
        .btnDel { background:#d33;color:#fff;border:none;padding:3px 6px;border-radius:4px;cursor:pointer; }
      </style>

      <div style="text-align:left;">
        
        <h4>${medios.medio1} & ${medios.medio2}</h4>
        <div id="contenedorPagos"></div>

        <button id="btnAgregar" type="button" class="btnAdd">+ Agregar pago</button>

        <hr>
        <div id="totalParcial" style="font-size:18px;font-weight:bold;margin-top:10px;">
          Total ingresado: $0
        </div>
      </div>
    `,
              focusConfirm: false,
              showCancelButton: true,
              confirmButtonColor: '#1337E8',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Aceptar',
              cancelButtonText: 'Cancelar',

              didOpen: () => {
                const contenedor = document.getElementById("contenedorPagos")!;
                const btnAgregar = document.getElementById("btnAgregar")!;
                const totalParcial = document.getElementById("totalParcial")!;

                /** 🔥 FUNCIÓN PARA CALCULAR TOTAL EN VIVO */
                function actualizarTotal() {
                  const valores = Array.from(document.querySelectorAll('.valorPago')) as HTMLInputElement[];
                  let total = 0;

                  valores.forEach(v => {
                    total += parseFloat(v.value) || 0;
                  });

                  totalParcial.innerHTML = `Total ingresado: $${total.toLocaleString()}`;

                  if (total === totalVenta) {
                    totalParcial.style.color = "green";
                  } else {
                    totalParcial.style.color = "red";
                  }
                }

                /** 🔥 FUNCION PARA CREAR UNA NUEVA FILA */
                function agregarFila() {
                  const fila = document.createElement("div");
                  fila.className = "fila";
                  fila.innerHTML = `
          <select class="swal2-input tipoPago">
            <option value="${medios.medio1}">${medios.medio1}</option>
            <option value="${medios.medio2}">${medios.medio2}</option>
          </select>
          <input type="number" class="swal2-input valorPago" placeholder="Valor">
          <button class="btnDel">X</button>
        `;

                  // Evento para borrar fila
                  fila.querySelector(".btnDel")!.addEventListener("click", () => {
                    fila.remove();
                    actualizarTotal();  // recalcular total al eliminar
                  });

                  // Evento para recalcular cuando se escribe
                  fila.querySelector(".valorPago")!.addEventListener("input", actualizarTotal);

                  // Evento por si cambia el medio (opcional pero lo dejo)
                  fila.querySelector(".tipoPago")!.addEventListener("change", actualizarTotal);

                  contenedor.appendChild(fila);
                }

                // agregar primera fila
                agregarFila();

                // evento del botón agregar
                btnAgregar.addEventListener("click", () => agregarFila());
              },

              preConfirm: () => {
                const tipos = Array.from(document.querySelectorAll('.tipoPago')) as HTMLSelectElement[];
                const valores = Array.from(document.querySelectorAll('.valorPago')) as HTMLInputElement[];

                const pagos1: number[] = [];
                const pagos2: number[] = [];

                valores.forEach((input, i) => {
                  const tipo = tipos[i].value;
                  const valor = parseFloat(input.value) || 0;

                  if (tipo === medios.medio1) pagos1.push(valor);
                  else pagos2.push(valor);
                });

                const total1 = pagos1.reduce((a: number, b: number) => a + b, 0);
                const total2 = pagos2.reduce((a: number, b: number) => a + b, 0);
                const totalIngresado = total1 + total2;

                // Validación: no puede usar solo un medio de pago
                if (total1 === 0 || total2 === 0) {
                  Swal.showValidationMessage(
                    `Debe ingresar al menos un pago en *${medios.medio1}* y otro en *${medios.medio2}*.`
                  );
                  return;
                }


                if (totalIngresado !== totalVenta) {
                  Swal.showValidationMessage(
                    `El total ingresado ($${totalIngresado.toLocaleString()}) debe ser EXACTAMENTE igual al total de la venta ($${totalVenta.toLocaleString()})`
                  );
                  return;
                }

                return { pagos1, pagos2 };
              }
            });

            if (formValues) {
              const totalMedio1 = formValues.pagos1.reduce((a: number, b: number) => a + b, 0);
              const totalMedio2 = formValues.pagos2.reduce((a: number, b: number) => a + b, 0);

              this.PrecioTransferencia = totalMedio2;
              this.PrecioTransferenciaSegundo = totalMedio1;

              const venta: Venta = {
                idCaja: idCaja,
                idPedido: pedido.idPedido,
                totalTexto: pedido.totalTexto,
                fechaRegistro: new Date().toLocaleString(),
                anulada: false,
                tipoPago: this.tipodePagoPorDefecto,
                tipoTranferencia: TipoPago,
                estadoVenta: metodo,
                cantidadProductoTexto: pedido.cantidadProductoTexto,
                gananciaTexto: '0',
                precioEfectivoTexto: "0",
                precioTransferenciaTexto: this.PrecioTransferencia!.toString(),
                precioTransferenciaSegundoTexto: this.PrecioTransferenciaSegundo!.toString(),

                detalleVenta: pedido.detallePedidos.map(detalle => ({
                  idProducto: detalle.idProducto,
                  nombre: detalle.descripcionProducto ?? '',
                  idCategoria: detalle.idCategoria ?? 0,
                  descripcionCategoria: detalle.descripcionCategoria ?? '',
                  stock: detalle.stock ?? 0,
                  descripcionProducto: detalle.descripcionProducto,
                  cantidad: detalle.cantidad,
                  precioTexto: detalle.precioUnitarioTexto,
                  totalTexto: detalle.totalTexto,
                  unidadMedidaTexto: detalle.unidadMedidaTexto,
                  descripcionCaracteristica: detalle.caracteristicas! ?? "",
                  descuentosTexto: '0',
                  ivaTexto: '19',
                  precioPagadoTexto: PrecioPagado,
                  precioUnitarioTexto: detalle.precioUnitarioTexto ?? '',
                  gananciaTexto: '',
                  precio: detalle.precio ?? '',
                  esActivo: detalle.esActivo ? 1 : 0,
                  imageData: [],
                  caracteristicas: detalle.caracteristicas ?? "",
                  idDetalleVenta: 0,
                  idVenta: 0,
                  idDetallePedido: 0,
                  comentario: detalle.comentario ?? '',
                  unidadMedida: detalle.unidadMedida ?? '',
                  descuentos: '0',
                  codigo: '',
                  iva: '0',
                  imagenUrl: [],
                  nombreImagen: [],
                  imagenes: [
                    { nombreImagen: "", imageData: "", imagenUrl: null }
                  ]
                }))
              };

              console.log(venta);
              this.confirmarGeneracionFactura(venta, idCaja);

            } else {
              this.bloquearBotonRegistrar = true;
              console.log('El usuario canceló el pago combinado');
            }
          }

          else {


            let pagado: number = 0;
            let total: number = 0;
            let suma: number = 0;
            // console.log(PrecioPagado);
            pagado = parseFloat(PrecioPagado.replace(/\./g, '').replace(',', '.'));
            total = parseFloat(pedido.totalTexto)

            this.Vueltos = pagado - total

            console.log(pagado);
            // console.log(total);

            if (pagado == 0) {
              pagado = total;

            }


            if (pagado < total) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Precio pagado no puede ser menor al total`,
              });
              return

            } else {

              // const heladeria = pedido.detallePedidos
              //   .filter(d => d.unidadMedidaTexto === "Heladeria");

              // if (heladeria.length > 0) {
              //   metodo = 'SemiPagado';
              // }


              const venta: Venta = {
                // idVenta: 0,
                idCaja: idCaja,
                idPedido: pedido.idPedido,
                totalTexto: pedido.totalTexto,
                fechaRegistro: new Date().toLocaleString(),
                anulada: false,
                tipoPago: this.tipodePagoPorDefecto,
                tipoTranferencia: TipoPago,
                estadoVenta: metodo,
                cantidadProductoTexto: pedido.cantidadProductoTexto,
                gananciaTexto: '0',
                precioEfectivoTexto: "0",
                precioTransferenciaTexto: "0",
                precioTransferenciaSegundoTexto: "0",
                detalleVenta: pedido.detallePedidos.map(detalle => ({
                  idProducto: detalle.idProducto,
                  nombre: detalle.descripcionProducto ?? '',
                  idCategoria: detalle.idCategoria ?? 0,
                  descripcionCategoria: detalle.descripcionCategoria ?? '',
                  stock: detalle.stock ?? 0,
                  descripcionProducto: detalle.descripcionProducto,
                  cantidad: detalle.cantidad,
                  precioTexto: detalle.precioUnitarioTexto,
                  totalTexto: detalle.totalTexto,
                  unidadMedidaTexto: detalle.unidadMedidaTexto,
                  descripcionCaracteristica: detalle.caracteristicas! ?? "",
                  descuentosTexto: '0',
                  ivaTexto: '19',
                  precioPagadoTexto: (pagado).toString() ?? "0",
                  precioUnitarioTexto: detalle.precioUnitarioTexto ?? '',
                  gananciaTexto: '',
                  // Add required DetalleVenta properties with default values if missing
                  precio: detalle.precio ?? '',
                  esActivo: detalle.esActivo ? 1 : 0,
                  imageData: [],
                  caracteristicas: detalle.caracteristicas ?? "",
                  idDetalleVenta: 0,
                  idVenta: 0,
                  idDetallePedido: 0,
                  comentario: detalle.comentario ?? '',
                  unidadMedida: detalle.unidadMedida ?? '',
                  descuentos: '0',
                  codigo: '',
                  iva: '0',
                  imagenUrl: [],
                  nombreImagen: [],

                  imagenes: [
                    {
                      nombreImagen: "",
                      imageData: "",
                      imagenUrl: null
                    }
                  ]

                }))
              };


              console.log(venta);
              this.confirmarGeneracionFactura(venta, idCaja);
            }



          }




        }
      });


    } else {
      console.log('No se encontró el idUsuario en el localStorage');
    }



  }


  renovarTokenYSolicitarVenta(pedido: Pedido) {
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
              this.pagarPedido(pedido);
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

  confirmarGeneracionFactura(request: Venta, idCaja: number) {
    console.log(request);
    if (request.estadoVenta == "Pagado") {
      Swal.fire({
        title: '¿Desea generar factura?',
        text: 'Se generara una factura.',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Sí',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(async (result) => {
        if (result.isConfirmed) {

          this.procesarRegistroVenta(request, idCaja);


        } else {

          this.confirmarCancelacionFactura(request, idCaja);

        }
      });
    } else {
      Swal.fire({
        title: '¿Se terminara de registrar la venta de heladeria?',
        text: 'Terminar venta de heladeria.',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Sí',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(async (result) => {
        if (result.isConfirmed) {

          this.procesarRegistroVenta(request, idCaja);


        } else {

          this.confirmarCancelacionFactura(request, idCaja);

        }
      });

    }


  }

  async procesarRegistroVenta(request: Venta, idCaja: number) {
    this.bloquearBotonRegistrar = true;
    // Guardar el cliente seleccionado actual antes de la validación
    this.mesaSeleccionadoTemporal = this.mesaSeleccionado;
    //funciona
    // this.ListaproductoSeleccionadoTemporal = JSON.parse(JSON.stringify(this.listaProductoParaVenta));
    this.ListaproductoSeleccionadoTemporal = [...request.detalleVenta];

    // console.log(this.ListaproductoSeleccionadoTemporal);
    // console.log(request);
    // const heladeria = request.detalleVenta
    //   .filter(d => d.unidadMedidaTexto === "Heladeria");
    // console.log(heladeria);
    // if (heladeria.length > 0) {
    //   request.estadoVenta = 'SemiPagado';
    // }

    console.log(request);

    if (request.estadoVenta == "Pagado") {
      this._ventaServicio.registrar(request).pipe(
        switchMap((response: ReponseApi) => {
          console.log(response);
          //funciona
          // if (!this.clienteSeleccionado || !this.clienteSeleccionado.nombreCompleto) {
          //   // throw new Error('No se ha seleccionado un cliente válido.');
          //   this.clienteSeleccionado = this.clienteSeleccionadoTemporal;
          //   this.listaProductoParaVenta = this.ListaproductoSeleccionadoTemporal;

          //   // Swal.fire({
          //   //   icon: 'error',
          //   //   title: 'Error al construir el ticket',
          //   //   text:'No se ha seleccionado un cliente válido.',
          //   // });
          // }
          if (!this.mesaSeleccionado || !this.mesaSeleccionado!.nombreMesa) {
            this.mesaSeleccionado = this.mesaSeleccionadoTemporal;
            // this.interesesSeleccionadoTemporal = this.formularioProductoVenta.value.intereses;
            this.listaProductoParaVenta = [...this.ListaproductoSeleccionadoTemporal];
          }

          if (response.status == true) {
            if (this.tipodeFacturaPorDefecto == "Ticket") {
              this.generarTicket(response);
              // this.abrirGaveta();  //Funcional 
            }

          }

          if (response.status && response.value && response.value.detalleVenta && response.value.detalleVenta[0].numeroDocumento) {
            // console.log('Número de documento en la respuesta:', response.value.detalleVenta[0].numeroDocumento);
            return of(response.value.detalleVenta[0].numeroDocumento);
          } else if (response.status && response.value && response.value.numeroDocumento) {
            // console.log('Número de documento en la respuesta:', response.value.numeroDocumento);
            return of(response.value.numeroDocumento);
          } else {
            // console.error('Error en la respuesta o número de documento no disponible:', response);

            if (response.status == false && response.msg == "No hay suficiente stock para realizar la venta.") {
              Swal.fire({
                icon: 'error',
                title: 'No hay suficiente stock',
                text: `No hay suficiente stock para realizar la venta.`,
              });

            } else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR.',
                text: 'No se pudo registrar la venta',
              });
            }
            // this._utilidadServicio.mostrarAlerta("No se pudo registrar la venta", "Oops");

            return of(null);
          }
        }),
        // switchMap((numeroDocumento: string | null) => this.actualizarListaProductosDespuesVenta().pipe(
        //   switchMap(() => of(numeroDocumento))
        // ))
      ).subscribe({
        next: (numeroDocumento: string | null) => {


          this.bloquearBotonRegistrar = true;
          this.actualizarCajaConVenta(request, idCaja, numeroDocumento);
          // Swal.fire({
          //   icon: 'success',
          //   title: 'Venta Registrada.',
          //   text: `Venta Registrada: ${numeroDocumento}`,
          // });
          this.reiniciarCampos();
        },
        error: (error) => {
          // this.handleErrorResponse(error);
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
                      this.procesarRegistroVenta(request, idCaja);
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
            this.handleErrorResponse(error);
          }

        },
        complete: () => {
          this.bloquearBotonRegistrar = true;
        },
      });

    } else {

      Swal.fire({
        title: '¿Completar heladería?',
        text: 'Se moverá el dinero a la caja de heladería',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {

        if (result.isConfirmed) {

          const idPedido = request.idPedido;
          console.log(idPedido)
          this._ventaServicio.completarHeladeria(idPedido!).subscribe({

            next: (response) => {
              if (response.status) {
                Swal.fire('Listo', 'Heladería completada', 'success');
                this.cargarPedidosDeMesa();
              } else {
                Swal.fire('Error', response.msg, 'error');
              }
            },
            complete: () => {
              this.bloquearBotonRegistrar = true;
              // this.actualizarCajaConVenta(request, idCaja, request.numeroDocumento!);
              this.reiniciarCampos();
            },

            error: (error: any) => {
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
                          this.procesarRegistroVenta2(request, idCaja);
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
                this.handleErrorResponse(error);
              }
            }

          });

        }

      });


    }


  }



  async abrirGaveta() {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }

      const config = qz.configs.create("GA-E200 Series", {
        port: 9100,
        protocol: "raw"
      });

      const data = [
        {
          type: "raw",
          format: "hex",
          data: "1B70005050"  // comando abrir gaveta
        }
      ];

      await qz.print(config, data);
    } catch (error) {
      console.error("Error al abrir la gaveta:", error);
    }
  }



  handleErrorResponse(error: any) {
    // console.error('Error al registrar la venta:', error);

    if (error && error.errors) {
      // console.error('Detalles del error en el servidor:', error.errors);

      for (const key of Object.keys(error.errors)) {
        const errorMessage = error.errors[key];
        // console.error(`Error en ${key}: ${errorMessage}`);
      }
    } else {
      console.error('Detalles del error desconocido:', error);
    }
  }

  reiniciarCampos(): void {
    // this.totalConDescuento=0;
    this.totalPagar = 0.00;
    this.listaProductoParaVenta = [];
    this.PrecioEfectivo = 0;
    this.PrecioTransferencia = 0;
    // this.mesaSeleccionado = null;
    this.productoSeleccionado = null;


    this.formularioProductoVenta.get('precioPagadoTexto')!.setValue('0');
    //  this.formularioProductoVenta.reset();  // Agrega esto para reiniciar el formulario

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
      const clienteControl = this.formularioProductoVenta.get('mesa');

      if (clienteControl) {
        clienteControl.setValue('');
      }
    }
  }


  procesarRegistroVenta2(request: Venta, idCaja: number) {
    this.bloquearBotonRegistrar = true;
    // console.log(request);
    if (request.estadoVenta == "Pagado") {
      this._ventaServicio.registrar(request).pipe(
        switchMap((response: ReponseApi) => {
          console.log(response);
          //funciona
          // if (!this.clienteSeleccionado || !this.clienteSeleccionado.nombreCompleto) {
          //   // throw new Error('No se ha seleccionado un cliente válido.');
          //   this.clienteSeleccionado = this.clienteSeleccionadoTemporal;
          //   this.listaProductoParaVenta = this.ListaproductoSeleccionadoTemporal;

          //   // Swal.fire({
          //   //   icon: 'error',
          //   //   title: 'Error al construir el ticket',
          //   //   text:'No se ha seleccionado un cliente válido.',
          //   // });
          // }
          if (!this.mesaSeleccionado || !this.mesaSeleccionado!.nombreMesa) {
            this.mesaSeleccionado = this.mesaSeleccionadoTemporal;
            // this.interesesSeleccionadoTemporal = this.formularioProductoVenta.value.intereses;
            this.listaProductoParaVenta = [...this.ListaproductoSeleccionadoTemporal];
          }

          if (response.status == true) {
            if (this.tipodeFacturaPorDefecto == "Ticket") {
              this.generarTicket(response);
              // this.abrirGaveta();  //Funcional 
            }

          }

          if (response.status && response.value && response.value.detalleVenta && response.value.detalleVenta[0].numeroDocumento) {
            // console.log('Número de documento en la respuesta:', response.value.detalleVenta[0].numeroDocumento);
            return of(response.value.detalleVenta[0].numeroDocumento);
          } else if (response.status && response.value && response.value.numeroDocumento) {
            // console.log('Número de documento en la respuesta:', response.value.numeroDocumento);
            return of(response.value.numeroDocumento);
          } else {
            // console.error('Error en la respuesta o número de documento no disponible:', response);

            if (response.status == false && response.msg == "No hay suficiente stock para realizar la venta.") {
              Swal.fire({
                icon: 'error',
                title: 'No hay suficiente stock',
                text: `No hay suficiente stock para realizar la venta.`,
              });

            } else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR.',
                text: 'No se pudo registrar la venta',
              });
            }
            // this._utilidadServicio.mostrarAlerta("No se pudo registrar la venta", "Oops");

            return of(null);
          }
        }),
        // switchMap((numeroDocumento: string | null) => this.actualizarListaProductosDespuesVenta().pipe(
        //   switchMap(() => of(numeroDocumento))
        // ))
      ).subscribe({
        next: (numeroDocumento: string | null) => {


          this.bloquearBotonRegistrar = true;
          this.actualizarCajaConVenta(request, idCaja, numeroDocumento);
          // Swal.fire({
          //   icon: 'success',
          //   title: 'Venta Registrada.',
          //   text: `Venta Registrada: ${numeroDocumento}`,
          // });
          this.reiniciarCampos();
        },
        error: (error) => {
          // this.handleErrorResponse(error);
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
                      this.procesarRegistroVenta2(request, idCaja);
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
            this.handleErrorResponse(error);
          }

        },
        complete: () => {
          this.bloquearBotonRegistrar = true;
        },
      });

    } else {

      Swal.fire({
        title: '¿Completar heladería?',
        text: 'Se moverá el dinero a la caja de heladería',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {

        if (result.isConfirmed) {

          const idPedido = request.idPedido;
          console.log(idPedido)
          this._ventaServicio.completarHeladeria(idPedido!).subscribe({

            next: (response) => {
              if (response.status) {
                Swal.fire('Listo', 'Heladería completada', 'success');
                this.cargarPedidosDeMesa();
              } else {
                Swal.fire('Error', response.msg, 'error');
              }
            },
            complete: () => {
              this.bloquearBotonRegistrar = true;
              // this.actualizarCajaConVenta(request, idCaja, request.numeroDocumento!);
              this.reiniciarCampos();
            },

            error: (error: any) => {
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
                          this.procesarRegistroVenta2(request, idCaja);
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
                this.handleErrorResponse(error);
              }
            }

          });

        }

      });


    }

  }
  confirmarCancelacionFactura(request: Venta, idCaja: number) {


    if (request.estadoVenta == "Pagado") {
      Swal.fire({
        title: 'Cancelar generación de factura',
        text: '¿Estás seguro de que no deseas generar la factura?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'cancelar venta',
        cancelButtonText: 'continuar con la venta sin factura',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((confirmResult) => {
        if (confirmResult.isConfirmed) {
          Swal.fire('Cancelado', 'No se generará la factura.', 'success');
          // this.bloquearBotonRegistrar = false;
        } else {
          this.procesarRegistroVenta2(request, idCaja);
        }
      });
    } else {
      Swal.fire({
        title: 'Cancelar ultima parte de la venta heladeria',
        text: '¿Estás seguro de que no deseas terminar la ultima parte?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'cancelar venta',
        cancelButtonText: 'continuar con la venta heladeria',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((confirmResult) => {
        if (confirmResult.isConfirmed) {
          Swal.fire('Cancelado', 'No se generará la factura.', 'success');
          // this.bloquearBotonRegistrar = false;
        } else {
          this.procesarRegistroVenta2(request, idCaja);
        }
      });
    }

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

                console.log('Usuario obtenido:', usuario);
                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    console.log('Token actualizado:', response.token);
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

  actualizarCajaConVenta(request: Venta, idCaja: number, numeroDocumento: string | null) {
    let idUsuario: number = 0;
    // Obtener el idUsuario del localStorage
    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
    if (datosDesencriptados !== null) {
      const usuario = JSON.parse(datosDesencriptados);
      idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
    }
    console.log(request);
    if (idCaja !== undefined) {
      let suma: string = "0";
      if (request.estadoVenta == "Pendiente") {
        // suma = request.deudaAbonoTexto;
        suma = "0";
      }
      if (request.tipoPago == "Fiado") {
        // suma = request.deudaAbonoTexto;
        suma = "0";
      }
      else if (request.estadoVenta == "Pagado") {

        // const heladeria = request.detalleVenta
        //   .filter(d => d.unidadMedidaTexto === "Heladeria");
        // console.log(heladeria);
        // if (heladeria.length > 0) {
        //   request.estadoVenta = 'SemiPagado';
        //   suma = request.totalTexto;
        // }

        suma = request.totalTexto;
      }
      else if (request.estadoVenta == "SemiPagado") {
        suma = "0";
      }
      else {

      }

      let cajaActualizada: Caja = {
        idCaja: idCaja,
        transaccionesTexto: suma,
        ingresosTexto: suma,
        metodoPago: this.tipodePagoPorDefecto,
        estado: '',
        nombreUsuario: '',
        idUsuario: idUsuario
      };
      console.log(cajaActualizada);
      // console.log(request);
      // console.log(this.PrecioEfectivo!.toString());
      // console.log(this.PrecioTransferencia!.toString());
      if (request.tipoPago == "Combinado") {
        //  console.log("Aqui");
        cajaActualizada.ingresosTexto = this.PrecioEfectivo!.toString();
        cajaActualizada.transaccionesTexto = this.PrecioTransferencia!.toString();
        //console.log(cajaActualizada);
        this.actualizarCajaPagosCombinado(cajaActualizada);
      }
      else if (request.tipoPago == "CombinadoDos") {

        const totalTransferencias =
          (this.PrecioTransferencia ?? 0) +
          (this.PrecioTransferenciaSegundo ?? 0);
        // console.log(totalTransferencias);
        cajaActualizada.transaccionesTexto = totalTransferencias.toString();

        this.actualizarCajaPagosCombinado(cajaActualizada);
      }

      else {
        // console.log("Aqui");
        this.actualizarCaja(cajaActualizada);
      }


    } else {
      console.error('No se encontró una caja abierta para el usuario actual');
    }
    this.CantidadPagar = 0;
  }


  actualizarCaja(caja: Caja): void {
    // console.log(caja);
    this.cajaService.obtenerCajaPorUsuario(caja.idUsuario).subscribe(c => {
      if (c) {
        // console.log(c);
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
                this.actualizarCaja(caja);
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

  actualizarCajaPagosCombinado(caja: Caja): void {
    this.cajaService.obtenerCajaPorUsuario(caja.idUsuario).subscribe(c => {
      if (c) {
        // console.log(c);
        // Actualiza los valores de ingresosTexto y metodoPago en la caja encontrada
        c.ingresosTexto = caja.ingresosTexto;
        c.metodoPago = caja.metodoPago;
        c.transaccionesTexto = caja.transaccionesTexto;
        // Llama al servicio para actualizar la caja en la base de datos
        this.cajaService.editarPagosCombinados(c).subscribe(() => {
          // console.log(c);
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
                this.actualizarCaja(caja);
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

  async generarTicket(ventaData: any) {


    //  console.log(ventaData);
    // console.log(ventaData.value.detalleVenta[0].precioPagadoTexto);

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
            allowEscapeKey: false
          }).then((result) => {

            if (result.isConfirmed) {
              // Capturar el valor seleccionado
              const tamañoTicket = result.value;

              // Configurar el tamaño de página basado en la selección
              const pageSize = tamañoTicket === '58' ? { width: 58, height: 'auto' } : { width: 100, height: 'auto' };

              // console.log('Tamaño del ticket seleccionado:', tamañoTicket);
              // console.log('Configuración del tamaño de página:', pageSize);

              // Ajustar el tamaño del texto del encabezado
              const headerStyle = tamañoTicket === '58'
                ? { fontSize: '1' }  // Tamaño de fuente para 58mm
                : { fontSize: '3' }; // Tamaño de fuente para 80mm

              const mensaje = tamañoTicket === '58' ?
                "***** Ticket de Venta *****"
                :
                "********** Ticket de Venta **********"

              const rayas = tamañoTicket === '58' ?
                "---------------------------------------------------------------------------"
                :
                "-------------------------------------------------------------------------------------------"



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

                this.cajaService.obtenerCajaPorUsuario(idUsuario).subscribe({
                  next: async (caja: Caja | null) => {
                    if (caja !== null) {
                      // Si se encuentra una caja abierta para el idUsuario
                      idCaja = caja.idCaja;
                      let MesaDatosTemporal: any;
                      // Verificar si this.clienteSeleccionado es válido antes de continuar
                      if (!this.mesaSeleccionado || !this.mesaSeleccionado!.nombreMesa) {
                        // throw new Error('No se ha seleccionado un cliente válido.');
                        // this.clienteSeleccionado = this.clienteSeleccionadoTemporal;
                        MesaDatosTemporal = this.mesaSeleccionadoTemporal;
                        ventaData.value.detalleVenta = [...this.ListaproductoSeleccionadoTemporal];
                        console.log(this.listaProductoParaVenta);
                      }
                      ventaData.value.detalleVenta = [...this.ListaproductoSeleccionadoTemporal];

                      MesaDatosTemporal = this.mesaSeleccionadoTemporal;

                      const nombreMesa = MesaDatosTemporal!.nombreMesa! || 'No disponible';
                      const tipo = MesaDatosTemporal!.tipo || 'No disponible';


                      const empresa = empresas[0];
                      // Extraer los datos de la empresa
                      const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
                      const direccion2 = empresa ? empresa.direccion : 'No disponible';
                      const telefono2 = empresa ? empresa.telefono : 'No disponible';
                      const correo = empresa ? empresa.correo : 'No disponible';
                      const rut = empresa ? empresa.rut : 'No disponible';
                      const logoBase64 = empresa ? empresa.logo : '';
                      // Agregar prefijo al logo base64
                      let logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;
                      const numeroDocumento = ventaData.value.numeroDocumento != null ? ventaData.value.numeroDocumento : 'No disponible';
                      const usuarioString = localStorage.getItem('usuario');
                      const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
                      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
                      // Verificar si usuarioString es nulo antes de parsearlo
                      const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;
                      // Obtener el nombre completo del usuario si existe
                      const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

                      const urlQR = `https://comida-kendry.web.app/menu/consultar_Venta?venta=${numeroDocumento}`;
                      const qrImageBase64 = await QRCode.toDataURL(urlQR);

                      // Obtener la fecha y hora actual para mostrarla en el ticket
                      const fechaActual = new Date().toLocaleString('es-CO', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      });
                      const detallesProductos = ventaData.value.detalleVenta.map((detalle: any, index: number) => {
                        // Enumerar productos con índice +1
                        const numero = index + 1;
                        const descripcionCortada = `${detalle.descripcionProducto.substring(0, 32)}`;
                        // const precioSinIva = parseFloat(detalle.precioSinDescuento!) - parseFloat(detalle.precioDelIva!);
                        // Crear la fila inicial del producto
                        const filaProducto: any[] = [
                          { text: numero, alignment: 'center', style: 'peque' },
                          { text: descripcionCortada, alignment: 'center', style: 'peque' },
                        ];
                        // Condicionalmente agregar columnas de IVA y Precio sin IVA si el tamaño del ticket es 80mm
                        if (tamañoTicket === '80') {
                          filaProducto.push(
                            // { text: this.formatearNumero(detalle.precioTexto!.toString()), alignment: 'center', style: 'peque' },
                            // { text: this.formatearNumero(precioSinIva.toString()), alignment: 'center', style: 'peque' },
                            // { text: this.formatearNumero(detalle.unidadMedidaTexto!.toString()), alignment: 'center', style: 'peque' },
                          );
                        }
                        // Agregar las columnas comunes
                        filaProducto.push(
                          { text: this.formatearNumero(detalle.precioTexto!.toString()), alignment: 'center', style: 'peque' },
                          // { text: this.formatearNumero(detalle.descuentos.toString()) + '%', alignment: 'center', style: 'peque' },
                          // { text: this.formatearNumero(detalle.precio.toString()), alignment: 'center', style: 'peque' },
                          { text: detalle.cantidad.toString(), alignment: 'center', style: 'peque' },
                          { text: this.formatearNumero(detalle.totalTexto), alignment: 'center', style: 'peque' }
                        );

                        return filaProducto;
                      });
                      const TipoPago = this.tipodePagoPorDefecto
                      const MedioPago = this.tipodePago
                      const NumeroCaja = idCaja
                      // Definir la ruta de la imagen por defecto
                      const imagenPorDefecto = 'assets/Images/laptop-support.png';
                      // Crear un array para almacenar la información de la tienda
                      let informacionTienda: any[] = [

                      ];

                      if (nombreEmpresa.trim() !== 'No disponible') {
                        informacionTienda.push(
                          { text: `Nombre del Local: ${nombreEmpresa}`, style: 'subheader', alignment: 'justify' }
                        );
                      }
                      if (rut.trim() !== 'No disponible') {
                        informacionTienda.push(
                          { text: `Nit: ${rut}`, style: 'subheader', alignment: 'justify' }
                        );
                      }
                      // Agregar el resto de la información de la tienda
                      if (direccion2.trim() !== 'No disponible') {
                        informacionTienda.push(
                          { text: `Dirección: ${direccion2}`, style: 'subheader', alignment: 'justify' }
                        );
                      }
                      if (telefono2.trim() !== 'No disponible') {
                        informacionTienda.push(
                          { text: `Teléfono: ${telefono2}`, style: 'subheader', alignment: 'justify' }
                        );
                      }
                      if (correo.trim() !== 'No disponible') {
                        informacionTienda.push(
                          { text: `Correo: ${correo}`, style: 'subheader', alignment: 'justify' }
                        );
                      }
                      // Calcular el precio pagado total, que abarca toda la venta
                      const precioPagadoTotal = this.parseNumeroColombiano(ventaData.value.detalleVenta[0].precioPagadoTexto);


                      // Calcular el vuelto total restando el total de la venta del precio pagado total
                      let vueltoTotal;
                      let precioEfectivo
                      let precioTransferencia
                      let PrecioTransferenciaSegundo
                      let totalVenta
                      let totalPagado
                      if (this.tipodePagoPorDefecto == "Transferencia" || this.tipodePagoPorDefecto == "Fiado") {
                        vueltoTotal = "0";

                      } else {
                        if (this.tipodePagoPorDefecto == "Combinado") {
                          precioEfectivo = parseFloat(ventaData.value.precioEfectivoTexto) || 0;
                          precioTransferencia = parseFloat(ventaData.value.precioTransferenciaTexto) || 0;
                          totalVenta = parseFloat(ventaData.value.totalTexto) || 0
                          totalPagado = precioEfectivo + precioTransferencia;
                          vueltoTotal = totalPagado > totalVenta ? totalPagado - totalVenta : 0;

                        }
                        else if (this.tipodePagoPorDefecto == "CombinadoDos") {

                          PrecioTransferenciaSegundo = parseFloat(ventaData.value.precioTransferenciaSegundoTexto) || 0;
                          precioTransferencia = parseFloat(ventaData.value.precioTransferenciaTexto) || 0;
                          totalVenta = parseFloat(ventaData.value.totalTexto) || 0
                          totalPagado = PrecioTransferenciaSegundo + precioTransferencia;
                          vueltoTotal = totalPagado > totalVenta ? totalPagado - totalVenta : 0;


                        }
                        else {
                          // vueltoTotal = precioPagadoTotal - parseFloat(ventaData.value.totalTexto);
                          if (precioPagadoTotal > 0) {
                            vueltoTotal = precioPagadoTotal - parseFloat(ventaData.value.totalTexto);

                          } else {
                            vueltoTotal = precioPagadoTotal

                          }

                        }

                      }

                      let medio1 = "";
                      let medio2 = "";
                      console.log(ventaData.value.tipoTranferencia);
                      if (ventaData.value.tipoTranferencia?.includes("/")) {
                        [medio1, medio2] = ventaData.value.tipoTranferencia.split("/");
                      }



                      const documentDefinition: any = {
                        pageSize,
                        // pageSize: { width: 80, height: 297 }, // Tamaño típico de un ticket
                        pageMargins: [2, 3, 5, 1], // Márgenes [izquierda, arriba, derecha, abajo]
                        content: [
                          ...informacionTienda,
                          // Agregar el nombre de usuario
                          { text: mensaje, style: 'header' },
                          { text: `Atendido por: ${nombreUsuario}`, style: 'subheader' },
                          { text: `Fecha de emisión: ${fechaActual}`, style: 'subheader' },
                          { text: `# de venta: ${numeroDocumento}`, style: 'subheader' },
                          { text: `Nombre de la mesa: ${nombreMesa}`, style: 'subheader' },
                          { text: `Tipo mesa: ${tipo}`, style: 'subheader' },
                          { text: `Pedido #: ${ventaData.value.idPedido}`, style: 'subheader' },
                          ...(TipoPago === 'Combinado' || TipoPago === 'Transferencia' ? [
                            { text: `Medio de Pago: ${MedioPago}`, style: 'subheader' },

                          ] : []),
                          { text: '' }, // Espacio en blanco
                          {
                            text: rayas, style: 'subheader2'
                          },
                          // Tabla de detalles de productos vendidos
                          {
                            table: {
                              headerRows: 1,
                              widths: tamañoTicket === '80'
                                ? ['*', 'auto', 'auto', 'auto', 'auto'] // 8 columnas si tamañoTicket === '80'
                                : ['*', 'auto', 'auto', 'auto', 'auto'], // 6 columnas si no es 80
                              alignment: 'center',
                              body: [
                                [
                                  { text: '#', style: 'tableHeader', alignment: 'center' },
                                  { text: 'Prod.', style: 'tableHeader', alignment: 'center' },


                                  ...(tamañoTicket === '80' ? [

                                    // { text: 'Med.', style: 'tableHeader', alignment: 'center' },

                                  ] : []),

                                  { text: 'P. Unit.', style: 'tableHeader', alignment: 'center' },
                                  { text: 'Cant', style: 'tableHeader', alignment: 'center' },
                                  { text: 'Total', style: 'tableHeader', alignment: 'center' }],
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

                          // {

                          //   text: rayas, style: 'subheader'
                          // },
                          // { text: `Total de Iva: ${totalIva.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'subheader' },
                          { text: '-----------------------------------------------', alignment: 'right', style: 'subheader2' },
                          // Separador decorativo
                          { text: '' },
                          { text: `Recibido: ${precioPagadoTotal.toLocaleString('es-CO')} $`, alignment: 'right', style: 'subheader' },
                          { text: `Total de la Venta: ${this.formatearNumeroMostrado(ventaData.value.totalTexto)} $`, alignment: 'right', style: 'subheader' },
                          { text: '-----------------------------------------------', alignment: 'right', style: 'subheader2' },
                          // { text: `Vueltos : ${vueltoTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'subheader' },
                          // 👇 INSERTAMOS CONDICIÓN AQUÍ
                          // 👇 SECCIÓN DE VUELTOS Y PAGOS POR MÉTODO

                          // === Combinado ===
                          ...(this.tipodePagoPorDefecto === 'Combinado' ? [
                            {
                              text: `Pago en efectivo: ${this.formatearNumeroMostrado(ventaData.value.precioEfectivoTexto)} $`,
                              alignment: 'right',
                              style: 'subheader'
                            },
                            {
                              text: `Pago por transferencia: ${this.formatearNumeroMostrado(ventaData.value.precioTransferenciaTexto)} $`,
                              alignment: 'right',
                              style: 'subheader'
                            },
                            {
                              text: `Vueltos : ${vueltoTotal.toLocaleString('es-CO')} $`,
                              alignment: 'right',
                              style: 'subheader'
                            }
                          ] : []),

                          // === CombinadoDos ===
                          ...(this.tipodePagoPorDefecto === 'CombinadoDos' ? [
                            {
                              text: `${medio1.trim()}: ${this.formatearNumeroMostrado(ventaData.value.precioTransferenciaTexto)} $`,
                              alignment: 'right',
                              style: 'subheader'
                            },
                            {
                              text: `${medio2.trim()}: ${this.formatearNumeroMostrado(ventaData.value.precioTransferenciaSegundoTexto)} $`,
                              alignment: 'right',
                              style: 'subheader'
                            },
                            {
                              text: `Total pagado: ${totalPagado!.toLocaleString('es-CO')} $`,
                              alignment: 'right',
                              style: 'subheader'
                            },
                            {
                              text: `Vueltos : ${vueltoTotal.toLocaleString('es-CO')} $`,
                              alignment: 'right',
                              style: 'subheader'
                            }
                          ] : []),


                          // === Cualquier otro método ===
                          ...(this.tipodePagoPorDefecto !== 'Combinado' &&
                            this.tipodePagoPorDefecto !== 'CombinadoDos' ? [
                            {
                              text: `Vueltos : ${vueltoTotal.toLocaleString('es-CO')} $`,
                              alignment: 'right',
                              style: 'subheader'
                            }
                          ] : []),

                          {
                            text: rayas, style: 'subheader2'
                          }, // Separador decorativo
                          { text: '' },
                          { text: 'Escanee su venta:', alignment: 'center', style: 'subheader' },
                          { image: qrImageBase64, alignment: 'center', margin: [0, 0], fit: [40, 40] },
                          // { text: urlQR, alignment: 'center', fontSize: 2 }, // opcional, puedes mostrar la URL debajo

                          {
                            text: rayas, style: 'subheader2'
                          }, // Separador decorativo
                          { text: '' },
                          {
                            text: '¡Gracias por su compra!',
                            alignment: 'center',
                            style: 'header',
                            margin: [0, 10, 0, 0],
                          },
                          {
                            text: 'Esperamos volver a servirle muy pronto.',
                            alignment: 'center',
                            style: 'subheader',
                            margin: [0, 0, 0, 5],
                          },
                          {
                            text: [
                              { text: '¿Interesado en este sistema o uno similar? ', bold: true },
                              'Contáctame: '
                            ],
                            alignment: 'center',
                            style: 'subheader',
                            margin: [0, 15, 0, 0],
                          },
                          {
                            text: [
                              { text: 'Carlos Cotes\n', bold: true },
                              ' 301 209 1145\n',
                              ' carloscotes48@gmail.com\n'
                            ],
                            alignment: 'center',
                            style: 'subheader',
                            // color: '#555555'
                          },

                          {
                            // Mensaje de validez para devoluciones de productos
                            text: '\n',

                          }
                        ],

                        styles: tamañoTicket === '80' ? {
                          // Estilos para ticket de 80mm
                          header: {
                            fontSize: 5,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 2] // Margen inferior de 20 unidades
                          },
                          subheader: {
                            fontSize: 4,
                            bold: true,
                            // margin: [0, 0, 0, 1] // Margen inferior de 10 unidades
                          },
                          subheader2: {
                            fontSize: 3,
                            bold: true,
                            // margin: [0, 0, 0, 1] // Margen inferior de 10 unidades
                          },
                          tableHeader: {
                            bold: true,
                            fontSize: 4, // Reducir el tamaño de fuente a 5
                            color: 'black',
                          },
                          peque: {

                            fontSize: 4,
                            bold: true,
                            // margin: [0, 0, 0, 1]
                          },

                        } : {
                          header: {
                            fontSize: 4,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 2] // Margen inferior de 20 unidades
                          },
                          subheader: {
                            fontSize: 2,
                            bold: true,
                            // margin: [0, 0, 0, 1] // Margen inferior de 10 unidades
                          },
                          subheader2: {
                            fontSize: 2,
                            bold: true,
                            // margin: [0, 0, 0, 1] // Margen inferior de 10 unidades
                          },
                          tableHeader: {
                            bold: true,
                            fontSize: 2, // Reducir el tamaño de fuente a 5
                            color: 'black',
                          },
                          peque: {

                            fontSize: 2,
                            bold: true,
                            // margin: [0, 0, 0, 1]
                          },
                        }
                      };
                      this.reiniciarCampos();
                      this.cargarPedidosDeMesa();
                      Swal.fire({
                        icon: 'success',
                        title: 'Venta Registrada.',
                        text: `Venta Registrada: ${numeroDocumento}`,
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

                    let idUsuario: number = 0;
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
                              this.generarTicket(ventaData);
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

              } else {
                console.log('No se encontró el idUsuario en el localStorage');
              }





            } else {
              const numeroDocumento = ventaData.value.numeroDocumento != null ? ventaData.value.numeroDocumento : 'No disponible';

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

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.generarTicket(ventaData);
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



  formatearNumeroMostrado(valor: string | number | null | undefined): string {
    if (valor == null) return '';

    const limpio = valor
      .toString()
      .replace(/\./g, '')   // quitar puntos de miles
      .replace(/,/g, '.');  // cambiar coma decimal por punto

    const numero = Number(limpio);

    if (!isNaN(numero) && isFinite(numero)) {
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 });
    } else {
      return '';
    }
  }


  parseNumeroColombiano(valor: string | number): number {
    if (typeof valor === 'number') return valor;

    return parseFloat(
      valor
        .toString()
        .replace(/\./g, '')   // quitar separadores de miles
        .replace(/,/g, '.')   // reemplazar coma decimal por punto
    );
  }




}
