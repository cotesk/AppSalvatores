import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { VentasFiadasResponseDTO } from '../../../../Interfaces/ventasFiadasResponseDTO';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { VentaService } from '../../../../Services/venta.service';
import { PagoFiadoDTO } from '../../../../Interfaces/pagoFiadoDTO';
import { PagoFiadoDTO2 } from '../../../../Interfaces/pagoFiadoDTO2';
import * as CryptoJS from 'crypto-js';
import { ModalDetallePagosFiadosComponent } from '../modal-detalle-pagos-fiados/modal-detalle-pagos-fiados.component';

@Component({
  selector: 'app-modal-pagos-fiados',
  templateUrl: './modal-pagos-fiados.component.html',
  styleUrl: './modal-pagos-fiados.component.css'
})
export class ModalPagosFiadosComponent {

  ventas!: VentasFiadasResponseDTO;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';

  columnasTabla: string[] = ['numeroDocumento', 'fecha', 'total', 'acciones'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ModalPagosFiadosComponent>,
    private ventaService: VentaService,
   private dialog: MatDialog,
  ) {

    if (data && data.ventas) {
      this.ventas = data.ventas;
      this.dataSource.data = this.ventas.ventas;
    }

  } // O usa una interfaz con status, msg, value
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    // console.log('Datos recibidos en el modal:', this.data);
    this.ventas = this.data.value;
    this.dataSource.data = this.ventas.ventas;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  formatearNumero(numero: string): string {
    const valorNumerico = parseFloat(numero.replace(',', '.'));

    if (!isNaN(valorNumerico)) {
      return valorNumerico.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      return numero;
    }
  }

  formatearNumero2(valor: number): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(valor);
  }

   verDetalle(venta: any): void {
     // const dialogRef = this.dialog.open(ModalPagosFiadosComponent, {
     //   width: '970px', // Ancho del modal
     //   height: '550px',
     //   disableClose: true,
     //   data: venta
     // });
 
     // dialogRef.afterClosed().subscribe(result => {
     //   console.log('Modal cerrado');
     //   this.buscarVentas();
     // });
      console.log(venta);
 
     this.ventaService.obtenerVentasFiadasPorDocumento(venta.numeroDocumento!).subscribe({
       next: (respuesta) => {
         console.log(respuesta);
        const dialogRef = this.dialog.open(ModalDetallePagosFiadosComponent, {
           width: '700px',
           data: respuesta,
         });
 
        //  dialogRef.afterClosed().subscribe(result => {
        //    console.log('Modal cerrado');
        //    this.buscarVentas();
        //  });
 
 
       },
       error: (err) => {
         console.error(err);
         // Puedes mostrar un swal o snackbar
       },
     });
 
 
   }

  pagarVenta(venta: any) {




    Swal.fire({
      title: '¿Confirmar pago?',
      html: `
      <p>¿Desea pagar la venta fiada N° <strong>${venta.numeroDocumento}</strong>?</p>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <select id="metodoPago" class="swal2-select">
      <option value="">Seleccione un método</option>
      <option value="Efectivo">Efectivo</option>
      <option value="Transferencia">Transferencia</option>
    </select>
    <select id="tipoTransferencia" class="swal2-select" style="display: none;">
      <option value="">Seleccione una opción</option>
      <option value="Nequi">Nequi</option>
      <option value="Daviplata">Daviplata</option>
      <option value="Bancolombia">Bancolombia</option>
    </select>
  </div>
`,

      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, pagar',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const metodoPagoSelect = document.getElementById('metodoPago') as HTMLSelectElement;
        const tipoTransferenciaSelect = document.getElementById('tipoTransferencia') as HTMLSelectElement;

        metodoPagoSelect.addEventListener('change', () => {
          if (metodoPagoSelect.value === 'Transferencia') {
            tipoTransferenciaSelect.style.display = 'block';
          } else {
            tipoTransferenciaSelect.style.display = 'none';
            tipoTransferenciaSelect.value = '';
          }
        });
      },
      preConfirm: () => {
        const metodoPago = (document.getElementById('metodoPago') as HTMLSelectElement).value;
        const tipoPago = (document.getElementById('tipoTransferencia') as HTMLSelectElement).value;

        if (!metodoPago) {
          Swal.showValidationMessage('Seleccione un método de pago');
          return false;
        }

        if (metodoPago === 'Transferencia' && !tipoPago) {
          Swal.showValidationMessage('Seleccione una opción de transferencia');
          return false;
        }

        return { metodoPago, tipoPago };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {


        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
        }


        const dto: PagoFiadoDTO2 = {
          idVenta: venta.idVenta,
          idUsuario: idUsuario,
          metodoPago: result.value.metodoPago,
          tipoPago: result.value.tipoPago ?? 'Efectivo' // Si no se selecciona tipoPago, usar 'Efectivo' por defecto
        };
        console.log(dto);
        this.ventaService.pagarUnSoloFiadoPorCliente(dto).subscribe({
          next: (resp) => {


           this.dataSource.data = this.dataSource.data.filter(v => v.idVenta !== venta.idVenta);

            console.log('Respuesta del servidor:', this.dataSource.data);
            if (this.dataSource.data == undefined || this.dataSource.data.length === 0) {
              Swal.fire('Pagado', resp.msg, 'success').then(() => {
                this.dialogRef.close(); // 👈 cerrar modal
              });

            } else {
              Swal.fire('Pagado', resp.msg, 'success');
              // Remover venta del listado
              // this.dataSource.data = this.dataSource.data.filter(v => v.idVenta !== venta.idVenta);

              // ✅ Restar al total fiado
              this.ventas.totalFiado -= parseFloat(venta.totalTexto.replace(',', ''));

            }


          },
          error: (err) => {
            console.log(err);
            Swal.fire('Error', err.error ?? 'Este usuario no tiene una caja asignada para registrar el pago de esta venta fiada', 'error');
          }
        });
      }
    });
  }

  confirmarPagoTotal() {
    let tipoTransferenciaSeleccionada = ''; // Para poder usarlo luego

    Swal.fire({
      title: '¿Está seguro?',
      html: `
      <p>¿Desea pagar las venta fiada N° <strong>${this.ventas.nombreCliente}</strong>?</p>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <select id="metodoPago" class="swal2-select">
      <option value="">Seleccione un método</option>
      <option value="Efectivo">Efectivo</option>
      <option value="Transferencia">Transferencia</option>
    </select>
    <select id="tipoTransferencia" class="swal2-select" style="display: none;">
      <option value="">Seleccione una opción</option>
      <option value="Nequi">Nequi</option>
      <option value="Daviplata">Daviplata</option>
      <option value="Bancolombia">Bancolombia</option>
    </select>
  </div>
`,
      preConfirm: () => {
        const metodo = (document.getElementById('metodoPago') as HTMLSelectElement).value;
        const transferencia = (document.getElementById('tipoTransferencia') as HTMLSelectElement).value;

        if (!metodo) {
          Swal.showValidationMessage('Debe seleccionar un método de pago');
          return;
        }

        if (metodo === 'Transferencia' && !transferencia) {
          Swal.showValidationMessage('Debe seleccionar el tipo de transferencia');
          return;
        }

        tipoTransferenciaSeleccionada = transferencia;

        return {
          metodoPago: metodo,
        };
      },
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar pago',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const metodoPagoSelect = document.getElementById('metodoPago') as HTMLSelectElement;
        const tipoTransferenciaSelect = document.getElementById('tipoTransferencia') as HTMLSelectElement;

        metodoPagoSelect.addEventListener('change', () => {
          tipoTransferenciaSelect.style.display = metodoPagoSelect.value === 'Transferencia' ? 'block' : 'none';
        });
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const metodo = result.value.metodoPago;
        const esTransferencia = metodo === 'Transferencia';


        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
        }


        const dto: PagoFiadoDTO = {
          idCliente: this.ventas.ventas[0].idPedido,
          idUsuario: idUsuario,
          metodoPago: esTransferencia ? 'Transferencia' : 'Efectivo',
          tipoPago: esTransferencia ? tipoTransferenciaSeleccionada : metodo,
        };
        console.log('Datos del pago total:', dto);
        this.ventaService.pagarFiadoPorCliente(dto).subscribe({
          next: (resp) => {
            Swal.fire('Éxito', resp.msg, 'success').then(() => {
              this.dialogRef.close(); // 👈 cerrar modal
            });
            this.dataSource.data = [];
          },
          error: (err) => {
            Swal.fire('Error', err.error ?? 'Este usuario no tiene una caja asignada para registrar el pago de todas las ventas fiadas', 'error');
          }
        });
      }
    });
  }


}
