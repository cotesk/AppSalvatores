import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  ngOnInit(): void {

    window.addEventListener('offline', () => {
      Swal.fire({
        icon: 'error',
        title: 'Sin conexión',
        text: 'Se perdió la conexión a internet. Revisa tu red.'
      });
    });

    window.addEventListener('online', () => {
      Swal.fire({
        icon: 'success',
        title: 'Conexión restaurada',
        text: 'Internet disponible nuevamente.',
        timer: 2000,
        showConfirmButton: false
      });
    });

  }
}