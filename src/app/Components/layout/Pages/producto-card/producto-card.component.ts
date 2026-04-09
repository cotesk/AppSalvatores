import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { interval } from 'rxjs';
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
declare var MercadoPago: any;
declare var Stripe: any;

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component.css',
  // encapsulation: ViewEncapsulation.None,
})
export class ProductoCardComponent implements OnInit {
  products: Producto[] = [];
  categorias: Categoria[] = [];
  metodo: string | null = null;
  categoriaSeleccionada: number | null = null;
  precioFiltro: number | null = null;
  descuentoFiltro: number | null = null;
  PrecioConDescuento: number | null = null;
  nombreFiltro: string | null = null;
  productosFiltrados: Producto[] = [];
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  metodoBusqueda: string | null = '';
  formularioProducto: FormGroup;
  pageSize: number = 20;
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
  toolbarColorClass: string = 'toolbar-black';
  sidenavColorClass: string = 'sidenav-black';
  ngContainerColorClass: string = 'sidenav-black';
  carritoProductos: Producto[] = [];
  selectedColor: string = '';
  listaCategoriaFiltro: Categoria[] = [];
  listaCategoria: Categoria[] = [];
  categoriaControl = new FormControl('');
  private mercadopago: any;
  clienteFiltrado: string = '';
  stripe = Stripe('pk_test_51POmZa2KtYgiCPJDNFtGd0kELRLRcf2wn5emJfhKhmTcP6KxrUVpfTP12FlNNzlwjDf2aOTMa0sOYXVUnXWtV07N002LG849VD');
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
    private mercadoPagoService: MercadoPagoService
    // private exchangeRateService: ExchangeRateService
  ) {



    this.formularioProducto = this.fb.group({

      categoria: ['',],
      precioFiltro: [''],
      nombreFiltro: ['']
    });

    this.formularioProducto.get('categoria')?.valueChanges.subscribe(value => {
      console.log('Valor de búsqueda:', value); // Log del valor de búsqueda
      this.listaCategoriaFiltro = this.retornarProductoPorFiltro(value); // Filtrar lista
      console.log('Lista de categorías filtradas:', this.listaCategoriaFiltro); // Log de categorías filtradas
    });

    // Establecer un intervalo para actualizar la lista de productos cada 5 minutos (puedes ajustar el tiempo según tus necesidades)
    // interval(1000) // 300,000 milisegundos = 5 minutos
    //   .subscribe(() => {
    //     this.actualizarListaProductos();
    //   });
  }

  ngOnInit(): void {
    // this.mercadopago = new MercadoPago('TEST-025cffe8-e00d-4714-884a-0fd2dc165fd8', {
    //   locale: 'es-CO' // Cambia esto según la localización deseada
    // });
    //this.loadProducts();
    this.cargarProductos();
    this.CategoriaCompleta();
    // this.obtenerCategorias();
    // this.fetchProductos();
    this.inicializar


  }

  inicializar() {


    this.formularioProducto = this.fb.group({

      categoria: ['',],
      precioFiltro: [''],
      nombreFiltro: ['']
    });

    this.formularioProducto.get('categoria')?.valueChanges.subscribe(value => {
      console.log('Valor de búsqueda:', value); // Log del valor de búsqueda
      this.listaCategoriaFiltro = this.retornarProductoPorFiltro(value); // Filtrar lista
      console.log('Lista de categorías filtradas:', this.listaCategoriaFiltro); // Log de categorías filtradas
    });
    this.empresaDataService.empresaActualizada$.subscribe((nuevaEmpresa) => {
      // Actualizar el nombre de la empresa en el layout
      this.nombreEmpresa = nuevaEmpresa.nombreEmpresa;
    });
    // this.obtenerInformacionEmpresa();
    const colorGuardado = localStorage.getItem('colorSeleccionado');
    if (colorGuardado) {
      this.selectedColor = colorGuardado; // Usar el color guardado como valor predeterminado
      this.cambiarColor2(colorGuardado); // Aplicar los estilos según el color guardado
    }
    this.cartService.getCart().subscribe((products: Producto[]) => {
      this.carritoProductos = products;
    });

  }

  verImagen2(): void {
    this.imageDialogService.openImageDialog(
      'data:image/png;base64,' + this.empresa.logo
    );
  }

  mostrarTooltip(tooltip: MatTooltip) {
    tooltip.show();
    // Ocultar el tooltip después de un tiempo
    setTimeout(() => tooltip.hide(), 2000); // Por ejemplo, ocultarlo después de 2 segundos
  }
  // obtenerInformacionEmpresa(): void {
  //   this.empresaService.listaCard().subscribe({
  //     next: (response) => {
  //       console.log('Datos recibidos del servidor:', response);

  //       if (response.status && response.value.length > 0) {
  //         this.empresa = response.value[0];
  //         this.nombreEmpresa = this.empresa.nombreEmpresa;
  //         // console.log('Tipo de imagen:', this.empresa.logo.startsWith('data:image/png;base64,')); // Verificar el tipo de imagen

  //         // Verificar la URL de la imagen generada
  //         // console.log('URL de la imagen:', 'data:image/png;base64,' + this.empresa.logo);


  //       } else {
  //         this.empresa = response.value[0];
  //         this.nombreEmpresa = this.empresa.nombreEmpresa;
  //         console.error('Error al obtener la información de la empresa');
  //       }
  //     },
  //     error: (error) => this.handleTokenError(() => this.obtenerInformacionEmpresa())
  //   });
  // }
  retornarProductoPorFiltro(value: string): Categoria[] {
    console.log('Filtrando con valor:', value);
    console.log('Categorías disponibles:', this.listaCategoria);

    if (!value) {
      return this.listaCategoria; // Si no hay valor, retornar todas las categorías
    }

    const lowerCaseValue = value.toLowerCase(); // Normaliza el valor de búsqueda
    const filteredList = this.listaCategoria.filter(categoria =>
      categoria.nombre.toLowerCase().includes(lowerCaseValue)
    );

    console.log('Categorías filtradas:', filteredList);
    return filteredList;
  }


  // obtenerCategorias() {
  //   this._categoriaServicio.listaCard().subscribe({
  //     next: (data) => {
  //       if (data.status) {
  //         data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));

  //         this.categorias = data.value;

  //       } else {
  //         // Manejar el caso en que no se encuentren categorías
  //       }
  //     },
  //     error: (error) => {
  //       this.handleTokenError(() => this.obtenerCategorias());
  //     }
  //   });
  // }

  //funcional para el select de categoria
  onCategoriaSelected(option: any): void {
    this.categoriaSeleccionada = option.idCategoria;  // Guardar la categoría seleccionada
    this.aplicarFiltroCard(); // Llamar al método para aplicar el filtro
  }

  // onCategoriaSelected(categoria: any, event: any): void {
  //   // Comprobamos si el checkbox ha sido marcado o desmarcado
  //   if (event.checked) {
  //     let metodoBusqueda: any = this.metodo;
  //     if (metodoBusqueda! == "Nombre") {
  //       // Evento cuando el checkbox es seleccionado
  //       // console.log('Categoría seleccionada:', categoria);
  //       this.nombreFiltro = "";
  //       this.metodo = null;
  //       this.metodoBusqueda = "Categoria"
  //       this.categoriaSeleccionada = categoria.idCategoria;
  //     } else if (metodoBusqueda! == "Precio") {
  //       // Evento cuando el checkbox es seleccionado
  //       // console.log('Categoría seleccionada:', categoria);
  //       this.precioFiltro = null;
  //       this.metodo = null;
  //       this.metodoBusqueda = "Categoria"
  //       this.categoriaSeleccionada = categoria.idCategoria;
  //     } else {
  //       // Evento cuando el checkbox es seleccionado
  //       // console.log('Categoría seleccionada:', categoria);
  //       this.metodoBusqueda = "Categoria"
  //       this.categoriaSeleccionada = categoria.idCategoria;

  //     }

  //   } else {
  //     if (this.metodoBusqueda == "Nombre") {
  //       this.metodoBusqueda == "Nombre"
  //     } else if (this.metodoBusqueda == "Precio") {
  //       this.metodoBusqueda == "Precio"
  //     } else {

  //       // Evento cuando el checkbox es deseleccionado
  //       // console.log('Categoría deseleccionada:', categoria);
  //       this.metodoBusqueda = ""
  //       this.categoriaSeleccionada = null; // Desmarcar la categoría seleccionada
  //     }

  //   }

  //   // Llamar al método para aplicar el filtro, si es necesario
  //   this.aplicarFiltroCard();
  // }
  CategoriaCompleta() {
    this._categoriaServicio.listaCard().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        if (data.status) {


          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));
          this.listaCategoria = data.value as Categoria[];
          this.listaCategoriaFiltro = [...this.listaCategoria];
          console.log('Categorías cargadas:', this.listaCategoria);
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


  // startPayment(producto: Producto) {
  //   const localPrice = this.calcularPrecioConDescuento(producto);

  //   // Obtener la tasa de cambio desde EUR
  //   const paymentRequest = {
  //     products: [
  //       {
  //         productName: producto.nombre, // Asegúrate de que el objeto Producto tenga una propiedad 'nombre'
  //         amount: parseInt(localPrice), // Usamos el monto en centavos
  //         quantity: 1 // Cantidad del producto (ajusta según sea necesario)
  //       }
  //     ],
  //     successUrl: environment.successUrl,
  //     cancelUrl: environment.cancelUrl,
  //     customerEmail: "prueba@gmail.com" // Agrega el correo electrónico del cliente
  //   };

  //   // Crear la sesión de pago
  //   this.paymentService.createCheckoutSession(paymentRequest).subscribe(response => {
  //     console.log('Payment session created successfully', response);
  //     this.stripe.redirectToCheckout({
  //       sessionId: response.sessionId
  //     });
  //   });
  // }


  startPayment(producto: Producto) {
    const localPrice = this.calcularPrecioConDescuento(producto);

    // Mostrar Swal para pedir el correo electrónico
    Swal.fire({
      title: 'Ingrese su correo electrónico',
      input: 'email',
      inputLabel: 'Su correo electrónico',
      inputPlaceholder: 'Ingrese su correo electrónico',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesita ingresar su correo electrónico!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const customerEmail = result.value; // Obtener el correo ingresado

        // Crear la estructura del paymentRequest
        const paymentRequest = {
          products: [
            {
              id: 0, // Ajusta según sea necesario
              purchaseId: 0, // Ajusta según sea necesario
              productName: producto.nombre, // Asegúrate de que el objeto Producto tenga una propiedad 'nombre'
              amount: parseInt(localPrice), // Usamos el monto en centavos
              quantity: 1, // Cantidad del producto (ajusta según sea necesario)
              purchase: {
                id: 0, // Ajusta según sea necesario
                customerEmail: customerEmail, // Correo electrónico del cliente
                totalAmount: parseInt(localPrice), // Monto total de la compra
                purchaseDate: new Date().toISOString(), // Fecha de la compra en formato ISO
                status: "Completada", // Estado de la compra
                nameCliente: "Carlos Cotes",
                telefono: "300",
                direccion: "calle",
                productItems: [
                  {
                    productName: producto.nombre,
                    amount: parseInt(localPrice),
                    quantity: 1,
                    purchase: {
                      id: 0, // Ajusta según sea necesario
                      customerEmail: customerEmail,
                      totalAmount: parseInt(localPrice),
                      purchaseDate: new Date().toISOString(),
                      status: "Completada",
                      nameCliente: "Carlos Cotes",
                      telefono: "300",
                      direccion: "calle",
                    }
                  }
                ]
              }
            }
          ],
          successUrl: environment.successUrl,
          cancelUrl: environment.cancelUrl,
          customerEmail: customerEmail // Correo electrónico del cliente
        };

        // Crear la sesión de pago
        this.paymentService.createCheckoutSession(paymentRequest).subscribe(
          response => {
            console.log('Payment session created successfully', response);
            this.stripe.redirectToCheckout({
              sessionId: response.sessionId
            });
          },
          error => {
            console.error('Error creating payment session', error);
          }
        );
      }
    });
  }

  // startPayment() {
  //   this.paymentService.createCheckoutSession(5000, 1, 'Producto de Prueba').subscribe(response => {
  //     this.stripe.redirectToCheckout({
  //       sessionId: response.sessionId
  //     });
  //   });
  // }

  // createPreference() {
  //   const preferenceRequest = {
  //     title: 'Producto de ejemplo',
  //     quantity: 1,
  //     price: 100.00
  //   };
  //   this.paymentService.createPreference(preferenceRequest).subscribe(preference => {
  //     try {
  //       const mp = new MercadoPago('APP_USR-d73b1348-710a-4bb2-8278-07b7726e2132', {
  //         locale: 'es-CO'
  //       });

  //       mp.checkout({
  //         preference: {
  //           id: preference.id
  //         },
  //         autoOpen: true, // Habilita la apertura automática del Checkout Pro
  //         onSubmit: () => {
  //           console.log("Submitting payment...");
  //         },
  //         onError: (error: any) => {
  //           console.error("Error durante el proceso de pago: ", error);
  //         }
  //       });
  //     } catch (error) {
  //       console.error("Error inicializando MercadoPago: ", error);
  //     }
  //   }, error => {
  //     console.error("Error creando la preferencia de pago: ", error);
  //   });
  // }

  // pay() {
  //   Swal.fire({
  //     title: 'Pagar con Nequi',
  //     html:
  //       '<input type="number" id="amount" class="swal2-input" placeholder="Monto">' +
  //       '<input type="text" id="phoneNumber" class="swal2-input" placeholder="Número de Teléfono">',
  //     focusConfirm: false,
  //     preConfirm: () => {
  //       const amount = (Swal.getPopup()!.querySelector('#amount') as HTMLInputElement).value;
  //       const phoneNumber = (Swal.getPopup()!.querySelector('#phoneNumber') as HTMLInputElement).value;
  //       if (!amount || !phoneNumber) {
  //         Swal.showValidationMessage('Por favor, ingrese el monto y el número de teléfono');
  //         return null;
  //       }
  //       return { amount: parseFloat(amount), phoneNumber: phoneNumber };
  //     }
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       const { amount, phoneNumber } = result.value;
  //       this.paymentService.payWithNequi(amount, phoneNumber).subscribe(response => {
  //         Swal.fire('Éxito', 'Pago realizado con éxito', 'success');
  //       }, error => {
  //         Swal.fire('Error', 'Error al realizar el pago', 'error');
  //       });
  //     }
  //   });
  // }

  // paypal() {

  //   const amount = 100.00; // Ejemplo de valor
  //   const currency = 'USD'; // Ejemplo de moneda

  //   this.paymentService.createOrder(amount, currency).subscribe(
  //     response => {
  //       console.log('Order created successfully:', response);
  //     },
  //     error => {
  //       console.error('Error creating order:', error);
  //     }
  //   );
  // }
  // createPreference() {
  //   const paymentData = {
  //     transactionAmount: 100, // El monto de la transacción
  //     description: 'Descripción del producto',
  //     paymentMethodId: 'visa', // El método de pago
  //     payerEmail: 'email@dominio.com'
  //   };

  //   this.paymentService.createPayment(paymentData).subscribe(response => {
  //     if (response.initPoint) {
  //       window.location.href = response.initPoint; // Redirige al checkout de Mercado Pago
  //     }
  //   }, error => {
  //     console.error('Error al crear el pago', error);
  //   });
  // }

  //funcional
  // addToCart(product: Producto) {

  //   const truncatedName = product.nombre.length > 40 ? product.nombre.substring(0, 40) + '...' : product.nombre;

  //   this.cartService.addToCart(product);
  //   Swal.fire('Añadido al carrito', `${truncatedName} ha sido añadido al carrito.`, 'success');
  // }
  // Objeto que almacena si el producto fue seleccionado para venderse por caja


  addToCart(product: Producto, precioPorCaja: boolean): void {
    // Determina el precio según la selección de caja o unidad
    const precioFinal = precioPorCaja
      ? (parseFloat(product.precio!) || 0).toString()  // Convierte a string
      : (parseFloat(product.precio) || 0).toString();         // Convierte a string

    // Clona el producto para no modificar directamente el objeto original y asigna el precio como string
    const productoParaCarrito: Producto = { ...product, precio: precioFinal };

    // Nombre truncado para mostrar en la notificación
    const truncatedName = productoParaCarrito.nombre.length > 40
      ? productoParaCarrito.nombre.substring(0, 40) + '...'
      : productoParaCarrito.nombre;

    // Añade el producto al carrito con el precio correcto
    this.cartService.addToCart(productoParaCarrito);

    // Muestra una notificación de éxito
    Swal.fire('Añadido al carrito', `${truncatedName} ha sido añadido al carrito.`, 'success');
  }


  // Método para calcular el subtotal
  calcularSubtotal(producto: Producto): number {
    // Verifica si se ha seleccionado 'precioPorCaja' para este producto
    let precio = this.precioPorCajaSeleccionado[producto.idProducto]
      ? parseFloat(producto.precio!) || 0  // Usa precioPorCaja si está seleccionado
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
  cargarProductos(): void {
    this.productoService.listaPaginadaCards(
      // this.page,
      this.currentPage,
      this.pageSize,
      this.metodoBusqueda!,
      this.filtroActivo()
    ).subscribe({
      next: (data: any) => {
        this.productosFiltrados = data.data || [];
        this.totalProductos = data.total || 0;
        this.totalPages = Math.ceil(this.totalProductos / this.pageSize);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }
  filtroActivo(): any {
    let filtro: any = {};

    if (this.metodoBusqueda === 'Precio' && this.precioFiltro !== undefined) {
      filtro.precio = this.precioFiltro;
    } else if (this.metodoBusqueda === 'Nombre' && this.nombreFiltro) {
      filtro.nombre = this.nombreFiltro;
    } else if (this.metodoBusqueda === 'Descuento' && this.descuentoFiltro !== undefined) {
      filtro.descuento = this.descuentoFiltro;
    } else if (this.metodoBusqueda === 'Categoria' && this.categoriaSeleccionada !== null) {
      filtro.categoriaId = this.categoriaSeleccionada;

    }

    return filtro;
  }

  mostrarListaCategoria(): void {


    this.listaCategoriaFiltro = this.listaCategoria;

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
      // this.clienteSeleccionado = null!;
      // this.formularioProductoVenta.patchValue({
      //   cliente: null,
      //   clienteId: null,
      // });

      // Limpiar el texto del cliente seleccionado
      this.formularioProducto.get('categoria')?.setValue('');
    }
    if (inputCliente == "") {

      this.categoriaSeleccionada = inputCliente;  // Guardar la categoría seleccionada
      this.aplicarFiltroCard();
    }

    const soloLetras = inputCliente.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '');

    // Almacena el valor filtrado en la variable clienteFiltrado
    this.clienteFiltrado = soloLetras;

    // Establece el valor en el control del formulario
    this.formularioProducto.get('categoria')?.setValue(this.clienteFiltrado);
  }


  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
  }
  mostrarCategoria(categoria: Categoria): string {

    return categoria.nombre;

  }
  aplicarFiltroCard(): void {

    this.page = 1; // Reiniciar a la primera página cuando se aplica un filtro
    this.currentPage = 1;
    this.cargarProductos();
    //this.loadProducts();
    // this.currentPage = 1;
    // this.fetchProductos();
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
    this.aplicarFiltroCard();
  }
  onPageSelected(event: MatSelectChange) {
    // Handle selection change from mat-select
    // Call your method to fetch data based on this.currentPage
    this.currentPage = event.value;
    this.fetchProductos();


  }

  // Realizar pago (ejemplo)
  // makePayment() {
  //   const paymentData = {
  //     amount: 10000, // Monto de ejemplo
  //     description: 'Compra de productos',
  //     cardNumber: '4099833361663634',
  //     expirationMonth: 11,
  //     expirationYear: 2025,
  //     cardholderName: 'John Doe',
  //     securityCode: '123',
  //     email: 'carloscotes48@gmail.com'
  //   };

  //   this.paymentService.createPayment(paymentData).subscribe(
  //     response => {
  //       if (response.initPoint) {
  //         window.location.href = response.initPoint; // Redirige al checkout de Mercado Pago
  //       }
  //       Swal.fire('Pago exitoso', 'Su pago ha sido procesado correctamente.', 'success');
  //       console.log('Pago procesado correctamente', response);
  //     },
  //     error => {
  //       Swal.fire('Error en el pago', 'Hubo un problema al procesar su pago. Por favor, inténtelo nuevamente.', 'error');
  //       console.error('Error al procesar el pago', error);
  //     }
  //   );
  // }
  // Método para abrir el modal de Mercado Pago
  abrirModalPago() {
    const checkout = this.mercadopago.checkout({
      preference: {
        id: this.products[0].idProducto // ID de la preferencia de pago
      },
      autoOpen: true // Para abrir el modal automáticamente
    });

    checkout.open().then((result: any) => {
      if (result.status === 'ok') {
        Swal.fire('Pago exitoso', 'Su pago fue procesado con éxito', 'success');
      } else {
        Swal.fire('Error', 'Hubo un error al procesar el pago', 'error');
      }
    }).catch((error: any) => {
      console.error('Error al abrir el modal de Mercado Pago:', error);
      Swal.fire('Error', 'Ocurrió un error al abrir el modal de pago', 'error');
    });
  }
  // fetchProductos() {
  //   // Llamada al servicio para obtener productos paginados
  //   this.productoService.listaPaginadaCards(this.currentPage, this.pageSize, null, null)
  //     .subscribe(response => {
  //       this.productosFiltrados = response.data; // Asignar productos obtenidos
  //       this.totalProductos = response.total; // Actualizar el total de productos
  //        this.updatePagesArray(); // Actualizar el arreglo de páginas disponibles
  //     }, error => {
  //       console.error('Error al obtener productos:', error);
  //     });
  // }
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
        imagenUrl: product.imagenUrl
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
  abrirFacebook(producto: Producto): void {
    this.empresaService.listaCard().subscribe({
      next: (response) => {
        if (response.status) {
          const empresas = response.value as Empresa[];
          const empresa = empresas[0];
          const facebook = empresa ? empresa.facebook : 'No disponible';

          if (facebook == "") {
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No hay link de facebook disponible.`,
            });

          } else {

            const mensaje =
              `Hola, quiero averiguar más acerca de este producto:\n` +
              `${producto.nombre}\n` +
              `Precio: ${this.formatearNumero(producto.precio)} $\n` +
              `Descuento: ${this.formatearNumero(producto.descuentos)} %\n` +
              `Quedo atento a tu respuesta.`;

            // Codifica el mensaje para que sea seguro para URL
            const encodedMensaje = encodeURIComponent(mensaje);

            // Obtén la URL del perfil de Facebook
            const facebookUrl = empresa.facebook;

            // Construye la URL de Messenger
            const messengerUrl = `https://m.me/${this.extractUsernameFromUrl(facebookUrl)}`;

            // Abre la URL en una nueva pestaña
            window.open(messengerUrl, '_blank');

            // Muestra el mensaje en una alerta para que el usuario lo copie
            // alert(`Copia y pega este mensaje en Messenger:\n\n${mensaje}`);

            // Muestra el mensaje en un SweetAlert con opción de copiar
            Swal.fire({
              title: 'Copia el mensaje',
              html: `<textarea id="mensajeTextarea" style="width: 100%; height: 150px;" readonly>${mensaje}</textarea>`,
              showCancelButton: true,
              confirmButtonColor: '#1337E8',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Copiar',
              cancelButtonText: 'Cerrar',
              preConfirm: () => {
                const mensajeTextarea = document.getElementById('mensajeTextarea') as HTMLTextAreaElement;
                mensajeTextarea.select();
                document.execCommand('copy');
                return true;
              }
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.fire('¡Copiado!', 'El mensaje ha sido copiado al portapapeles.', 'success');
              }
            });

          }

        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => this.handleTokenError(() => this.abrirFacebook(producto))
    });
  }

  abrirInstagram(producto: Producto): void {
    this.empresaService.listaCard().subscribe({
      next: (response) => {
        if (response.status) {
          const empresas = response.value as Empresa[];
          const empresa = empresas[0];
          const instagram = empresa ? empresa.instagram : 'No disponible';

          if (instagram == "") {
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No hay link de instagram disponible.`,
            });

          } else {

            const mensaje =
              `Hola, quiero averiguar más acerca de este producto:\n` +
              `${producto.nombre}\n` +
              `Precio: ${this.formatearNumero(producto.precio)} $\n` +
              `Descuento: ${this.formatearNumero(producto.descuentos)} %\n` +
              `Quedo atento a tu respuesta.`;

            // Construye la URL del perfil de Instagram
            const perfilInstagramUrl = empresa.instagram;

            // Abre la URL del perfil de Instagram en una nueva pestaña
            window.open(perfilInstagramUrl, '_blank');
            Swal.fire({
              title: 'Copia el mensaje',
              html: `<textarea id="mensajeTextarea" style="width: 100%; height: 150px;" readonly>${mensaje}</textarea>`,
              showCancelButton: true,
              confirmButtonColor: '#1337E8',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Copiar',
              cancelButtonText: 'Cerrar',
              preConfirm: () => {
                const mensajeTextarea = document.getElementById('mensajeTextarea') as HTMLTextAreaElement;
                mensajeTextarea.select();
                document.execCommand('copy');
                return true;
              }
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.fire('¡Copiado!', 'El mensaje ha sido copiado al portapapeles.', 'success');
              }
            });

          }

        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => this.handleTokenError(() => this.abrirInstagram(producto))
    });
  }
  // Función para extraer el nombre de usuario de la URL de Facebook
  extractUsernameFromUrl(url: string): string {
    const regex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^/?]+)/;
    const matches = url.match(regex);
    return matches ? matches[1] : '';
  }
  abrirWhatsApp(producto: Producto) {

    this.empresaService.listaCard().subscribe({
      next: (response) => {
        if (response.status) {
          const empresas = response.value as Empresa[];
          // if (empresas.length > 0) {
          const empresa = empresas[0];
          const telefono = empresa ? empresa.telefono : 'No disponible';



          if (telefono == "") {
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No hay numero disponible.`,
            });

          } else {
            const mensaje =
              `Hola, quiero averiguar más acerca de este producto:\n` +
              `${producto.nombre}\n` +
              `Precio: ${this.formatearNumero(producto.precio)} $\n` +
              `Descuento: ${this.formatearNumero(producto.descuentos)} %\n` +
              `Quedo atento a tu respuesta.`;

            // const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
            const url = `https://api.whatsapp.com/send?phone=57${telefono}&text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
          }


        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => this.handleTokenError(() => this.abrirInstagram(producto))

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
  formatearNumero2(numero: any): string {
    if (typeof numero === 'number' && !isNaN(numero)) {
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } else {
      return 'N/A';
    }
  }

  //

  getTextColorClass(): string {
    switch (this.toolbarColorClass) {
      case 'toolbar-white':
        return 'text-black';
      case 'toolbar-red':
      case 'toolbar-green':
        return 'text-white';
      case 'toolbar-morado':
        return 'text-white';
      case 'toolbar-black':
        return 'text-white';
      case 'toolbar-azul':
        return 'text-white';
      default:
        return '';
    }
  }
  getTextColorClass2(): string {
    switch (this.toolbarColorClass) {
      case 'toolbar-white':
        return 'text-white';
      case 'toolbar-red':
      case 'toolbar-green':
        return 'text-white';
      case 'toolbar-morado':
        return 'text-white';
      case 'toolbar-black':
        return 'text-white';
      case 'toolbar-azul':
        return 'text-white';
      default:
        return '';
    }
  }
  getIconColorClass2(): string {
    switch (this.toolbarColorClass) {
      case 'toolbar-white':
        return 'icon-white';
      case 'toolbar-red':
      case 'toolbar-green':
        return 'icon-white';
      case 'toolbar-morado':
        return 'icon-white';
      case 'toolbar-black':
        return 'icon-white';
      case 'toolbar-azul':
        return 'icon-white';
      default:
        return 'icon-white';
    }
  }

  verCarrito2() {
    this.dialog.open(CarritoModalComponent, {
      width: '600px',
      data: {
        cartItems: this.cartService.getCartItems()
      }
    });
  }

  colors = [

    { value: 'morado', viewValue: 'Morado' },
    { value: 'rojo', viewValue: 'Rojo' },
    { value: 'verde', viewValue: 'Verde' },
    { value: 'azul', viewValue: 'Azul' },
    { value: 'black', viewValue: 'Negro' },
    { value: 'blanco', viewValue: 'Blanco' },

  ];
  cambiarColor(event: Event): void {
    const colorSeleccionado = (event.target as HTMLSelectElement)?.value;

    // Lógica para cambiar el color según la opción seleccionada
    switch (colorSeleccionado) {
      case 'morado':
        this.toolbarColorClass = 'toolbar-morado'; // Cambiar el color de fondo del toolbar a blanco
        this.sidenavColorClass = 'sidenav-morado'; // Cambiar el color de fondo del sidenav a blanco
        this.ngContainerColorClass = 'ng-container-morado'; // Cambiar el color de fondo del contenedor ng-container a blanco

        break;
      case 'blanco':
        this.toolbarColorClass = 'toolbar-white'; // Cambiar el color de fondo del toolbar a blanco
        this.sidenavColorClass = 'sidenav-white'; // Cambiar el color de fondo del sidenav a blanco
        this.ngContainerColorClass = 'ng-container-white'; // Cambiar el color de fondo del contenedor ng-container a blanco
        break;
      case 'rojo':
        this.toolbarColorClass = 'toolbar-red'; // Cambiar el color de fondo del toolbar a rojo
        this.sidenavColorClass = 'sidenav-red'; // Cambiar el color de fondo del sidenav a rojo
        this.ngContainerColorClass = 'ng-container-red'; // Cambiar el color de fondo del contenedor ng-container a rojo
        break;
      case 'verde':
        this.toolbarColorClass = 'toolbar-green'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-green'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-green'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      case 'black':
        this.toolbarColorClass = 'toolbar-black'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-black'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-black'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      case 'azul':
        this.toolbarColorClass = 'toolbar-azul'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-azul'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-azul'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      default:
        console.error('Color no reconocido');
        break;
    }
    this.selectedColor = colorSeleccionado;
    // Guardar el color seleccionado en el localStorage
    localStorage.setItem('colorSeleccionado', colorSeleccionado);
  }
  cambiarColor2(colorSeleccionado: string): void {
    // const colorSeleccionado = (event.target as HTMLSelectElement)?.value;

    // Lógica para cambiar el color según la opción seleccionada
    switch (colorSeleccionado) {
      case 'morado':
        this.toolbarColorClass = 'toolbar-morado'; // Cambiar el color de fondo del toolbar a blanco
        this.sidenavColorClass = 'sidenav-morado'; // Cambiar el color de fondo del sidenav a blanco
        this.ngContainerColorClass = 'ng-container-morado'; // Cambiar el color de fondo del contenedor ng-container a blanco

        break;
      case 'blanco':
        this.toolbarColorClass = 'toolbar-white'; // Cambiar el color de fondo del toolbar a blanco
        this.sidenavColorClass = 'sidenav-white'; // Cambiar el color de fondo del sidenav a blanco
        this.ngContainerColorClass = 'ng-container-white'; // Cambiar el color de fondo del contenedor ng-container a blanco
        break;
      case 'rojo':
        this.toolbarColorClass = 'toolbar-red'; // Cambiar el color de fondo del toolbar a rojo
        this.sidenavColorClass = 'sidenav-red'; // Cambiar el color de fondo del sidenav a rojo
        this.ngContainerColorClass = 'ng-container-red'; // Cambiar el color de fondo del contenedor ng-container a rojo
        break;
      case 'verde':
        this.toolbarColorClass = 'toolbar-green'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-green'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-green'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      case 'black':
        this.toolbarColorClass = 'toolbar-black'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-black'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-black'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      case 'azul':
        this.toolbarColorClass = 'toolbar-azul'; // Cambiar el color de fondo del toolbar a verde
        this.sidenavColorClass = 'sidenav-azul'; // Cambiar el color de fondo del sidenav a verde
        this.ngContainerColorClass = 'ng-container-azul'; // Cambiar el color de fondo del contenedor ng-container a verde
        break;
      default:
        console.error('Color no reconocido');
        break;
    }
    this.selectedColor = colorSeleccionado;
    // Guardar el color seleccionado en el localStorage
    localStorage.setItem('colorSeleccionado', colorSeleccionado);
  }

  colorCircles: { [key: string]: string } = {
    blanco: '#ffffff',
    morado: '#7e3f88',
    rojo: '#940c0c',
    verde: '#064006',
    black: '#000000',
    azul: '#1f448f',
  };

  colorCircles2: { [key: string]: string } = {
    blanco: '#f4eeee',
    morado: '#522b41',
    rojo: '#c72c2c',
    verde: '#126b12',
    black: '#242222',
    azul: '#385897',
  };


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


  MercadoPago(producto: Producto) {

    Swal.fire({
      title: 'Ingrese su correo electrónico',
      html: `
        <label style="font-weight: bold; color: #e74c3c;">Importante:</label>
        <p style="margin: 5px 0 10px; font-size: 14px; color: #333;">
          En este correo se le enviará la información de su compra.
        </p>`,
      input: 'email',
      inputPlaceholder: 'Ingrese su correo electrónico',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesita ingresar su correo electrónico!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const customerEmail = result.value; // Obtener el correo ingresado




        const localPrice = this.calcularPrecioConDescuento(producto);
        // const items = this.productosFiltrados.map(product => {
        //   const selectedPrice = this.precioPorCajaSeleccionado[product.idProducto] || product.precio;
        //   return {
        //     title: product.nombre,
        //     description: product.descripcionCategoria || 'Descripción del producto', // Asegúrate de que esto sea un string
        //     quantity: 1,
        //     unitPrice:(parseInt(localPrice)), // Asegúrate de que este método devuelva un número
        //     currencyId: 'COP'
        //   };
        // });

        const items = [
          {
            title: producto.nombre,
            description: producto.descripcionCategoria || 'Descripción del producto', // Asegúrate de que esto sea un string
            quantity: 1,
            unitPrice: (parseInt(localPrice)), // Asegúrate de que este método devuelva un número
            currencyId: 'COP'
          }
        ];

        const preference: CustomPreferenceRequest = {

          items: items,
          // payer: {
          //   name: 'Nombre del Comprador',
          //   surname: 'Apellido del Comprador',
          //   email: 'email@ejemplo.com',
          //   phone: {
          //     areaCode: '57',
          //     number: '3001234567'
          //   },
          //   address: {
          //     zipCode: '110111',
          //     streetName: 'Calle Ejemplo',
          //     streetNumber: '123'
          //   }
          // },
          backUrls: { // Cambié back_urls a backUrls
            success: 'https://appsistemaventa2024.web.app/pago-exitoso',
            failure: 'https://appsistemaventa2024.web.app/pago-cancelado',
            pending: 'https://appsistemaventa2024.web.app/pago-pendiente'
          },
          autoReturn: 'approved',
          externalReference: customerEmail
        };

        this.mercadoPagoService.createPreference(preference).subscribe(
          (response: any) => {
            console.log('Preferencia creada:', response);
            window.location.href = response;
          },
          (error) => {
            console.error('Error al crear la preferencia:', error);
            alert('Error al crear la preferencia de pago. Inténtalo de nuevo más tarde.');
          }
        );



      }
    });


  }




}
