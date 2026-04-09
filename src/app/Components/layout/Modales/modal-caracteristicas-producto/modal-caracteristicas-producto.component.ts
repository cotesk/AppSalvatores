import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Producto } from '../../../../Interfaces/producto';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';

@Component({
  selector: 'app-modal-caracteristicas-producto',
  templateUrl: './modal-caracteristicas-producto.component.html',
  styleUrls: ['./modal-caracteristicas-producto.component.css']
})
export class ModalCaracteristicasProductoComponent {
  // constructor(@Inject(MAT_DIALOG_DATA) public data: { caracteristicas: string, imageData: string }) { }
  titulo: string | undefined;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
     private dialog: MatDialog

  ) {

    this.titulo = data.titulo || 'Características del Producto';
  }
  verImagen(): void {
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenes: this.data.imagenUrl
      }
    });
  }

  formatearCaracteristicas(): string {
    return this.data.caracteristicas
      ? this.data.caracteristicas.replace(/\.\s*/g, '.<br>')
      : 'No hay características disponibles';
  }

}
