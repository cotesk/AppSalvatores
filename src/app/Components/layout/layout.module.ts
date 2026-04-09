import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { DashBoardComponent } from './Pages/dash-board/dash-board.component';
import { UsuarioComponent } from './Pages/usuario/usuario.component';
import { ProductoComponent } from './Pages/producto/producto.component';
import { VentaComponent } from './Pages/venta/venta.component';
import { HistorialVentaComponent } from './Pages/historial-venta/historial-venta.component';
import { ReporteComponent } from './Pages/reporte/reporte.component';
import { SharedModule } from '../../Reutilizable/shared/shared.module';
import { ModalUsuarioComponent } from './Modales/modal-usuario/modal-usuario.component';
import { ModalProductoComponent } from './Modales/modal-producto/modal-producto.component';
import { ModalDetalleVentaComponent } from './Modales/modal-detalle-venta/modal-detalle-venta.component';
import { ModalCategoriaComponent } from './Modales/modal-categoria/modal-categoria.component';

import { CategoriaComponent } from './Pages/categoria/categoria.component';

import { CambiarImagenComponent } from './Modales/cambiar-imagen/cambiar-imagen.component';
import { BackupComponent } from './Pages/backup/backup.component';
import { FileUploadComponent } from './Pages/file-upload/file-upload.component';
import { FileListComponent } from './Pages/file-list/file-list.component';
import { ConfirmDialogComponent } from './Modales/confirm-dialog/confirm-dialog.component';

import { CambiarImagenUsuarioComponent } from './Modales/cambiar-imagen-usuario/cambiar-imagen-usuario.component';
import { ModalStockComponent } from './Modales/modal-stock/modal-stock.component';
import { ConfirmacionAnulacionComponent } from './Modales/confirmacion-anulacion/confirmacion-anulacion.component';
import { ModalCaracteristicasProductoComponent } from './Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { ModalTemporizadorComponent } from './Modales/modal-temporizador/modal-temporizador.component';
import { ImageDialogComponent } from './Modales/image-dialog/image-dialog.component';
import { ChangeInfoModalComponent } from './Modales/change-info-modal/change-info-modal.component';
import { ApiComponent } from './Pages/api/api.component';

import { VerImagenProductoModalComponent } from './Modales/ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ModalCambioImagenUsuarioComponent } from './Modales/modal-cambio-imagen-usuario/modal-cambio-imagen-usuario.component';

import { LoadingModalComponent } from './Modales/loading-modal/loading-modal.component';
import { EmpresaComponent } from './Pages/empresa/empresa.component';
import { ModalEmpresaComponent } from './Modales/modal-empresa/modal-empresa.component';
import { CambiarImagenEmpresaComponent } from './Modales/cambiar-imagen-empresa/cambiar-imagen-empresa.component';
import { NotificacionesDialogComponent } from './Modales/notificaciones-dialog/notificaciones-dialog.component';
import { MenuComponent } from './Pages/menu/menu.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CajaComponent } from './Pages/caja/caja.component';
import { ModalAbrirCajaComponent } from './Modales/modal-abrir-caja/modal-abrir-caja.component';
import { ModalPrestamosComponent } from './Modales/modal-prestamos/modal-prestamos.component';
import { FileListFacturaComponent } from './Pages/file-list-factura/file-list-factura.component';
import { ColoresComponent } from './Pages/colores/colores.component';

import { ModalCambioComponent } from './Modales/modal-cambio/modal-cambio.component';
import { CambiosComponent } from './Pages/cambios/cambios.component';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { ModalGenerarCodigoBarraComponent } from './Modales/modal-generar-codigo-barra/modal-generar-codigo-barra.component';
import { ProductoCardComponent } from './Pages/producto-card/producto-card.component';
import { ContenidoComponent } from './Pages/contenido/contenido.component';
import { ModalContenidoComponent } from './Modales/modal-contenido/modal-contenido.component';
import { CambiarImagenContenidoComponent } from './Modales/cambiar-imagen-contenido/cambiar-imagen-contenido.component';
import { MatStepperModule } from '@angular/material/stepper';
import { ModalListaClientesComponent } from './Modales/modal-lista-clientes/modal-lista-clientes.component';
// import { ModalpdfViewerComponent } from './Modales/modalpdf-viewer/modalpdf-viewer.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
// import { CartComponent } from './Pages/cart/cart.component';
import { CarritoModalComponent } from './Modales/carrito-modal/carrito-modal.component';
import { ModalPruebaComponent } from './Modales/modal-prueba/modal-prueba.component';
import { BodegaComponent } from './Pages/bodega/bodega.component';
import { ConsultarCompraOnlineComponent } from './Pages/consultar-compra-online/consultar-compra-online.component';
import { ConsultarVentaOnlineComponent } from './Pages/consultar-venta-online/consultar-venta-online.component';
import { MercadoPagoCompraOnlineComponent } from './Pages/mercado-pago-compra-online/mercado-pago-compra-online.component';
import { MercadoPagoVentaComponent } from './Pages/mercado-pago-venta/mercado-pago-venta.component';

import { ModalPromocionesComponent } from './Modales/modal-promociones/modal-promociones.component';
import { PruebaComponent } from './Pages/prueba/prueba.component';
import { ModalPagosFiadosComponent } from './Modales/modal-pagos-fiados/modal-pagos-fiados.component';
import { ModalDetallePagosFiadosComponent } from './Modales/modal-detalle-pagos-fiados/modal-detalle-pagos-fiados.component';
import { ConsultarVentasComponent } from './Pages/consultar-ventas/consultar-ventas.component';
import { HistorialPedidoComponent } from './Pages/historial-pedido/historial-pedido.component';
import { MesasComponent } from './Pages/mesas/mesas.component';
import { ModalMesasComponent } from './Modales/modal-mesas/modal-mesas.component';
import { MatExpansionModule } from "@angular/material/expansion";
import { EditarPedidoDialogComponent } from './Pages/editar-pedido-dialog/editar-pedido-dialog.component';
import { EditarSoloElPedidoComponent } from './Pages/editar-solo-el-pedido/editar-solo-el-pedido.component';
import { LicenciaComponent } from './Pages/licencias/licencias.component';
import { ModalDomicilioComponent } from './Modales/modal-domicilio/modal-domicilio.component';
import { ModalEditarVentaComponent } from './Modales/modal-editar-venta/modal-editar-venta.component';



@NgModule({


  declarations: [
    DashBoardComponent,
    UsuarioComponent,
    ProductoComponent,
    VentaComponent,
    HistorialVentaComponent,
    ReporteComponent,
    ModalUsuarioComponent,
    ModalProductoComponent,
    ModalDetalleVentaComponent,
    ModalCategoriaComponent,

    CategoriaComponent,

    CambiarImagenComponent,
    BackupComponent,
    FileUploadComponent,
    FileListComponent,
    ConfirmDialogComponent,

    CambiarImagenUsuarioComponent,
    ModalStockComponent,
    ConfirmacionAnulacionComponent,
    ModalCaracteristicasProductoComponent,
    ModalTemporizadorComponent,
    ImageDialogComponent,
    ChangeInfoModalComponent,
    ApiComponent,

    VerImagenProductoModalComponent,
    ModalCambioImagenUsuarioComponent,
    LoadingModalComponent,
    EmpresaComponent,
    ModalEmpresaComponent,
    CambiarImagenEmpresaComponent,
    NotificacionesDialogComponent,
    MenuComponent,
    CajaComponent,
    ModalAbrirCajaComponent,
    ModalPrestamosComponent,
    FileListFacturaComponent,
    ColoresComponent,
    ModalCambioComponent,
    CambiosComponent,
    ModalGenerarCodigoBarraComponent,
    ProductoCardComponent,
    ContenidoComponent,
    ModalContenidoComponent,
    CambiarImagenContenidoComponent,
    ModalListaClientesComponent,
    // ModalpdfViewerComponent,
    // CartComponent,
    CarritoModalComponent,
    ModalPruebaComponent,
    BodegaComponent,
    ConsultarCompraOnlineComponent,
    ConsultarVentaOnlineComponent,
    MercadoPagoCompraOnlineComponent,
    MercadoPagoVentaComponent,
    ModalPromocionesComponent,
    PruebaComponent,
    ModalPagosFiadosComponent,
    ModalDetallePagosFiadosComponent,

    ConsultarVentasComponent,
    HistorialPedidoComponent,
    MesasComponent,
    ModalMesasComponent,
    EditarPedidoDialogComponent,
    EditarSoloElPedidoComponent,
    LicenciaComponent,
    ModalDomicilioComponent,
    ModalEditarVentaComponent,




  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    SharedModule,
    MatTooltipModule,
    CarouselModule.forRoot(),
    MatStepperModule,
    NgxExtendedPdfViewerModule,
    MatExpansionModule
  ],

})
export class LayoutModule { }
