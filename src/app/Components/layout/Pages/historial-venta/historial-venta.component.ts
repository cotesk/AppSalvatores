import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { ModalDetalleVentaComponent } from '../../Modales/modal-detalle-venta/modal-detalle-venta.component';
import { VentaService } from './../../../../Services/venta.service';
import { Venta } from './../../../../Interfaces/venta';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { ConfirmacionAnulacionComponent } from '../../Modales/confirmacion-anulacion/confirmacion-anulacion.component';
import moment from 'moment';
import Swal from 'sweetalert2';
import { CajaService } from '../../../../Services/caja.service';
import { Caja } from '../../../../Interfaces/caja';

import { ModalCambioComponent } from '../../Modales/modal-cambio/modal-cambio.component';
import { CambioService } from '../../../../Services/cambio.service';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { HistorialResponse } from '../../../../Interfaces/HistorialResponse ';
import { MercadoPagoService } from '../../../../Services/mercadoPago.service';
import { ModalPagosFiadosComponent } from '../../Modales/modal-pagos-fiados/modal-pagos-fiados.component';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';
import { ModalEditarVentaComponent } from '../../Modales/modal-editar-venta/modal-editar-venta.component';
import { ResumenProducto } from '../../../../Interfaces/resumenProducto';
import { ResultadoAgrupado } from '../../../../Interfaces/resultadoAgrupado';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-historial-venta',
  templateUrl: './historial-venta.component.html',
  styleUrl: './historial-venta.component.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})
export class HistorialVentaComponent implements OnInit, AfterViewInit {

  formularioBusqueda: FormGroup;
  totalIngresos: string = "0";


  resumenProductos: ResumenProducto[] = [];
  // totalDineroCaja: number = 0;


  totalGeneral: number = 0;
  totalEfectivo: number = 0;
  totalTransferencia: number = 0;

  totalNequi: number = 0;
  totalDaviplata: number = 0;
  totalBancolombia: number = 0;

  totalCombinado: number = 0;
  totalCombinadoDos: number = 0;

  opcionesBusqueda: any[] = [
    { value: "fecha", descripcion: "Por Fechas" },
    { value: "numero", descripcion: "Numero Venta" },
    { value: 'cliente', descripcion: 'Cliente' }
  ]


  columnasTabla: string[] = ['idPedido', 'usuarioAtendio', 'nombreMesa', 'fechaRegistro', 'idCaja', 'numeroDocumento', 'estadoVenta', 'anulada',
    'tipoPago', 'tipoTranferencia', 'total', 'ver', 'editar', 'reporte'];
  datainicio: Venta[] = [];
  datosListaVenta = new MatTableDataSource(this.datainicio);
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  dataInicioCaja: Caja[] = [];
  dataListaCaja = new MatTableDataSource(this.dataInicioCaja);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  pageSize: number = 5;
  page: number = 1;
  totalPages: number = 0;
  searchTerm = '';


  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService,
    private cajaService: CajaService,
    private cambioService: CambioService,
    private _usuarioServicio: UsuariosService,
    private mercadoPagoService: MercadoPagoService,
    private signalRService: SignalRService,
    private router: Router
  ) {

    this.formularioBusqueda = this.fb.group({
      buscarPor: ['fecha'],
      numero: ['', [Validators.pattern('[0-9]*'), Validators.maxLength(7)]],
      // cliente: ['', [this.letrasSinNumerosValidator(), Validators.maxLength(40)]],
      fechaInicio: [''],
      fechaFin: ['']
    })

    this.formularioBusqueda.get('buscarPor')?.valueChanges.subscribe(value => {
      this.formularioBusqueda.patchValue({
        numero: "",
        fechaInicio: "",
        fechaFin: ""
      })
      this.datosListaVenta.data = [];
    })
    // Configurar validadores para la fecha de fin en función de la fecha de inicio
    this.formularioBusqueda.get('fechaInicio')?.valueChanges.subscribe((fechaInicio) => {
      const fechaFinControl = this.formularioBusqueda.get('fechaFin');
      if (fechaFinControl) {
        // Limpiar validadores actuales
        fechaFinControl.clearValidators();

        // Agregar nuevo validador que asegura que la fecha de fin no sea anterior a la fecha de inicio
        fechaFinControl.setValidators([Validators.required, this.fechaFinValidator(fechaInicio)]);

        // Actualizar el estado del control
        fechaFinControl.updateValueAndValidity();
      }
    });

    // Personalizar la función de filtro
    this.datosListaVenta.filterPredicate = (data: Venta, filter: string) => {
      const formattedFilter = filter.trim().toLowerCase();

      // Si el filtro es "no activo", comparar con esActivo == 0
      if (formattedFilter === 'no anulada') {
        return data.anulada === false;
      }

      // Si el filtro es "activo", comparar con esActivo == 1
      if (formattedFilter === 'anulada') {
        return data.anulada === true;
      }

      // Otros filtros basados en propiedades del objeto Proveedor
      return data.idCaja.toString().includes(formattedFilter.toString()) ||
        data.numeroDocumento!.toLowerCase().includes(formattedFilter) ||
        data.tipoPago.toLowerCase().includes(formattedFilter) ||
        data.totalTexto.toLowerCase().includes(formattedFilter) ||
        data.estadoVenta.toLowerCase().includes(formattedFilter);
      // data.deudaAbonoTexto.toLowerCase().includes(formattedFilter);
    };

  }


  // ngOnDestroy(): void {
  //   console.log('[PedidoComponent] Destruyendo...');

  //   this.listeners.forEach((unsubscribe, i) => {
  //     unsubscribe();
  //     console.log(`[PedidoComponent] Listener ${i} desuscrito`);
  //   });

  //   this.listeners = []; // Limpia el array
  //   // this.signalRService.stopConnection(); // si aplica
  // }

  // private listeners: (() => void)[] = [];

  ngOnInit(): void {

    // this.signalRService.startConnection();

    // this.signalRService.onVentaAnulado((pedido) => {
    //   const currentRoute = this.router.url;
    //   console.log('📦 Pedido anulado:', pedido);
    //   console.log(currentRoute);
    //   // Solo muestra mensaje si está en /pages/historial_Pedidos
    //   if (currentRoute === '/pages/historial_venta') {
    //     Swal.fire({
    //       toast: true,
    //       position: 'top-end', // O 'bottom-end'
    //       icon: 'success',
    //       title: `Se anulo una venta`,
    //       showConfirmButton: false,
    //       timer: 5000,
    //       timerProgressBar: true,
    //       didOpen: (toast) => {
    //         toast.addEventListener('mouseenter', Swal.stopTimer);
    //         toast.addEventListener('mouseleave', Swal.resumeTimer);
    //       }
    //     });
    //     this.buscarVentas();
    //   }
    // });


  }
  letrasSinNumerosValidator() {
    return (control: FormControl) => {
      const nombre = control.value;
      const contieneNumeros = /\d/.test(nombre); // Verifica si hay al menos un dígito
      return contieneNumeros ? { letrasSinNumerosValidator: true } : null;
    };
  }


  fechaFinValidator(fechaInicio: string) {
    return (control: any): { [key: string]: boolean } | null => {
      const fechaInicioMoment = moment(fechaInicio, 'DD/MM/YYYY', true);
      const fechaFinMoment = moment(control.value, 'DD/MM/YYYY', true);

      if (fechaInicioMoment.isValid() && fechaFinMoment.isValid() && fechaFinMoment.isBefore(fechaInicioMoment)) {
        return { 'fechaFinAntesDeInicio': true };
      }

      return null;
    };
  }

  ngAfterViewInit(): void {
    this.datosListaVenta.paginator = this.paginacionTabla;
    // this.loadVentas(this.page, this.pageSize);
  }

  aplicarFiltroTabla(event: Event) {
    const filtreValue = (event.target as HTMLInputElement).value;
    this.datosListaVenta.filter = filtreValue.trim().toLocaleLowerCase();
    // this.loadVentas(this.page, this.pageSize,this.searchTerm);
  }


  abrirModalPagoFiado(venta: Venta): void {
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
    // console.log(venta.idPedido);

    this._ventaServicio.obtenerTodasVentasFiadasPorDocumento(venta.idPedido!).subscribe({
      next: (respuesta) => {
        // console.log(respuesta);
        const dialogRef = this.dialog.open(ModalPagosFiadosComponent, {
          width: '700px',
          data: respuesta,
        });

        dialogRef.afterClosed().subscribe(result => {
          console.log('Modal cerrado');
          this.buscarVentas();
        });


      },
      error: (err) => {
        console.error(err);
        // Puedes mostrar un swal o snackbar
      },
    });


  }
  // verDetalleVenta2(_venta: Venta) {
  //   this.dialog.open(ModalDetalleVentaComponent, {
  //     data: _venta,
  //     disableClose: true,
  //     width: '900px',
  //   })
  // }

  private toNumber(valor: string | null | undefined): number {
    if (!valor) return 0;
    return Number(valor.replace(/\./g, '').replace(',', '.'));
  }

  calcularResumenPagos(ventas: any[]) {

    let totalGeneral = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;

    let nequi = 0;
    let daviplata = 0;
    let bancolombia = 0;

    let totalCombinado = 0;
    let totalCombinadoDos = 0;

    ventas.forEach(v => {

      if (v.anulada) return;

      const totalVenta = this.toNumber(v.totalTexto);
      const efectivo = this.toNumber(v.precioEfectivoTexto);
      const trans1 = this.toNumber(v.precioTransferenciaTexto);
      const trans2 = this.toNumber(v.precioTransferenciaSegundoTexto);

      totalGeneral += totalVenta;
      totalEfectivo += efectivo;

      const sumaTransferencias = trans1 + trans2;

      // 🔹 SOLO transferencia pura
      if (v.tipoPago === 'Transferencia') {
        totalTransferencia += totalVenta;

        if (v.tipoTranferencia.includes('Nequi')) nequi += totalVenta;
        if (v.tipoTranferencia.includes('Daviplata')) daviplata += totalVenta;
        if (v.tipoTranferencia.includes('Bancolombia')) bancolombia += totalVenta;
      }

      // 🔹 Combinado (efectivo + 1 transferencia)
      if (v.tipoPago === 'Combinado') {
        totalCombinado += totalVenta;
        totalTransferencia += trans1;

        if (v.tipoTranferencia.includes('Nequi')) nequi += trans1;
        if (v.tipoTranferencia.includes('Daviplata')) daviplata += trans1;
        if (v.tipoTranferencia.includes('Bancolombia')) bancolombia += trans1;
      }

      // 🔹 CombinadoDos (2 transferencias)
      if (v.tipoPago === 'CombinadoDos') {
        totalCombinadoDos += totalVenta;
        totalTransferencia += sumaTransferencias;

        const medios = v.tipoTranferencia.split('/');

        if (medios[0]?.includes('Nequi')) nequi += trans1;
        if (medios[0]?.includes('Daviplata')) daviplata += trans1;
        if (medios[0]?.includes('Bancolombia')) bancolombia += trans1;

        if (medios[1]?.includes('Nequi')) nequi += trans2;
        if (medios[1]?.includes('Daviplata')) daviplata += trans2;
        if (medios[1]?.includes('Bancolombia')) bancolombia += trans2;
      }

      // 🔹 Solo efectivo
      if (v.tipoPago === 'Efectivo') {
        totalEfectivo += totalVenta;
      }

    });

    return {
      totalGeneral,
      totalEfectivo,
      totalTransferencia,
      nequi,
      daviplata,
      bancolombia,
      totalCombinado,
      totalCombinadoDos
    };
  }

  agruparProductos(ventas: any[]): ResultadoAgrupado {

    const mapa = new Map<number, ResumenProducto>();

    ventas.forEach(venta => {
      if (venta.anulada) return;

      venta.detalleVenta.forEach((item: any) => {

        const precio = parseFloat(
          item.precioTexto.replace('.', '').replace(',', '.')
        );

        if (!mapa.has(item.idProducto)) {
          mapa.set(item.idProducto, {
            idProducto: item.idProducto,
            descripcion: item.descripcionProducto,
            cantidadTotal: 0,
            precioUnitario: precio,
            totalProducto: 0
          });
        }

        const producto = mapa.get(item.idProducto)!;
        producto.cantidadTotal += item.cantidad;
        producto.totalProducto = producto.cantidadTotal * producto.precioUnitario;
      });
    });

    const resumenProductos = Array.from(mapa.values());

    const totalGeneral = resumenProductos.reduce(
      (sum, p) => sum + p.totalProducto,
      0
    );

    return {
      resumenProductos,
      totalGeneral
    };
  }

  buscarVentas() {

    // Swal.fire({
    //   title: 'Buscando...',
    //   allowOutsideClick: false,
    //   didOpen: () => {
    //     Swal.showLoading();
    //   }
    // });


    if (
      (this.formularioBusqueda.value.buscarPor === 'numero' &&
        (this.formularioBusqueda.value.numero === '' || this.formularioBusqueda.value.numero === '0')) ||
      (this.formularioBusqueda.value.buscarPor === 'cliente' &&
        (!this.formularioBusqueda.value.cliente || this.formularioBusqueda.value.cliente.trim() === ''))
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `Debe ingresar un ${this.formularioBusqueda.value.buscarPor === 'numero' ? 'número de venta' : 'nombre de cliente'} válido.`,
      });
      return;
    }
    else {

      // Swal.fire({
      //   icon: 'success',
      //   title: 'Ok',
      //   text: `Se estan buscando los productos.`,
      // });

      // Swal.fire({
      //   title: 'Buscando...',
      //   allowOutsideClick: false,
      //   html: '<img src="assets/Images/bean-mr.gif" style="width: 200px; height: 200px;">',
      //   didOpen: () => {
      //     Swal.showLoading();
      //     Swal.close();
      //   },

      // });


      let _fechaInicio: string = "";
      let _fechaFin: string = "";

      if (this.formularioBusqueda.value.buscarPor === "fecha") {
        const fechaInicioMoment = moment(this.formularioBusqueda.value.fechaInicio, 'DD/MM/YYYY', true);
        const fechaFinMoment = moment(this.formularioBusqueda.value.fechaFin, 'DD/MM/YYYY', true);

        if (!fechaInicioMoment.isValid() || !fechaFinMoment.isValid()) {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: `Debe ingresar ambas fechas válidas`,
          });
          // this._utilidadServicio.mostrarAlerta("Debe ingresar ambas fechas válidas", 'Oops!');
          return;
        }

        // if (fechaInicioMoment.isAfter(fechaFinMoment)) {
        //   this._utilidadServicio.mostrarAlerta('La fecha de inicio no puede ser después de la fecha de fin', 'Oops!');
        //   return;
        // }

        _fechaInicio = fechaInicioMoment.format('DD/MM/YYYY');
        _fechaFin = fechaFinMoment.format('DD/MM/YYYY');
      }
      // console.log(this.formularioBusqueda.value.buscarPor);
      // console.log(this.formularioBusqueda.value.numero);



      let UnoSolo;
      if (this.formularioBusqueda.value.buscarPor === 'numero') {
        UnoSolo = this.formularioBusqueda.value.numero;
        console.log('Buscando por número de venta:', UnoSolo);
      } else if (this.formularioBusqueda.value.buscarPor === 'cliente') {
        UnoSolo = this.formularioBusqueda.value.cliente;
        console.log('Buscando por cliente:', UnoSolo);
      } else {

      }



      this._ventaServicio.historial(
        this.formularioBusqueda.value.buscarPor,
        UnoSolo,
        _fechaInicio,
        _fechaFin,
      ).subscribe({
        next: (data) => {
          // console.log('Respuesta del servidor:', data);
          // Swal.close();
          if (data.status) {
            if (data.value.length === 0) {

              Swal.fire({
                icon: 'info',
                title: 'Información',
                text: `No se encontraron venta con el número ${this.formularioBusqueda.value.numero}.`,
              });
              this.datosListaVenta.data = data.value;
              return

            } else {



              this.datosListaVenta.data = data.value;


              // resumen agrupado
              // const resumenPagos = this.calcularResumenPagos(data.value);

              // const resultado = this.agruparProductos(data.value);

              // this.resumenProductos = resultado.resumenProductos;

              // this.totalGeneral = resumenPagos.totalGeneral;
              // this.totalEfectivo = resumenPagos.totalEfectivo;
              // this.totalTransferencia = resumenPagos.totalTransferencia;

              // this.totalNequi = resumenPagos.nequi;
              // this.totalDaviplata = resumenPagos.daviplata;
              // this.totalBancolombia = resumenPagos.bancolombia;

              // this.totalCombinado = resumenPagos.totalCombinado;
              // this.totalCombinadoDos = resumenPagos.totalCombinadoDos;

              // Swal.fire({
              //   icon: 'question',
              //   title: 'Reporte de ventas',
              //   text: '¿Deseas generar el reporte en PDF del día?',
              //   showCancelButton: true,
              //   confirmButtonColor: '#1337E8',
              //   cancelButtonColor: '#d33',
              //   confirmButtonText: 'Sí, generar',
              //   cancelButtonText: 'No'
              // }).then((r) => {
              //   if (r.isConfirmed) {
              //     this.generarPdfVentas(_fechaInicio, _fechaFin);
              //   }
              // });


              // console.log("RESUMEN PRODUCTOS:", this.resumenProductos);
              // console.log("TOTAL GENERAL PEDIDOS:", this.totalDineroCaja);

            }

          }
          else
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No se encontraron datos`,
            });
          // this._utilidadServicio.mostrarAlerta("No se encontraron datos", 'Oops!');
          console.error('El servidor devolvió false en status. Detalles:', data.msg);
        },
        error: (e) => {

          // Swal.close();
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

                //console.log('Usuario obtenido:', usuario);
                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    //console.log('Token actualizado:', response.token);
                    // Guardar el nuevo token de acceso en el almacenamiento local
                    localStorage.setItem('authToken', response.token);
                    this.buscarVentas();
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
        complete: () => {
          // Swal.close();
        }
      })

    }


  }


  buscarVentasReporte() {

    // Swal.fire({
    //   title: 'Buscando...',
    //   allowOutsideClick: false,
    //   didOpen: () => {
    //     Swal.showLoading();
    //   }
    // });


    if (
      (this.formularioBusqueda.value.buscarPor === 'numero' &&
        (this.formularioBusqueda.value.numero === '' || this.formularioBusqueda.value.numero === '0')) ||
      (this.formularioBusqueda.value.buscarPor === 'cliente' &&
        (!this.formularioBusqueda.value.cliente || this.formularioBusqueda.value.cliente.trim() === ''))
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `Debe ingresar un ${this.formularioBusqueda.value.buscarPor === 'numero' ? 'número de venta' : 'nombre de cliente'} válido.`,
      });
      return;
    }
    else {

      // Swal.fire({
      //   icon: 'success',
      //   title: 'Ok',
      //   text: `Se estan buscando los productos.`,
      // });

      // Swal.fire({
      //   title: 'Buscando...',
      //   allowOutsideClick: false,
      //   html: '<img src="assets/Images/bean-mr.gif" style="width: 200px; height: 200px;">',
      //   didOpen: () => {
      //     Swal.showLoading();
      //     Swal.close();
      //   },

      // });


      let _fechaInicio: string = "";
      let _fechaFin: string = "";

      if (this.formularioBusqueda.value.buscarPor === "fecha") {
        const fechaInicioMoment = moment(this.formularioBusqueda.value.fechaInicio, 'DD/MM/YYYY', true);
        const fechaFinMoment = moment(this.formularioBusqueda.value.fechaFin, 'DD/MM/YYYY', true);

        if (!fechaInicioMoment.isValid() || !fechaFinMoment.isValid()) {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: `Debe ingresar ambas fechas válidas`,
          });
          // this._utilidadServicio.mostrarAlerta("Debe ingresar ambas fechas válidas", 'Oops!');
          return;
        }

        // if (fechaInicioMoment.isAfter(fechaFinMoment)) {
        //   this._utilidadServicio.mostrarAlerta('La fecha de inicio no puede ser después de la fecha de fin', 'Oops!');
        //   return;
        // }

        _fechaInicio = fechaInicioMoment.format('DD/MM/YYYY');
        _fechaFin = fechaFinMoment.format('DD/MM/YYYY');
      }
      // console.log(this.formularioBusqueda.value.buscarPor);
      // console.log(this.formularioBusqueda.value.numero);



      let UnoSolo;
      if (this.formularioBusqueda.value.buscarPor === 'numero') {
        UnoSolo = this.formularioBusqueda.value.numero;
        console.log('Buscando por número de venta:', UnoSolo);
      } else if (this.formularioBusqueda.value.buscarPor === 'cliente') {
        UnoSolo = this.formularioBusqueda.value.cliente;
        console.log('Buscando por cliente:', UnoSolo);
      } else {

      }



      this._ventaServicio.historial(
        this.formularioBusqueda.value.buscarPor,
        UnoSolo,
        _fechaInicio,
        _fechaFin,
      ).subscribe({
        next: (data) => {
          // console.log('Respuesta del servidor:', data);
          // Swal.close();
          if (data.status) {
            if (data.value.length === 0) {

              Swal.fire({
                icon: 'info',
                title: 'Información',
                text: `No se encontraron venta con el número ${this.formularioBusqueda.value.numero}.`,
              });
              this.datosListaVenta.data = data.value;
              return

            } else {



              this.datosListaVenta.data = data.value;


              // resumen agrupado
              const resumenPagos = this.calcularResumenPagos(data.value);

              const resultado = this.agruparProductos(data.value);

              this.resumenProductos = resultado.resumenProductos;

              this.totalGeneral = resumenPagos.totalGeneral;
              this.totalEfectivo = resumenPagos.totalEfectivo;
              this.totalTransferencia = resumenPagos.totalTransferencia;

              this.totalNequi = resumenPagos.nequi;
              this.totalDaviplata = resumenPagos.daviplata;
              this.totalBancolombia = resumenPagos.bancolombia;

              this.totalCombinado = resumenPagos.totalCombinado;
              this.totalCombinadoDos = resumenPagos.totalCombinadoDos;

              Swal.fire({
                icon: 'question',
                title: 'Reporte de ventas',
                text: '¿Deseas generar el reporte en PDF del día?',
                showCancelButton: true,
                confirmButtonColor: '#1337E8',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, generar',
                cancelButtonText: 'No'
              }).then((r) => {
                if (r.isConfirmed) {
                  this.generarPdfVentas(_fechaInicio, _fechaFin);
                }
              });


              // console.log("RESUMEN PRODUCTOS:", this.resumenProductos);
              // console.log("TOTAL GENERAL PEDIDOS:", this.totalDineroCaja);

            }

          }
          else
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No se encontraron datos`,
            });
          // this._utilidadServicio.mostrarAlerta("No se encontraron datos", 'Oops!');
          console.error('El servidor devolvió false en status. Detalles:', data.msg);
        },
        error: (e) => {

          // Swal.close();
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

                //console.log('Usuario obtenido:', usuario);
                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    //console.log('Token actualizado:', response.token);
                    // Guardar el nuevo token de acceso en el almacenamiento local
                    localStorage.setItem('authToken', response.token);
                    this.buscarVentas();
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
        complete: () => {
          // Swal.close();
        }
      })

    }


  }

  generarPdfVentas(fechaInicio: string, fechaFin: string) {

    const doc = new jsPDF();

    const format = (n: number) => `$${n.toLocaleString('es-CO')}`;

    // ===== TITULO CENTRADO =====
    doc.setFontSize(16);
    doc.text('REPORTE DE VENTAS', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Fecha: ${fechaInicio} - ${fechaFin}`, 14, 25);


    const filas = this.resumenProductos.map((p, i) => [
      i + 1,                       
      p.descripcion,
      p.cantidadTotal,
      format(p.precioUnitario),
      format(p.totalProducto)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Producto', 'Cantidad', 'Precio Unitario', 'Total']],
      body: filas,
      styles: {
        fontSize: 9,
        halign: 'center'
      },
      headStyles: {
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10 },     
        1: { halign: 'center' },    
        4: { halign: 'center' }     
      }
    });

    // ===== POSICION FINAL DE TABLA =====
    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // ===== RESUMEN DE CAJA =====
    // ===== TITULO =====
    doc.setFontSize(12);
    doc.text('RESUMEN DE CAJA', doc.internal.pageSize.getWidth() / 2, finalY + 12, { align: 'center' });

    const resumenFilas = [
      ['Total General', format(this.totalGeneral)],
      ['Total Efectivo', format(this.totalEfectivo)],
      ['Total Transferencias', format(this.totalTransferencia)],
      ['Nequi', format(this.totalNequi)],
      ['Daviplata', format(this.totalDaviplata)],
      ['Bancolombia', format(this.totalBancolombia)],
      ['Combinado', format(this.totalCombinado)],
      ['Combinado Dos', format(this.totalCombinadoDos)],
    ];

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Concepto', 'Valor']],
      body: resumenFilas,

      styles: {
        fontSize: 10,
        halign: 'center',
        cellPadding: 3
      },

      headStyles: {
        halign: 'center',
        fontStyle: 'bold'
      },

      columnStyles: {
        0: { halign: 'left' },   // concepto
        1: { halign: 'center' }   // dinero alineado como contabilidad
      },

      // theme: 'grid' // 👈 bordes tipo tabla real
    });


    // ===== ABRIR EN NUEVA PESTAÑA =====
    const url = doc.output('bloburl');
    window.open(url, '_blank');
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
  actualizarCaja(caja: Caja): void {
    this.cajaService.obtenerCajaPorUsuario(caja.idUsuario).subscribe(c => {
      if (c) {
        // Actualiza los valores de ingresosTexto y metodoPago en la caja encontrada
        c.devolucionesTexto = caja.devolucionesTexto;
        c.ingresosTexto = caja.ingresosTexto;
        c.transaccionesTexto = caja.transaccionesTexto;
        c.metodoPago = caja.metodoPago;
        // Llama al servicio para actualizar la caja en la base de datos
        this.cajaService.editarDevoluiones(c).subscribe(() => {
          console.log(`Caja actualizada para el usuario ${caja.idUsuario}: ingresosTexto = ${caja.devolucionesTexto}`);
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

            //console.log('Usuario obtenido:', usuario);
            let refreshToken = usuario.refreshToken

            // Manejar la renovación del token
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                //console.log('Token actualizado:', response.token);
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

  verDetalleVenta(_venta: Venta) {
    // console.log(_venta);
    this.dialog.open(ModalDetalleVentaComponent, {
      data: _venta,
      disableClose: true,
      //  width: '1200px',
      width: '90vw',  // Ajusta el ancho del modal al 80% de la pantalla
      height: '80vh',  // Ajusta la altura al 80% de la pantalla
      maxWidth: '100vw',
      maxHeight: '100vh',
    })
  }



  abrirModalEditarVenta(data: any) {
    const dialogRef = this.dialog.open(ModalEditarVentaComponent, {
      width: "400px",
      height: "60vh",
      disableClose: true,   // ⛔ NO cerrar por fuera ni ESC
      autoFocus: false,
      data
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.buscarVentas();
      }
    });
  }

  Reembolso(numeroDocumento: any) {


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


        this.mercadoPagoService.BuscarNumeroDocumento(numeroDocumento).subscribe(
          (response: any) => {
            console.log('Respuesta del backend:', response);
            // Obtener el transactionId desde la respuesta
            const transactionId = response.transactionId;

            if (transactionId) {
              console.log('Transaction ID:', transactionId);

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
                  this.buscarVentas(); // Llamada a buscarVentas después de que el reembolso se haya completado
                }
              );



            } else {
              Swal.fire({
                title: 'Error',
                text: 'No se pudo obtener el transactionId.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }

          },
          (error: any) => {
            // this.token(transaccionid, estadoVenta);
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

  // anularVenta(idVenta: number) {
  //   console.log(`Intentando anular la venta con ID ${idVenta}`);

  //   if (confirm('¿Está seguro de que desea anular esta venta?')) {
  //     console.log('Confirmado. Iniciando solicitud para anular la venta...');

  //     this._ventaServicio.anularVenta(idVenta).subscribe({
  //       next: (data) => {
  //         console.log('Respuesta del servidor:', data);

  //         if (data.status) {
  //           this._utilidadServicio.mostrarAlerta(data.msg, 'Éxito');
  //           // Recargar los datos después de anular la venta
  //           this.buscarVentas();
  //         } else {
  //           this._utilidadServicio.mostrarAlerta(data.msg, 'Error');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error al anular la venta:', error);
  //         this._utilidadServicio.mostrarAlerta('Error al anular la venta', 'Error');
  //       },
  //       complete: () => {
  //         console.log('Solicitud de anulación de venta completada.');
  //       },
  //     });
  //   } else {
  //     console.log('Anulación de venta cancelada por el usuario.');
  //   }
  // }



  abrirModalCambio(venta: Venta): void {
    const dialogRef = this.dialog.open(ModalCambioComponent, {
      width: '100vw', // Ancho del modal
      // height: '45vw',
      height: '80vh',
      disableClose: true,
      data: venta
    });

    // Suscribirse al evento 'afterClosed' para obtener datos cuando se cierre el modal
    dialogRef.afterClosed().subscribe(result => {
      // Aquí puedes manejar los datos que devuelve el modal después de cerrarse
      console.log('Datos del modal de cambio:', result);
      this.buscarVentas();
    });
  }

  anularVenta(venta: any, idVenta: number, tipoPago: string, numeroDocumento: string) {

    console.log(venta);

    let idUsuario: number = 0;
    let idCaja: number = 0;
    let saldoInicial: string = "";
    let ingresos: string = "";
    let gastos: string = "";
    let devoluciones: string = "";
    let prestamos: string = "";
    let fechaRegistro: Date | null = null;
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
        next: (caja: Caja | null) => {
          if (caja !== null) {
            // Si se encuentra una caja abierta para el idUsuario
            idCaja = caja.idCaja;
            saldoInicial = caja.saldoInicial!;
            ingresos = caja.ingresos!;
            gastos = caja.gastos!;
            devoluciones = caja.devoluciones!;
            prestamos = caja.prestamos!;
            fechaRegistro = (caja.fechaRegistro!);
            // const cajaActualizada: Caja = {
            //   idCaja: idCaja,
            //   transaccionesTexto: ''  ,
            //   ingresosTexto: '',
            //   metodoPago: '',
            //   estado: '',
            //   nombreUsuario: '',
            //   idUsuario: idUsuario
            // };
            //  this.actualizarCaja(cajaActualizada);




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


          // Obtener el idUsuario del localStorage
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          if (datosDesencriptados !== null) {
            const usuario = JSON.parse(datosDesencriptados);
            idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

            this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
              (usuario: any) => {

                // //console.log('Usuario obtenido:', usuario);
                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    // //console.log('Token actualizado:', response.token);
                    // Guardar el nuevo token de acceso en el almacenamiento local
                    localStorage.setItem('authToken', response.token);
                    this.anularVenta(venta, idVenta, tipoPago, numeroDocumento);
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
        complete: () => {

          const fechaSeleccionada = this.datosListaVenta.data.find(v => v.idVenta === idVenta);

          // Nueva expresión regular para capturar día, mes, año, hora y minutos con AM/PM
          const partesFecha = fechaSeleccionada!.fechaRegistro!.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)/);

          if (partesFecha) {
            // Extrae los componentes de la fecha
            const dia = parseInt(partesFecha[1], 10);
            const mes = parseInt(partesFecha[2], 10) - 1; // Meses en JavaScript son base 0
            const anio = parseInt(partesFecha[3], 10);
            let horas = parseInt(partesFecha[4], 10);
            const minutos = parseInt(partesFecha[5], 10);
            const ampm = partesFecha[6];

            // Ajuste para formato 24 horas
            if (ampm === 'PM' && horas < 12) horas += 12;
            if (ampm === 'AM' && horas === 12) horas = 0;

            // Crear el objeto Date
            const fechaRegistro = new Date(anio, mes, dia, horas, minutos);
            const fechaActual = new Date();

            const diferenciaMilisegundos = fechaActual.getTime() - fechaRegistro.getTime();
            const diferenciaDias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

            // console.log('Fecha de registro:', fechaRegistro.toLocaleDateString());
            // console.log('Fecha actual:', fechaActual.toLocaleDateString());
            // console.log('Milisegundos de diferencia:', diferenciaMilisegundos);
            // console.log('Diferencia en días:', diferenciaDias);

            if (diferenciaDias > 15) {
              const diasExcedidos = diferenciaDias - 15;

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `La fecha de registro ha pasado los 15 días por ${diasExcedidos} día(s),
                             no se puede anular la venta por las políticas de cambio.`,
                confirmButtonText: 'Aceptar'
              });
              return;
            }
          } else {
            console.error('Formato de fecha no válido:', fechaSeleccionada!.fechaRegistro);
          }


          const ventaSeleccionada = this.datosListaVenta.data.find(v => v.idVenta === idVenta);
          const totalDevolucionDecimal: number = ventaSeleccionada ? parseFloat(ventaSeleccionada.totalTexto) : 0;
          // const totalDevolucion: string = totalDevolucionDecimal.toString();

          let suma: number = parseInt(ingresos) + parseInt(saldoInicial);
          let resta: number = parseInt(devoluciones);
          let sumaTotal: number = suma - resta;
          if (totalDevolucionDecimal > sumaTotal) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'La caja no cuenta con ese dinero sufieciente para cancelar esa venta',
              confirmButtonText: 'Aceptar'
            });
            // Detener la ejecución
            return;


          } else {

            this.cambioService.obtenerCambiosIdVenta(idVenta).pipe(
              take(1), // Tomar solo el primer valor y luego completar la suscripción
              catchError(error => {
                console.error('Error al obtener cambios:', error);
                // Retornar un observable vacío en caso de error
                return of(null);
              })
            ).subscribe(c => {
              if (c) {
                // Si se encuentra un registro de cambio de producto, mostrar un mensaje de error y detener la ejecución
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'No puede anular una venta con un registro de cambio de producto ya existente.',
                  confirmButtonText: 'Aceptar'
                });
              } else {
                // Si no se encuentra ningún registro de cambio de producto, continuar con el proceso de anulación de venta
                this.procesoAnulacionVenta(venta, idVenta, tipoPago, numeroDocumento);
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

                    //console.log('Usuario obtenido:', usuario);
                    let refreshToken = usuario.refreshToken

                    // Manejar la renovación del token
                    this._usuarioServicio.renovarToken(refreshToken).subscribe(
                      (response: any) => {
                        //console.log('Token actualizado:', response.token);
                        // Guardar el nuevo token de acceso en el almacenamiento local
                        localStorage.setItem('authToken', response.token);
                        this.anularVenta(venta, idVenta, tipoPago, numeroDocumento);
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



        }
      });

    } else {
      console.log('No se encontró el idUsuario en el localStorage');
    }


  }

  // anularVenta2(idVenta: number, tipoPago: string, numeroDocumento: string) {
  //   this.cambioService.obtenerCambiosIdVenta(idVenta).pipe(
  //     take(1), // Tomar solo el primer valor y luego completar la suscripción
  //     catchError(error => {
  //       console.error('Error al obtener cambios:', error);
  //       // Retornar un observable vacío en caso de error
  //       return of(null);
  //     })
  //   ).subscribe(c => {
  //     if (c) {
  //       // Si se encuentra un registro de cambio de producto, mostrar un mensaje de error y detener la ejecución
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Error',
  //         text: 'No puede anular una venta con un registro de cambio de producto ya existente.',
  //         confirmButtonText: 'Aceptar'
  //       });
  //     } else {
  //       // Si no se encuentra ningún registro de cambio de producto, continuar con el proceso de anulación de venta
  //       this.procesoAnulacionVenta(idVenta, tipoPago, numeroDocumento);
  //     }
  //   });
  // }
  procesoAnulacionVenta(venta: any, idVenta: number, tipoPago: string, numeroDocumento: string) {



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
        next: (caja: Caja | null) => {
          if (caja !== null) {
            // Si se encuentra una caja abierta para el idUsuario
            idCaja = caja.idCaja;

            // const cajaActualizada: Caja = {
            //   idCaja: idCaja,
            //   transaccionesTexto: ''  ,
            //   ingresosTexto: '',
            //   metodoPago: '',
            //   estado: '',
            //   nombreUsuario: '',
            //   idUsuario: idUsuario
            // };
            //  this.actualizarCaja(cajaActualizada);




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


          // Obtener el idUsuario del localStorage
          const usuarioString = localStorage.getItem('usuario');
          const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
          const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
          if (datosDesencriptados !== null) {
            const usuario = JSON.parse(datosDesencriptados);
            idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

            this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
              (usuario: any) => {

                //console.log('Usuario obtenido:', usuario);
                let refreshToken = usuario.refreshToken

                // Manejar la renovación del token
                this._usuarioServicio.renovarToken(refreshToken).subscribe(
                  (response: any) => {
                    //console.log('Token actualizado:', response.token);
                    // Guardar el nuevo token de acceso en el almacenamiento local
                    localStorage.setItem('authToken', response.token);
                    this.procesoAnulacionVenta(venta, idVenta, tipoPago, numeroDocumento);
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
        complete: () => {

          // Obtener la venta correspondiente en los datos de la lista
          const ventaSeleccionada = this.datosListaVenta.data.find(v => v.idVenta === idVenta);
          const TipoPagoSeleccionado = this.datosListaVenta.data.find(v => v.tipoPago === tipoPago);


          // Verificar si la venta seleccionada existe y si su fecha de registro es anterior a la fecha actual
          // if (ventaSeleccionada && moment(ventaSeleccionada.fechaRegistro, 'DD/MM/YYYY').isBefore(moment(), 'day')) {
          //   // Mostrar un mensaje de error indicando que no se puede anular una venta con fecha pasada
          //   Swal.fire({
          //     icon: 'error',
          //     title: 'Error',
          //     text: 'No se puede anular una venta con fecha pasada.',
          //     confirmButtonText: 'Aceptar'
          //   });
          //   return; // Detener la ejecución del método
          // }
          // funcional
          //  if (TipoPagoSeleccionado?.tipoPago =="Efectivo") {
          //   Swal.fire({
          //     icon: 'error',
          //     title: 'Error',
          //     text: 'Es efectivo',
          //     confirmButtonText: 'Aceptar'
          //   });
          //   return; // Detener la ejecución
          // }

          // Obtener el idCaja asociado a la venta que se desea anular
          const idCajaVenta = ventaSeleccionada?.idCaja;
          let idcajas: number;
          if (idCaja == idCajaVenta) {
            idcajas = idCajaVenta;
          } else {
            idcajas = idCaja;
          }
          let totalDevolucionDecimal: number
          let totalDevolucion: string
          let numeroDocumentos: string
          let precioEfectivoTexto: number
          let precioTransferenciaTexto: number
          let precioTransferenciaSegundoTexto: number
          let totalDevolucionTransferencia: string
          let totalDevolucionEfectivo: string
          let totalDevolucionTransferenciaSegundo: string
          // Verificar si idCajaVenta no es undefined
          if (idcajas !== null) {


            // Obtener el total de la venta
            if (tipoPago == "Combinado") {
              totalDevolucionDecimal = ventaSeleccionada ? parseFloat(ventaSeleccionada.totalTexto) : 0;
              totalDevolucion = totalDevolucionDecimal.toString();

              precioEfectivoTexto = ventaSeleccionada ? parseFloat(ventaSeleccionada.precioEfectivoTexto) : 0;
              totalDevolucionEfectivo = precioEfectivoTexto.toString();

              precioTransferenciaTexto = ventaSeleccionada ? parseFloat(ventaSeleccionada.precioTransferenciaTexto) : 0;
              totalDevolucionTransferencia = precioTransferenciaTexto.toString();

              numeroDocumentos = numeroDocumento;

            }
            else if (tipoPago == "CombinadoDos") {
              totalDevolucionDecimal = ventaSeleccionada ? parseFloat(ventaSeleccionada.totalTexto) : 0;
              totalDevolucion = totalDevolucionDecimal.toString();



              precioTransferenciaTexto = ventaSeleccionada ? parseFloat(ventaSeleccionada.precioTransferenciaTexto) : 0;
              totalDevolucionTransferencia = precioTransferenciaTexto.toString();

              precioTransferenciaSegundoTexto = ventaSeleccionada ? parseFloat(ventaSeleccionada.precioTransferenciaSegundoTexto) : 0;
              totalDevolucionTransferenciaSegundo = precioTransferenciaSegundoTexto.toString();

              numeroDocumentos = numeroDocumento;

            }
            else {
              totalDevolucionDecimal = ventaSeleccionada ? parseFloat(ventaSeleccionada.totalTexto) : 0;
              totalDevolucion = totalDevolucionDecimal.toString();
              numeroDocumentos = numeroDocumento;
            }




            // Inicializar las variables
            let idUsuario: number = 0;
            let idCaja: number = 0;
            let nombreUsua: string = "";
            let nombreUsua2: string = "";
            let cajaActualizada2: Caja;

            // Obtener el idUsuario del localStorage
            const usuarioString = localStorage.getItem('usuario');
            const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
            const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
            if (datosDesencriptados !== null) {
              const usuario = JSON.parse(datosDesencriptados);
              idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
              nombreUsua2 = usuario.nombreCompleto;
            }

            // Verificar que se haya obtenido el idUsuario
            if (idUsuario !== 0) {
              this.cajaService.obtenerCajaPoridCaja(idcajas).subscribe({
                next: (caja: Caja | null) => {
                  if (caja !== null) {
                    // Si se encuentra una caja abierta para el idUsuario
                    idCaja = caja.idCaja;
                    nombreUsua = caja.nombreUsuario;

                    let cajaActualizada: Caja = {
                      idCaja: idCaja,
                      devolucionesTexto: totalDevolucion,
                      ingresosTexto: totalDevolucion,
                      transaccionesTexto: totalDevolucion,
                      metodoPago: tipoPago,
                      estado: '',
                      nombreUsuario: '',
                      idUsuario: idUsuario
                    };

                    if (tipoPago == "Combinado") {
                      cajaActualizada.devolucionesTexto = totalDevolucion;
                      cajaActualizada.ingresosTexto = totalDevolucionEfectivo;
                      cajaActualizada.transaccionesTexto = totalDevolucionTransferencia;
                    }
                    if (tipoPago == "CombinadoDos") {
                      // cajaActualizada.devolucionesTexto = totalDevolucion;     
                      const suma = parseFloat(totalDevolucionTransferenciaSegundo) + parseFloat(totalDevolucionTransferencia)
                      cajaActualizada.transaccionesTexto = suma.toString();
                    }

                    // Verificar si el idCaja de la venta es diferente al idCaja actual del usuario
                    // if (idCajaVenta !== idCaja) {
                    //   Swal.fire({
                    //     icon: 'error',
                    //     title: 'Error',
                    //     text: 'No puede anular una venta realizada en una caja diferente a la actual.',
                    //     confirmButtonText: 'Aceptar'
                    //   });
                    //   return; // Detener la ejecución
                    // }
                    // Verificar si el idCaja de la venta es diferente al idCaja actual del usuario
                    if (nombreUsua !== nombreUsua2) {
                      Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No puede anular una venta realizada en una caja diferente a la actual.',
                        confirmButtonText: 'Aceptar'
                      });
                      return; // Detener la ejecución
                    }
                    cajaActualizada2 = cajaActualizada;

                    // console.log(`Intentando anular la venta con ID ${idVenta}`);

                    const dialogRef = this.dialog.open(ConfirmacionAnulacionComponent);

                    dialogRef.afterClosed().subscribe((result) => {
                      if (result) {
                        console.log('Confirmado. Iniciando solicitud para anular la venta...');
                        this._ventaServicio.anularVenta(idVenta).subscribe({
                          next: (data) => {
                            // console.log('Respuesta del servidor:', data);

                            if (data.status) {
                              // this._utilidadServicio.mostrarAlerta(data.msg, 'Éxito');

                              // this._utilidadServicio.mostrarAlerta('Solicitud de anulación de venta completada.', 'OK!');

                              // Encontrar la venta anulada en los datos de la lista
                              const ventaAnulada = this.datosListaVenta.data.find(v => v.idVenta === idVenta);

                              if (ventaAnulada) {
                                // Restar el valor de la venta anulada
                                this.totalIngresos = (parseFloat(this.totalIngresos.replace(',', '')) - parseFloat(ventaAnulada.totalTexto.replace(',', ''))).toFixed(2);
                              }



                              Swal.fire({
                                title: 'Realizar un comentario',
                                html:
                                  // '<input id="prestamosTexto" class="swal2-input" placeholder="Valor del préstamo">' +
                                  // '<input id="comentariosDevoluciones" class="swal2-input" placeholder="Comentario">',
                                  '<textarea id="comentariosDevoluciones" class="swal2-textarea" placeholder="Comentario" style="height: 150px;"></textarea>',
                                showCancelButton: true,
                                confirmButtonColor: '#1337E8',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Realizar comentario',
                                cancelButtonText: 'Cancelar',
                                allowOutsideClick: false, // Evitar que se cierre haciendo clic fuera del diálogo
                                preConfirm: () => {
                                  // const prestamosTexto = parseFloat((<HTMLInputElement>document.getElementById('prestamosTexto')).value);
                                  const comentariosDevoluciones = (<HTMLInputElement>document.getElementById('comentariosDevoluciones')).value;
                                  // Verificar si el saldo disponible es mayor o igual al valor del préstamo

                                  // Verificar si el campo de comentario está vacío
                                  if (comentariosDevoluciones.trim() === '') {
                                    Swal.showValidationMessage('Por favor, ingrese un comentario.'); // Mostrar mensaje de validación
                                  } else {
                                    // Verificar que idCaja tenga un valor asignado
                                    if (idCaja !== undefined) {
                                      // Actualizar la caja correspondiente con los nuevos valores de ingresosTexto y metodoPago
                                      const cajaActualizada2: Caja = {
                                        idCaja: idCaja,
                                        devolucionesTexto: totalDevolucion,
                                        ingresosTexto: totalDevolucion,
                                        transaccionesTexto: totalDevolucion,
                                        metodoPago: tipoPago,
                                        estado: '',
                                        nombreUsuario: '',
                                        idUsuario: idUsuario
                                      };

                                      if (tipoPago == "Combinado") {
                                        cajaActualizada.devolucionesTexto = totalDevolucionEfectivo;
                                        cajaActualizada.ingresosTexto = totalDevolucionEfectivo;
                                        cajaActualizada.transaccionesTexto = totalDevolucionTransferencia;
                                      }
                                      if (tipoPago == "CombinadoDos") {
                                        // cajaActualizada.devolucionesTexto = totalDevolucionEfectivo;
                                        // cajaActualizada.ingresosTexto = totalDevolucionEfectivo;
                                        const suma = parseFloat(totalDevolucionTransferenciaSegundo) + parseFloat(totalDevolucionTransferencia)
                                        console.log(suma);
                                        cajaActualizada.transaccionesTexto = suma.toString();
                                      }

                                    }

                                    this.ComentarioDevoluciones(idCaja, numeroDocumento, comentariosDevoluciones);

                                    // Verificar si cajaActualizada está definida antes de intentar actualizar la caja
                                    if (cajaActualizada2 !== undefined) {
                                      // Actualizar la caja
                                      this.actualizarCaja(cajaActualizada2);
                                    }


                                    // Swal.fire({
                                    //   icon: 'success',
                                    //   title: 'Venta Anulada ',
                                    //   text: `Solicitud de anulación de venta completada.`,
                                    // });


                                    // Recargar los datos después de anular la venta
                                    // this.buscarVentas(this.page, this.pageSize,this.searchTerm);
                                    this.buscarVentas();
                                  }


                                }
                              });





                            } else {
                              // this._utilidadServicio.mostrarAlerta(data.msg, 'Error');
                              this._utilidadServicio.mostrarAlerta('Error de anulación de venta .', 'Error');

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

                                  //console.log('Usuario obtenido:', usuario);
                                  let refreshToken = usuario.refreshToken

                                  // Manejar la renovación del token
                                  this._usuarioServicio.renovarToken(refreshToken).subscribe(
                                    (response: any) => {
                                      //console.log('Token actualizado:', response.token);
                                      // Guardar el nuevo token de acceso en el almacenamiento local
                                      localStorage.setItem('authToken', response.token);
                                      this.procesoAnulacionVenta(venta, idVenta, tipoPago, numeroDocumento);
                                    },
                                    (error: any) => {
                                      console.error('Error al actualizar el token:', error);
                                    }
                                  );



                                },
                                (error: any) => {
                                  // console.error('Error al obtener el usuario:', error);
                                }
                              );
                            }
                          },
                          complete: () => {
                            //console.log('Solicitud de anulación de venta completada.');
                          },
                        });
                      } else {
                        //console.log('Anulación de venta cancelada por el usuario.');
                      }
                    });





                    //  this.actualizarCaja(cajaActualizada);
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


                  // Obtener el idUsuario del localStorage
                  const usuarioString = localStorage.getItem('usuario');
                  const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
                  const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
                  if (datosDesencriptados !== null) {
                    const usuario = JSON.parse(datosDesencriptados);
                    idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

                    this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
                      (usuario: any) => {

                        //console.log('Usuario obtenido:', usuario);
                        let refreshToken = usuario.refreshToken

                        // Manejar la renovación del token
                        this._usuarioServicio.renovarToken(refreshToken).subscribe(
                          (response: any) => {
                            //console.log('Token actualizado:', response.token);
                            // Guardar el nuevo token de acceso en el almacenamiento local
                            localStorage.setItem('authToken', response.token);
                            this.procesoAnulacionVenta(venta, idVenta, tipoPago, numeroDocumento);
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
                complete: () => {


                }
              });

            }


          }




        }




      });

    } else {
      console.log('No se encontró el idUsuario en el localStorage');
    }







  }





  ComentarioDevoluciones(idCaja: number, numeroDocumento: string, comentariosDevoluciones: string) {
    const estado = "Venta"
    this.cajaService.devoluciones(idCaja, numeroDocumento, comentariosDevoluciones, estado).subscribe(
      () => {

        Swal.fire({
          icon: 'success',
          title: 'Venta Anulada ',
          text: `Solicitud de anulación de venta completada.`,
        });


        // Swal.fire('Comentario guardado exitosamente', '', 'success');
        // Aquí puedes agregar lógica adicional después de realizar el préstamo, como volver a cargar la lista de cajas

        this.obtenerCaja();
      },
      error => {
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

              //console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  //console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.ComentarioDevoluciones(idCaja, numeroDocumento, comentariosDevoluciones);
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


  obtenerCaja() {

    this.cajaService.lista().subscribe({

      next: (data) => {
        if (data.status)
          this.dataListaCaja.data = data.value;
        else
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: `no se encontraron datos`,
          });
        // this._utilidadServicio.mostrarAlerta("no se encontraron datos", "Oops!");
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

              //console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  //console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.obtenerCaja();
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


}
