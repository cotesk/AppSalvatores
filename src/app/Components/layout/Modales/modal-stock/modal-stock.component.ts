import { ProductoService } from './../../../../Services/producto.service';
import { Producto } from './../../../../Interfaces/producto';
import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ChangeDetectionStrategy } from '@angular/core';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';
@Component({
  selector: 'app-modal-stock',
  templateUrl: './modal-stock.component.html',
  styleUrl: './modal-stock.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalStockComponent {
  productoService: ProductoService;
  producto: Producto[] = [];
  totalProductos: number;
  dataListaProductos: MatTableDataSource<Producto>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(
    public dialogRef: MatDialogRef<ModalStockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto[] },
    productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {
    console.log('Productos recibidos:', data.producto);
    this.producto = data.producto;
    this.productoService = productoService;
    this.totalProductos = data.producto.length;
    this.dataListaProductos = new MatTableDataSource<Producto>(this.producto);
  }
  ngAfterViewInit(): void {
    // Realiza tareas después de que la vista se ha inicializado
    // this.producto = this.data.producto;
    // this.cdr.detectChanges();
    this.dataListaProductos.paginator = this.paginator;
  }
   ngOnInit(): void {

  }

  onCloseClick(): void {
    this.clearImages();
    this.dialogRef.close();
  }
  // Asegúrate de que esta función se llama después de que las imágenes se han cargado
  onImagesLoaded() {
    // Forzar la detección de cambios
    this.cdr.detectChanges();
  }
   // Agrega esta función para manejar el cambio de página
   onPageChange(event: any): void {
    this.paginator = event;
    this.cdr.detectChanges();
  }
  verImagen(product: Producto): void {
    // const imageUrl = this.productoService.decodeBase64ToImageUrl(product.imageData!);

    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imagenes: product.imagenUrl
      }
    });
  }

  clearImages(): void {
    this.dataListaProductos.data.forEach(producto => {
      producto.imageData = null;
    });

    this.cdr.markForCheck(); // Utilizar markForCheck en lugar de detectChanges
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 0);
  }

  getDataForCurrentPage(pageIndex: number, pageSize: number): void {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    // Obtener los productos de la página actual
    this.producto = this.data.producto.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }
  decodeImage(producto: Producto): string | null {
    if (producto.imageData) {
      return this.productoService.decodeBase64ToImageUrl(producto.imageData![0]);
    } else {
      return null;
    }
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

}
