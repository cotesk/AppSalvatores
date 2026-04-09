import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Contenido } from '../../../../Interfaces/contenido';
import { ContenidoService } from '../../../../Services/contenido.service';
import { ReponseApi } from '../../../../Interfaces/reponse-api';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-modal-promociones',
  templateUrl: './modal-promociones.component.html',
  styleUrl: './modal-promociones.component.css'
})
export class ModalPromocionesComponent {

  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  images: string[] = [];
  currentIndex = 0;
  isLoading = true;

  constructor(public dialogRef: MatDialogRef<ModalPromocionesComponent>,
    private _contenidoServicio: ContenidoService,
    private _usuarioServicio: UsuariosService,
  ) {


  }
  ngOnInit(): void {
    this.obtenerContenido();
  }


  onNoClick(): void {
    this.dialogRef.close();
  }


  obtenerContenido() {
    this._contenidoServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          // Filtrar solo las promociones y procesar las imágenes
          const promociones = data.value.filter((contenido: Contenido) => contenido.tipoContenido === 'Promociones');

          console.log(promociones)
          // this.images = promociones.map((contenido: Contenido) => {
          //   // Asegurarse de que la imagen se decodifique en una URL válida
          //   return this._contenidoServicio.decodeBase64ToImageUrl(contenido.imagenes!);
          // });
          // Extraer las URLs de las imágenes
          this.images = promociones.map((contenido: Contenido) => contenido.imagenUrl);

          // Verificar si hay imágenes
          if (this.images.length === 0) {
            // Si no hay imágenes, cerrar el modal

            this.dialogRef.close(); // Cierra el modal si no hay imágenes
          } else {
            // Verificar si las imágenes realmente están cargadas
            this.checkImagesLoaded();
            // Cambia disableClose a false cuando las imágenes hayan cargado
            this.dialogRef.disableClose = false;
          }



        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: `no se encontraron datos`
          });
          this.dialogRef.close();
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al cargar las promociones.'
        });
        this.dialogRef.close();
      }
    });
  }

  checkImagesLoaded() {
    const imageLoadPromises = this.images.map(
      (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(true);
          img.onerror = () => reject(false);
        })
    );

    Promise.all(imageLoadPromises)
      .then(() => {
        this.isLoading = false; // Mostrar el contenido cuando todas las imágenes están listas
      })
      .catch(() => {
        console.error('Algunas imágenes no se pudieron cargar.');
        this.isLoading = false;
      });
  }

  verImagen(imageUrl: string) {
    // Puedes abrir un modal o hacer otra acción al hacer clic en una imagen
    Swal.fire({
      imageUrl,
      imageAlt: 'Promoción',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'image-popup'
      }
    });
  }


}
