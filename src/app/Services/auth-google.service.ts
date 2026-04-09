import { Injectable } from '@angular/core';
import { AuthConfig, OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import Swal from 'sweetalert2';
import { UsuariosService } from './usuarios.service';
import { Router } from '@angular/router';
import { Producto } from '../Interfaces/producto';
import { LoadingModalComponent } from '../Components/layout/Modales/loading-modal/loading-modal.component';
import { ProductoService } from './producto.service';
import { MatDialog } from '@angular/material/dialog';
import { UtilidadService } from '../Reutilizable/utilidad.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGoogleService {

  mostrarLoading: boolean = false;

  constructor(
    private oauthService: OAuthService,
    private _usuarioServicio: UsuariosService,
    private router: Router,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private _utilidadServicio: UtilidadService,
    private authService: AuthService,
  ) {
    this.initLogin();
  }

  initLogin() {
    const config: AuthConfig = {
      issuer: 'https://accounts.google.com',
      // strictDiscoveryDocumentValidation: false,
      clientId: '854428957815-blv3lr817nvc3uq5tetc21t5uto57n58.apps.googleusercontent.com',
      redirectUri: window.location.origin + '/pages',
      // redirectUri: 'http://localhost:4200/pages',
      responseType: 'token id_token',
      scope: 'openid profile email',
      showDebugInformation: true,
    };

    this.oauthService.configure(config);
    this.oauthService.setupAutomaticSilentRefresh();

    // this.oauthService.events.subscribe((event: OAuthEvent) => {
    //   console.log('OAuth Event:', event);
    //   if (event.type === 'token_received') {
    //     console.log('Token received. Calling registerFromGoogle()');
    //     this.registerFromGoogle();
    //   }
    // });

    // this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
    //   console.log('Discovery document loaded and tried login.');
    //   console.log('Valid ID Token:', this.oauthService.hasValidIdToken());
    //   console.log('Valid Access Token:', this.oauthService.hasValidAccessToken());
    //   if (this.oauthService.hasValidIdToken() && this.oauthService.hasValidAccessToken()) {
    //     this.registerFromGoogle();
    //   } else {
    //     console.log('No valid tokens found. Initiating login flow.');
    //     // this.oauthService.initImplicitFlow();
    //   }
    // });

  }

  login() {
    this.oauthService.initLoginFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  // registerFromGoogle() {
  //   const claims = this.oauthService.getIdentityClaims();
  //   if (claims) {
  //     const nombre = claims['name'];
  //     const correo = claims['email'];
  //     this._usuarioServicio.registerFromGoogle(nombre, correo).subscribe(
  //       (response) => {
  //         if (response.status) {
  //           Swal.fire({
  //             icon: 'success',
  //             title: 'Usuario Registrado',
  //             text: `El usuario fue registrado`,
  //           }).then(() => {
  //             this.loginWithGoogle(correo);
  //           });
  //         } else {
  //           Swal.fire({
  //             icon: 'error',
  //             title: 'ERROR',
  //             text: response.msg,
  //           });
  //         }
  //       }
  //     );
  //   }
  // }

  // loginWithGoogle(correo: string) {
  //   const dialogRef = this.dialog.open(LoadingModalComponent, {
  //     disableClose: true,
  //   });

  //   this._usuarioServicio.loginWithGoogle(correo).subscribe({
  //     next: (data) => {
  //       if (data && data.status) {
  //         if (data.value) {
  //           const usuario = data.value;
  //           this._utilidadServicio.guardarSesionUsuario(usuario);
  //         }
  //         const token = data.token;
  //         this.authService.setAuthToken(token);

  //         if (data.value.rolDescripcion === 'Administrador' || data.value.rolDescripcion === 'Supervisor') {
  //           this.productoService.lista().subscribe({
  //             next: (productosData) => {
  //               if (productosData.status) {
  //                 const productsLessThan5 = productosData.value.filter((product: Producto) => product.stock <= 5);

  //                 setTimeout(() => {
  //                   dialogRef.close();
  //                   this.router.navigate(["pages"]);
  //                   if (productsLessThan5.length > 0) {
  //                     this.openProductModal(productsLessThan5);
  //                   }
  //                 }, 100);
  //               }
  //             },
  //             complete: () => {
  //               this.mostrarLoading = false;
  //             },
  //             error: () => {
  //               this.mostrarLoading = false;
  //               dialogRef.close();
  //             }
  //           });
  //         } else {
  //           setTimeout(() => {
  //             dialogRef.close();
  //             this.router.navigate(["pages"]);
  //           }, 3000);
  //         }
  //       } else {
  //         setTimeout(() => {
  //           dialogRef.close();
  //           Swal.fire({
  //             icon: 'error',
  //             title: 'ERROR',
  //             text: `No se encontraron coincidencias`,
  //           });
  //           this.mostrarLoading = false;
  //         }, 3000);
  //       }
  //     },
  //     error: (err) => {
  //       setTimeout(() => {
  //         dialogRef.close();
  //         Swal.fire({
  //           icon: 'error',
  //           title: 'ERROR',
  //           text: `Verifique que su contraseña o usuario esté correctamente.`,
  //         });
  //         this.mostrarLoading = false;
  //       }, 3000);
  //     },
  //   });
  // }

  openProductModal(products: Producto[]) {
    // Implementa la lógica para abrir el modal de productos
  }
}
