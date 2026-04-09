import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PaymentService, RefundResponse } from '../../../../Services/payment.service';
import { PurchaseDTO } from '../../../../Interfaces/purchaseDTO';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-consultar-venta-online',
  templateUrl: './consultar-venta-online.component.html',
  styleUrl: './consultar-venta-online.component.css'
})
export class ConsultarVentaOnlineComponent {

  formularioVentaOnline: FormGroup;
  purchases: PurchaseDTO[] = [];
  displayedColumns: string[] = ['id', 'nameCliente', 'telefono', 'customerEmail', 'totalAmount', 'purchaseDate', 'status', 'accion', 'products'];
  dataSource = new MatTableDataSource<PurchaseDTO>(this.purchases);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  paymentId: string | null = null;
  purchaseId: number | null = null;
  errorMessage: string | null = null;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';

  constructor(private dialog: MatDialog,
    // private empresaService: EmpresaService,
    // private _usuarioServicio: UsuariosService,
    // private abonoService: AbonoService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private customerPurchasesService: PaymentService,
    private _usuarioServicio: UsuariosService,
  ) {

    this.formularioVentaOnline = this.fb.group({


      correo: ['', [Validators.required, Validators.email, this.validateEmailDomain]],

    });



  }

  ngOnInit(): void {

  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  buscarCompraCorreo(): void {
    const correo = this.formularioVentaOnline.get('correo')!.value;

    // Limpia la tabla antes de la nueva búsqueda
    this.purchases = [];
    this.dataSource.data = this.purchases;

    this.customerPurchasesService.getCustomerPurchases(correo).subscribe(
      (data) => {
        if (data && data.length > 0) {
          // Si existen compras, asignarlas y configurar el paginador
          this.purchases = data;
          this.dataSource.data = this.purchases;
          this.dataSource.paginator = this.paginator;
        } else {
          // Si no se encontraron compras, mostrar mensaje de error con Swal.fire
          Swal.fire({
            icon: 'error',
            title: 'Sin resultados',
            text: 'No se encontraron compras con el correo proporcionado.',
            confirmButtonText: 'Aceptar'
          });
          this.limpiarCampos();
          // Limpiar los datos de la tabla
          this.purchases = [];  // Limpia la lista de compras
          this.dataSource.data = [];  // Limpia los datos de la tabla
        }
      },
      (error) => {
        console.error('Error fetching purchases', error);
        // Mostrar mensaje de error con Swal.fire en caso de fallo de red o servidor
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se encontraron compras para el correo proporcionado.',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }
  limpiarCampos() {
    // Reiniciar el formulario



    this.dataSource.data = [];
  }

  formatDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Los meses son 0-indexados
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convertir a formato 12 horas

    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completada':
        return '#4caf50'; // Verde
      case 'Reembolsado':
        return '#f44336'; // Rojo
      case 'Preparación y Empaque':
        return '#ff9800'; // Amarillo
      case 'En Camino':
        return '#2196f3'; // Azul
      // Agrega más casos según los estados que manejes
      default:
        return '#9e9e9e'; // Gris para estados no definidos
    }
  }

  formatTelefono(telefono: string): string {
    if (telefono.startsWith('+57')) {
      // Insertar un espacio después de +57
      return telefono.replace('+57', '+57 ');
    }
    return telefono; // Retornar el número tal como está si no es +57
  }



  Estado(purchase: number, status: string) {
    if (status === "Completada" || status === "Preparación y Empaque" ) {
      // Mostrar mensaje de confirmación
      Swal.fire({
        title: 'Confirmar Estado',
        text: `¿Está seguro de que desea cambiar el estado de la venta, con el ID ${purchase}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1337E8',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // El usuario confirmó el reembolso, proceder con la solicitud

          this.customerPurchasesService.EstadoPurchasesId(purchase).subscribe(
            (response: any) => {

              const message = response.message || response;
              Swal.fire({
                title: 'Estado Cambiado.',
                text: message,
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });

              this.buscarCompraCorreo();

            },
            (error: any) => {
             this.token(purchase,status);
            }
          );
        } else {
          // El usuario canceló el reembolso
          Swal.fire({
            title: 'Acción cancelada',
            text: 'No se ha procesado ningún reembolso.',
            icon: 'info',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }else if(status === "En Camino"){


        Swal.fire({
          title: '¡ERROR!',
          text: `No hay mas estado.`,
          icon: 'error',
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


  token(purchase : number, status: string){
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
                      this.EstadosinMensaje(purchase,status);
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

  EstadosinMensaje(purchase: number, status: string){
    this.customerPurchasesService.EstadoPurchasesId(purchase).subscribe(
      (response: any) => {

        const message = response.message || response;
        Swal.fire({
          title: 'Estado Cambiado.',
          text: message,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        this.buscarCompraCorreo();

      },
      (error: any) => {
       this.token(purchase,status);
      }
    );
  }

  // procesarReembolso(purchase: PurchaseDTO, status: string) {
  //   if (status !== "Reembolsado") {
  //     // Mostrar mensaje de confirmación
  //     Swal.fire({
  //       title: 'Confirmar Reembolso',
  //       text: `¿Está seguro de que desea procesar el reembolso, con el ID ${purchase}?`,
  //       icon: 'warning',
  //       showCancelButton: true,
  //       confirmButtonColor: '#1337E8',
  //       cancelButtonColor: '#d33',
  //       confirmButtonText: 'Sí, procesar',
  //       cancelButtonText: 'Cancelar'
  //     }).then((result) => {
  //       if (result.isConfirmed) {
  //         // El usuario confirmó el reembolso, proceder con la solicitud
  //         this.customerPurchasesService.procesarReembolso(purchase).subscribe({
  //           next: (response: RefundResponse) => {
  //             this.paymentId = response.paymentId;
  //             this.purchaseId = response.purchaseId;
  //             this.errorMessage = null;
  //             const refundRequest = {
  //               paymentId: this.paymentId,
  //               purchaseId: this.purchaseId
  //             };

  //             // Hacer la solicitud de reembolso
  //             this.customerPurchasesService.refunds(refundRequest).subscribe(
  //               (response) => {
  //                 // Accede al mensaje de la respuesta
  //                 const message = response.message || response; // Maneja el caso en que sea directamente un string
  //                 Swal.fire({
  //                   title: 'Reembolso procesado!',
  //                   text: message,
  //                   icon: 'success',
  //                   confirmButtonText: 'Aceptar'
  //                 });

  //                 this.buscarCompraCorreo();
  //               },
  //               (error) => {
  //                 console.error(error);
  //                 Swal.fire({
  //                   title: 'Error al procesar el reembolso!',
  //                   text: error.error?.message || error.message || 'Ha ocurrido un error al procesar el reembolso.',
  //                   icon: 'error',
  //                   confirmButtonText: 'Aceptar'
  //                 });

  //                 this.buscarCompraCorreo();
  //               }
  //             );

  //           },
  //           error: (error) => {
  //             this.errorMessage = error; // Maneja el error
  //             this.paymentId = null; // Limpia el ID de pago en caso de error
  //           }
  //         });
  //       } else {
  //         // El usuario canceló el reembolso
  //         Swal.fire({
  //           title: 'Acción cancelada',
  //           text: 'No se ha procesado ningún reembolso.',
  //           icon: 'info',
  //           confirmButtonText: 'Aceptar'
  //         });
  //       }
  //     });
  //   } else {
  //     Swal.fire({
  //       title: '¡ERROR!',
  //       text: `Usted ya reembolsó esta compra`,
  //       icon: 'error',
  //       confirmButtonText: 'Aceptar'
  //     });
  //     return;
  //   }
  // }


}
