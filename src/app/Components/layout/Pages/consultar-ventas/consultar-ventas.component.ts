import { Component, ViewChild } from '@angular/core';
import { DetalleVenta } from '../../../../Interfaces/detalle-venta';
import { Venta } from '../../../../Interfaces/venta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { VentaService } from '../../../../Services/venta.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-consultar-ventas',
  templateUrl: './consultar-ventas.component.html',
  styleUrl: './consultar-ventas.component.css'
})
export class ConsultarVentasComponent {

  columnasTabla: string[] = ['descripcionProducto', 'cantidad', 'precioTexto', 'totalTexto', 'descripcionCaracteristica'];
  dataInicio: Venta[] = [];
  dataListaVenta = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  formularioVenta: FormGroup;
  Selector: string = "id";


  NombreCliente: string = "";
  CedulaCliente: string = "";
  Numerodeventa: string = "";
  TipoPago: string = "";
  Total: string = "";


  constructor(
    private dialog: MatDialog,
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {

    this.formularioVenta = this.fb.group({

      numeroCompra: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(15)]],

      // precioCompra: ['', [Validators.required, Validators.maxLength(10)]]
    });

  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const numeroQR = params['venta'];
      if (numeroQR) {
        this.Selector = 'id';
        this.formularioVenta.get('numeroCompra')?.setValue(numeroQR);
        this.buscarCompra(); // Ejecuta la búsqueda automáticamente
      }
    });
  }

  onSelectChange(event: any) {
    this.formularioVenta.reset();
    this.limpiarCampos();
  }

  limpiarCampos(): void {

    this.dataListaVenta.data = [];
    this.NombreCliente = "";
    this.CedulaCliente = "";
    this.Numerodeventa = "";
    this.TipoPago = "";
    this.Total = "";

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
  formatearNumero2(numero: any): string {
    if (typeof numero === 'number' && !isNaN(numero)) {
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } else {
      return 'N/A';
    }
  }

  calcularSubTotalProducto(element: any): string {
    const precio = parseFloat(element.precioTexto?.replace(',', '.') || '0');
    const cantidad = parseFloat(element.cantidad || '0');
    const total = precio * cantidad;

    return this.formatearNumero2(total);
  }


  buscarCompra() {
    const numero = this.formularioVenta.get('numeroCompra')?.value;
    if (!numero) return;

    this._ventaServicio.getVentaPorDocumento(numero).subscribe({
      next: (resp) => {
        if (resp.status) {
          // console.log(resp.value);
          this.dataInicio = resp.value;
          // console.log(this.dataInicio);
          this.dataListaVenta.data = resp.value.detalleVenta;
          // console.log(this.dataListaVenta.data);
          this.NombreCliente = resp.value.nombreClient
          this.CedulaCliente = resp.value.cedulaClient
          this.Total = resp.value.totalTexto
          this.TipoPago = resp.value.tipoPago
          this.Numerodeventa = resp.value.numeroDocumento
        } else {
          Swal.fire('No encontrado', 'No se encontró ninguna venta con ese número de documento.', 'info');
        this.limpiarCampos();
        }
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo obtener la información de la venta.', 'error');
         this.limpiarCampos();
      }
    });
  }

}
