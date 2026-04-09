import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { ModalDetalleVentaComponent } from '../../Modales/modal-detalle-venta/modal-detalle-venta.component';
import { VentaService } from './../../../../Services/venta.service';
import { Reporte } from './../../../../Interfaces/reporte';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import moment from 'moment';
import * as XLSX from "xlsx";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DetalleVenta } from '../../../../Interfaces/detalle-venta';
import { ModalCaracteristicasProductoComponent } from '../../Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { Venta } from '../../../../Interfaces/venta';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { ProductoService } from '../../../../Services/producto.service';


export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})
export class ReporteComponent implements OnInit, AfterViewInit {

  formularioFiltro: FormGroup;
  listaVentasReporte: Reporte[] = [];
  columnasTabla: string[] = ['usuarioAtendio', 'mesa', 'producto', 'verCaracteristicas', 'fechaRegistro', 'numeroVenta', 'tipoPago', 'precio', 'cantidad', 'total', 'totalVenta', 'anulada'];
  dataVentaReporte = new MatTableDataSource(this.listaVentasReporte);
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  sinRegistros: boolean = false;
  fechaRegistro: string = "";

  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;

  constructor(

    private fb: FormBuilder,
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService,
    private dialog: MatDialog,
    private empresaService: EmpresaService,
    private _usuarioServicio: UsuariosService,
    private _productoServicio: ProductoService,
  ) {

    this.formularioFiltro = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],

    })

    // Configurar validadores para la fecha de fin en función de la fecha de inicio
    this.formularioFiltro.get('fechaInicio')?.valueChanges.subscribe((fechaInicio) => {
      const fechaFinControl = this.formularioFiltro.get('fechaFin');
      if (fechaFinControl) {
        // Limpiar validadores actuales
        fechaFinControl.clearValidators();

        // Agregar nuevo validador que asegura que la fecha de fin no sea anterior a la fecha de inicio
        fechaFinControl.setValidators([Validators.required, this.fechaFinValidator(fechaInicio)]);

        // Actualizar el estado del control
        fechaFinControl.updateValueAndValidity();
      }
    });

  }


  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.dataVentaReporte.paginator = this.paginacionTabla;
  }

  fechaFinValidator(fechaInicio: string) {
    return (control: any): { [key: string]: boolean } | null => {
      const fechaInicioMoment = moment(fechaInicio, 'DD/MM/YYYY', true);
      const fechaFinMoment = moment(control.value, 'DD/MM/YYYY', true);

      if (fechaInicioMoment.isValid() && fechaFinMoment.isValid() && fechaFinMoment.isBefore(fechaInicioMoment)) {
        return { 'fechaFinAntesDeInicio': true };
      }

      return null;
    };
  }

  convertirANumero = (valor: any) => {
    if (!valor) return 0;
    // Quitar puntos de miles y cambiar coma decimal a punto
    return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.'));
  };

  exportarPDF() {
    this.empresaService.lista().subscribe({
      next: (response) => {
        if (!response.status) {
          console.error('La respuesta de la API indica un error:', response.msg);
          return;
        }

        const empresas = response.value as Empresa[];
        const empresa = empresas[0];

        // Datos de la empresa
        const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
        const direccion = empresa ? empresa.direccion : 'No disponible';
        const telefono = empresa ? empresa.telefono : 'No disponible';
        const correo = empresa ? empresa.correo : 'No disponible';
        const rut = empresa ? empresa.rut : 'No disponible';
        const logoBase64WithPrefix = empresa && empresa.logo
          ? 'data:image/png;base64,' + empresa.logo
          : '';

        // Crear PDF
        const doc = new jsPDF();

        // Información de la empresa
        const infoX = doc.internal.pageSize.width - 130;
        doc.setFontSize(10);
        doc.text('Nombre del Local : ' + nombreEmpresa, infoX, 7);
        doc.setFontSize(10);
        doc.text('Nit : ' + rut, infoX, 12);
        doc.setFontSize(10);
        doc.text('Direccion : ' + direccion, infoX, 17);
        doc.setFontSize(10);
        doc.text('Telefono : ' + telefono, infoX, 22);
        doc.setFontSize(10);
        doc.text('Correo : ' + correo, infoX, 27);

        // Logo
        if (logoBase64WithPrefix) {
          doc.addImage(logoBase64WithPrefix, 'PNG', 175, 3, 30, 35);
        }

        // Título y fecha
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(28);
        doc.text('Reporte de todas las ventas', 40, 40);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Fecha de creación de este reporte: ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 50);

        // Línea separadora
        doc.setLineWidth(1);
        doc.line(20, 60, 190, 60);

        // Columnas de la tabla
        const columns = ['Atendido Por', 'Mesa', 'Producto', 'Fecha Registro', 'Número de Venta', 'Tipo de Pago', 'Precio', 'Unidad Medida', 'Cantidad', 'Total de la venta'];

        // Filtrar ventas activas
        const dataFiltrada = this.listaVentasReporte.filter(v => !v.anulada);

        // === AGRUPAR VENTAS ÚNICAS POR NUMERO DE DOCUMENTO ===
        const ventasUnicas = new Map<string, { tipoPago: string; totalVenta: number }>();
        dataFiltrada.forEach(item => {
          if (!ventasUnicas.has(item.numeroDocumento)) {
            ventasUnicas.set(item.numeroDocumento, {
              tipoPago: item.tipoPago,
              totalVenta: this.convertirANumero(item.totalVenta)
            });
          }
        });

        // === TOTALES POR TIPO DE PAGO ===
        let totalEfectivo = 0;
        let totalTransferencia = 0;
        let totalCombinado = 0;
        let totalCombinadoDos = 0;

        ventasUnicas.forEach(v => {
          switch (v.tipoPago.toLowerCase()) {
            case 'efectivo':
              totalEfectivo += v.totalVenta;
              break;
            case 'transferencia':
              totalTransferencia += v.totalVenta;
              break;
            case 'combinado':
              totalCombinado += v.totalVenta;
              break;
            case 'combinadodos':
            case 'combinado dos':
              totalCombinadoDos += v.totalVenta;
              break;
          }
        });

        const totalGeneral = totalEfectivo + totalTransferencia + totalCombinado + totalCombinadoDos;

        // Datos de la tabla
        const data = dataFiltrada.map(row => {
          const producto = row.producto.length > 30 ? row.producto.substring(0, 30) + '...' : row.producto;
          return [
            row.usuarioAtendio,
            row.nombreMesa,
            producto,
            row.fechaRegistro,
            row.numeroDocumento,
            row.tipoPago,
            this.formatearNumero(row.precio),
            row.unidadMedida,
            row.cantidad,
            this.formatearNumero(row.totalVenta)
          ];
        });

        // Crear la tabla
        (doc as any).autoTable({
          head: [columns],
          body: data,
          startY: 70,
          theme: 'grid',
          headStyles: { fillColor: [200, 200, 200],textColor: [0, 0, 0] , halign: 'center', fontStyle: 'bold' },
          bodyStyles: { textColor: [0, 0, 0], halign: 'center' },
          styles: { cellPadding: 1, fontSize: 10 },
          didDrawPage: (dataArg: any) => {
            const pageCount = doc.getNumberOfPages();
            const pageNumber = dataArg.pageNumber;
            doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);
          }
        });

        // Posición debajo de la tabla
        let posY = (doc as any).autoTable.previous.finalY + 15;
        if (posY > 260) {
          doc.addPage();
          posY = 20;
        }

        // Resumen de totales
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('RESUMEN DE TOTALES POR MEDIO DE PAGO:', 20, posY);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        posY += 8;
        doc.text(`Total Efectivo: ${this.formatearNumero(totalEfectivo)}`, 25, posY);
        posY += 7;
        doc.text(`Total Transferencia: ${this.formatearNumero(totalTransferencia)}`, 25, posY);
        posY += 7;
        doc.text(`Total Combinado: ${this.formatearNumero(totalCombinado)}`, 25, posY);
        posY += 7;
        doc.text(`Total Combinado Dos: ${this.formatearNumero(totalCombinadoDos)}`, 25, posY);

        doc.setFont('Helvetica', 'bold');
        posY += 10;
        doc.text(`TOTAL GENERAL: ${this.formatearNumero(totalGeneral)}`, 20, posY);

        // Guardar PDF en nueva ventana
        const pdfData = doc.output('datauristring');
        const win = window.open();
        if (win) {
          win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
        } else {
          console.error('No se pudo abrir la ventana del navegador.');
        }
      },
      error: (error) => {
        console.error('Error al obtener los datos de la empresa:', error);
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.exportarPDF();
                },
                (error: any) => {
                  console.error('Error al actualizar el token:', error);
                }
              );



            },
            (error: any) => {
              console.error('Error al obtener el usuario:', error);
            }
          );
        }

      }
    });
  }



  formatearNumero(numero: any): string {
    // Convierte la cadena a número
    const valorNumerico = parseFloat(numero);

    // Verifica si es un número válido
    if (!isNaN(valorNumerico)) {
      // Formatea el número con comas como separadores de miles y sin decimales
      return valorNumerico.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      // Devuelve la cadena original si no se puede convertir a número
      return numero.toString();
    }
  }
  verCaracteristicas(producto: DetalleVenta): void {
    const productoNombre = (producto as any).producto;
    this._productoServicio.obtenerImagenNombreProducto(productoNombre).subscribe(
      (response: any) => {
        if (response && response.imageData) {
          // this.imagenSeleccionada = `data:image/png;base64,${response.imageData}`;
          this.dialog.open(ModalCaracteristicasProductoComponent, {


            data: {
              caracteristicas: producto.caracteristicas || 'No hay características disponibles',
              imageData: `data:image/png;base64,${response.imageData}`
            }
          });

        } else {
          console.error('Imagen no disponible');

        }
      },
      (error: any) => {
        console.error('Error al cargar la imagen:', error);

      }
    );

  }
  private cargarImagenProducto(idProducto: number) {

  }


  buscarVentas() {

    const _fechaInicio: any = moment(this.formularioFiltro.value.fechaInicio).format('DD/MM/YYYY')
    const _fechaFin: any = moment(this.formularioFiltro.value.fechaFin).format('DD/MM/YYYY')

    console.log('Estado de la venta seleccionado:');
    if (_fechaInicio === "invalid date " || _fechaFin === "invalid date ") {

      Swal.fire({
        icon: 'error',
        title: 'ERROR',
        text: `Debe ingresar ambas fechas`,
      });
      // this._utilidadServicio.mostrarAlerta("Debe ingresar ambas fechas", 'Oops!');
      return;
    }
    // Asegúrate de que el estadoVenta sea 'false' para filtrar solo ventas no anuladas
    const estadoVenta = false;

    this._ventaServicio.reporte(_fechaInicio, _fechaFin, estadoVenta).subscribe({

      next: (data) => {
        console.log('Datos recibidos:', data);
        if (data.status) {
          if (data.value.length > 0) {
            console.log('Datos para la tabla:', data.value);

            // Filtrar las ventas anuladas
            this.listaVentasReporte = data.value.filter((venta: Venta) => !venta.anulada);
            this.dataVentaReporte.data = this.listaVentasReporte;

            this.sinRegistros = this.listaVentasReporte.length === 0;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'ERROR',
              text: `No hay datos para mostrar.`,
            });
            // No hay datos para mostrar
            console.log('No hay datos para mostrar.');

            // Puedes mostrar un mensaje en tu componente o realizar alguna acción adecuada.
          }
        }
        else {
          Swal.fire({
            icon: 'error',
            title: 'ERROR',
            text: `No se encontraron datos`,
          });
          // this._utilidadServicio.mostrarAlerta("No se encontraron datos", 'Oops!');
          this.listaVentasReporte = [];
          this.dataVentaReporte.data = [];
          this.sinRegistros = true;
          console.log('La respuesta no tiene el estado esperado.');
        }

      },
      error: (e) => {
        this.sinRegistros = true;
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
        const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
        if (datosDesencriptados !== null) {
          const usuario = JSON.parse(datosDesencriptados);
          idUsuario = usuario.idUsuario; // Obtener el idUsuario del objeto usuario

          this._usuarioServicio.obtenerUsuarioPorId(idUsuario).subscribe(
            (usuario: any) => {

              console.log('Usuario obtenido:', usuario);
              let refreshToken = usuario.refreshToken

              // Manejar la renovación del token
              this._usuarioServicio.renovarToken(refreshToken).subscribe(
                (response: any) => {
                  console.log('Token actualizado:', response.token);
                  // Guardar el nuevo token de acceso en el almacenamiento local
                  localStorage.setItem('authToken', response.token);
                  this.buscarVentas();
                },
                (error: any) => {
                  console.error('Error al actualizar el token:', error);
                }
              );



            },
            (error: any) => {
              console.error('Error al obtener el usuario:', error);
            }
          );
        }



      },
      complete: () => {

      }
    })

  }


  exportarExcel() {




    if (!this.listaVentasReporte || this.listaVentasReporte.length === 0) {
      this._utilidadServicio.mostrarAlerta(
        'No hay datos para exportar',
        'Oops!'
      );
      return;
    }

    const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
    const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico

    const fileName = `ReporteVentas_${uniqueIdentifier}_${currentDate}.xlsx`;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(this.listaVentasReporte.map(row => {
      return {
        'Atendido Por': row.usuarioAtendio,
        Mesa: row.nombreMesa,
        Producto: row.producto,
        'Fecha Registro': row.fechaRegistro,
        '# de Venta': row.numeroDocumento,
        'Tipo de Pago': row.tipoPago,
        Precio: this.formatearNumero(row.precio),
        'Unidad Medida': row.unidadMedida,
        Cantidad: row.cantidad,
        Intereses: row.intereses,
        // total: this.formatearNumero(row.total),
        'Total Venta': this.formatearNumero(row.totalVenta)
      };
    }));

    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'EXITOS',
      text: `Archivo Descargado`,
    });

  }



}


