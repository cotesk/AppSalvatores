import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ModalCategoriaComponent } from '../../Modales/modal-categoria/modal-categoria.component';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { MatSort } from '@angular/material/sort';
import { Pedido } from '../../../../Interfaces/pedido';
import { MesaService } from '../../../../Services/mesa.service';
import { PedidoService } from '../../../../Services/pedido.service';
import { Mesa } from '../../../../Interfaces/mesa';
import { EditarPedidoDialogComponent } from '../editar-pedido-dialog/editar-pedido-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import moment from 'moment';
import { EditarSoloElPedidoComponent } from '../editar-solo-el-pedido/editar-solo-el-pedido.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Subscription } from 'rxjs';
import { DomicilioService } from '../../../../Services/domicilio.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Usuario } from '../../../../Interfaces/usuario';
import { ModalDomicilioComponent } from '../../Modales/modal-domicilio/modal-domicilio.component';

declare var qz: any;
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
  selector: 'app-historial-pedido',
  templateUrl: './historial-pedido.component.html',
  styleUrl: './historial-pedido.component.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})
export class HistorialPedidoComponent implements OnInit, OnDestroy {


  listaPedidos: Pedido[] = [];
  columnasDetalle: string[] = [
    'seleccionar',
    'cantidadEditar',
    'descripcionProducto',
    'cantidad',
    'precioUnitarioTexto',
    'unidadMedidaTexto',
    'subTotal',
    'totalTexto',
    'comentario',
    'acciones'
  ];

  totalPaginas: number = 0;
  paginaActual: number = 1;
  totalRegistros: number = 0;
  registrosPorPagina: number = 12;
  filtroForm!: FormGroup;
  rolDescripcion: string = "";

  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';

  private subscriptions: Subscription[] = [];
  public innerWidth: any;

  listaMesas: Mesa[] = [];
  listaMesaFiltrada: Mesa[] = [];
  mesaFiltrado: string = '';
  mesaSeleccionado!: Mesa | null;
  mesaSeleccionadoTemporal: any;


  listaUsuario: Usuario[] = [];
  listaUsuarioFiltrada: Usuario[] = [];
  usuarioFiltrado: string = '';
  usuarioSeleccionado!: Usuario | null;


  totalSeleccionado: number = 0;


  constructor(
    private pedidoService: PedidoService,
    private _usuarioServicio: UsuariosService,
    private dialog: MatDialog,
    private signalRService: SignalRService,
    private router: Router,
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private domicilioService: DomicilioService,
    private mesaService: MesaService,
  ) {



    this.filtroForm = this.fb.group({
      metodoBusqueda: [''],
      searchTerm: [''],
      fechaInicio: [''],
      fechaFin: [''],
      tipoPedido: [''],
      mesa: ['', [Validators.maxLength(35)]],
      usuario: ['', [Validators.maxLength(55)]],
    });


    this.filtroForm.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesaFiltrada = this.filtrarMesa(value);
    });


    this.filtroForm.get('usuario')?.valueChanges.subscribe(value => {
      this.listaUsuarioFiltrada = this.filtrarUsuario(value);
    });


  }



  ngOnDestroy(): void {
    console.log('[HistorialPedidoComponent] Destruyendo listeners...');

    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    // this.listeners.forEach(l => l());
    // this.listeners = [];
    // this.signalRService.stopConnection();
  }

  private esMovil(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }


  ngOnInit(): void {


    this.filtroForm = this.fb.group({
      metodoBusqueda: [''],
      searchTerm: [''],
      fechaInicio: [''],
      fechaFin: [''],
      tipoPedido: [''],
      mesa: ['', [Validators.maxLength(35)]],
      usuario: ['', [Validators.maxLength(55)]],
    });

    this.filtroForm.get('mesa')?.valueChanges.subscribe(value => {
      this.listaMesaFiltrada = this.filtrarMesa(value);
    });


    this.filtroForm.get('usuario')?.valueChanges.subscribe(value => {
      this.listaUsuarioFiltrada = this.filtrarUsuario(value);
    });


    let idUsuario: number = 0;

    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

    const usuario = JSON.parse(datosDesencriptados);




    // Configurar validadores para la fecha de fin en función de la fecha de inicio
    this.filtroForm.get('fechaInicio')?.valueChanges.subscribe((fechaInicio) => {
      const fechaFinControl = this.filtroForm.get('fechaFin');
      if (fechaFinControl) {
        // Limpiar validadores actuales
        fechaFinControl.clearValidators();

        // Agregar nuevo validador que asegura que la fecha de fin no sea anterior a la fecha de inicio
        fechaFinControl.setValidators([Validators.required, this.fechaFinValidator(fechaInicio)]);

        // Actualizar el estado del control
        fechaFinControl.updateValueAndValidity();
      }
    });



    // ===============================================
    //  🔔 ESCUCHAR EVENTOS GLOBALES DESDE EL LAYOUT
    // ===============================================
    const sub = this.signalRService.eventosGlobales$.subscribe(evento => {

      const ruta = this.router.url;

      switch (evento.tipo) {

        case "pedido_registrado":
        case "pedido_editado":
        case "pedido_anulado":
          if (ruta === '/pages/historial_Pedidos') {
            this.obtenerPedidosPendientes();
          }
          break;

        case "venta_anulada":
        case "venta_registrada":
          if (ruta === '/pages/historial_Pedidos') {
            this.obtenerPedidosPendientes();
          }
          break;

        // case "pedido_registrado":

        //   break;


      }

    });

    this.subscriptions.push(sub);


    this.obtenerPedidosPendientes();
    this.actualizarListaMesa();
    this.listaUsuarios();
  }


  validarCantidad(d: any) {
    if (!d.cantidadSeleccionada) {
      d.cantidadSeleccionada = 1;
    }

    if (d.cantidadSeleccionada > d.cantidad) {
      d.cantidadSeleccionada = d.cantidad;
    }

    if (d.cantidadSeleccionada < 1) {
      d.cantidadSeleccionada = 1;
    }

    this.calcularTotalSeleccionado();
  }

  onSeleccionChange(d: any) {
    if (d.seleccionado) {
      d.cantidadSeleccionada = d.cantidad; // 🔥 llena automático
    } else {
      d.cantidadSeleccionada = 1;
    }

    this.calcularTotalSeleccionado();
  }


  calcularTotalSeleccionado() {
    let total = 0;

    this.listaPedidos.forEach(p => {
      p.detallePedidos.forEach(d => {
        if (d.seleccionado) {
          total += d.cantidadSeleccionada! * this.parseNumero(d.precioUnitarioTexto);
        }
      });
    });

    this.totalSeleccionado = total;
  }


  parseNumero(valor: string): number {
    if (!valor) return 0;
    return Number(valor.replace(/\./g, '').replace(',', '.'));
  }

  filtrarMesa(nombre: any): Mesa[] {

    const valorBuscado = typeof nombre === "string" ? nombre.toLocaleLowerCase() : nombre.nombreMesa.toLocaleLowerCase();
    const mesaFiltrados = this.listaMesas.filter(item => item.nombreMesa.toLocaleLowerCase().includes(valorBuscado));
    // console.log('Mesa filtrados:', mesaFiltrados);
    return mesaFiltrados;
  }

  filtrarUsuario(nombre: any): Usuario[] {

    const valorBuscado = typeof nombre === "string" ? nombre.toLocaleLowerCase() : nombre.nombreCompleto.toLocaleLowerCase();
    const ususarioFiltrados = this.listaUsuario.filter(item => item.nombreCompleto!.toLocaleLowerCase().includes(valorBuscado));
    // console.log('Mesa filtrados:', mesaFiltrados);
    return ususarioFiltrados;
  }


  private listaUsuarios() {
    this._usuarioServicio.lista().subscribe({
      next: (data) => {
        // console.log(data);
        if (data.status) {
          // Filtrar y ordenar la lista de usuarios
          this.listaUsuario = (data.value as Usuario[])
            .filter(p => p.esActivo == 1)
            .sort((a: Usuario, b: Usuario) => {
              // Verificar si nombreCompleto está definido
              if (a.nombreCompleto && b.nombreCompleto) {
                return a.nombreCompleto.localeCompare(b.nombreCompleto);
              }
              // En caso de que nombreCompleto sea undefined en alguno de los usuarios,
              // maneja esta situación aquí (por ejemplo, devolviendo 0 para mantener el orden)
              return 0;
            });
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
                  this.listaUsuarios();
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
  verTicket(pedido: Pedido): void {
    Swal.fire({
      title: '¿Qué deseas hacer?',
      showCancelButton: true,
      showDenyButton: true,
      showConfirmButton: true,
      confirmButtonColor: '#1337E8',
      denyButtonColor: '#135207',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Factura / Ticket completo',
      denyButtonText: 'Seleccionar productos',
      cancelButtonText: 'Ticket cocina',
    }).then((result) => {
      if (result.isConfirmed) {
        if (pedido.tipoPedido === "Domicilio") {

          this.domicilioService.obtenerPorIdPedido(pedido.idPedido).subscribe({
            next: (response) => {
              if (response.status === true) {

                let domicilio = response.value;

                const datosDomicilio = {
                  nombre: domicilio.nombre ?? "",
                  direccion: domicilio.direccion ?? "",
                  telefono: domicilio.telefono ?? "",
                  referencia: domicilio.referencia ?? ""
                };

                this.generarYMostrarTicket(pedido, datosDomicilio);


              }
            },
            error: (error) => this.handleTokenError(() => this.verTicket(pedido))
          });



        } else {
          // Ticket normal
          this.generarYMostrarTicket(pedido);
        }

      } else if (result.isDenied) {
        this.seleccionarProductosParaTicket(pedido);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Ticket cocina
        console.log(pedido);
        this.imprimirContenidoHeladeriaYComida(pedido);

      }
    });
  }


  private generarYMostrarTicket(pedido: Pedido, datosDomicilio?: any): void {
    // Pregunta al usuario si desea imprimir
    Swal.fire({
      title: '¿Deseas imprimir el ticket?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, imprimir',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {


        const anchoTicketDefault = '80mm';
        const contenido = this.generarContenidoTicket(pedido, datosDomicilio);
        this.innerWidth = window.innerWidth;

        // Si es móvil → enviar directamente sin ventana
        if (this.innerWidth <= 768) {
          // this.signalRService.enviarTicket(contenido);
          return; // salir si es móvil
        }


        // Abrir ventana de impresión
        // const ventana = window.open(
        //   '',
        //   '',
        //   'width=400,height=600,toolbar=0,location=0,menubar=0,scrollbars=0,status=0'
        // );

        const ventana = window.open(
          '',
          '_blank',
          `
    width=${screen.availWidth},
    height=${screen.availHeight},
    left=0,
    top=0,
    fullscreen=yes,
    toolbar=no,
    location=no,
    directories=no,
    status=no,
    menubar=no,
    scrollbars=no,
    resizable=no
  `
        );


        //ES TEMPORAL PORQUE NO TENGO IMPRESORA y funciona bien
        //  this.signalRService.enviarTicket(contenido);

        if (ventana) {
          ventana.document.write(`
    <html>
      <head>
        <style>
     @media print {
  html, body {
    margin: 5 !important;
    padding: 0 !important;
  }

  body {
    width: 80mm;
    font-family: monospace;
    font-size: 6pt !important;
    white-space: pre-wrap;
    transform: translateY(-30px);
  }

  pre {
    margin: 0 !important;
    padding: 0 !important;
  }

  @page {
    margin: 0 !important;
    size: 80mm auto;
  }
}

body {
  margin: 0;
  padding: 0;
  font-family: monospace;
  font-size: 6pt;
  white-space: pre-wrap;
  width: 80mm;
}

pre {
  margin: 0;
  padding: 0;
}
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <pre>${contenido}</pre>
      </body>
    </html>
  `);

          ventana.document.close();
        }

      }
    });
  }


  async imprimirTicket(texto: string) {
    try {

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }

      const config = qz.configs.create("XP-80C", {
        port: 9100,
        protocol: "raw"
      });

      // 🔥 Forzar FONT A (más ancho)
      const fontA = {
        type: "raw",
        format: "hex",
        data: "1B4501"
      };

      // 🔥 Alinear a la izquierda (para usar todo el ancho real)
      const alignLeft = {
        type: "raw",
        format: "hex",
        data: "1B6101"
      };

      // 🧾 Ticket
      const dataTicket = {
        type: "raw",
        format: "plain",
        data: texto + "\n\n\n\n\n\n"
      };

      // 🔪 Corte automático
      const cutCommand = {
        type: "raw",
        format: "hex",
        data: "1D5601"
      };

      // 🔊 Beep
      const beepCommand = {
        type: "raw",
        format: "hex",
        data: "1B420114"
      };

      await qz.print(config, [
        fontA,      // <<--- ocupa todo el ancho
        alignLeft,  // <<--- alineación correcta
        dataTicket,
        cutCommand,
        beepCommand
      ]);

      Swal.fire({
        icon: 'success',
        title: 'Ticket impreso',
        text: 'El ticket se imprimió, cortó y pitó.',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error("❌ Error en impresión:", error);
    }
  }




  async probarBeep() {
    try {

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }

      const config = qz.configs.create("XP-80C", {
        port: 9100,
        protocol: "raw"
      });

      // BEEP estándar: 1 beep, duración media
      const beepCommand = {
        type: "raw",
        format: "hex",
        // data: "1B420101" // demora 1 segundo
        data: "1B420114"
      };

      await qz.print(config, [beepCommand]);

      Swal.fire({
        icon: 'success',
        title: 'Beep enviado',
        text: 'La impresora debería haber pitado.',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error("Error enviando beep:", error);
    }
  }


  private generarYMostrarTicketCocina(pedido: Pedido, datosDomicilio?: any): void {
    // Pregunta al usuario si desea imprimir
    Swal.fire({
      title: '¿Deseas imprimir el ticket?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, imprimir',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {

        const anchoTicketDefault = '80mm';
        const contenido = this.generarContenidoTicketCocinaPrimero(pedido, datosDomicilio);

        this.innerWidth = window.innerWidth;

        // this.imprimirTicket(contenido);

        // Si es móvil → NO abrir ventana ni imprimir
        if (this.innerWidth <= 768) {
          // console.log("Aquii")
          this.signalRService.enviarTicket(contenido);
          return; // salir si es móvil
        }

        const ventana = window.open(
          '',
          '',
          'width=400,height=600,toolbar=0,location=0,menubar=0,scrollbars=0,status=0'
        );

        this.signalRService.enviarTicket(contenido);

        if (ventana) {
          ventana.document.write(`
      <html>
        <head>
          <style>
            @media print {
              body {
                width: ${anchoTicketDefault};
                font-family: monospace;
                font-size: 8pt !important;
                white-space: pre-wrap;
                padding: 4px;
              }
              pre {
                font-size: 8pt !important;
              }
              /* Oculta todo excepto el contenido */
              .no-print { display: none !important; }
            }

            body {
              padding: 4px;
              font-family: monospace;
              font-size: 8pt;
              white-space: pre-wrap;
              width: ${anchoTicketDefault};
            }

            /* Evita margenes del navegador */
            @page { margin: 0; }
          </style>
        </head>

        <body>
          <pre>${contenido}</pre>

          <!-- Div para evitar errores, pero NO se imprime -->
          <div class="no-print"></div>

        </body>
      </html>
    `);

          ventana.document.close();
        }

      }
    });

  }



  private mostrarTicketEnVentana(contenido: string) {
    Swal.fire({
      title: '¿Deseas imprimir el ticket?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, imprimir',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {

        const anchoTicketDefault = '80mm';

        this.innerWidth = window.innerWidth;

        // this.imprimirTicket(contenido);

        // Si es móvil → NO abrir ventana ni imprimir
        if (this.innerWidth <= 768) {
          this.signalRService.enviarTicket(contenido);
          return; // salir si es móvil
        }

        const ventana = window.open(
          '',
          '',
          'width=400,height=600,toolbar=0,location=0,menubar=0,scrollbars=0,status=0'
        );
        this.signalRService.enviarTicket(contenido);
        if (ventana) {
          ventana.document.write(`
      <html>
        <head>
          <style>
            @media print {
              body {
                width: ${anchoTicketDefault};
                font-family: monospace;
                font-size: 7pt;
                white-space: pre-wrap;
                padding: 4px;
              }
              pre { font-size: 7pt; }
            }
            body {
              padding: 4px;
              font-family: monospace;
              font-size: 8pt;
              white-space: pre-wrap;
              width: ${anchoTicketDefault};
            }
            @page { margin: 0; }
          </style>
        </head>
        <body>
          <pre>${contenido}</pre>
      
        </body>
      </html>
    `);

          ventana.document.close();
        }

      }
    });

  }


  generarContenidoTicketCocina(pedido: Pedido): string {

    const detalle = pedido.detallePedidos || [];


    const productosComida = detalle.filter(p =>
      (p.unidadMedidaTexto || '').toLowerCase() === 'comida'
    );


    const productosUnitarios = detalle.filter(p =>
      (p.unidadMedidaTexto || '').toLowerCase() !== 'comida' &&
      (p.unidadMedidaTexto || '').toLowerCase() !== 'heladería'
    );

    const productosHeladeria = detalle.filter(p =>
      (p.unidadMedidaTexto || '').toLowerCase() === 'heladería'
    );

    let ticket = String.raw`===================================
         TICKET
===================================
Mesa: ${pedido.nombreMesa}
Pedido #: ${pedido.idPedido}
Tipo Pedido: ${pedido.tipoPedido}
Fecha: ${pedido.fechaHora}
Estado: ${pedido.estadoPedido}
-----------------------------------
      PRODUCTOS DE COMIDA
-----------------------------------`;

    // 🔵 LISTADO DE COMIDA
    productosComida.forEach((item, i) => {
      const comentario = item.comentario
        ? this.dividirComentario(item.comentario)
          .split("\n")
          .map(l => "   " + l)
          .join("\n")
        : "";

      ticket += `

${i + 1}. ${item.descripcionProducto}
    Cant: ${item.cantidad}
${comentario ? comentario : ""}`;
    });

    // console.log(productosUnitarios);
    if (productosUnitarios && productosUnitarios.length > 0) {
      // LISTADO DE UNITARIOS
      ticket += `
-----------------------------------
       PRODUCTOS UNITARIOS
-----------------------------------`;
    }


    if (productosHeladeria && productosHeladeria.length > 0) {
      // LISTADO DE UNITARIOS
      ticket += `
-----------------------------------
       PRODUCTOS HELADERIA
-----------------------------------`;
    }

    productosUnitarios.forEach((item, i) => {
      const comentario = item.comentario
        ? this.dividirComentario(item.comentario)
          .split("\n")
          .map(l => "   " + l)
          .join("\n")
        : "";

      ticket += `

${i + 1}. ${item.descripcionProducto}
    Cant: ${item.cantidad}
${comentario ? comentario : ""}`;
    });

    // item.descripcionProducto.toUpperCase()  toUpper sirve para que se vea en mayuscula
    //Comentario general
    const comentarioGeneral = pedido.comentarioGeneral
      ? this.dividirComentario(pedido.comentarioGeneral)
        .split("\n")
        .map(l => "   " + l)
        .join("\n")
      : "   N/A";

    ticket += `
-----------------------------------
COMENTARIO GENERAL:
${comentarioGeneral}
===================================`;

    return ticket;
  }

  imprimirContenidoHeladeriaYComida(pedido: Pedido) {

    this.pedidoService.imprimirCocina(pedido, true).subscribe({
      next: (resp) => {
        console.log('✅ Impreso correctamente');
      },
      error: (err) => {
        console.error('❌ Error al imprimir', err);
      }
    });

  }


  private seleccionarProductosParaTicket(pedido: Pedido): void {

    // console.log(pedido);


    // 1. Agrupar productos por descripción
    const grupos = pedido.detallePedidos.reduce((acc: any, prod: any) => {
      if (!acc[prod.descripcionProducto]) {
        acc[prod.descripcionProducto] = { ...prod, cantidadTotal: 0 };
      }
      acc[prod.descripcionProducto].cantidadTotal += prod.cantidad;
      return acc;
    }, {});

    const opciones = Object.keys(grupos).map((key, index) => ({
      id: index,
      descripcion: key,
      cantidadTotal: grupos[key].cantidadTotal
    }));

    // 2. Modal con checkbox + input cantidad
    Swal.fire({
      title: 'Selecciona productos a incluir',
      html: opciones
        .map(
          opt => `
        <div style="text-align:left; margin-bottom:10px;">
          <input type="checkbox" id="chk_${opt.id}" checked>

          <label for="chk_${opt.id}">
            <b>${opt.descripcion}</b> (máx: ${opt.cantidadTotal})
          </label><br>

          <input type="number"
            id="cant_${opt.id}"
            min="1"
            max="${opt.cantidadTotal}"
            value="${opt.cantidadTotal}"
            style="width:65px; margin-left:25px;"
          >
        </div>`
        )
        .join(''),
      showCancelButton: true,
      confirmButtonText: 'Generar ticket',
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      preConfirm: () => {

        const seleccionados: any[] = [];

        opciones.forEach(opt => {
          const chk = document.getElementById(`chk_${opt.id}`) as HTMLInputElement;
          const cant = document.getElementById(`cant_${opt.id}`) as HTMLInputElement;

          if (chk?.checked) {
            const cantidadSeleccionada = Number(cant.value);


            if (cantidadSeleccionada > opt.cantidadTotal) {
              Swal.showValidationMessage(
                `La cantidad de "${opt.descripcion}" no puede superar ${opt.cantidadTotal}`
              );
            }

            if (cantidadSeleccionada > 0) {
              seleccionados.push({
                descripcionProducto: opt.descripcion,
                cantidad: cantidadSeleccionada,
                unidadMedidaTexto: grupos[opt.descripcion].unidadMedidaTexto,
                comentario: grupos[opt.descripcion].comentario,

                // OBLIGATORIO
                precioUnitarioTexto: grupos[opt.descripcion].precioUnitarioTexto,
              });
            }
          }
        });

        if (seleccionados.length === 0) {
          Swal.showValidationMessage('Debes seleccionar al menos un producto');
          return;
        }

        return seleccionados;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {

        // Reemplazar el detalle por el detalle filtrado
        const copiaPedido = {
          ...pedido,
          detallePedidos: result.value
        };
        console.log(copiaPedido);
        // this.generarYMostrarTicketCocina(copiaPedido);
        this.imprimirContenidoHeladeriaYComida(copiaPedido);
      }
    });
  }




  //   verTicket(pedido: Pedido): void {
  //     const anchoTicketDefault = '80mm'; // Puedes cambiar entre '58mm' y '80mm'

  //     const contenido = this.generarContenidoTicket(pedido);

  //     const ventana = window.open('', '_blank', 'width=400,height=600');

  //     if (ventana) {
  //       ventana.document.write(`
  //       <html>
  //         <head>
  //           <style>
  //             @media print {
  //               body {
  //                 width: ${anchoTicketDefault};
  //                 font-family: monospace;
  //                 font-size: 10pt;
  //                 white-space: pre-wrap;
  //               }
  //             }
  //             body {
  //               padding: 10px;
  //               font-family: monospace;
  //               font-size: 10pt;
  //               white-space: pre-wrap;
  //               width: ${anchoTicketDefault};
  //             }
  //             .botones {
  //               margin-top: 10px;
  //               display: flex;
  //               gap: 10px;
  //             }
  //             button {
  //               font-size: 10pt;
  //               padding: 5px 10px;
  //             }
  //           </style>
  //         </head>
  //         <body>
  //           <pre>${contenido}</pre>
  //           <div class="botones">
  //             <button onclick="window.print()">Imprimir</button>
  //             <button onclick="window.close()">Cerrar</button>
  //           </div>
  //         </body>
  //       </html>
  //     `);
  //       ventana.document.close();
  //     }
  //   }

  formatearReferencia(texto: string, longitudMax: number = 35): string {
    if (!texto) return 'N/A';
    let resultado = '';
    for (let i = 0; i < texto.length; i += longitudMax) {
      resultado += texto.substr(i, longitudMax) + '\n';
    }
    return resultado.trim(); // quitar el último salto de línea
  }


  generarContenidoTicket(pedido: Pedido, datosDomicilio?: any): string {

    const ancho = 32;

    const centrar = (texto: string) => {
      const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2));
      return ' '.repeat(espacios) + texto;
    };

    const dividirLinea = (texto: string, max = ancho): string => {
      if (!texto) return '';
      const palabras = texto.split(' ');
      let linea = '';
      let resultado = '';

      palabras.forEach(p => {
        if ((linea + p).length > max) {
          resultado += linea + '\n';
          linea = p + ' ';
        } else {
          linea += p + ' ';
        }
      });

      resultado += linea;
      return resultado.trim();
    };

    let ticket = `=============== TICKET ===============\n`;

    // --- DOMICILIO (con división de texto) ---
    if (pedido.tipoPedido === 'Domicilio' && datosDomicilio) {

      ticket += `* DOMICILIO *\n`;

      ticket += `Nom:\n${dividirLinea(datosDomicilio.nombre)}\n`;
      ticket += `Dir:\n${dividirLinea(datosDomicilio.direccion)}\n`;
      ticket += `Tel: ${datosDomicilio.telefono}\n`;

      ticket += `Ref:\n${dividirLinea(this.formatearReferencia(datosDomicilio.referencia))}\n`;

      ticket += `-------------------------------------\n`;
    }

    // --- INFO GENERAL ---
    ticket +=
      `Mesa: ${pedido.nombreMesa}
Usuario: ${pedido.nombreUsuario}
Tipo: ${pedido.tipoPedido}
Fecha: ${pedido.fechaHora}
Pedido #: ${pedido.idPedido}
----------------------------------------\n`;

    // --- PRODUCTOS ---
    const productosComida = pedido.detallePedidos.filter(p => p.unidadMedidaTexto === 'Comida');
    const productosUnitarios = pedido.detallePedidos.filter(p => p.unidadMedidaTexto !== 'Comida' && p.unidadMedidaTexto !== 'Heladeria');
    const productosHeladeria = pedido.detallePedidos.filter(p => p.unidadMedidaTexto === 'Heladeria');

    let index = 1;

    const formatearDetalle = (detalle: any): string => {
      const comentario = detalle.comentario
        ? this.dividirComentario(detalle.comentario)
          .split('\n')
          .map(x => '  ' + x)
          .join('\n')
        : '';

      const salto = comentario ? '\n\n' : '\n';

      return `${index++}. ${dividirLinea(detalle.descripcionProducto)}
  Cant: ${detalle.cantidad}  Vlr: $${this.formatearNumero(detalle.precioUnitarioTexto)}
  Sub: $${this.calcularTotalCaja(detalle)}
${comentario}${salto}`;
    };

    // Comida
    productosComida.forEach(detalle => ticket += formatearDetalle(detalle));

    // Unitarios
    if (productosUnitarios.length > 0) {
      ticket += `-------------- UNITARIOS --------------\n`;
      productosUnitarios.forEach(detalle => ticket += formatearDetalle(detalle));
    }

    // Heladería
    if (productosHeladeria.length > 0) {
      ticket += `-------------- HELADERIA --------------\n`;
      productosHeladeria.forEach(detalle => ticket += formatearDetalle(detalle));
    }

    // --- COMENTARIO GENERAL ---
    const comentarioGeneral = pedido.comentarioGeneral
      ? dividirLinea(pedido.comentarioGeneral)
      : 'N/A';

    // --- TOTALES ---
    ticket +=
      `-----------------------------------------
TOTAL: $${this.formatearNumero(pedido.totalTexto)}
Estado: ${pedido.estadoPedido}
Pagado: ${pedido.pagado ? 'Si' : 'No'}
Cancelado: ${pedido.cancelado ? 'Si' : 'No'}
Com. General:
${comentarioGeneral}
`;


    ticket += `
=========================================
${centrar('       GRACIAS POR SU COMPRA')}
${centrar('       Esperamos volver a servirle')}

${centrar('       ¿INTERESADO EN ESTE SISTEMA?')}
${centrar('       CONTACTAME:')}

${centrar('       Carlos Cotes')}
${centrar('       301 209 1145')}
${centrar('       carloscotes48@gmail.com')}
=========================================`;

    return ticket;
  }





  generarContenidoTicketCocinaPrimero(pedido: Pedido, datosDomicilio?: any): string {

    // console.log(pedido);


    let ticket = `******** TICKET ********\n`;

    if (pedido.tipoPedido === 'Domicilio' && datosDomicilio) {
      ticket += `\n--- DATOS DEL DOMICILIO ---\n`;
      ticket += `Nombre: ${datosDomicilio.nombre}\n`;
      ticket += `Dirección: ${datosDomicilio.direccion}\n`;
      ticket += `Teléfono: ${datosDomicilio.telefono}\n`;
      ticket += `Referencia: ${datosDomicilio.referencia || 'N/A'}\n`;
      ticket += `-----------------------\n`;
    }

    ticket += `
Mesa: ${pedido.nombreMesa}
Atendido por: ${pedido.nombreUsuario}
Tipo Pedido: ${pedido.tipoPedido}
Fecha: ${pedido.fechaHora}
Pedido #: ${pedido.idPedido}
Productos:\n`;

    // Separar por tipo de unidad
    const productosComida = pedido.detallePedidos.filter(p => p.unidadMedidaTexto === 'Comida');
    const productosUnitarios = pedido.detallePedidos.filter(p => p.unidadMedidaTexto === 'Unitario');
    const productosHeladeria = pedido.detallePedidos.filter(p => p.unidadMedidaTexto === 'Heladeria');

    // console.log(productosComida);
    // console.log(productosComida);

    let index = 1;

    const formatearDetalle = (detalle: any): string => {
      const comentario = detalle.comentario
        ? this.dividirComentario(detalle.comentario).split('\n').map(linea => '   ' + linea).join('\n')
        : '';
      return `
${index++}. ${detalle.descripcionProducto}
   Cantidad: ${detalle.cantidad}
${comentario ? comentario : ''}\n`;
    };


    // Agregar productos de comida
    productosComida.forEach(detalle => {
      ticket += formatearDetalle(detalle);
    });

    // Si hay productos unitarios, agregamos una línea divisoria
    if (productosUnitarios.length > 0) {
      ticket += `
      ----- PRODUCTOS UNITARIOS -----`;
      productosUnitarios.forEach(detalle => {
        ticket += formatearDetalle(detalle);
      });
    }


    if (productosUnitarios.length > 0) {
      ticket += `
      ----- PRODUCTOS HELADERIA -----`;
      productosHeladeria.forEach(detalle => {
        ticket += formatearDetalle(detalle);
      });
    }

    const comentarioGeneral = pedido.comentarioGeneral
      ? this.dividirComentario(pedido.comentarioGeneral).split('\n').map(linea => '   ' + linea).join('\n')
      : '   N/A';

    //     ticket += `

    // -------------------------------------
    // TOTAL: $${this.formatearNumero(pedido.totalTexto)}
    // Estado: ${pedido.estadoPedido}
    // Pagado: ${pedido.pagado ? 'Sí' : 'No'}
    // Cancelado: ${pedido.cancelado ? 'Sí' : 'No'}
    // Comentario general:
    // ${comentarioGeneral.toUpperCase()}
    // *************************************`;

    ticket += `

-------------------------------
Comentario general:
${comentarioGeneral}
*******************************`;

    return ticket;
  }

  private dividirComentario(texto: string, maxLongitud: number = 35): string {
    const partes = [];
    for (let i = 0; i < texto.length; i += maxLongitud) {
      partes.push(texto.substring(i, i + maxLongitud));
    }
    return partes.join('\n');
  }



  cambiarPagina(direccion: number, tipo?: string): void {
    if (tipo === 'inicio') {
      this.paginaActual = 1;
    } else if (tipo === 'fin') {
      this.paginaActual = this.totalPaginas;
    } else {
      const nuevaPagina = this.paginaActual + direccion;
      if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
        this.paginaActual = nuevaPagina;
      }
    }

    this.obtenerPedidosPendientes(); // actualiza los datos
  }


  obtenerPedidosPendientes() {


    let idUsuario: number = 0;

    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

    const usuario = JSON.parse(datosDesencriptados);
    idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario
    this.rolDescripcion = usuario.rolDescripcion
    if (usuario.rolDescripcion == "Administrador") {
      this.buscarPedidoPorIdUsuarioAdmin(idUsuario);
    } else {
      this.buscarPedidoPorIdUsuario(idUsuario);
    }


  }

  onTipoPedidoChange(event: any) {
    this.obtenerPedidosPendientes();
  }



  buscarPedidoPorIdUsuarioAdmin(idUsuario: any) {
    let { metodoBusqueda, searchTerm, fechaInicio, tipoPedido, fechaFin } = this.filtroForm.value;

    // console.log(tipoPedido);

    if (metodoBusqueda == "cancelado") {

      searchTerm = "true";
    } else if (metodoBusqueda == "pagado") {

      searchTerm = "true";

    }
    else if (metodoBusqueda == "estadopedido") {

      searchTerm = "Pendiente";

    }
    else if (metodoBusqueda == "nombremesa") {

      searchTerm = this.mesaSeleccionado?.nombreMesa;

    }
    else if (metodoBusqueda == "nombreusuario") {

      searchTerm = this.usuarioSeleccionado?.nombreCompleto;

    }
    else if (metodoBusqueda == "tipopedido") {

      searchTerm = tipoPedido;

    }


    this.pedidoService
      .buscarPedidoPorIdUsuarioAdmin(
        idUsuario,
        this.paginaActual,
        this.registrosPorPagina,
        metodoBusqueda || null,
        searchTerm || null,
        fechaInicio ? fechaInicio.toISOString() : null,
        fechaFin ? fechaFin.toISOString() : null
      )
      .subscribe({
        next: (response) => {
          console.log(response);
          if (response.status) {

            const data = response.value;
            // console.log(data);

            this.listaPedidos = data.pedidos;
            this.totalPaginas = data.totalPaginas;
            this.paginaActual = data.paginaActual;


            this.listaPedidos.forEach(p => {
              p.detallePedidos.forEach(d => {
                d.seleccionado = false;
                d.cantidadSeleccionada = 1;
              });
            });

            this.totalSeleccionado = 0;

          }
        },
        error: (error) => {
          console.log("Error al filtrar pedidos:", error);

        }
      });
  }



  buscarPedidoPorIdUsuario(idUsuario: any) {
    this.pedidoService.buscarPedidoPorIdUsuario(idUsuario).subscribe({
      next: (respuesta: any) => {
        console.log(respuesta);
        if (respuesta.status) {
          this.listaPedidos = respuesta.value;

          this.listaPedidos.forEach(p => {
            p.detallePedidos.forEach(d => {
              d.seleccionado = false;
              d.cantidadSeleccionada = 1;
            });
          });

          this.totalSeleccionado = 0;

        } else {
          console.warn('No se pudo obtener pedidos pendientes');
        }
      },
      error: (err) => {
        console.error('Error al obtener pedidos pendientes:', err);
      }
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


  calcularTotalCaja(element: any): string {
    const precio = parseFloat(element.precioUnitarioTexto || '0');
    const cantidad = parseFloat(element.cantidad || '0');


    // console.log(saldoInicial);
    const total = precio * cantidad;


    // console.log(suma);
    return this.formatearNumero2(total);
  }

  anularPedido(pedido: Pedido) {
    console.log(pedido);

    if (pedido.cancelado == true) {
      Swal.fire({
        icon: 'error',
        title: 'ERROR',
        text: `Este pedido ya esta anulado`,
      });
      return
    } else {
      Swal.fire({

        title: "¿Desea anular el pedido de la mesa?",
        text: pedido.nombreMesa,
        icon: "warning",
        confirmButtonColor: '#3085d6',
        confirmButtonText: "Si, anular",
        showCancelButton: true,
        cancelButtonColor: '#d33',
        cancelButtonText: 'No, volver'

      }).then((resultado) => {


        if (resultado.isConfirmed) {

          this.pedidoService.anularPedido(pedido.idPedido!).subscribe({
            next: (data) => {
              console.log(data);
              if (data.status) {
                Swal.fire({
                  icon: 'success',
                  title: 'Pedido Anulado',
                  text: `El pedido fue anulado`,
                });
                // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
                this.obtenerPedidosPendientes();
              } else {
                if (data.msg == "el pedido ya está anulada.") {
                  Swal.fire({
                    icon: 'error',
                    title: 'ERROR',
                    text: `Este pedido ya esta anulado`,
                  });
                  return
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'ERROR',
                    text: `No se pudo anular el pedido`,
                  });
                  return
                }

                // this._utilidadServicio.mostrarAlerta("No se pudo eliminar la categoria","Error");

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
                        this.anular(pedido);
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


      })
    }



  }
  anular(pedido: Pedido) {
    this.pedidoService.anularPedido(pedido.idPedido!).subscribe({
      next: (data) => {

        if (data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Categoria Eliminada',
            text: `La categoria fue eliminada`,
          });
          // this._utilidadServicio.mostrarAlerta("La categoria fue eliminado","listo!");
          this.obtenerPedidosPendientes();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'ERROR',
            text: `No se pudo eliminar la categoria`,
          });
          // this._utilidadServicio.mostrarAlerta("No se pudo eliminar la categoria","Error");

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
                  this.anular(pedido);
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

  mostrarMesas(mesa: Mesa): string {

    return mesa.nombreMesa;

  }
  mostrarListaMesa(): void {
    this.listaMesaFiltrada = this.listaMesas;
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
    this.filtroForm.get('mesa')?.setValue(this.mesaFiltrado);


  }

  mostrarUsuario(usuario: Usuario): string {

    return usuario.nombreCompleto!;

  }
  mostrarListaUsuario(): void {
    this.listaUsuarioFiltrada = this.listaUsuario;
  }



  filtrarEntradaUsuarios(event: any): void {

    const inputCliente = event.target.value;
    this.usuarioFiltrado = inputCliente;

    // Establece el valor en el control del formulario
    this.filtroForm.get('usuario')?.setValue(this.usuarioFiltrado);


  }



  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
  }


  mesaParaVenta(event: MatAutocompleteSelectedEvent) {
    this.mesaSeleccionado = event.option.value;
    //  console.log(this.mesaSeleccionado);
    this.obtenerPedidosPendientes();
  }

  ususarioParaVenta(event: MatAutocompleteSelectedEvent) {
    this.usuarioSeleccionado = event.option.value;
    console.log(this.usuarioSeleccionado);
    this.obtenerPedidosPendientes();

  }


  editarPedido(pedido: Pedido) {
    const dialogRef = this.dialog.open(EditarPedidoDialogComponent, {
      width: '950px',
      disableClose: true,
      data: JSON.parse(JSON.stringify(pedido)) // Enviar una copia
    });

    dialogRef.afterClosed().subscribe((pedidoActualizado: Pedido | null) => {
      // if (pedidoActualizado) {
      //   this.pedidoService.actualizarPedido(pedidoActualizado.idPedido!, pedidoActualizado)
      //     .subscribe(() => {
      //       // Vuelve a cargar los pedidos actualizados
      //       this.obtenerPedidosPendientes();
      //     });
      // }
      // console.log(pedidoActualizado);
      if (pedidoActualizado) {
        this.obtenerPedidosPendientes();
      }

    });
  }



  editarSoloPedido(pedido: Pedido) {
    const dialogRef = this.dialog.open(EditarSoloElPedidoComponent, {
      width: '450px',
      disableClose: true,
      data: JSON.parse(JSON.stringify(pedido)) // Enviar una copia
    });

    dialogRef.afterClosed().subscribe((pedidoActualizado: Pedido | null) => {
      if (pedidoActualizado) {
        // console.log('Pedido actualizado:', pedidoActualizado);
        if (pedidoActualizado.fechaHora) {
          // La fecha viene como "22-09-2025 10:37 AM"
          const partes = pedidoActualizado.fechaHora.split(/[- :]/);
          // partes = ["22", "09", "2025", "10", "37", "AM"]

          let dia = parseInt(partes[0], 10);
          let mes = parseInt(partes[1], 10) - 1; // en JS el mes va de 0 a 11
          let anio = parseInt(partes[2], 10);
          let hora = parseInt(partes[3], 10);
          let minuto = parseInt(partes[4], 10);
          const ampm = pedidoActualizado.fechaHora.includes("PM") ? "PM" : "AM";

          if (ampm === "PM" && hora < 12) hora += 12;
          if (ampm === "AM" && hora === 12) hora = 0;

          const fecha = new Date(anio, mes, dia, hora, minuto);
          pedidoActualizado.fechaHora = fecha.toISOString();
        }

        // console.log(pedidoActualizado);
        this.pedidoService.editarPedido(pedidoActualizado.idPedido!, pedidoActualizado)
          .subscribe({
            next: () => {
              this.obtenerPedidosPendientes(); // Recargar pedidos
            },
            error: (err) => {
              console.error('Error al editar pedido:', err);
              let mensaje = 'Error desconocido.';
              if (err.status === 0) {
                mensaje = 'No se pudo conectar al servidor. Verifica tu conexión o que el servidor esté disponible.';
              } else if (err.status === 400) {
                mensaje = err.error;
              }
              // Si usas SweetAlert2
              Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: typeof err.error === 'string' ? err.error : 'Ocurrió un error al editar el pedido.'
              });

            }
          });
      }
    });
  }



  editarDomicilio(pedido: any) {
    this.domicilioService.obtenerPorIdPedido(pedido.idPedido).subscribe({
      next: (response) => {
        if (response.status === true) {


          const domicilio = response.value;

          this.abrirModalDomicilio(domicilio);
        }
      },
      error: (error) => this.handleTokenError(() => this.editarDomicilio(pedido))
    });
  }

  abrirModalDomicilio(data: any) {
    const dialogRef = this.dialog.open(ModalDomicilioComponent, {
      width: "auto",
      maxWidth: "600px",
      height: "auto",
      maxHeight: "90vh",
      disableClose: true,
      autoFocus: false,
      data
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.guardarDomicilioEditado(data.idDomicilio, resultado);
      }
    });
  }


  guardarDomicilioEditado(idDomicilio: number, datos: any) {
    this.domicilioService.editarDomicilio(idDomicilio, datos).subscribe({
      next: (r) => {
        if (r.status === true) {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'El domicilio se actualizó correctamente.'
          });
        }
      },
      error: () => this.handleTokenError(() =>
        this.guardarDomicilioEditado(idDomicilio, datos)
      )
    });
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

  generarPdfPedidos() {
    Swal.fire({
      title: 'Seleccione tipo de reporte',
      input: 'select',
      inputOptions: { mes: 'Por mes', dia: 'Por día' },
      inputPlaceholder: 'Elige una opción',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Siguiente',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (!res.isConfirmed) return;
      const tipo = res.value;
      if (tipo === 'mes') this.pedirMesYAñoPedidos();
      if (tipo === 'dia') this.pedirDiaMesAñoPedidos();
    });
  }

  /* ---------- Por MES ---------- */
  private pedirMesYAñoPedidos() {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const options = meses.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');

    Swal.fire({
      title: 'Selecciona mes y año',
      html: `
      <select id="month" class="swal2-select">${options}</select>
      <input id="year" type="number" class="swal2-input" placeholder="Año" value="${new Date().getFullYear()}">
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Generar PDF',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const month = Number((document.getElementById('month') as HTMLSelectElement).value);
        const year = Number((document.getElementById('year') as HTMLInputElement).value);
        if (!month || !year) Swal.showValidationMessage('Selecciona un mes y un año válido.');
        return { month, year };
      }
    }).then(r => {
      if (r.isConfirmed) this.generarPDFPorMesPedidos(r.value.month, r.value.year);
    });
  }

  /* ---------- Por DÍA ---------- */
  private pedirDiaMesAñoPedidos() {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const options = meses.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');

    Swal.fire({
      title: 'Día, Mes y Año',
      html: `
      <input id="day" type="number" class="swal2-input" placeholder="Día (1-31)" min="1" max="31">
      <select id="month" class="swal2-select">${options}</select>
      <input id="year" type="number" class="swal2-input" placeholder="Año" value="${new Date().getFullYear()}">
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Generar PDF',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const day = Number((document.getElementById('day') as HTMLInputElement).value);
        const month = Number((document.getElementById('month') as HTMLSelectElement).value);
        const year = Number((document.getElementById('year') as HTMLInputElement).value);
        if (!day || day < 1 || day > 31 || !month || !year) Swal.showValidationMessage('Ingresa día, mes y año válidos.');
        return { day, month, year };
      }
    }).then(r => {
      if (r.isConfirmed) this.generarPDFPorDiaPedidos(r.value.day, r.value.month, r.value.year);
    });
  }

  /* ---------- Generación PDF por mes ---------- */
  private generarPDFPorMesPedidos(mes: number, anio: number) {
    //  console.log(this.listaPedidos);
    const filtrados = this.listaPedidos.filter((p: any) => {
      const [dia, mesStr, anioStr] = p.fechaHora.split(' ')[0].split('-');
      return Number(mesStr) === mes && Number(anioStr) === anio;
    });
    // console.log(filtrados);
    if (!filtrados.length) {
      Swal.fire('Sin datos', 'No hay pedidos para ese mes y año.', 'warning');
      return;
    }

    const totalPedidos = filtrados.length;

    // Función para limpiar y convertir valores numéricos
    const limpiarNumero = (valor: string | number): number => {
      return Number((valor || '0').toString().replace(/[^0-9,-]+/g, '').replace(',', '.'));
    };

    // Calcular totales por estado
    const totalPendiente = filtrados
      .filter(p => p.estadoPedido === 'Pendiente')
      .reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    const totalFacturado = filtrados
      .filter(p => p.estadoPedido === 'Facturado')
      .reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    const totalGeneral = filtrados.reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    // Formatear en formato colombiano
    const formatoCOP = (num: number) => num.toLocaleString('es-CO', { maximumFractionDigits: 0 });

    // Texto con los totales
    const totalTexto =
      `Total pedidos: ${totalPedidos} | ` +
      `Pendiente: $${formatoCOP(totalPendiente)} | ` +
      `Facturado: $${formatoCOP(totalFacturado)} | ` +
      `Total vendido: $${formatoCOP(totalGeneral)}`;

    this.crearPDFPedidos(filtrados, `Pedidos - ${mes}/${anio}`, totalTexto);
  }

  /* ---------- Generación PDF por día ---------- */
  private generarPDFPorDiaPedidos(dia: number, mes: number, anio: number) {
    const filtrados = this.listaPedidos.filter((p: any) => {
      const [diaStr, mesStr, anioStr] = p.fechaHora.split(' ')[0].split('-');
      return Number(diaStr) === dia && Number(mesStr) === mes && Number(anioStr) === anio;
    });

    if (!filtrados.length) {
      Swal.fire('Sin datos', 'No hay pedidos para esa fecha.', 'warning');
      return;
    }

    const totalPedidos = filtrados.length;

    // Función para limpiar y convertir valores numéricos
    const limpiarNumero = (valor: string | number): number => {
      return Number((valor || '0').toString().replace(/[^0-9,-]+/g, '').replace(',', '.'));
    };

    // Calcular totales por estado
    const totalPendiente = filtrados
      .filter(p => p.estadoPedido === 'Pendiente')
      .reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    const totalFacturado = filtrados
      .filter(p => p.estadoPedido === 'Facturado')
      .reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    const totalGeneral = filtrados.reduce((acc, p) => acc + limpiarNumero(p.totalTexto), 0);

    // Formatear en formato colombiano
    const formatoCOP = (num: number) => num.toLocaleString('es-CO', { maximumFractionDigits: 0 });

    // Texto con los totales
    const totalTexto =
      `Total pedidos: ${totalPedidos} | ` +
      `Pendiente: $${formatoCOP(totalPendiente)} | ` +
      `Facturado: $${formatoCOP(totalFacturado)} | ` +
      `Total vendido: $${formatoCOP(totalGeneral)}`;

    this.crearPDFPedidos(filtrados, `Pedidos - ${dia}/${mes}/${anio}`, totalTexto);
  }

  /* ---------- Construcción del PDF ---------- */
  private crearPDFPedidos(data: any[], titulo: string, totalTexto: string) {
    this.empresaService.lista2().subscribe({
      next: (response) => {

        // Si la empresa no existe o el array viene vacío, usamos valores por defecto
        const empresa =
          response && response.status && response.value && response.value.length > 0
            ? response.value[0]
            : {
              nombreEmpresa: 'No registrado',
              nit: 'No registrado',
              direccion: 'No registrado',
              telefono: 'No registrado',
              correo: 'No registrado'
            };


        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // 🏷️ Encabezado empresa
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(empresa.nombreEmpresa, pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`NIT: ${empresa.nit}`, pageWidth / 2, 26, { align: 'center' });
        doc.text(`Dirección: ${empresa.direccion}`, pageWidth / 2, 31, { align: 'center' });
        doc.text(`Tel: ${empresa.telefono} | ${empresa.correo}`, pageWidth / 2, 36, { align: 'center' });

        doc.setDrawColor(44, 62, 80);
        doc.line(14, 40, pageWidth - 14, 40);

        // 📄 Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(titulo, pageWidth / 2, 50, { align: 'center' });

        // 📋 Tabla de pedidos
        autoTable(doc, {
          startY: 58,
          head: [['#', 'Mesa/Cliente', 'Usuario', 'Fecha', 'Tipo', 'Total', 'Estado']],
          body: data.map((p, i) => [
            i + 1,
            p.nombreMesa,
            p.nombreUsuario,
            p.fechaHora,
            p.tipoPedido,
            `$${this.formatToCurrency(p.totalTexto || 0)}`,
            p.estadoPedido
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [95, 117, 144],
            textColor: 255,
            halign: 'center',
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: [44, 62, 80],
            fontSize: 9,
            lineColor: [220, 220, 220]
          },
          alternateRowStyles: { fillColor: [245, 247, 255] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 35 },
            2: { halign: 'center', cellWidth: 35 },
            3: { halign: 'center', cellWidth: 32 },
            4: { halign: 'center', cellWidth: 22 },
            5: { halign: 'center', cellWidth: 27 },
            6: { halign: 'center', cellWidth: 25 }
          }
        });

        // 📊 Totales
        const finalY = (doc as any).lastAutoTable.finalY || 60;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(totalTexto, pageWidth - 14, finalY + 10, { align: 'right' });

        // 🖋️ Pie
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `${empresa.nombreEmpresa} — Comprometidos con la calidad y el servicio.`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
          doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10);
        }

        // 📄 Abrir PDF
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => Swal.fire('Error', 'No se pudo generar el reporte.', 'error')
    });
  }



  // 1) tu helper (devuelve number)
  private FormatearNumero(text: string | number | undefined): number {
    if (text == null) return 0;
    if (typeof text === 'number') return text;
    let s = String(text).trim();
    s = s.replace(/\./g, ''); // quitar puntos de miles
    s = s.replace(/,/g, '.'); // coma decimal -> punto
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  // 2) formatea number -> "18.000" (string), con configuración 'es-CO' y sin decimales
  private formatToCurrency(text: string | number | undefined): string {
    const n = this.FormatearNumero(text);
    // toLocaleString('es-CO') usará '.' como separador de miles y ',' como decimal
    // usamos maximumFractionDigits: 0 para quitar decimales
    return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }



}
