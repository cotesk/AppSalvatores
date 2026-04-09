
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { LayoutComponent } from './layout.component';
import { DashBoardComponent } from './Pages/dash-board/dash-board.component';
import { UsuarioComponent } from './Pages/usuario/usuario.component';
import { ProductoComponent } from './Pages/producto/producto.component';
import { VentaComponent } from './Pages/venta/venta.component';
import { HistorialVentaComponent } from './Pages/historial-venta/historial-venta.component';
import { ReporteComponent } from './Pages/reporte/reporte.component';
import { CategoriaComponent } from './Pages/categoria/categoria.component';

import { BackupComponent } from './Pages/backup/backup.component';
import { FileUploadComponent } from './Pages/file-upload/file-upload.component';
import { FileListComponent } from './Pages/file-list/file-list.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ApiComponent } from './Pages/api/api.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { AuthLoginGuard } from '../../Services/auth-login.guard';

import { ModalUsuarioComponent } from './Modales/modal-usuario/modal-usuario.component';
import { EmpresaComponent } from './Pages/empresa/empresa.component';
import { MenuComponent } from './Pages/menu/menu.component';
import { CajaComponent } from './Pages/caja/caja.component';
import { FileListFacturaComponent } from './Pages/file-list-factura/file-list-factura.component';
import { ColoresComponent } from './Pages/colores/colores.component';

import { CambiosComponent } from './Pages/cambios/cambios.component';
import { ProductoCardComponent } from './Pages/producto-card/producto-card.component';
import { ContenidoComponent } from './Pages/contenido/contenido.component';

// import { CartComponent } from './Pages/cart/cart.component';
import { ModalPruebaComponent } from './Modales/modal-prueba/modal-prueba.component';
// import { MenuPresentacionComponent } from './Pages/menu-presentacion/menu-presentacion.component';
import { BodegaComponent } from './Pages/bodega/bodega.component';
import { NotificacionesDialogComponent } from './Modales/notificaciones-dialog/notificaciones-dialog.component';
import { SuccessPaymentComponent } from '../success-payment/success-payment.component';
import { ConsultarVentaOnlineComponent } from './Pages/consultar-venta-online/consultar-venta-online.component';
import { MercadoPagoVentaComponent } from './Pages/mercado-pago-venta/mercado-pago-venta.component';
import { PruebaComponent } from './Pages/prueba/prueba.component';
import { HistorialPedidoComponent } from './Pages/historial-pedido/historial-pedido.component';
import { MesasComponent } from './Pages/mesas/mesas.component';
import { ConsultarVentasComponent } from './Pages/consultar-ventas/consultar-ventas.component';



const routes: Routes = [{

path:"",
component:LayoutComponent,
 canActivate: [AuthLoginGuard],
children:[
{path:'dashboard',component:DashBoardComponent},
{path:'usuarios',component:UsuarioComponent,},
{path:'productos',component:ProductoComponent},
{path:'venta',component:VentaComponent},
{path:'historial_venta',component:HistorialVentaComponent},

{path:'reportes',component:ReporteComponent},
{path:'categoria',component:CategoriaComponent},

{path:'backup',component:BackupComponent},
{path:'archivo',component:FileUploadComponent},
{path:'listaArchivo',component:FileListComponent},
{path:'api',component:ApiComponent},

{path:'usuarios',component:UsuarioComponent},

{path:'empresa',component:EmpresaComponent},
{path:'menu',component:MenuComponent},
{path:'caja',component:CajaComponent},
{path:'listaArchivoFactura',component:FileListFacturaComponent},
{path:'colores',component:ColoresComponent},

{path:'cambios',component:CambiosComponent},
// {path:'abonar',component:AbonarModalComponent},
 {path:'cards',component:ProductoCardComponent},
{path:'contenido',component:ContenidoComponent},

{ path: 'bodega', component: BodegaComponent },

// { path: 'cart', component: CartComponent },

//  { path: 'consultar_Venta_Online', component: ConsultarVentaOnlineComponent },
{ path: 'consultar_Venta', component: ConsultarVentasComponent },

{path:'mesas',component:MesasComponent},
{ path: 'realizarPedidos', component: PruebaComponent },
{path:'historial_Pedidos',component:HistorialPedidoComponent},

]


}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
