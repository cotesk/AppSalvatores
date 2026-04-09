import { ImageDialogService } from './../../Services/image-dialog.service';
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Menu } from '../../Interfaces/menu';
import { MenuService } from '../../Services/menu.service';
import { UtilidadService } from '../../Reutilizable/utilidad.service';
import { MatMenuModule } from '@angular/material/menu';
import { ChangeInfoModalService } from '../../Services/change-info-modal.service';
import { Usuario } from '../../Interfaces/usuario';
import { ImageUpdatedService } from '../../Services/image-updated.service';
import { MatDialog } from '@angular/material/dialog';
import { CambiarImagenUsuarioComponent } from './Modales/cambiar-imagen-usuario/cambiar-imagen-usuario.component';
import { NgZone } from '@angular/core';
import { ChangeDetectorRef, HostListener } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../../Services/auth.service';
import { ModalCambioImagenUsuarioComponent } from './Modales/modal-cambio-imagen-usuario/modal-cambio-imagen-usuario.component';

import { ReponseApi } from '../../Interfaces/reponse-api';
import { Empresa } from '../../Interfaces/empresa';
import { EmpresaService } from '../../Services/empresa.service';
import { EmpresaDataService } from '../../Services/EmpresaData.service';
import { NotificacionService } from '../../Services/notificacion.service';
import { NotificacionesDialogComponent } from './Modales/notificaciones-dialog/notificaciones-dialog.component';
import { Producto } from '../../Interfaces/producto';
import { UsuariosService } from '../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { CarritoModalComponent } from './Modales/carrito-modal/carrito-modal.component';
import { CartService } from '../../Services/cart.service';
import { VerImagenProductoModalComponent } from './Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ColoresService } from '../../Services/coloresService.service';
import { SignalRService } from '../../Services/signalr.service';
import * as signalR from '@microsoft/signalr';
import { MatSidenav } from '@angular/material/sidenav';
import { LicenciaService } from '../../Services/licencia.service';
import { Pedido } from '../../Interfaces/pedido';

declare var qz: any;

import { environment } from '../../environments/environment';
import { QzService } from '../../Services/qzService.service';
import { PedidoService } from '../../Services/pedido.service';



@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {

  public mensaje: string = 'Hola, Mundo! ';
  listaMenus: Menu[] = [];
  correoUsuario: string = "";
  nombreUsuario: string = "";
  rolUsuario: string = "";
  usuario: any;
  imageData: Uint8Array | string = "";
  mimeType: | string = "";
  // usuario: { imagen: string } = { imagen: '' };
  selectCambiado: boolean = false;
  empresa: any;
  imageDataBase64: string | null = null;
  imagenUrl: string = '';
  nombreEmpresa: string = '';
  notificacionVisible = false;
  numeroProductosBajoStock: number = 0;
  toolbarColorClass: string = 'toolbar-white';
  sidenavColorClass: string = 'sidenav-white';
  ngContainerColorClass: string = 'sidenav-white';
  applyHoverClass = false;
  selectedColor: string = '';
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  claveSecreta: string | null = null;
  error: string | null = null;
  private hubConnection!: signalR.HubConnection;

  carritoProductos: Producto[] = [];
  public innerWidth: any;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('sidenavContainer') sidenavContainer!: ElementRef;

  private touchStartX = 0;
  private touchEndX = 0;
  serialGuardado: string | null = null;

  private appVersion = 'v1.5.0';
  private signalUnsubs: (() => void)[] = [];

  private ticketsPendientes: any[] = [];
  private mostrandoTicket: boolean = false;
  pedidosImpresos = new Map<string, number>();
  private limpiarPedidosInterval: any;


  private segundosInternet = 0;
  private intervaloInternet: any;
  private avisoMostrado = false;


  constructor(
    private router: Router,
    private _menusServicio: MenuService,
    private _utilidadServicio: UtilidadService,
    private imageDialogService: ImageDialogService,
    private changeInfoModalService: ChangeInfoModalService,
    private imageUpdatedService: ImageUpdatedService,
    private dialog: MatDialog,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private empresaDataService: EmpresaDataService,
    private notificacionService: NotificacionService,
    private _usuarioServicio: UsuariosService,
    private cartService: CartService,
    private colorService: ColoresService,
    private signalRService: SignalRService,
    private licenciaService: LicenciaService,
    private qz: QzService,
    private pedidoService: PedidoService
  ) {



    // this.obtenerClaveSecreta();
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString !== null) {
      const bytes = CryptoJS.AES.decrypt(usuarioString, this.CLAVE_SECRETA!);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      this.usuario = JSON.parse(datosDesencriptados);
      // Swal.fire({
      //   icon: 'error',
      //   title: 'Error',
      //   text: 'No hay notificaciones disponibles en este momento.'
      // });
      // this.setupInactivityTimer();
    } else {
      // Manejar el caso en el que no se encuentra ningún usuario en el Local Storage
      // Por ejemplo, podrías asignar un valor por defecto o mostrar un mensaje de error
    }

    // this.serialGuardado = localStorage.getItem('licencia'); // Guardamos licencia en localStorage

    // this.ngOnDestroy();

    // Configurar QZ Tray con certificado público

    // this.configurarQZ();


  }


  configurarQZ() {

    qz.security.setCertificatePromise(() => {
      return `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUHgEKRH2mWqF0BgPX11c2/lDR9AcwDQYJKoZIhvcNAQEL
BQAwRTEeMBwGA1UEAwwVY29taWRhLWtlbmRyeS53ZWIuYXBwMRYwFAYDVQQKDA1j
b21pZGEta2VuZHJ5MQswCQYDVQQGEwJDTzAeFw0yNTEyMTEwMzExMjBaFw0zNTEy
MDkwMzExMjBaMEUxHjAcBgNVBAMMFWNvbWlkYS1rZW5kcnkud2ViLmFwcDEWMBQG
A1UECgwNY29taWRhLWtlbmRyeTELMAkGA1UEBhMCQ08wggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDLpYtNxK15r/yr0QZ7lnv4Efb09pgE/GW+VuenfOrz
NLymyOXQXurMt2YB4KsaoZ41OEhpQjcq3KSAwPsS3dbGaWbOA/Mgm/xhfodvIneY
cwkzS3Jc0qdWDYmjmLDjiFOES1GX+N5/amM8ZxNdciA++9yoMUrHar/c72t6jsM6
2gcvd9EtZURE5xh8tQHyUdLTe7YGipoqPDs9zRoJaqYUjU8NL2/U9OAnUymT9VWH
xXjCJR3hmJpS6vzpBvCvx4UczIwAkfbh27MBS/U4F21SXntHTkcItq+4MYoEwyBT
Ee/OpgGLLxTrkM8Tei7Zx/Ucpx0Qwdot5if/jNT5+uxtAgMBAAGjUzBRMB0GA1Ud
DgQWBBQ4Mcofe820ahl+TvDOcIWfQUesmDAfBgNVHSMEGDAWgBQ4Mcofe820ahl+
TvDOcIWfQUesmDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQC/
2yy2o2wSDV8EDWr3Lj1n3RczPl+oXP6nA1cWQI/q3jaTBFvkt1XLSaQJi1DhODWl
hHHyEEqZcZ3VBGjrV/wjKWeHzcVrhMc5Hqc9jw1EJqFjRK5UEyMfjmBUlY2Zzuy+
LtEFFwj3MJjbCKJxT0rinlQXJ4k9vkQ5cYPU7VoctrrjIOXGtIzqsgaoMbi+kKVl
JTN4gaGzpd+rjObaVO/OMSPBoAEO1AXAC90em6ecw3VJ1puAAv//wSOr5UM1chVt
iuwzN8o20MxSOsg9YLHG+G1UebXQ+RXQeESTe0lfOX1H8v7yeQGZ3IQgpP0c+uUn
17VysK3dHVXTmvsf18yI
-----END CERTIFICATE-----`;
    });



    // 🔥 SOLUCIÓN: Ejecutar fuera de Angular
    this.zone.runOutsideAngular(() => {

      qz.security.setSignaturePromise((toSign: string) => {

        return new Promise((resolve, reject) => {

          fetch(`${environment.endpoint}Qz/qzfirma`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texto: toSign })
          })
            .then(r => r.text())
            .then(firma => {
              if (!firma) reject("Firma vacía");
              else resolve(firma);
            })
            .catch(err => reject(err));

        });

      });

    });


  }

  // ngOnDestroy(): void {
  //   // Limpia el listener y desconecta el hub al destruir el componente
  //   if (this.hubConnection) {
  //     this.hubConnection.off('RecibirTicket', this.ticketListener);
  //     console.log('🧹 Listener "RecibirTicket" removido en OnDestroy');

  //     this.hubConnection.stop().then(() => {
  //       console.log('🛑 Conexión SignalR detenida en OnDestroy');
  //     }).catch(err => console.error('❌ Error al detener la conexión SignalR:', err));
  //   }
  // }



  ngOnDestroy(): void {

    if (this.limpiarPedidosInterval) {
      clearInterval(this.limpiarPedidosInterval);
    }

    // console.log('[PedidoComponent] Destruyendo...');

    this.signalUnsubs.forEach(unsub => {
      try { unsub(); } catch (err) {
        //  console.warn('Error unsub listener', err);
      }
    });
    this.signalUnsubs = [];

    //para el intervalo de internet lento
    // if (this.intervaloInternet) {
    //   clearInterval(this.intervaloInternet);
    // }

    // this.signalRService.stopConnection();


  }



  async ngOnInit(): Promise<void> {

    // window.addEventListener('offline', () => {
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Sin conexión',
    //     text: 'Se perdió la conexión a internet. El sistema no puede enviar pedidos.'
    //   });
    // });

    // window.addEventListener('online', () => {

    //   const info = this.obtenerInfoInternet();

    //   Swal.fire({
    //     icon: 'success',
    //     title: 'Conexión restaurada',
    //     html: info
    //       ? `Velocidad estimada: <b>${info.velocidadMbps} Mbps</b>`
    //       : 'Internet disponible nuevamente.',
    //     timer: 2500,
    //     showConfirmButton: false
    //   });

    // });


    // this.iniciarMonitorInternet();



    // if (this.serialGuardado) {
    //   this.verificarLicencia(this.serialGuardado);
    // } else {
    //   this.pedirLicencia();
    // }

    this.actualizarEstadoUsuario();

    this.limpiarPedidosInterval = setInterval(() => {
      const ahora = Date.now();

      this.pedidosImpresos.forEach((time, id) => {
        if (ahora - time > 60 * 60 * 1000) { // 1 hora
          this.pedidosImpresos.delete(id);
        }
      });

    }, 1000 * 60 * 5);


    this.checkVersionMessage();


    this.licencias5diasAntes();

    this.innerWidth = window.innerWidth;//esto para ocualtar cosa en vista movil

    this.signalRService.startConnection();



    // if (usuarioAdmin.rolDescripcion === "Administrador" && this.innerWidth >= 768) {
    // Iniciar la conexión desde Layout



    this.registrarEventosSignalR();


    // }
    // this.obtenerClaveSecreta();

    // this.setupInactivityTimer();

    //funciona para inabilitar la aplicacion visualmente dejandola en blanco es funcional
    const dueDate = new Date('2025-11-15');   // Fecha de vencimiento
    const deadline = 3;  // Plazo en días
    const currentDate = new Date();  // Fecha actual

    const daysPassed = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPassed > 0) {
      // const daysLate = daysPassed - deadline;
      // let opacity = 1 - (daysLate / deadline);
      // opacity = Math.min(opacity, 1);
      // opacity = Math.max(opacity, 0);

      // // Aplicar la opacidad al body del documento
      // document.body.style.opacity = opacity.toString();

      // Mostrar mensaje de alerta si el plazo ha pasado
      // if (daysPassed > deadline) {
      //   Swal.fire({
      //     title: 'Tiempo vencido',
      //     text: `Han pasado ${daysLate} días desde el plazo de 15 días. Reúnase con su dueño.`,
      //     icon: 'warning',
      //     confirmButtonText: 'Entendido'
      //   });
      // }

    }

    // this.actualizarDatosUsuario();
    this.imageUpdatedService.imageUpdated$.subscribe(() => {
      this.actualizarImagenUsuario();
    });

    // if (!this.authService.isAuthenticated()) {
    //   // Redirige al inicio de sesión si el usuario no está autenticado
    //   this.router.navigate(['/login']);
    // }
    // this.imageUpdatedService.imageUpdated$.subscribe(() => {
    //   // Actualizar la URL de la imagen
    //   this.obtenerInformacionEmpresa();
    //   this.actualizarImagenUsuario();
    // });


    // Suscribirse a los cambios en la cantidad de productos bajo stock
    this.notificacionService.numeroProductosBajoStock$.subscribe(numero => {
      // Asignar la cantidad de productos al componente para mostrar en la interfaz de usuario
      this.numeroProductosBajoStock = numero;
    });

    this.notificacionService.iniciarActualizacionAutomatica();

    this.authService.usuario$.subscribe(usuario => {
      this.actualizarNombreUsuario();
      // console.log('Usuario actualizado en tiempo real:', usuario);
    });

    // Inicializa el nombre de usuario al cargar el componente
    this.actualizarNombreUsuario();

    // Actualiza el nombre de usuario cada segundo
    // setInterval(() => {
    //   this.actualizarNombreUsuario();
    // }, 1000);
    //  setInterval(() => {
    //       this.actualizarDatosUsuario();
    //     }, 1000);

    this.listaMenus.sort((a, b) => a.nombre.localeCompare(b.nombre));


    const usuario = this._utilidadServicio.obtenerSesionUsuario();
    // console.log('Usuario:', usuario);


    // Suscribirse al evento de actualización de la empresa
    this.empresaDataService.empresaActualizada$.subscribe((nuevaEmpresa) => {
      // Actualizar el nombre de la empresa en el layout
      this.nombreEmpresa = nuevaEmpresa.nombreEmpresa;
    });

    // this.imageUpdatedService.imageUpdated$.subscribe(() => {
    //   console.log('Recibida notificación de actualización de imagen22');
    //   const nuevaImagenUrl = this.obtenerNuevaImagenUrl();
    //   this.zone.run(() => {
    //     this.imagenUrl = nuevaImagenUrl;
    //     // this.cdr.detectChanges(); // Activar manualmente la detección de cambios
    //   });
    // });



    if (usuario != null) {
      this.correoUsuario = usuario.correo;
      this.nombreUsuario = usuario.nombreCompleto;
      this.rolUsuario = usuario.rolDescripcion;
      if ((usuario.imagenUrl)) {
        // Si ya es un Uint8Array
        this.imagenUrl = usuario.imagenUrl;
      }

      // console.log('Ruta de la imagen del usuario:', this.imageData);
      // Llamada al servicio para obtener los menús
      this._menusServicio.lista(usuario.idUsuario).subscribe({
        next: (response: ReponseApi) => {
          if (response.status) {
            const data = response.value; // Obtener los datos de la respuesta

            // Obtener los idMenu de los menús asociados con el rol del usuario
            const idMenusAsociados = data.map((entry: any) => entry.idMenu);

            // Filtrar los menús para mostrar solo aquellos asociados con el rol del usuario
            const menusAsociados = data.filter((entry: any) => idMenusAsociados.includes(entry.idMenu));

            // Organizar los menús con submenús
            this.listaMenus = this.organizarMenusConSubmenus(menusAsociados, idMenusAsociados);
          }
        },
        error: (e) => {

          this.token();
        }
      });


    }
    else {
      window.location.reload();

    }
    // Verificar si hay un color almacenado en el localStorage


    //Toma el cambio del color y lo aplica aqui en el layout

    // const colorGuardado = localStorage.getItem('colorSeleccionado');
    // if (colorGuardado) {
    //   this.selectedColor = colorGuardado; // Usar el color guardado como valor predeterminado
    //   this.cambiarColor(colorGuardado); // Aplicar los estilos según el color guardado
    // }

    this.colorService.color$.subscribe((color: string) => {
      this.cambiarColor(color);
    });

    // Si ya hay un color guardado en localStorage, se aplica al inicio
    const storedColor = localStorage.getItem('colorSeleccionado');
    if (storedColor) {
      this.cambiarColor(storedColor);
    }
    //Fin

    this.obtenerInformacionEmpresa();

  }


  esMovil(): boolean {
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  // private iniciarMonitorInternet() {

  //   // Si el navegador soporta info de red
  //   const connection = (navigator as any).connection ||
  //     (navigator as any).mozConnection ||
  //     (navigator as any).webkitConnection;

  //   if (connection) {
  //     if (
  //       connection.effectiveType === '2g' ||
  //       connection.effectiveType === 'slow-2g' ||
  //       connection.downlink < 1
  //     ) {
  //       this.mostrarInternetLento();
  //     }
  //   }
  // }

  private iniciarMonitorInternet() {

    const info = this.obtenerInfoInternet();
    if (!info) return;

    // Internet lento para POS
    if (
      info.velocidadMbps < 1 ||
      info.tipo === '2g' ||
      info.tipo === 'slow-2g'
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Conexión lenta',
        html: `
        <p>Velocidad aproximada:</p>
        <b>${info.velocidadMbps} Mbps</b>
        <br>
        <small>Pedidos y facturas pueden tardar.</small>
      `
      });
    }
  }

  private obtenerInfoInternet() {
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) {
      return null;
    }

    return {
      tipo: connection.effectiveType,   // '4g', '3g', '2g'
      velocidadMbps: connection.downlink, // Mbps
      latencia: connection.rtt          // ms
    };
  }


  private mostrarInternetLento() {
    if (this.avisoMostrado) return;

    this.avisoMostrado = true;
    this.segundosInternet = 0;

    Swal.fire({
      icon: 'warning',
      title: 'Conexión lenta',
      html: `<b>0 segundos</b>`,
      allowOutsideClick: false,
      didOpen: () => {
        this.intervaloInternet = setInterval(() => {
          this.segundosInternet++;

          Swal.update({
            html: `
            <p>La conexión está lenta.</p>
            <small>Pedidos y facturas pueden tardar.</small>
            <b>${this.segundosInternet} segundos</b>
          `
          });
        }, 2000);
      }
    });
  }

  private cerrarInternetLento() {
    clearInterval(this.intervaloInternet);
    this.avisoMostrado = false;
    Swal.close();
  }


  private clavePedido(pedido: any): string {
    const cantidad = pedido.detalleVenta?.length ?? 0;
    return `${pedido.idPedido}-${cantidad}`;
  }


  private registrarEventosSignalR(): void {

    const usuarioAdmin = this._utilidadServicio.obtenerSesionUsuario();
    if (!usuarioAdmin) return;


    // ============================================================
    //                     🟩 PEDIDOS
    // ============================================================

  //  Pedido Registrado
    this.signalUnsubs.push(
      this.signalRService.onPedidoRegistrado((pedidoOriginal) => {

        const pedido = JSON.parse(JSON.stringify(pedidoOriginal));

        if (!pedido?.idPedido) return;

        if (this.esMovil()) return;



        const ahora = Date.now();
        const ultimo = this.pedidosImpresos.get(pedido.idPedido);

        // Bloqueo anti-duplicado real
        if (ultimo && (ahora - ultimo) < 5000) {
          console.log('⛔ Pedido duplicado bloqueado:', pedido.idPedido);
          return;
        }

        // Marcar inmediatamente
        this.pedidosImpresos.set(pedido.idPedido, ahora);

        const data = [
          { nombreMesa: pedido.nombreMesa, idPedido: pedido.idPedido }
        ];

        if (usuarioAdmin.rolDescripcion === "Administrador") {
      
          

          this.notificarGlobal(pedido, 'Pedido registrado');
        }

      })
    );




    // this.signalUnsubs.push(
    //   this.signalRService.onTicketRecibido((ticketHtml: string) => {
    //     console.log('📩 Ticket recibido desde móvil:', ticketHtml);
    //     this.imprimirTicket2(ticketHtml); // QZ-Tray imprime
    //      this.notificarGlobal(ticketHtml, "Ticket recibido");
    //   })
    // );
    this.signalUnsubs.push(
      this.signalRService.onTicketRecibido((pedidoOriginal: any) => {
        // console.log(pedidoOriginal);
        const pedido = JSON.parse(JSON.stringify(pedidoOriginal));

        // if (!pedido?.idPedido) return;
        if (this.esMovil()) return;

        const clave = this.clavePedido(pedido);
        const ahora = Date.now();
        const ultimo = this.pedidosImpresos.get(clave);

        // Bloqueo anti-duplicado
        if (ultimo && (ahora - ultimo) < 5000) {
          console.log('⛔ Ticket duplicado bloqueado:', clave);
          return;
        }

        // Marcar este estado como impreso
        this.pedidosImpresos.set(clave, ahora);

        console.log(pedido);
        // this.imprimirTicket2(pedido);
        this.imprimirCocina(pedido);

        this.notificarGlobal(pedido, 'Ticket recibido');
      })
    );

    //   this.signalUnsubs.push(
    //   this.signalRService.onTicketRecibido((pedidoOriginal: string) => {
    //     console.log('📩 Ticket recibido desde móvil:', pedidoOriginal);

    //     const pedido = JSON.parse(JSON.stringify(pedidoOriginal));

    //     if (pedidoOriginal?.trim().length > 0) {
    //       this.imprimirTicket2(pedido);
    //     }
    //     this.notificarGlobal(pedido, "Ticket recibido");
    //   })
    // );


    this.signalUnsubs.push(
      this.signalRService.onUsuarioEditado((usuarioEditado) => {

        console.log("SignalR recibido:", usuarioEditado);

        const datosUsuarioEncriptados = localStorage.getItem("usuario");

        if (!datosUsuarioEncriptados) return;

        const bytesDesencriptados = CryptoJS.AES.decrypt(datosUsuarioEncriptados, this.CLAVE_SECRETA);
        const datosDesencriptados = bytesDesencriptados.toString(CryptoJS.enc.Utf8);
        const usuarioActual = JSON.parse(datosDesencriptados);

        if (usuarioActual.idUsuario === usuarioEditado.idUsuario) {

          this._usuarioServicio.obtenerUsuarioPorId(usuarioEditado.idUsuario).subscribe(
            (resp: any) => {

              if (resp != null) {

                console.log(resp)
                if (!resp.esActivo) {
                  console.log("Usuario desactivado, cerrando sesión");
                  localStorage.clear();
                  window.location.href = '/login';
                  return;
                }

                // Actualizar localStorage correctamente
                const nuevoUsuarioEncriptado = CryptoJS.AES.encrypt(
                  JSON.stringify(resp.value),
                  this.CLAVE_SECRETA
                ).toString();

                localStorage.setItem("usuario", nuevoUsuarioEncriptado);

                console.log("Usuario actualizado en localStorage");

                // Opcional: recargar para aplicar cambios
                window.location.reload();
              }



            },
            (error: any) => {
              if (error === 401) {
                localStorage.clear();
                window.location.href = '/login';
              }
            }
          );
        }
      })
    );

    // Pedido Actualizado
    this.signalUnsubs.push(
      this.signalRService.onPedidoActualizado((data) => {
        console.log("🔄 Pedido actualizado", data);
        this.notificarGlobal(data, "Pedido actualizado");
      })
    );

    // Pedido Editado
    this.signalUnsubs.push(
      this.signalRService.onPedidoEditado((data) => {
        console.log("✏️ Pedido editado", data);
        this.notificarGlobal(data, "Pedido editado");
      })
    );

    // Pedido Anulado
    this.signalUnsubs.push(
      this.signalRService.onPedidoAnulado((data) => {
        console.log("❌ Pedido anulado", data);
        this.notificarGlobal(data, "Pedido anulado");
      })
    );

    // ============================================================
    //                     🟦 VENTAS
    // ============================================================


    // Venta Registrada
    this.signalUnsubs.push(
      this.signalRService.onVentaRegistrada((data) => {
        console.log("💰 Venta registrada", data);
        if (usuarioAdmin.rolDescripcion === "Administrador") {
          this.notificarGlobal(data, "Venta registrada");
        }
      })
    );

    // Venta Anulada
    this.signalUnsubs.push(
      this.signalRService.onVentaAnulado((data) => {
        console.log("❌ Venta anulada", data);
        if (usuarioAdmin.rolDescripcion === "Administrador") {
          this.notificarGlobal(data, "Venta anulada");
        }
      })
    );



    // ============================================================
    //                     🟧 PRODUCTOS
    // ============================================================

    if (usuarioAdmin.rolDescripcion === "Administrador") {
      // Imagen de Producto Actualizada
      this.signalUnsubs.push(
        this.signalRService.onProductosImagen((data) => {
          console.log("🖼️ Imagen producto actualizada", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Nueva imagen de producto");
          }
        })
      );

      // Producto ingresado a bodega
      this.signalUnsubs.push(
        this.signalRService.onProductosBodega((data) => {
          console.log("📦 Producto ingresado a bodega", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Producto ingresado a bodega");
          }
        })
      );

      // Producto editado
      this.signalUnsubs.push(
        this.signalRService.onProductosEditados((data) => {
          console.log("✏️ Producto editado", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Producto editado");
          }
        })
      );

      // Producto eliminado
      this.signalUnsubs.push(
        this.signalRService.onProductosEliminado((data) => {
          console.log("🗑️ Producto eliminado", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Producto eliminado");
          }
        })
      );

      // Producto guardado
      this.signalUnsubs.push(
        this.signalRService.onProductosGuardado((data) => {
          console.log("💾 Producto guardado", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Producto guardado");
          }
        })
      );

      // Productos vencidos
      this.signalUnsubs.push(
        this.signalRService.onProductosVencidos((data) => {
          console.log("⚠️ Productos vencidos", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Productos vencidos");
          }
        })
      );

      // Nueva imagen de producto
      this.signalUnsubs.push(
        this.signalRService.onProductosNuevaImagen((data) => {
          console.log("🖼️ Nueva imagen de producto", data);
          if (usuarioAdmin.rolDescripcion === "Administrador") {
            this.notificarGlobal(data, "Nueva imagen de producto");
          }
        })
      );

    }
    // ============================================================
    //                     🟪 MESAS
    // ============================================================


    // Mesa guardada
    this.signalUnsubs.push(
      this.signalRService.onMesa((data) => {
        console.log("🍽️ Mesa guardada", data);
        if (usuarioAdmin.rolDescripcion === "Administrador") {
          this.notificarGlobal(data, "Mesa guardada");
        }
      })
    );

    // Mesa editada
    this.signalUnsubs.push(
      this.signalRService.onMesaEditada((data) => {
        console.log("✏️ Mesa editada", data);
        if (usuarioAdmin.rolDescripcion === "Administrador") {
          this.notificarGlobal(data, "Mesa editada");
        }
      })
    );

    // Mesa eliminada
    this.signalUnsubs.push(
      this.signalRService.onMesaEliminada((data) => {
        console.log("🗑️ Mesa eliminada", data);
        if (usuarioAdmin.rolDescripcion === "Administrador") {
          this.notificarGlobal(data, "Mesa eliminada");
        }
      })
    );

    // ============================================================
    //                 LISTO — TODOS LOS EVENTOS ACTIVOS
    // ============================================================

    // console.log("🔗 Todos los eventos SignalR registrados en Layout");
  }


  // ============================================================
  //                    NOTIFICACIÓN GLOBAL
  // ============================================================
  private notificarGlobal(data: any, mensaje: string): void {

    const ruta = this.router.url;
    // console.log(ruta);

    const rutasExcluidas = [
      '/pages/realizarPedidos',
      '/pages/historial_Pedidos',
      '/pages/venta'
    ];

    // SI LA RUTA ESTÁ EXCLUIDA → NO MUESTRA EL MENSAJE
    if (rutasExcluidas.includes(ruta)) {
      return;
    }


    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: mensaje,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true
    });
  }


  private generarHtmlTicket(pedido: any): string {




    if (!pedido || !pedido.detallePedidos) {
      return "";
    }

    // 🔹 Comida
    const productosComida = pedido.detallePedidos.filter((x: any) =>
      (x.unidadMedidaTexto || '').toLowerCase() === 'comida'
    );

    // 🔹 Unitarios
    const productosUnitarios = pedido.detallePedidos.filter((x: any) =>
      (x.unidadMedidaTexto || '').toLowerCase() !== 'comida'
    );

    if (productosComida.length === 0 && productosUnitarios.length === 0) {
      return "";
    }

    const cortarTexto = (txt: string, max: number = 30): string => {
      if (!txt) return "";
      const palabras = txt.split(' ');
      let lineas: string[] = [];
      let lineaActual = '';

      palabras.forEach(palabra => {
        if ((lineaActual + ' ' + palabra).trim().length > max) {
          lineas.push(lineaActual.trim());
          lineaActual = palabra;
        } else {
          lineaActual += ' ' + palabra;
        }
      });

      if (lineaActual.trim().length > 0) {
        lineas.push(lineaActual.trim());
      }

      return lineas.join('\n');
    };

    // 🔥 Calcular total general
    const totalGeneral = pedido.detallePedidos.reduce((acc: number, p: any) =>
      acc + (Number(p.totalTexto) || 0)
      , 0);

    let html = `
<pre style="font-family: monospace; font-size: 12pt; width: 80mm;">
<b>
=======================================
          TICKET
=======================================
Mesa: ${pedido.nombreMesa}
Pedido #: ${pedido.idPedido}
Tipo Pedido: ${pedido.tipoPedido}
Fecha: ${pedido.fechaHora}
Estado: ${pedido.estadoPedido}
`;

    // 🔹 Si es domicilio
    if (pedido.tipoPedido === 'Domicilio' && pedido.domicilio) {
      html += `
---------------------------------------
--- DATOS DE DOMICILIO ---
Cliente: ${pedido.domicilio.nombre}
Dirección:
${pedido.domicilio.direccion}
Teléfono: ${pedido.domicilio.telefono}
Referencia:
${cortarTexto(pedido.domicilio.referencia, 30)}
---------------------------------------
-------- Pedidos --------
`;
    } else {
      html += `
---------------------------------------
-------- Pedidos --------
`;
    }

    // 🔥 SECCIÓN COMIDA
    if (productosComida.length > 0) {
      html += `
*** PRODUCTOS DE COMIDA ***
`;

      productosComida.forEach((p: any) => {
        const comentarioFinal = cortarTexto(p.comentario || "");

        html += `
${p.descripcionProducto}
Cant: ${p.cantidad}
${comentarioFinal ? "Nota: " + comentarioFinal : ""}
---------------------------------------
`;
      });
    }

    // 🔥 SECCIÓN UNITARIOS
    if (productosUnitarios.length > 0) {
      html += `
*** PRODUCTOS UNITARIOS ***
`;

      productosUnitarios.forEach((p: any) => {
        const comentarioFinal = cortarTexto(p.comentario || "");

        html += `
${p.descripcionProducto}
Cant: ${p.cantidad}
${comentarioFinal ? "Nota: " + comentarioFinal : ""}
---------------------------------------
`;
      });
    }

    // 🔹 Comentario general
    if (pedido.comentarioGeneral) {
      html += `
--- Comentario General ---
${cortarTexto(pedido.comentarioGeneral)}
---------------------------------------
`;
    }

    const totalGeneralTexto = Number(pedido.detallePedidos[0].totalTexto)
      .toLocaleString("es-CO");

    html += `
============== TOTAL ==============
Total General: ${totalGeneralTexto}
===================================
</b></pre>
`;

    html += `
<div style="text-align:center; margin-top:15px; font-family: monospace;">
  <strong>¿Interesado en este sistema o uno similar?</strong><br/>
  <strong>Contáctame:</strong><br/>
  <strong>Carlos Cotes</strong><br/>
  <strong>301 209 1145</strong><br/>
  <strong>carloscotes48@gmail.com</strong><br/>
</div>
`;

    return html;
  }




  async imprimirTicket(ticketHtml: string, datos: any) {
    const nombreMesa = datos[0].nombreMesa;
    const idPedido = datos[0].idPedido;

    // Guardar el ticket en la cola
    this.ticketsPendientes.push({ idPedido, nombreMesa, ticketHtml });

    // Beep de aviso
    const audio = new Audio('/assets/Images/beep.mp3');
    audio.play().catch(() => { });
    //GA-E200 Series     y    XP-80C
    // Intentar imprimir en QZ Tray (si falla, sigue en la cola)
    try {
      if (!qz.websocket.isActive()) await qz.websocket.connect();
      const config = qz.configs.create("GA-E200 Series", {
        port: 9100,
        protocol: "raw",
        jobName: `Ticket pedido #${idPedido} - Mesa ${nombreMesa}`
      });
      await qz.print(config, [{ type: 'html', format: 'plain', data: ticketHtml }]);
      // await qz.print(config, [{ type: "raw", format: "hex", data: "1B420114" }]);
    } catch (err) {
      console.error("Error al imprimir:", err);
    }

    // Mostrar la cola de tickets si no se está mostrando otro
    if (!this.mostrandoTicket) {
      this.mostrarProximoTicket();
    }
  }

  private async mostrarProximoTicket() {
    if (this.ticketsPendientes.length === 0) {
      this.mostrandoTicket = false;
      return;
    }

    this.mostrandoTicket = true;
    const ticket = this.ticketsPendientes[0]; // ver el primero de la cola

    const result = await Swal.fire({
      icon: 'success',
      title: `Ticket #${ticket.idPedido} - Mesa ${ticket.nombreMesa}`,
      html: `El ticket fue impreso correctamente.`,
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Ver Ticket',
      reverseButtons: true
    });

    // Si el usuario hace "Ver Ticket", abrir ventana
    if (result.dismiss === Swal.DismissReason.cancel) {
      this.verTicket(ticket.ticketHtml);
    }

    // Eliminar ticket de la cola
    this.ticketsPendientes.shift();

    // Mostrar siguiente ticket
    this.mostrarProximoTicket();
  }

  private verTicket(ticketHtml: string) {
    const anchoTicketDefault = '80mm';
    const ventana = window.open(
      '',
      '',
      'width=400,height=600,toolbar=0,location=0,menubar=0,scrollbars=0,status=0'
    );
    if (ventana) {
      ventana.document.write(`
      <html>
        <head>
          <style>
            @media print {
              body { width: ${anchoTicketDefault}; font-family: monospace; font-size: 8pt !important; white-space: pre-wrap; padding: 4px; }
              pre { font-size: 8pt !important; }
              .no-print { display: none !important; }
            }
            body { padding: 4px; font-family: monospace; font-size: 8pt; white-space: pre-wrap; width: ${anchoTicketDefault}; }
            @page { margin: 0; }
          </style>
        </head>
        <body>
          <pre>${ticketHtml}</pre>
        </body>
      </html>
    `);
      ventana.document.close();
    }
  }


  private guardarTicketPendiente(idPedido: number, ticketHtml: string) {
    const pendientes = JSON.parse(localStorage.getItem('ticketsPendientes') || '[]');
    pendientes.push({ idPedido, ticketHtml });
    localStorage.setItem('ticketsPendientes', JSON.stringify(pendientes));
  }

  private eliminarTicketPendiente(idPedido: number) {
    const pendientes = JSON.parse(localStorage.getItem('ticketsPendientes') || '[]');
    const actualizados = pendientes.filter((t: any) => t.idPedido !== idPedido);
    localStorage.setItem('ticketsPendientes', JSON.stringify(actualizados));
  }



  async imprimirTicket2(texto: string) {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }


      const audio = new Audio('/assets/Images/beep.mp3');
      audio.play().catch(() => { });

      // const config = qz.configs.create("XP-80C", {
      //   port: 9100,
      //   protocol: "raw"
      // });

      const config = qz.configs.create("GA-E200 Series", {
        port: 9100,
        protocol: "raw"
      });

      // 1️⃣ Imprimir HTML
      await qz.print(config, [
        {
          type: 'html',
          format: 'plain',
          data: texto.replace(/\n/g, "<br>") + "<br><br><br>"
        }
      ]);

      // 2️⃣ Enviar beep de 2 segundos (separado)
      await qz.print(config, [
        {
          type: "raw",
          format: "hex",
          data: "1B420114"
        }
      ]);

      Swal.fire({
        icon: 'success',
        title: 'Ticket impreso',
        text: 'El ticket se imprimió, cortó y pitó.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#1337E8',

      });

    } catch (error) {
      console.error("❌ Error en impresión:", error);
    }
  }


  imprimirCocina(pedido: any) {

    if (!pedido || !pedido.idPedido) {
      console.error("❌ Pedido inválido:", pedido);
      return;
    }

    console.log("📤 Enviando pedido limpio:", pedido);

    this.pedidoService.imprimirCocina(pedido).subscribe({
      next: (res) => console.log("✅ Impreso", res),
      error: (err) => console.error(err)
    });
  }

  // async imprimirTicket(html: string) {
  //   try {
  //     console.log("🔹 HTML recibido para imprimir:\n", html);

  //     // ============== CERTIFICADO ==============
  //     qz.security.setCertificatePromise(() => {
  //       console.log("🔹 Cargando certificate.txt...");
  //       return fetch("assets/certs/certificate.txt")
  //         .then(r => r.text());
  //     });

  //     console.log("🔹 QZ Configuración actual:", qz.security);

  //     qz.security.setSignaturePromise((toSign: any) => {
  //       console.log("🔹 Firmando con private.txt…");
  //       return fetch("assets/certs/private.txt")
  //         .then(res => res.text())
  //         .then(privateKey => {
  //           try {
  //             const firma = qz.crypto.sign(toSign, privateKey);
  //             console.log("🔹 Firma generada correctamente");
  //             return firma;
  //           } catch (err) {
  //             console.error("❌ ERROR FIRMANDO:", err);
  //             throw err;
  //           }
  //         })
  //         .catch(err => {
  //           console.error("❌ ERROR CARGANDO O FIRMANDO:", err);
  //           throw err;
  //         });
  //     });



  //     // ============== CONEXIÓN ==============
  //     if (!qz.websocket.isActive()) {
  //       console.log("🔹 Conectando a QZ...");
  //       await qz.websocket.connect();
  //       console.log("🔹 QZ conectado correctamente");
  //     }

  //     // ============== IMPRESORA ==============
  //     const printerName = await qz.printers.find("GA-E200 Series");
  //     const config = qz.configs.create(printerName);

  //     // ============== DATOS DE IMPRESIÓN ==============
  //     const data = [{
  //       type: "html",
  //       format: "html",
  //       data: html
  //     }];

  //     console.log("🔹 Enviando a imprimir…");

  //     await qz.print(config, data);

  //     console.log("🖨️ Ticket impreso (SILENCIOSO) ✔");

  //   } catch (err) {
  //     console.error("❌ Error al imprimir:", err);
  //   }
  // }




  licencias5diasAntes() {
    this.licenciaService.consultar().subscribe({
      next: (res) => {
        // console.log("✅ Respuesta del backend:", res);

        if (res.licencia.estadoPago && res.licencia.activa) {
          if (res.diasRestantes !== undefined) {
            const usuario = this._utilidadServicio.obtenerSesionUsuario();
            // console.log('Usuario:', usuario);
            if (usuario.rolDescripcion == "Administrador") {
              if (res.diasRestantes > 0 && res.diasRestantes <= 5) {
                Swal.fire({
                  title: '⚠️ Licencia por vencer',
                  text: `Tu licencia expira en ${res.diasRestantes} día(s). Por favor contacta al dueño para renovarla.`,
                  icon: 'warning',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#f39c12'
                });
              } else if (res.diasRestantes === 0) {
                Swal.fire({
                  title: '⛔ Licencia expira HOY',
                  text: 'Tu licencia vence hoy mismo. Contacta al dueño urgentemente.',
                  icon: 'error',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#e74c3c'
                });
              } else {
                console.log("✅ Licencia válida y vigente");
              }
            }

          }
        } else {
          // Swal.fire({
          //   title: '❌ Licencia vencida o inválida',
          //   text: 'El sistema se bloqueará hasta renovar la licencia.',
          //   icon: 'error',
          //   confirmButtonText: 'Salir',
          //   confirmButtonColor: '#c0392b'
          // });
          // Aquí puedes hacer logout o bloquear acceso
        }
      },
      error: (err) => {
        console.error("❌ Error consultando licencia", err);
      }
    });
  }

  private async checkVersionMessage(): Promise<void> {
    const savedVersion = localStorage.getItem('appVersion');

    // Si la versión cambió, mostramos el aviso
    if (savedVersion !== this.appVersion) {
      Swal.fire({
        title: '🚀 ¡Nueva versión disponible!',
        html: `
        <div style="text-align: left; font-size: 15px; line-height: 1.5;">
          <p>Se ha detectado una <strong>actualización (${this.appVersion})</strong> en el sistema.</p>
          <p>Para que los cambios se apliquen correctamente, es necesario <strong>recargar la página y cerrar la sesión</strong>.</p>
          <hr style="margin: 12px 0;">
          <ul style="padding-left: 20px; margin: 0;">
            <li>🔧 Correcciones de errores importantes</li>
            <li>⚡ Mayor rendimiento y velocidad</li>
            <li>🛠️ Ajustes de estabilidad</li>
            <li>🌟 Mejoras en la experiencia de usuario</li>
          </ul>
        </div>
      `,
        icon: 'info',
        confirmButtonColor: '#1337E8',
        cancelButtonColor: '#d33',
        // showCancelButton: true,
        confirmButtonText: '🔄 Recargar ahora',
        // cancelButtonText: '📌 Más tarde',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'rounded-2xl shadow-lg',
          confirmButton: 'swal2-confirm btn btn-primary',
          // cancelButton: 'swal2-cancel btn btn-secondary'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Guardamos la nueva versión en localStorage
          localStorage.setItem('appVersion', this.appVersion);
          // this._utilidadServicio.eliminarSesionUsuario();
          // Forzamos recarga de la página
          window.location.reload();
        } else {
          // Guardamos pero dejamos que el usuario decida cuándo refrescar
          localStorage.setItem('appVersion', this.appVersion);
        }
      });
    }
  }



  verificarLicencia(serial: string): void {
    this.licenciaService.validarLicencia(serial).subscribe({
      next: (res) => {
        // console.log('📩 Respuesta del backend:', res);
        if (res.mensaje === 'Pago confirmado') {
          // ✅ Aquí podrías permitir login normal
          // console.log('Pago confirmado');
          if (res.activa == false) {
            // console.log('Licencia inactiva');
          }

        } else {
          //console.log('aquiiii', res);
          this.mostrarAlertaLicencia(res.mensaje);
        }
      },
      error: (err) => {
        this.mostrarAlertaLicencia('Error validando licencia');
      }
    });
  }

  mostrarAlertaLicencia(mensaje: string): void {
    Swal.fire({
      title: 'Licencia Vencida o Licencia Desactivada',
      confirmButtonColor: '#1337E8',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Ingresar nueva licencia'
    }).then(() => {
      this.pedirLicencia();
    });
  }

  pedirLicencia(): void {
    Swal.fire({
      title: 'Ingrese su licencia',
      text: '📞 Pongase en contacto con el dueño del aplicativo para gestionar su licencia: 3012091145',
      input: 'text',
      inputPlaceholder: 'Digite el serial de la licencia',
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      showCancelButton: false,
      confirmButtonText: 'Validar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      preConfirm: (serial) => {
        if (!serial) {
          Swal.showValidationMessage('Debe ingresar un serial válido');
          // console.warn('⚠️ Validación fallida: serial vacío');
          return false;
        }

        // ✅ Caso 1: licencia por defecto
        if (serial === '1081828957') {
          // console.info('✅ Licencia por defecto detectada, redirigiendo a /licencias');
          this.router.navigate(['/licencias']);
          return true;
        }

        //console.log('🔎 Validando serial ingresado:', serial);

        // ✅ Caso 2: validar contra API
        return this.licenciaService.validarLicencia(serial).toPromise()
          .then((res) => {
            //console.log('📩 Respuesta del backend:', res);

            if (res.mensaje === 'Pago confirmado') {
              localStorage.setItem('licencia', serial);
              // console.info('✅ Licencia válida guardada en localStorage:', serial);
              return true; // cierra el Swal
            } else {
              // console.warn('⚠️ Licencia inválida:', res.mensaje);
              Swal.showValidationMessage(res.mensaje);
              return false; // mantiene abierto
            }
          })
          .catch((err) => {
            // console.error('❌ Error en la validación de licencia:', err);

            // Intentamos leer el mensaje que manda tu API
            let mensajeError = 'Error validando licencia';
            if (err?.error?.mensaje) {
              mensajeError = err.error.mensaje;  // 👈 viene del backend (ej: "Licencia vencida")
            } else if (err.message) {
              // Solo mostramos algo corto
              mensajeError = 'Esta licencia no es válida';
            }

            Swal.showValidationMessage(`Error validando licencia: ${mensajeError}`);
            return false;
          });

      }
    }).then((result) => {
      if (result.isConfirmed) {
        // console.log('🎉 Swal confirmado: licencia válida');
        Swal.fire('Éxito', 'Licencia válida, puede continuar', 'success');
      } else {
        //console.log('ℹ️ Swal cerrado sin confirmar');
      }
    });
  }



  ngAfterViewInit() {
    const container = this.sidenavContainer.nativeElement;

    container.addEventListener('touchstart', (event: TouchEvent) => {
      this.touchStartX = event.changedTouches[0].screenX;
    });

    container.addEventListener('touchend', (event: TouchEvent) => {
      this.touchEndX = event.changedTouches[0].screenX;
      this.handleSwipe();
    });
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (swipeDistance > 50) {
      // Deslizó a la derecha → abrir
      this.sidenav.open();
    } else if (swipeDistance < -50) {
      // Deslizó a la izquierda → cerrar
      this.sidenav.close();
    }
  }


  mostrarTicket(contenidoTexto: string) {
    const contenidoFormateado = contenidoTexto
      .replace(/(?<!\*)\*\*(?!\*)(.*?)\*\*(?!\*)/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const contenidoHtml = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            padding: 10px;
            white-space: pre-wrap;
            line-height: 1.5;
          }
          .ticket {
            width: 280px;
            margin: auto;
          }
          .ticket-header, .ticket-footer {
            text-align: center;
            font-weight: bold;
          }
          .ticket-total {
            font-weight: bold;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div>${contenidoFormateado}</div>
        </div>
      </body>
    </html>
  `;

    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (ventana) {
      ventana.document.write(contenidoHtml);
      ventana.document.close();
      ventana.onload = () => {
        ventana.focus();
        ventana.print();
        ventana.close();
      };
    }
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.innerWidth = window.innerWidth;
  }

  isMobileView(): boolean {
    return this.innerWidth <= 768;
  }
  cambiarMensaje() {
    this.mensaje = 'Mensaje cambiado!';
    this.dispararDeteccionCambios();
  }

  // Método para disparar la detección de cambios
  dispararDeteccionCambios() {
    this.cdr.markForCheck();
  }
  //se puede borrar
  actualizarImagenUsuario(): void {
    const usuarioEncriptado = localStorage.getItem('usuario');
    if (usuarioEncriptado) {
      try {
        const bytes = CryptoJS.AES.decrypt(usuarioEncriptado, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

        if (datosDesencriptados) {
          const usuario = JSON.parse(datosDesencriptados);
          this.usuario = usuario;
          this.nombreUsuario = usuario.nombreCompleto || '';
          this.rolUsuario = usuario.rolDescripcion || '';

          if (usuario.imagenUrl) {
            this.cargarImagenDesdeDatos(usuario.imagenUrl);
          } else {
            console.error('No se encontraron datos de imagen en el usuario desencriptado');
          }
        } else {
          console.error('Los datos desencriptados están vacíos.');
        }
      } catch (error) {
        console.error('Error al desencriptar los datos:', error);
      }
    } else {
      console.error('No se encontraron datos en el localStorage.');
    }
  }

  cargarImagenDesdeDatos(imagenUrl: string): void {
    if (typeof imagenUrl === 'string') {
      this.imagenUrl = `${imagenUrl}`;
      this.cdr.markForCheck();
    } else {
      console.error('El tipo de datos de la imagen no es válido.');
    }
  }
  actualizarDatosUsuario(): void {
    const usuarioEncriptado = localStorage.getItem('usuario');
    if (usuarioEncriptado) {
      try {
        const bytes = CryptoJS.AES.decrypt(usuarioEncriptado, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

        if (datosDesencriptados) {
          const usuario = JSON.parse(datosDesencriptados);
          this.usuario = usuario; // Almacena el usuario desencriptado

          this.nombreUsuario = usuario.nombreCompleto || '';
          this.rolUsuario = usuario.rolDescripcion || '';

          if (usuario.imagenUrl) {
            this.cargarImagenDesdeDatos(usuario.imagenUrl); // Carga la imagen desde los datos desencriptados
          } else {
            console.error('No se encontraron datos de imagen en el usuario desencriptado');
          }
        } else {
          console.error('Los datos desencriptados están vacíos.');
        }
      } catch (error) {
        console.error('Error al desencriptar los datos:', error);
      }
    } else {
      console.error('No se encontraron datos en el localStorage.');
    }
  }




  arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }



  actualizarNombreUsuario(): void {
    const usuarioEncriptado = localStorage.getItem('usuario');
    if (usuarioEncriptado) {
      try {
        const bytes = CryptoJS.AES.decrypt(usuarioEncriptado, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

        if (datosDesencriptados) {
          const usuario = JSON.parse(datosDesencriptados);
          this.nombreUsuario = usuario.nombreCompleto || '';
          this.rolUsuario = usuario.rolDescripcion || '';
        } else {
          console.error('Los datos desencriptados están vacíos.');
        }
      } catch (error) {
        console.error('Error al desencriptar los datos:', error);
      }
    } else {
      console.error('No se encontraron datos en el localStorage.');
    }
  }

  actualizarEstadoUsuario(): void {
    const usuarioEncriptado = localStorage.getItem('usuario');
    if (usuarioEncriptado) {
      try {
        const bytes = CryptoJS.AES.decrypt(usuarioEncriptado, this.CLAVE_SECRETA!);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);

        if (datosDesencriptados) {
          const usuario = JSON.parse(datosDesencriptados);
          this.nombreUsuario = usuario.nombreCompleto || '';
          this.rolUsuario = usuario.rolDescripcion || '';
          console.log(usuario);
          if (usuario.esActivo == 0) {
            this._utilidadServicio.eliminarSesionUsuario();
            this.authService.logout();
            this.router.navigate(['login']);
            this.cartService.clearCart(); // para limpiar el carrito
          }

        } else {
          console.error('Los datos desencriptados están vacíos.');
        }
      } catch (error) {
        console.error('Error al desencriptar los datos:', error);
      }
    } else {
      console.error('No se encontraron datos en el localStorage.');
    }
  }
  actualizarImagen(nuevaImagen: Uint8Array, mimeType: string) {
    this.imageData = nuevaImagen;
    this.mimeType = mimeType;
    this.cdr.detectChanges();
  }
  obtenerClaveSecreta(): void {
    this._usuarioServicio.getClaveSecreta().subscribe({
      next: (respuesta) => {
        this.claveSecreta = respuesta.claveSecreta;
      },
      error: (err) => {
        this.error = 'Error al obtener la clave secreta.';
        console.error(err);
      }
    });
  }


  lista() {
    const usuario = this._utilidadServicio.obtenerSesionUsuario();
    if (usuario != null) {
      this.correoUsuario = usuario.correo;
      this.nombreUsuario = usuario.nombreCompleto;
      this.rolUsuario = usuario.rolDescripcion;
      if (this.isUint8Array(usuario.imageData)) {
        // Si ya es un Uint8Array
        this.imageData = usuario.imageData;
      } else {
        // Si es una cadena, convertir a Uint8Array
        const binaryString = atob(usuario.imageData);
        const uint8Array = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }

        this.imageData = uint8Array;
      }


      console.log('Ruta de la imagen del usuario:', this.imageData);
      // Llamada al servicio para obtener los menús
      this._menusServicio.lista(usuario.idUsuario).subscribe({
        next: (response: ReponseApi) => {
          if (response.status) {
            const data = response.value; // Obtener los datos de la respuesta

            // Obtener los idMenu de los menús asociados con el rol del usuario
            const idMenusAsociados = data.map((entry: any) => entry.idMenu);

            // Filtrar los menús para mostrar solo aquellos asociados con el rol del usuario
            const menusAsociados = data.filter((entry: any) => idMenusAsociados.includes(entry.idMenu));

            // Organizar los menús con submenús
            this.listaMenus = this.organizarMenusConSubmenus(menusAsociados, idMenusAsociados);
          }
        },
        error: (e) => {

          this.token();
        }
      });


    }


  }

  token() {
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
              this.lista();
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
  detectChangesManually() {
    this.cdr.detectChanges();
  }

  colors = [
    { value: 'blanco', viewValue: 'Blanco' },
    { value: 'morado', viewValue: 'Morado' },
    { value: 'rojo', viewValue: 'Rojo' },
    { value: 'verde', viewValue: 'Verde' }

  ];
  cambiarColor(colorSeleccionado: string): void {
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
  onOptionMouseEnter() {
    this.applyHoverClass = true;
  }

  onOptionMouseLeave() {
    this.applyHoverClass = false;
  }
  getColorTextClass(color: string): string {
    return color === 'blanco' ? 'text-black' : 'text-white';
  }
  getPanelColorClass(): string {
    switch (this.toolbarColorClass) {
      case 'toolbar-white':
        return 'panel-white';
      case 'toolbar-red':
        return 'panel-red';
      case 'toolbar-green':
        return 'panel-green';
      case 'toolbar-morado':
        return 'panel-morado';
      case 'toolbar-black':
        return 'panel-black';
      case 'toolbar-azul':
        return 'panel-azul';
      default:
        return '';
    }
  }

  getButtonColorClass() {
    switch (this.selectedColor) {
      case 'rojo':
        return 'custom-button-rojo';
      case 'verde':
        return 'custom-button-verde';
      case 'morado':
        return 'custom-button-morado';
      case 'black':
        return 'custom-button-black';
      case 'azul':
        return 'custom-button-azul';
      default:
        return 'custom-button-defecto';
    }
  }


  changeColor(color: string) {
    this.selectedColor = color;
    console.log('Color seleccionado:', this.selectedColor);
  }


  getIconColorClass(): string {
    switch (this.toolbarColorClass) {
      case 'toolbar-white':
        return 'icon-black';
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
        return 'text-black';
      case 'toolbar-red':
        return 'text-white';
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
        return 'icon-black';
      case 'toolbar-red':
        return 'icon-white';
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
  handleClickEvent(event: Event): void {
    // Puedes agregar la lógica que necesites aquí
    console.log('Item clicked:', event);
  }
  abrirNotificaciones(): void {

    // this.notificacionService.iniciarActualizacionAutomatica();
    // // Suscribirse a los cambios en la cantidad de productos bajo stock
    // this.notificacionService.numeroProductosBajoStock$.subscribe(numero => {
    //   // Asignar la cantidad de productos al componente para mostrar en la interfaz de usuario
    //   this.numeroProductosBajoStock = numero;
    // });


    if (this.numeroProductosBajoStock === 0) {
      // Mostrar mensaje de error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No hay notificaciones disponibles en este momento.'
      });
    } else {
      // this.numeroProductosBajoStock = 0;
      // Abrir el modal de notificaciones
      this.notificacionService.obtenerProductosBajoStock().subscribe(productos => {

        const dialogRef = this.dialog.open(NotificacionesDialogComponent, {
          data: { productos: productos }
        });
        this.numeroProductosBajoStock = 0;

        // Manejar el evento de clic fuera del modal
        dialogRef.backdropClick().subscribe(() => {
          // Restablecer el contador a cero
          this.numeroProductosBajoStock = 0;
        });
        // Suscribirse al evento de cierre del modal
        dialogRef.afterClosed().subscribe(confirmed => {
          // Si el usuario confirmó la notificación, restablecer el contador de productos bajo stock
          if (confirmed) {
            this.numeroProductosBajoStock = 0; // Restablecer el contador a cero
            this.notificacionService.iniciarActualizacionAutomatica();
          } else {

            this.numeroProductosBajoStock = 0;
            this.notificacionService.iniciarActualizacionAutomatica();
          }
        });
      },
        error => {

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
                    this.abrirNotificaciones();
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




  obtenerInformacionEmpresa(): void {
    this.empresaService.lista2().subscribe({
      next: (response) => {
        console.log('Datos recibidos del servidor:', response);

        if (response.status && response.value.length > 0) {
          this.empresa = response.value[0];
          this.nombreEmpresa = this.empresa.nombreEmpresa;
          // console.log('Tipo de imagen:', this.empresa.logo.startsWith('data:image/png;base64,')); // Verificar el tipo de imagen

          // Verificar la URL de la imagen generada
          // console.log('URL de la imagen:', 'data:image/png;base64,' + this.empresa.logo);


        } else {
          this.empresa = response.value[0];
          this.nombreEmpresa = this.empresa.nombreEmpresa;
          console.error('Error al obtener la información de la empresa');
        }
      },
      error: (error) => this.handleTokenError(() => this.obtenerInformacionEmpresa())
    });
  }

  handleTokenError(retryCallback: () => void): void {

    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const bytes = CryptoJS.AES.decrypt(usuarioString, this.CLAVE_SECRETA!);
      const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
      if (datosDesencriptados) {
        const usuario = JSON.parse(datosDesencriptados);
        this._usuarioServicio.obtenerUsuarioPorId(usuario.idUsuario).subscribe(
          (usuario: any) => {
            const refreshToken = usuario.refreshToken;
            this._usuarioServicio.renovarToken(refreshToken).subscribe(
              (response: any) => {
                localStorage.setItem('authToken', response.token);
                // localStorage.setItem('refreshToken', response.refreshToken);
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

  verImagen2(): void {
    this.imageDialogService.openImageDialog(
      this.empresa.imagenUrl
    );
  }



  organizarMenusConSubmenus(menusAsociados: any[], idMenusAsociados: number[]): Menu[] {
    const menus: Menu[] = [];

    menusAsociados.forEach(menu => {
      const submenuIds = menusAsociados.filter(entry => entry.idMenuPadre === menu.idMenu).map(entry => entry.idMenu);
      const hasSubmenus = submenuIds.length > 0;

      // Verificar si el menú tiene submenús o no
      if (hasSubmenus || !idMenusAsociados.includes(menu.idMenuPadre)) {
        const menuObj: Menu = {
          idMenu: menu.idMenu,
          nombre: menu.nombre,
          icono: menu.icono,
          url: menu.url,
          idMenuPadre: menu.idMenuPadre,
          esPadre: menu.esPadre
        };

        // Si tiene submenús, asignarlos
        if (hasSubmenus) {
          menuObj.submenus = menusAsociados.filter(entry => entry.idMenuPadre === menu.idMenu);
        }

        menus.push(menuObj);
      }
    });

    return menus;
  }

  private setupInactivityTimer(): void {
    document.addEventListener('mousemove', () => this.authService.resetInactivityTimer());
    document.addEventListener('keydown', () => this.authService.resetInactivityTimer());
    document.addEventListener('touchstart', () => this.authService.resetInactivityTimer());
  }
  verCarrito2() {
    this.dialog.open(CarritoModalComponent, {
      width: '600px',
      data: {
        cartItems: this.cartService.getCartItems()
      }
    });
  }


  limpiarCarrito() {
    this.cartService.clearCart(); // Llama al método clearCart del servicio
    Swal.fire({
      icon: 'success',
      title: 'Carrito Limpiado',
      text: 'El carrito ha sido limpiado correctamente.',
    });
  }
  cerrarCarrito() {
    Swal.close(); // Cierra el modal de Swal
    // Lógica adicional al cerrar el carrito, si aplica
  }


  verImagenCarrito(producto: Producto): void {
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imageData: producto.imageData
      }
    });
  }



  enviarMensajeWhatsApp(mensaje: string) {
    this.empresaService.lista().subscribe({
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
            const url = `https://api.whatsapp.com/send?phone=57${telefono}&text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
          }
        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
        }
      },
      error: (error) => this.handleTokenError(() => this.enviarMensajeWhatsApp(mensaje))
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
  formatearNumero2(num: number): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(num);
  }

  cerrarSesion() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Cerrarás la sesión actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: '¡Sesión cerrada!',
          text: 'Has cerrado sesión exitosamente.',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          this._utilidadServicio.eliminarSesionUsuario();
          this.authService.logout();
          this.router.navigate(['login']);
          this.cartService.clearCart(); // para limpiar el carrito

        });
      }
    });
  }
  // cerrarSesion() {

  //   // Preguntar al usuario si está seguro de cerrar sesión
  //   const confirmacion = window.confirm('¿Estás seguro de cerrar sesión?');

  //   if (confirmacion) {
  //     // Eliminar la sesión del usuario
  //     this._utilidadServicio.eliminarSesionUsuario();

  //     // Redirigir al usuario a la página de inicio de sesión
  //     this.router.navigate(['login']);
  //   }

  // }
  // obtenerNuevaImagenUrl(): string {
  //   // Obtener la imagen almacenada desde el localStorage
  //   const imageData = localStorage.getItem('imagenUsuario');

  //   // Verificar si la imagen existe y si es una cadena base64
  //   if (imageData && imageData.startsWith('data:image')) {
  //     // La imagen ya es una URL, así que devolverla directamente
  //     return imageData;
  //   }

  //   // Si la imagen se almacena como un Uint8Array o Blob, conviértela a URL
  //   if (imageData) {
  //     const uint8Array = new Uint8Array(JSON.parse(imageData));
  //     const blob = new Blob([uint8Array], { type: 'image/png' });
  //     return URL.createObjectURL(blob);
  //   }

  //   // En caso de que no haya imagen, puedes proporcionar una URL de imagen por defecto
  //   return 'URL_POR_DEFECTO';
  // }

  convertirBytesAURL(bytes: Uint8Array, mimeType: string): string {
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  isUint8Array(value: any): value is Uint8Array {
    return value instanceof Uint8Array;
  }


  verImagen() {
    this.imageDialogService.openImageDialog(
      this.isUint8Array(this.imagenUrl) ? this.convertirBytesAURL(this.imagenUrl, this.mimeType) : this.imagenUrl
    );
  }

  cambiarNombre() {
    // Lógica para abrir el modal con la información del usuario
    this.changeInfoModalService.abrirModal();
  }

  onSeleccionDesdeSelect() {
    // Tu lógica para manejar el cambio en el select
    this.selectCambiado = true;
  }
  openCambiarImagenModal() {
    const usuario = this._utilidadServicio.obtenerSesionUsuario();

    if (usuario) {
      const dialogRef = this.dialog.open(ModalCambioImagenUsuarioComponent, {
        data: { usuario: usuario }, // Asegúrate de pasar correctamente el objeto de usuario
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('El diálogo se cerró con el resultado:', result);

        // Refrescar la página solo si el cambio provino del select
        if (this.selectCambiado) {
          window.location.reload();
          location.reload();
        }

      });
    } else {
      console.error('Usuario no encontrado al abrir el diálogo.');
    }
  }






}
