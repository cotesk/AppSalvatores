import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MercadoPagoService } from '../../../../Services/mercadoPago.service';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { transition } from '@angular/animations';
import { ProductoOnline } from '../../../../Interfaces/productosOnline';

import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { Transactions } from '../../../../Interfaces/transactions';

@Component({
  selector: 'app-mercado-pago-venta',
  templateUrl: './mercado-pago-venta.component.html',
  styleUrl: './mercado-pago-venta.component.css'
})
export class MercadoPagoVentaComponent {


  formularioCompraOnline: FormGroup;
  usuario: any;
  clienteData: any[] = []; // Cambia el tipo según tu modelo
  displayedColumns: string[] = ['identificationNumber', 'email', 'firstName', 'lastName', 'phone', 'tipoIdentificacion'];
  transactionData: any[] = [];
  displayedColumnsTransaccion: string[] = ['transactionId', 'amount', 'currency', 'createdDate', 'paymentMethod', 'paymentMethodType', 'numeroDocumento', 'estadoVenta', 'icono', 'cardNumber', 'cardType', 'cardNameCliente'];
  displayedColumnsProducto: string[] = ['transactionId', 'title', 'description', 'quantity', 'unitPrice'];
  dataSource = new MatTableDataSource<ProductoOnline>();
  dataSource2 = new MatTableDataSource<Transactions>();
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
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
  meses = [
    { nombre: 'Enero', value: 1 },
    { nombre: 'Febrero', value: 2 },
    { nombre: 'Marzo', value: 3 },
    { nombre: 'Abril', value: 4 },
    { nombre: 'Mayo', value: 5 },
    { nombre: 'Junio', value: 6 },
    { nombre: 'Julio', value: 7 },
    { nombre: 'Agosto', value: 8 },
    { nombre: 'Septiembre', value: 9 },
    { nombre: 'Octubre', value: 10 },
    { nombre: 'Noviembre', value: 11 },
    { nombre: 'Diciembre', value: 12 }
  ];



  constructor(private dialog: MatDialog,
    // private empresaService: EmpresaService,
    // private _usuarioServicio: UsuariosService,
    // private abonoService: AbonoService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private mercadoPagoService: MercadoPagoService,
    private _usuarioServicio: UsuariosService,
  ) {

    this.formularioCompraOnline = this.fb.group({


      transactionId: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(15)]],
      dia: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(2)]],
      mes: ['', [Validators.required, Validators.maxLength(2)]],
      anio: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(4)]],


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
    this.dataSource2.data = [];
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



    if (this.transactions == "todo") {


      this.limpiarCampos();

      let dia: number = this.formularioCompraOnline.value.dia;
      let mes: number = this.formularioCompraOnline.value.mes;
      let anio: number = this.formularioCompraOnline.value.anio;

      let diaString: any;
      let mesString: any;
      let anioString: any;

      if (dia == null) {
        diaString = dia;
      } else {
        diaString = dia.toString();
      }
      if (mes == null) {
        mesString = mes
      } else {
        mesString = mes.toString();
      }
      if (anio == null) {
        anioString = anio
      } else {
        anioString = anio.toString();
      }

      if (diaString == "" && mesString == "" && anioString == "") {
        Swal.fire({
          icon: 'error',
          title: 'ERROR!',
          text: `Por favor digite una fecha.`,
          confirmButtonText: 'Aceptar'
        });
        return

      } else if (diaString == "" && mesString == "" && anioString == null) {
        Swal.fire({
          icon: 'error',
          title: 'ERROR!',
          text: `Por favor digite una fecha.`,
          confirmButtonText: 'Aceptar'
        });
        return
      }
      else if (diaString == "" && mesString == null && anioString == "") {
        Swal.fire({
          icon: 'error',
          title: 'ERROR!',
          text: `Por favor digite una fecha.`,
          confirmButtonText: 'Aceptar'
        });
        return
      }
      else if (diaString == null && mesString == "" && anioString == "") {
        Swal.fire({
          icon: 'error',
          title: 'ERROR!',
          text: `Por favor digite una fecha.`,
          confirmButtonText: 'Aceptar'
        });
        return
      }
      else if (diaString == null && mesString == null && anioString == null) {
        Swal.fire({
          icon: 'error',
          title: 'ERROR!',
          text: `Por favor digite una fecha.`,
          confirmButtonText: 'Aceptar'
        });
        return
      }

      else {
        this.mercadoPagoService.getTransactionsByDate(dia, mes, anio).subscribe({
          next: (data) => {
            console.log(data); // Agregar este log
            if (data !== null)

              if (data && Array.isArray(data)) {
                // this.transactionData = data; // Asigna el array directamente
                this.dataSource2.data = data;
                this.dataSource2.paginator = this.paginator;

              } else {
                this.transactionData = [];
                // Swal.fire({
                //   icon: 'error',
                //   title: 'ERROR!',
                //   text: `No existe registro con esa fecha.`,
                //   confirmButtonText: 'Aceptar'
                // });
                // return
              }

          },
          error: (error) => {


            if (error.status == 401) {
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
                        this.buscarCompra();
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
                text: `No hay registro.`, // Incluye el número de cédula en el mensaje
                confirmButtonText: 'Aceptar'
              });

              this.limpiarCampos();
              return;
            }




          },
          complete: () => {



          },
        })

      }


    } else {

      this.limpiarCampos();



      const idCedula = (this.formularioCompraOnline.get('transactionId')!.value)

  

    }


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


          if (data && Array.isArray(data)) {
            this.dataSource2.data = data; // Asigna el array directamente si es un array
          } else {
            this.dataSource2.data = [data]; // Si no es un array, lo envuelve en un array
          }
        this.dataSource2.paginator = this.paginator;
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

  Estado(transactionId: number, estadoVenta: string) {
    if (estadoVenta === "Completada" || estadoVenta === "Preparación y Empaque") {
      // Mostrar mensaje de confirmación
      Swal.fire({
        title: 'Confirmar Estado',
        text: `¿Está seguro de que desea cambiar el estado de la venta, con el ID ${transactionId}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1337E8',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // El usuario confirmó el reembolso, proceder con la solicitud

          this.mercadoPagoService.EstadoCompra(transactionId).subscribe(
            (response: any) => {
              console.log('Respuesta del backend:', response);
              const message = response.message || response;
              Swal.fire({
                title: 'Estado Cambiado.',
                text: message,
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });

              // this.buscarCompra();

            },
            (error: any) => {
              this.token(transactionId, estadoVenta);
            },
            () => {
              this.buscarCompra();
            }
          );
        } else {
          // El usuario canceló el reembolso
          Swal.fire({
            title: 'Acción cancelada',
            text: 'No se ha procesado ningún cambio.',
            icon: 'info',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
    else if (estadoVenta === "Reembolsado") {
      Swal.fire({
        title: 'Reembolso Realizado',
        text: 'Este pedido ya fue reembolsado.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;

    }
    else if (estadoVenta === "En Camino") {


      // Swal.fire({
      //   title: '¡ERROR!',
      //   text: `No hay mas estado.`,
      //   icon: 'error',
      //   confirmButtonText: 'Aceptar'
      // });
      // return;

      this.Reembolso(transactionId);

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



  Reembolso(transactionId: any) {


    Swal.fire({
      title: 'Confirmar Estado',
      text: `¿Está seguro de que desea hacer este reembolso?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {


        this.mercadoPagoService.Reembolso(transactionId).subscribe(
          (response: any) => {
            console.log('Respuesta del backend:', response);
            const message = response.message || response;
            Swal.fire({
              title: 'Reembolso realizado',
              text: `El reembolso se realizó correctamente. Transaction ID: ${transactionId}`,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });


          },
          (error: any) => {
            // this.token(transaccionid, estadoVenta);
          }, () => {
            this.buscarCompra(); // Llamada a buscarVentas después de que el reembolso se haya completado
          }
        );





      } else {
        // El usuario canceló el reembolso

        Swal.fire({
          title: 'Acción cancelada',
          text: 'No se ha procesado ningún cambio.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });

      }
    });
  }

  token(purchase: number, estadoVenta: string) {
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
              this.EstadosinMensaje(purchase, estadoVenta);
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


  EstadosinMensaje(purchase: number, estadoVenta: string) {
    this.mercadoPagoService.EstadoCompra(purchase).subscribe(
      (response: any) => {

        const message = response.message || response;
        Swal.fire({
          title: 'Estado Cambiado.',
          text: message,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        this.buscarCompra();

      },
      (error: any) => {
        this.token(purchase, status);
      }
    );
  }

}
