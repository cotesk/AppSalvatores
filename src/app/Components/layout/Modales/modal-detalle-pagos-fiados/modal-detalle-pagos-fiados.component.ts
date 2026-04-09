import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VentasFiadasResponseDTO } from '../../../../Interfaces/ventasFiadasResponseDTO';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-modal-detalle-pagos-fiados',
  templateUrl: './modal-detalle-pagos-fiados.component.html',
  styleUrl: './modal-detalle-pagos-fiados.component.css'
})
export class ModalDetallePagosFiadosComponent {


    ventas!: VentasFiadasResponseDTO;
    private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  
    columnasTabla: string[] = ['descripcionProducto', 'cantidad', 'precioTexto', 'totalTexto'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,

  ) {
     console.log(data);
    if (data) {
      this.ventas = data.value;
      this.dataSource.data = this.ventas.ventas[0].detalleVenta;
      console.log(this.dataSource.data);
    }

  } // O usa una interfaz con status, msg, value
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    console.log('Datos recibidos en el modal:', this.data);
   
  }



 ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  formatearNumero(numero: string): string {
    const valorNumerico = parseFloat(numero.replace(',', '.'));

    if (!isNaN(valorNumerico)) {
      return valorNumerico.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      return numero;
    }
  }

  formatearNumero2(valor: number): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(valor);
  }


}
