import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MercadoPagoService } from '../../../../Services/mercadoPago.service';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { transition } from '@angular/animations';
import { ProductoOnline } from '../../../../Interfaces/productosOnline';


@Component({
  selector: 'app-mercado-pago-compra-online',
  templateUrl: './mercado-pago-compra-online.component.html',
  styleUrl: './mercado-pago-compra-online.component.css'
})
export class MercadoPagoCompraOnlineComponent {


  formularioCompraOnline: FormGroup;
  usuario: any;
  clienteData: any[] = []; // Cambia el tipo según tu modelo
  displayedColumns: string[] = ['identificationNumber', 'email', 'firstName', 'lastName', 'phone', 'tipoIdentificacion'];
  transactionData: any[] = [];
  displayedColumnsTransaccion: string[] = ['amount', 'currency', 'createdDate', 'paymentMethod', 'paymentMethodType', 'numeroDocumento', 'estadoVenta', 'icono', 'cardNumber', 'cardType', 'cardNameCliente'];
  displayedColumnsProducto: string[] = ['transactionId', 'title', 'description', 'quantity', 'unitPrice'];
  dataSource = new MatTableDataSource<ProductoOnline>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  //cliente
  correo: string = "";
  nombrecliente: string = "";
  cedulacliente: string = "";
  apellidocliente: string = "";
  tipoIdentificacion: string = "";
  telefono: string = "0";
  //transations
  total: number = 0;
  fecha: string = "";
  peso: string = "";
  status: string = "";
  comision: number = 0;
  metodoPago: string = "";
  tipoMetodoPago: string = "";
  statusVenta: string = "";
  cedulaTarjetaCredito: string = "";
  tipoTarjeta: string = "";
  nombreTarjeta: string = "";
  //
  transactions: string = "id";
  constructor(private dialog: MatDialog,
    // private empresaService: EmpresaService,
    // private _usuarioServicio: UsuariosService,
    // private abonoService: AbonoService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private mercadoPagoService: MercadoPagoService
  ) {

    this.formularioCompraOnline = this.fb.group({


      transactionId: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(15)]],
      correo: ['', [Validators.required, Validators.email, this.validateEmailDomain, Validators.maxLength(35)]],
    });



  }

  ngOnInit(): void {

  }

  onSelectChange(event: any) {
    this.formularioCompraOnline.reset();
    this.limpiarCampos();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completada':
        return '#4caf50'; // Verde
      case 'Reembolsado':
        return '#f44336'; // Rojo
      case 'Preparación y Empaque':
        return '#ff9800'; // Naranja
      case 'En Camino':
        return '#2196f3'; // Azul
      case 'En Proceso':
        return '#ffc107'; // Amarillo claro
      case 'Cancelado':
        return '#000000'; // Negro
      case 'Pendiente':
        return '#fbc02d'; // Amarillo dorado
      default:
        return '#9e9e9e'; // Gris para estados no definidos
    }
  }



  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  // }
  limpiarCampos(): void {
    this.clienteData = [];
    this.transactionData = [];
    this.dataSource.data = [];
  }

  formatearNumero(valor: string | number): string {
    // Si el valor es un número, convertirlo directamente
    if (typeof valor === 'number') {
      return valor.toLocaleString('de-DE');
    }

    // Si es un string, manejamos el caso de los puntos y comas
    const parteEntera = valor.split(',')[0];
    const numeroSinFormato = parteEntera.replace(/\./g, '');

    return parseInt(numeroSinFormato, 10).toLocaleString('de-DE');
  }

  // En el archivo del componente
  getReadablePaymentMethod(method: string): string {
    switch (method) {
      case 'credit_card':
        return 'Tarjeta de Crédito';
      case 'debit_card':
        return 'Tarjeta de Débito';
      case 'ticket':
        return 'Boleto';
      case 'bank_transfer':
        return 'Transferencia Bancaria';
      case 'prepaid_card':
        return 'Tarjeta Prepaga';
      case 'digital_currency':
        return 'Moneda Digital';
      case 'account_money':
        return 'Dinero en Cuenta';
      default:
        return method; // Si no hay coincidencia, retorna el valor original
    }
  }

  getReadablePaymentMethodType(type: string): string {
    switch (type) {
      case 'visa':
      case 'visa_debit':
        return 'Visa';
      case 'mastercard':
        return 'MasterCard';
      case 'amex':
        return 'American Express';
      case 'boleto':
        return 'Boleto';
      case 'oxxo':
        return 'OXXO';
      case 'pagoefectivo':
        return 'Pago Efectivo';
      case 'mercadopago_card':
        return 'Tarjeta Mercado Pago';
      case 'bitcoin':
        return 'Bitcoin';
      case 'ethereum':
        return 'Ethereum';
      case 'account_money':
        return 'Dinero en Cuenta';
      case 'credit_card':
        return 'Tarjeta de Crédito';
      case 'prepaid_card':
        return 'Tarjeta Prepaga'; // Agregado para el caso prepaid_card
      case 'debvisa':
        return 'Débito Visa';
      default:
        return type; // Si no hay coincidencia, retorna el valor original
    }
  }



  buscarCompra(): void {

    this.limpiarCampos();
    const idCedula = (this.formularioCompraOnline.get('transactionId')!.value);

  }

  buscarTransations(): void {

    // this.limpiarCampos();
    const idCedula = (this.formularioCompraOnline.get('transactionId')!.value);
    this.mercadoPagoService.Transactions(idCedula).subscribe({
      next: (data) => {

        if (data !== null)
          // this.total = data.amount;
          // this.peso= data.currency;
          // this.fecha = data.createdDate;
          // this.status= data.status;
          // this.comision= data.mercadoPagoFee;
          // this.metodoPago= data.paymentMethod;
          // this.tipoMetodoPago= data.paymentMethodType;
          // this.statusVenta= data.estadoVenta;
          // this.cedulaTarjetaCredito= data.cardNumber!;
          // this.tipoTarjeta= data.cardType!;
          // this.nombreTarjeta= data.cardNameCliente!;
          this.transactionData = [data];
      },
      error: (error) => {

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Ese número de compra no existe: ${idCedula}`, // Incluye el número de cédula en el mensaje
          confirmButtonText: 'Aceptar'
        });
        // Detener la ejecución
        this.buscarPorductos()
        return;
      },
      complete: () => {

        this.buscarPorductos();


      },
    })
  }

  buscarPorductos(): void {

    // this.limpiarCampos();
    const idCedula = (this.formularioCompraOnline.get('transactionId')!.value);
    this.mercadoPagoService.ProductosOnline(idCedula).subscribe({
      next: (data) => {

        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Ese número de compra no existe: ${idCedula}`, // Incluye el número de cédula en el mensaje
          confirmButtonText: 'Aceptar'
        });
        // Detener la ejecución
        this.limpiarCampos();
        return;
      },
      complete: () => {




      },
    })
  }



  confirmarCancelarPago(transaccionid: number): void {
    Swal.fire({
      title: 'Confirmar Estado',
      text: `¿Está seguro de que desea cancelar el pago con el ID ${transaccionid}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // El usuario confirmó la cancelación, proceder con la solicitud
        this.mercadoPagoService.cancelPedido(transaccionid).subscribe(
          (response: any) => {
            console.log('Respuesta del backend:', response);
            const message = response.message || response;
            Swal.fire({
              title: 'Pago Cancelado.',
              text: message,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          (error: any) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo cancelar el pago. Intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          },
          () => {
            this.buscarCompra(); // Actualizar el estado de la compra
          }
        );
      } else {
        // El usuario canceló la cancelación
        Swal.fire({
          title: 'Acción cancelada',
          text: 'No se ha procesado ningún cambio.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  confirmarReembolso(transaccionid: number): void {
    Swal.fire({
      title: 'Confirmar Estado',
      text: `¿Está seguro de que desea solicitar el reembolso de su compra con el ID ${transaccionid}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reembolsar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // El usuario confirmó el reembolso, proceder con la solicitud
        this.mercadoPagoService.Reembolso(transaccionid).subscribe(
          (response: any) => {
            console.log('Respuesta del backend:', response);
            const message = response.message || response;
            // this.buscarCompra();
            Swal.fire({
              title: 'Reembolso Realizado.',
              text: message,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          (error: any) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo procesar el reembolso. Intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          },
          () => {
            this.buscarCompra();  // Llamar a buscarCompra para actualizar los datos
            this.buscarTransations();
          }
        );
      } else {
        // El usuario canceló la solicitud de reembolso
        Swal.fire({
          title: 'Acción cancelada',
          text: 'No se ha procesado ningún cambio.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }



  Estado(transaccionid: number, estadoVenta: string) {
    if (estadoVenta === "Completada" || estadoVenta === "Preparación y Empaque" || estadoVenta === "En Proceso") {
      // Mostrar mensaje de confirmación

      if (estadoVenta === "Completada" || estadoVenta === "Preparación y Empaque") {

        this.confirmarReembolso(transaccionid);


      } else {

        this.confirmarCancelarPago(transaccionid);

      }






    } else if (estadoVenta === "En Camino") {


      Swal.fire({
        title: 'Reembolso no disponible en este momento',
        text: 'Tu pedido ya está en camino. Ponte en contacto con nosotros para coordinar el reembolso. Una vez que recibas el pedido, procederemos a gestionar el reembolso.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;

    }
    else if (estadoVenta === "Reembolsado") {


      Swal.fire({
        title: 'Reembolso Realizado',
        text: 'Tu pedido ya fue reembolsado.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;

    }
    else {
      Swal.fire({
        title: '¡ERROR!',
        text: `No se pudo cambiar el estado`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  }

  validateEmailDomain(control: FormControl) {
    const email = control.value;
    if (email && email.indexOf('@') !== -1) {
      const domain = email.substring(email.lastIndexOf('@') + 1);
      if (domain === 'gmail.com' || domain === 'hotmail.com' || domain === 'outlook.com' || domain === 'unicesar.edu.co') {
        return null; // Válido
      }
      return { invalidDomain: true }; // Dominio no válido
    }
    return null; // No es un correo electrónico o no hay dominio para validar
  }


  SolicitarReembolso() {

    const transactionId = (this.formularioCompraOnline.get('transactionId')!.value);
    const correo = (this.formularioCompraOnline.get('correo')!.value);

    Swal.fire({
      title: 'Confirmar Estado',
      text: `¿Solicitar un reembolso, con el ID ${transactionId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // El usuario confirmó el reembolso, proceder con la solicitud
        const idTransactions: number = parseInt(transactionId);
        this.mercadoPagoService.SolicitarReembolso(idTransactions, correo).subscribe(
          (response: any) => {
            console.log('Respuesta del backend:', response);
            const message = response.message || response;
            Swal.fire({
              title: 'Solicitud Realizada.',
              text: 'Se a enviado su solicitud de reembolso.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });

            // this.buscarCompra();

          },
          (error: any) => {
            // this.token(transaccionid, estadoVenta);
          }
        );
      } else {
        // El usuario canceló el reembolso

        Swal.fire({
          title: 'Acción cancelada',
          text: 'No se pudo realizar la solicitud.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });

      }
    });

  }


}
