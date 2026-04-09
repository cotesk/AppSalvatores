import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Producto } from '../../../../Interfaces/producto';
import { CartService } from '../../../../Services/cart.service';
import Swal from 'sweetalert2';
import { EmpresaService } from '../../../../Services/empresa.service';
import { UsuariosService } from '../../../../Services/usuarios.service';
import { Empresa } from '../../../../Interfaces/empresa';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ProductoService } from '../../../../Services/producto.service';
import { PaymentService } from '../../../../Services/payment.service';
import { environment } from '../../../../environments/environment';
import { MercadoPagoService } from '../../../../Services/mercadoPago.service';
import { CustomPreferenceRequest } from '../../../../Interfaces/CustomPreferenceRequest';
declare const MercadoPago: any;
declare var Stripe: any;
@Component({
  selector: 'app-carrito-modal',
  templateUrl: './carrito-modal.component.html',
  styleUrls: ['./carrito-modal.component.css']
})
export class CarritoModalComponent implements OnInit {

  cartItems: Producto[] = [];
  total: number = 0;
  imagenSeleccionada: string | null = null;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  stripe = Stripe('pk_test_51POmZa2KtYgiCPJDNFtGd0kELRLRcf2wn5emJfhKhmTcP6KxrUVpfTP12FlNNzlwjDf2aOTMa0sOYXVUnXWtV07N002LG849VD');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CarritoModalComponent>,
    private cartService: CartService,
    private empresaService: EmpresaService,
    private _usuarioServicio: UsuariosService,
    private dialog: MatDialog,
    private productoService: ProductoService,
    private paymentService: PaymentService,
    private mercadoPagoService: MercadoPagoService
  ) {


  }
  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(cartItems => {
      this.cartItems = cartItems;
      this.actualizarTotal(); // Asegúrate de que el total se actualice cuando cambian los items del carrito
    });


  }
  // startPayment() {
  //   // Mapea los elementos del carrito para crear la estructura de productos
  //   const paymentRequest = {
  //     products: this.cartItems.map(item => ({
  //       // imagenData: item.imageData,
  //       productName: item.nombre,
  //       amount: Math.round(parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100)), // Monto en centavos
  //       quantity: item.stock // Ajusta esto según sea necesario
  //     })),
  //     successUrl: environment.successUrl,
  //     cancelUrl: environment.cancelUrl,
  //     customerEmail: "prueba@gmail.com"
  //   };

  //   // Crear la sesión de pago
  //   this.paymentService.createCheckoutSession(paymentRequest).subscribe(response => {
  //     console.log('Payment session created successfully', response);
  //     this.stripe.redirectToCheckout({
  //       sessionId: response.sessionId
  //     });
  //   });
  // }


  startPayment() {
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

        // Mapea los elementos del carrito para crear la estructura de productos
        const paymentRequest = {
          products: this.cartItems.map(item => ({
            id: 0, // Ajusta según sea necesario
            purchaseId: 0, // Ajusta según sea necesario
            productName: item.nombre,
            amount: Math.round(parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100)), // Monto en centavos
            quantity: item.stock, // Ajusta esto según sea necesario
            purchase: {
              id: 0, // Ajusta según sea necesario
              customerEmail: customerEmail, // Usar el correo ingresado
              totalAmount: Math.round(parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100)) * item.stock, // Total calculado
              purchaseDate: new Date().toISOString(), // Fecha de la compra en formato ISO
              status: "Completada", // Estado de la compra
              nameCliente: "Carlos Cotes",
              telefono: "300",
              direccion: "calle",
              productItems: [
                {
                  productName: item.nombre,
                  amount: Math.round(parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100)), // Monto en centavos
                  quantity: item.stock,
                  purchase: {
                    id: 0, // Ajusta según sea necesario
                    customerEmail: customerEmail, // Usar el correo ingresado
                    totalAmount: Math.round(parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100)) * item.stock, // Total calculado
                    purchaseDate: new Date().toISOString(), // Fecha de la compra en formato ISO
                    status: "Completada", // Estado de la compra
                    nameCliente: "Carlos Cotes",
                    telefono: "300",
                    direccion: "calle",

                  }
                }
              ]
            }
          })),
          successUrl: environment.successUrl,
          cancelUrl: environment.cancelUrl,
          customerEmail: customerEmail // Agregar el correo aquí como parte del PaymentRequest
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


  actualizarCarrito() {
    this.cartItems = this.cartService.getCartItems();
    this.actualizarTotal();
  }

  actualizarCantidad(producto: Producto) {
    // Asegúrate de que la cantidad mínima sea 1 o ajusta según tus requisitos
    if (producto.stock < 1) {
      producto.stock = 1;
    }
    this.actualizarTotal(); // Actualizar el total después de cambiar la cantidad
  }
  verImagen(product: Producto): void {
    // const imageUrl = this.productoService.decodeBase64ToImageUrl(product.imageData!);
    // console.log('URL de la imagen:', imageUrl); // Verificar la URL de la imagen en la consola
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenUrl: product.imagenUrl
      }
    });
  }
  eliminarProducto(index: number) {
    this.cartService.removeFromCart2(index).subscribe(() => {
      console.log('Producto eliminado del carrito');
      this.actualizarCarrito();
      this.actualizarTotal(); // Asegúrate de que se esté llamando correctamente
    }, error => {
      console.error('Error al eliminar producto del carrito:', error);
    });
  }


  calcularSubtotal(producto: Producto): number {
    let precio = parseFloat(producto.precio) || 0;
    let descuento = parseFloat(producto.descuentos);
    let precioSinDescuento = precio * (1 - descuento / 100);
    return precioSinDescuento * producto.stock;
  }
  calcularPrecio(producto: Producto): number {
    let precio = parseFloat(producto.precio) || 0;
    let descuento = parseFloat(producto.descuentos);

    return precio * (1 - descuento / 100);
  }
  actualizarTotal() {
    this.total = this.cartItems.reduce((sum, item) => {
      let subtotal = this.calcularSubtotal(item);
      return sum + subtotal;
    }, 0);
  }
  limpiarCarrito() {
    this.cartService.clearCart(); // Llama al método clearCart del servicio
    Swal.fire({
      icon: 'success',
      title: 'Carrito Limpiado',
      text: 'El carrito ha sido limpiado correctamente.',
    });
  }

  solicitarCompra() {
    Swal.fire({
      title: 'Ingresa tus datos',
      html: `
        <input id="nombreCliente" class="swal2-input" placeholder="Nombre del cliente" required>
        <input id="direccion" class="swal2-input" placeholder="Dirección" required>
        <input id="telefono" class="swal2-input" placeholder="Teléfono" required>
      `,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Enviar',
      confirmButtonColor: '#3085d6',
      preConfirm: () => {
        const nombreCliente = (document.getElementById('nombreCliente') as HTMLInputElement).value;
        const direccion = (document.getElementById('direccion') as HTMLInputElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;

        if (!nombreCliente || !direccion || !telefono) {
          Swal.showValidationMessage('Por favor completa todos los campos.');
        }

        return { nombreCliente, direccion, telefono };
      }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // Cancelar
      } else if (result.isConfirmed) {
        const { nombreCliente, direccion, telefono } = result.value;
        const mensaje = this.generarMensajeWhatsApp(this.cartItems, nombreCliente, direccion, telefono);
        this.enviarMensajeWhatsApp(mensaje);
      }
    });
  }

  generarMensajeWhatsApp(productos: Producto[], nombreCliente: string, direccion: string, telefono: string): string {
    let mensaje = `Hola, quiero solicitar la compra de los siguientes productos:\n\n`;

    productos.forEach((producto, index) => {
      let nombreCortado = producto.nombre.length > 40 ? producto.nombre.slice(0, 40) + '...' : producto.nombre;
      let precio = parseFloat(producto.precio);
      let descuento = parseFloat(producto.descuentos);
      let precioConDescuento = precio * (1 - descuento / 100);
      let subtotal = precioConDescuento * producto.stock;

      mensaje += `${index + 1}. ${nombreCortado}\n`;
      mensaje += `   Precio: ${this.formatearNumero(producto.precio)} $\n`;
      mensaje += `   Descuento: ${this.formatearNumero(producto.descuentos)} %\n`;
      mensaje += `   Cantidad: ${producto.stock}\n`;
      mensaje += `   Subtotal: ${this.formatearNumero2(subtotal)} $\n\n`;
    });

    const total = productos.reduce((sum, producto) => {
      let precio = parseFloat(producto.precio);
      let descuento = parseFloat(producto.descuentos);
      let precioConDescuento = precio * (1 - descuento / 100);
      let subtotal = precioConDescuento * producto.stock;

      return sum + subtotal;
    }, 0);

    mensaje += `Total de la compra: ${this.formatearNumero2(total)} $\n\n`;
    mensaje += `Datos del cliente:\n`;
    mensaje += `Nombre: ${nombreCliente}\n`;
    mensaje += `Dirección: ${direccion}\n`;
    mensaje += `Teléfono: ${telefono}\n\n`;
    mensaje += 'Quedo atento a tu respuesta.';

    return mensaje;
  }

  enviarMensajeWhatsApp(mensaje: string) {
    this.empresaService.listaCard().subscribe({
      next: (response) => {
        if (response.status) {
          const empresas = response.value as Empresa[];
          const empresa = empresas.length > 0 ? empresas[0] : null;
          const telefono = empresa ? empresa.telefono : '';

          if (!telefono) {
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: 'No hay número disponible.',
            });
          } else {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const urlPrefix = isMobile ? 'https://wa.me/' : 'https://api.whatsapp.com/send?phone=57';
            const url = `${urlPrefix}${telefono}&text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
          }
        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => {
        let idUsuario: number = 0;
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
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
                  this.enviarMensajeWhatsApp(mensaje);
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
    const valorNumerico = parseFloat(numero.replace(',', '.'));
    if (!isNaN(valorNumerico)) {
      return valorNumerico.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      return numero;
    }
  }

  formatearNumero2(num: number): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0,  maximumFractionDigits: 0  }).format(num);
  }

  close() {
    this.dialogRef.close();
  }




  realizarPago() {
    // Crea una preferencia de pago
    const preference = {
      items: this.cartItems.map(item => ({
        title: item.nombre,
        unit_price: parseFloat(item.precio) * (1 - parseFloat(item.descuentos) / 100),
        quantity: item.stock,
      })),
    };

    const mp = new MercadoPago('TEST-025cffe8-e00d-4714-884a-0fd2dc165fd8', {
      locale: 'es-CO' // Puedes cambiar el idioma
    });

    mp.checkout({
      preference: {
        id: 'tu-preference-id' // Reemplaza con el ID de la preferencia que obtienes desde tu backend
      },
      render: {
        container: '#boton-pago', // Indica dónde se renderizará el botón de pago
        label: 'Pagar con Mercado Pago', // Cambia el texto del botón si lo deseas
      }
    });
  }



  MercadoPago() {

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




        const items = this.cartItems.map(item => {
          // Imprime el precio original para depuración
          console.log("Precio original:", item.precio);

          // Asegúrate de que el precio es un número
          const priceInCOP = parseFloat(item.precio); // Obtén el precio en COP
          const discount = parseFloat(item.descuentos) || 0; // Asegúrate de que el descuento es un número

          // Calcula el precio final aplicando el descuento
          const finalPrice = priceInCOP * (1 - discount / 100);

          // Redondea a 2 decimales antes de convertir a centavos
          // const unitPrice = Math.round(finalPrice * 100);

          // Imprime el precio final y el unitPrice para depuración
          console.log("Precio final:", finalPrice.toFixed(0)); // Muestra 2 decimales
          // console.log("Unit Price en centavos:", unitPrice);
          let preciofinal = finalPrice.toFixed(0);
          return {
            title: item.nombre,
            description: item.descripcionCategoria || 'Descripción del producto',
            quantity: item.stock > 0 ? item.stock : 1, // Asegúrate de que quantity sea al menos 1
            unitPrice: parseInt(preciofinal), // Aquí asignamos el precio en centavos, sin decimales
            currencyId: 'COP'
          };
        });

        // Formato de la preferencia
        const preference = {
          items: items,
          backUrls: {
            success: "https://appsistemaventa2024.web.app/pago-exitoso",
            failure: "https://appsistemaventa2024.web.app/pago-cancelado",
            pending: "https://appsistemaventa2024.web.app/pago-pendiente"
          },
          autoReturn: "approved",
          externalReference:customerEmail
        };

        // Verificar que los items se envían correctamente
        console.log("Preferencia a enviar:", JSON.stringify(preference, null, 2));

        this.mercadoPagoService.createPreference(preference).subscribe(
          (response: any) => {
            console.log('Preferencia creada:', response);
            if (response && response) {
              window.location.href = response; // Asegúrate de que rediriges correctamente a la URL del pago
            } else {
              console.error('No se encontró el punto de inicio de pago en la respuesta:', response);
              alert('Error al iniciar el pago. Por favor, intenta de nuevo más tarde.');
            }
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
