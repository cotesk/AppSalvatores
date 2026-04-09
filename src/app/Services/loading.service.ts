import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private segundos = 0;
  private intervalo: any;

  mostrar(mensaje: string = 'Procesando pedido...') {
    this.segundos = 0;

    Swal.fire({
      title: mensaje,
      html: `<b>0 segundos</b>`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        this.iniciarContador();
      }
    });
  }

  private iniciarContador() {
    this.intervalo = setInterval(() => {
      this.segundos++;

      if (this.segundos === 8) {
        Swal.update({
          html: `
            <p>La conexión está tardando más de lo normal…</p>
            <b>${this.segundos} segundos</b>
          `
        });
      } else {
        Swal.update({
          html: `<b>${this.segundos} segundos</b>`
        });
      }
    }, 1000);
  }

  cerrar() {
    clearInterval(this.intervalo);
    Swal.close();
  }

  error(mensaje: string) {
    clearInterval(this.intervalo);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje
    });
  }
}
