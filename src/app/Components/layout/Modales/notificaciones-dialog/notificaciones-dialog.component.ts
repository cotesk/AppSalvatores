import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Producto } from '../../../../Interfaces/producto';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ModalCaracteristicasProductoComponent } from '../modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { ProductoService } from '../../../../Services/producto.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-notificaciones-dialog',
  templateUrl: './notificaciones-dialog.component.html',
  styleUrls: ['./notificaciones-dialog.component.css']
})
export class NotificacionesDialogComponent {
  productos: Producto[];
  paginaActual = 0;
  productosPorPagina = 3;

  constructor(
    public dialogRef: MatDialogRef<NotificacionesDialogComponent>,
    private dialog: MatDialog,
    private productoService: ProductoService,

    @Inject(MAT_DIALOG_DATA) public data: { productos: Producto[] }
  ) {
    this.productos = data.productos;
    console.log('Tamaño de productos con stock bajo:', this.productos);
  }

  // Método para cerrar el diálogo y confirmar la notificación
  cerrarDialog(confirmado: boolean): void {
    this.dialogRef.close(confirmado);
  }


  // Método para cambiar de página
  // cambiarPagina(pagina: number) {
  //   this.paginaActual = pagina;
  // }

  // Método para calcular el índice del primer elemento en la página actual
  indiceInicial() {
    return (this.paginaActual - 1) * this.productosPorPagina;
  }

  // Método para calcular el índice del último elemento en la página actual
  indiceFinal() {
    return Math.min(this.indiceInicial() + this.productosPorPagina - 1, this.productos.length - 1);
  }


  // Método para generar un array de números que representan las páginas disponibles
  paginas() {
    const totalPaginas = Math.ceil(this.productos.length / this.productosPorPagina);
    return Array(totalPaginas).fill(0).map((x, i) => i + 1);
  }

  // Método para obtener los productos de la página actual
  // productosDePagina() {
  //   const inicio = (this.paginaActual - 1) * this.productosPorPagina;
  //   return this.productos.slice(inicio, inicio + this.productosPorPagina);
  // }
  // Método para mostrar la imagen del producto en un cuadro de diálogo modal

  verImagen(product: Producto): void {
    // const imageUrl = this.productoService.decodeBase64ToImageUrl(product.imageData!);

    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenes: product.imagenUrl
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


// paginasVisibles(): number[] {
//   const paginas: number[] = [];
//   const rango = 2;

//   const inicio = Math.max(1, this.paginaActual - rango);
//   const fin = Math.min(this.productosPorPagina, this.paginaActual + rango);

//   for (let i = inicio; i <= fin; i++) {
//     paginas.push(i);
//   }

//   return paginas;
// }

// cambiarPagina(pagina: number): void {
//   this.paginaActual = pagina;
//   // cargar los datos para esa página
// }

// paginaAnterior(): void {
//   if (this.paginaActual > 1) {
//     this.paginaActual--;
//   }
// }

// paginaSiguiente(): void {
//   if (this.paginaActual < this.productosPorPagina) {
//     this.paginaActual++;
//   }
// }

// irPrimeraPagina(): void {
//   this.paginaActual = 1;
// }

// irUltimaPagina(): void {
//   this.paginaActual = this.productosPorPagina;
// }


// Método para obtener productos de la página actual
productosDePagina() {
  const inicio = this.paginaActual * this.productosPorPagina;
  const fin = inicio + this.productosPorPagina;
  return this.productos.slice(inicio, fin);
}

// Evento de cambio de página desde mat-paginator
cambiarPaginaDesdePaginador(event: PageEvent) {
  this.paginaActual = event.pageIndex;
  this.productosPorPagina = event.pageSize;
}

}
