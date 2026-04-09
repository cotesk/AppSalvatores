import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  // === SUBJECTS PARA NOTIFICAR A LOS COMPONENTES HIJOS ===
  private productosActualizadosSubject = new BehaviorSubject<any | null>(null);
  productosActualizados$ = this.productosActualizadosSubject.asObservable();

  private mesasActualizadasSubject = new BehaviorSubject<any | null>(null);
  mesasActualizadas$ = this.mesasActualizadasSubject.asObservable();

  private ventasActualizadasSubject = new BehaviorSubject<any | null>(null);
  ventasActualizadas$ = this.ventasActualizadasSubject.asObservable();

  private pedidosActualizadosSubject = new BehaviorSubject<any | null>(null);
  public pedidosActualizados$ = this.pedidosActualizadosSubject.asObservable();

  // 🔥 EVENTO GLOBAL
  private eventosGlobalesSource = new Subject<any>();
  eventosGlobales$ = this.eventosGlobalesSource.asObservable();


  // HANDLERS REGISTRADOS POR EVENTO
  private pedidoRegistradoHandlers: ((pedido: any) => void)[] = [];
  private pedidoActualizadoHandlers: ((data: any) => void)[] = [];
  private pedidoEditadoHandlers: ((data: any) => void)[] = [];
  private pedidoAnuladoHandlers: ((data: any) => void)[] = [];

  private usuarioEditadoHandlers: ((data: any) => void)[] = [];

  private ventaRegistradaHandlers: ((data: any) => void)[] = [];
  private ventaAnuladoHandlers: ((data: any) => void)[] = [];

  private productosImagenHandlers: ((data: any) => void)[] = [];
  private productosBodegaHandlers: ((data: any) => void)[] = [];
  private productosEditadosHandlers: ((data: any) => void)[] = [];
  private productosEliminadoHandlers: ((data: any) => void)[] = [];
  private productosGuardadoHandlers: ((data: any) => void)[] = [];
  private productosVencidosHandlers: ((data: any) => void)[] = [];
  private productosNuevaImagenHandlers: ((data: any) => void)[] = [];

  private mesaHandlers: ((data: any) => void)[] = [];
  private mesaEditadaHandlers: ((data: any) => void)[] = [];
  private mesaEliminadaHandlers: ((data: any) => void)[] = [];

  private ticketsPendientes: string[] = [];
  private conectado: boolean = false;


  constructor() { }

  // ============================================================
  //            INICIAR CONEXIÓN SOLO EN LAYOUT
  // ============================================================
  public startConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://comidasrapidas.somee.com/hubs/pedido', {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // intentos: inmediato, 2s, 5s, 10s
      .build();


    // Eventos de reconexión
    this.hubConnection.onreconnecting(err => {
      console.warn('⚠ Reconectando SignalR...', err);
      this.conectado = false;
    });

    this.hubConnection.onreconnected(id => {
      console.log('✅ Reconectado SignalR, ConnectionId:', id);
      this.conectado = true;
      this.enviarTicketsPendientes();
    });

    this.hubConnection.onclose(err => {
      console.error('❌ Conexión SignalR cerrada', err);
      this.conectado = false;
      // Intentar reconectar manualmente cada 3s
      setTimeout(() => this.startConnection(), 3000);
    });

    // Iniciar conexión
    this.hubConnection.start()
      .then(() => {
        console.log('✅ Conexión establecida con el Hub de pedidos');
        this.conectado = true;
        this.enviarTicketsPendientes();
      })
      .catch(err => console.error('❌ Error al conectar con el Hub:', err));
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('🔌 SignalR desconectado'))
        .catch(err => console.error('❌ Error al detener la conexión SignalR:', err));
    }
  }


  // stopConnection(): void {
  //   if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
  //     this.hubConnection.stop().then(() => {
  //       console.log('🔌 SignalR desconectado');
  //     }).catch(err => {
  //       console.error('❌ Error al detener la conexión SignalR:', err);
  //     });
  //   }
  // }

  // ============================================================
  //                 REGISTRO DINÁMICO DE HANDLERS
  // ============================================================
  private registerHandler<T>(
    eventName: string,
    callback: (data: T) => void,
    handlersList: ((data: T) => void)[]
  ): () => void {

    if (!handlersList.includes(callback)) {
      handlersList.push(callback);
      this.hubConnection.on(eventName, callback);
    }

    return () => {
      this.hubConnection.off(eventName, callback);
      const index = handlersList.indexOf(callback);
      if (index !== -1) handlersList.splice(index, 1);
      console.log(`🧹 Desuscrito de ${eventName}`);
    };
  }



  onUsuarioEditado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'usuario_editado',
        usuario: data,
        mensaje: `Usuario editado`
      });
    };

    return this.registerHandler('UsuarioEditado', wrapper, this.usuarioEditadoHandlers);
  }

  // ============================================================
  //                        PEDIDOS
  // ============================================================

  onPedidoRegistrado(callback: (pedido: any) => void): () => void {
    const wrapper = (pedido: any) => {
      callback(pedido);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'pedido_registrado',
        pedido,
        mensaje: `Nuevo pedido #${pedido.idPedido} – Mesa ${pedido.nombreMesa ?? 'Cliente'}`
      });
    };

    return this.registerHandler('PedidoRegistrado', wrapper, this.pedidoRegistradoHandlers);
  }

  onPedidoActualizado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'pedido_actualizado',
        pedido: data,
        mensaje: `Pedido actualizado`
      });
    };

    return this.registerHandler('PedidoActualizado', wrapper, this.pedidoActualizadoHandlers);
  }

  onPedidoEditado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'pedido_editado',
        pedido: data,
        mensaje: `Pedido editado`
      });
    };

    return this.registerHandler('EditarPedido', wrapper, this.pedidoEditadoHandlers);
  }

  onPedidoAnulado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'pedido_anulado',
        pedido: data,
        mensaje: `Pedido anulado`
      });
    };

    return this.registerHandler('PedidoAnulado', wrapper, this.pedidoAnuladoHandlers);
  }

  // ============================================================
  //                        VENTAS
  // ============================================================
  onVentaRegistrada(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'venta_registrada',
        venta: data,
        mensaje: `Venta registrada`
      });
    };

    return this.registerHandler('VentaRegistrada', wrapper, this.ventaRegistradaHandlers);
  }

  onVentaAnulado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      // 🔥 EVENTO GLOBAL
      this.eventosGlobalesSource.next({
        tipo: 'venta_anulada',
        venta: data,
        mensaje: `Venta anulada`
      });
    };

    return this.registerHandler('VentaAnulado', wrapper, this.ventaAnuladoHandlers);
  }

  // ============================================================
  //                      PRODUCTOS
  // ============================================================
  // (estos no se unifican a eventos globales a menos que quieras)

  // onProductosImagen(callback: (data: any) => void): () => void {
  //   return this.registerHandler('ImagenProducto', callback, this.productosImagenHandlers);
  // }

  // ============================================================
  //                      PRODUCTOS
  // ============================================================


  onProductosImagen(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'imagen_producto',
        payload: data,
        mensaje: 'Nueva imagen de producto'
      });
    };

    return this.registerHandler('ImagenProducto', wrapper, this.productosImagenHandlers);
  }

  onProductosBodega(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_bodega',
        payload: data,
        mensaje: 'Producto ingresado a bodega'
      });
    };

    return this.registerHandler('ProductoIngresarBodega', wrapper, this.productosBodegaHandlers);
  }

  onProductosEditados(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_editado',
        payload: data,
        mensaje: 'Producto editado'
      });
    };

    return this.registerHandler('ProductosEditado', wrapper, this.productosEditadosHandlers);
  }

  onProductosEliminado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_eliminado',
        payload: data,
        mensaje: 'Producto eliminado'
      });
    };

    return this.registerHandler('ProductosEliminado', wrapper, this.productosEliminadoHandlers);
  }

  onProductosGuardado(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_guardado',
        payload: data,
        mensaje: 'Nuevo producto guardado'
      });
    };

    return this.registerHandler('Producto', wrapper, this.productosGuardadoHandlers);
  }

  onProductosVencidos(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_vencido',
        payload: data,
        mensaje: 'Producto vencido'
      });
    };

    return this.registerHandler('ProductoVencidos', wrapper, this.productosVencidosHandlers);
  }

  onProductosNuevaImagen(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'producto_nueva_imagen',
        payload: data,
        mensaje: 'Nueva imagen añadida al producto'
      });
    };

    return this.registerHandler('NuevaImagenProducto', wrapper, this.productosNuevaImagenHandlers);
  }

  // ============================================================
  //                          MESAS
  // ============================================================

  onMesa(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'mesa_guardada',
        payload: data,
        mensaje: 'Mesa registrada'
      });
    };

    return this.registerHandler('MesaGuardada', wrapper, this.mesaHandlers);
  }

  onMesaEditada(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'mesa_editada',
        payload: data,
        mensaje: 'Mesa editada'
      });
    };

    return this.registerHandler('MesaEditada', wrapper, this.mesaEditadaHandlers);
  }

  onMesaEliminada(callback: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      callback(data);

      this.eventosGlobalesSource.next({
        tipo: 'mesa_eliminada',
        payload: data,
        mensaje: 'Mesa eliminada'
      });
    };

    return this.registerHandler('MesaEliminada', wrapper, this.mesaEliminadaHandlers);
  }


  // ============================================================
  //                      EVENTOS HACIA LOS HIJOS
  // ============================================================
  emitirActualizacionProductos(producto: any) {
    this.productosActualizadosSubject.next(producto);
  }

  emitirActualizacionMesas(mesa: any) {
    this.mesasActualizadasSubject.next(mesa);
  }

  emitirActualizacionVentas(venta: any) {
    this.ventasActualizadasSubject.next(venta);
  }

  emitirActualizacionPedidos(pedido: any) {
    this.pedidosActualizadosSubject.next(pedido);
  }

  // ============================================================
  //                         TICKET
  // ============================================================
  private enviarTicketsPendientes() {
    while (this.ticketsPendientes.length > 0 && this.conectado) {
      const ticket = this.ticketsPendientes.shift()!;
      this.enviarTicket(ticket);
    }
  }

  public enviarTicket(contenido: string) {
    if (this.conectado && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('EnviarTicket', contenido)
        .then(() => console.log('✅ Ticket enviado correctamente'))
        .catch(err => {
          console.error('❌ Error al enviar ticket:', err);
          this.ticketsPendientes.push(contenido);
        });
    } else {
      console.warn('⚠ No hay conexión, ticket guardado en cola');
      this.ticketsPendientes.push(contenido);
      this.intentarReconectar();
    }
  }


  public onTicketRecibido(callback: (ticketHtml: string) => void): () => void {
    if (!this.hubConnection) return () => { };

    const wrapper = (ticketHtml: string) => {
      console.log('📥 Ticket recibido:', ticketHtml);
      callback(ticketHtml);
      this.eventosGlobalesSource.next({
        tipo: 'ticket_recibido',
        contenido: ticketHtml,
        mensaje: 'Ticket recibido desde otro dispositivo'
      });
    };

    this.hubConnection.on('RecibirTicket', wrapper);
    return () => this.hubConnection.off('RecibirTicket', wrapper);
  }


  private intentarReconectar() {
    if (!this.hubConnection || this.hubConnection.state === signalR.HubConnectionState.Connected) return;

    this.hubConnection.start()
      .then(() => {
        this.conectado = true;
        console.log('🔌 Reconectado al Hub de SignalR');
        this.enviarTicketsPendientes();
      })
      .catch(err => {
        console.error('❌ No se pudo reconectar:', err);
        setTimeout(() => this.intentarReconectar(), 3000);
      });
  }



}
