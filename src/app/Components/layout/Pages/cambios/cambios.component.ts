import { CambioService } from './../../../../Services/cambio.service';
import { Cambio } from './../../../../Interfaces/cambio';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ModalProductoComponent } from '../../Modales/modal-producto/modal-producto.component';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import Swal from 'sweetalert2';
import { ModalCaracteristicasProductoComponent } from '../../Modales/modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { ModalPrestamosComponent } from '../../Modales/modal-prestamos/modal-prestamos.component';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { VentaService } from '../../../../Services/venta.service';
import { Venta } from '../../../../Interfaces/venta';
import jsPDF from 'jspdf';
import moment from 'moment';
import { format } from 'date-fns';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';

@Component({
  selector: 'app-cambios',
  templateUrl: './cambios.component.html',
  styleUrl: './cambios.component.css'
})
export class CambiosComponent implements OnInit, AfterViewInit {
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  columnasTabla: string[] = ['idCambio', 'numeroDocumento', 'nuevoProducto', 'producto', 'estadoProductoDevuelto',
    'cantidadCambiada', 'diferenciaPrecio', 'motivo', 'fechaCambio', 'acciones'];
  dataInicio: Cambio[] = [];
  dataListaCambio = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private _cambioServicio: CambioService,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,
    private _ventaServicio: VentaService,
    private empresaService: EmpresaService,
  ) { }


  obtenerCambios() {
    this._cambioServicio.obtenerCambios().subscribe(
      cambios => {
        cambios.sort((a, b) => b.idCambio - a.idCambio);
        this.dataInicio = cambios;
        this.dataListaCambio.data = this.dataInicio;
      },
      error => {
        // Manejo de errores
        // console.error(error);
        // Swal.fire('Error', 'Ocurrió un error al obtener los cambios.', 'error');

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
                  this.obtenerCambios();
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
    );
  }

  ngOnInit(): void {
    this.obtenerCambios();
  }

  pdf(cambio: Cambio) {

    this.empresaService.lista().subscribe({
      next: (response) => {
        // Verificar si la respuesta tiene éxito (status = true)
        if (response.status) {
          const empresas = response.value as Empresa[];

          const empresa = empresas[0];

          // Extraer los datos de la empresa

          const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
          const direccion2 = empresa ? empresa.direccion : 'No disponible';
          const telefono2 = empresa ? empresa.telefono : 'No disponible';
          const correo = empresa ? empresa.correo : 'No disponible';
          const rut = empresa ? empresa.rut : 'No disponible';
          const logoBase64 = empresa ? empresa.logo : '';



          const logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;



          this._ventaServicio.obtenerVentaIdVenta(cambio.idVenta).subscribe(
            (response: any) => {




              const usuarioString = localStorage.getItem('usuario');
              const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
              const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
              // Verificar si usuarioString es nulo antes de parsearlo
              const usuario = datosDesencriptados ? JSON.parse(datosDesencriptados) : null;

              // Obtener el nombre completo del usuario si existe
              const nombreUsuario = usuario ? usuario.nombreCompleto : 'Desconocido';

              const doc = new jsPDF();


              // Agregar información adicional antes de agregar cualquier página
              const additionalInfoX = doc.internal.pageSize.width - 130;
              const additionalInfoY = 7;
              const additionalInfoFontSize = 10;

              const additionalInfoX2 = doc.internal.pageSize.width - 130;
              const additionalInfoY2 = 12;
              const additionalInfoFontSize2 = 10;

              const additionalInfoX4 = doc.internal.pageSize.width - 130;
              const additionalInfoY4 = 17;
              const additionalInfoFontSize4 = 10;

              const additionalInfoX3 = doc.internal.pageSize.width - 130;
              const additionalInfoY3 = 22;
              const additionalInfoFontSize3 = 10;

              const additionalInfoX5 = doc.internal.pageSize.width - 130;
              const additionalInfoY5 = 27;
              const additionalInfoFontSize5 = 10;

              doc.setFontSize(additionalInfoFontSize);
              // doc.text('Número de contacto: 3012091145\nCorreo electrónico: carloscotes48@gmail.com', additionalInfoX, additionalInfoY);
              doc.text('Nombre de la Empresa : ' + nombreEmpresa, additionalInfoX, additionalInfoY);
              doc.setFontSize(additionalInfoFontSize4);
              doc.text('Nit : ' + rut, additionalInfoX2, additionalInfoY2);
              doc.setFontSize(additionalInfoFontSize2);
              doc.text('Direccion : ' + direccion2, additionalInfoX4, additionalInfoY4);
              doc.setFontSize(additionalInfoFontSize3);
              doc.text('Telefono : ' + telefono2, additionalInfoX3, additionalInfoY3);

              doc.setFontSize(additionalInfoFontSize5);
              doc.text('Correo : ' + correo, additionalInfoX5, additionalInfoY5);

              if (logoBase64WithPrefix && logoBase64WithPrefix.trim() !== 'data:image/png;base64,') {
                // Si hay un logo, agregarlo al array de información de la tienda
                const logo = logoBase64WithPrefix;
                const logoWidth = 30; // Adjust as needed
                const logoHeight = 35; // Adjust as needed
                doc.addImage(logo, 'PNG', 170, 10, logoWidth, logoHeight);
              }

              const fechaCambio = moment().format('DD-MM-yyyy h:mm a')
              const detalleVenta = response.DetalleVenta.$values[0];
              const Venta = response.NumeroDocumento;
              const nombreCliente = detalleVenta.IdClienteNavigation.NombreCompleto;
              const direccionCliente = detalleVenta.IdClienteNavigation.Direccion;
              const telefonoCliente = detalleVenta.IdClienteNavigation.Telefono;
              const cedulaCliente = detalleVenta.IdClienteNavigation.IdCedula;
              const numeroDocumento = Venta;
              this._cambioServicio.obtenerCambiosTodoIdVenta(cambio.idVenta).subscribe(
                (cambios: Cambio[]) => {
                  cambios.sort((a, b) => b.idCambio - a.idCambio);

                  const tableRows = cambios.map(cambio => [
                    cambio.idCambio.toString(),
                    cambio.idVenta.toString(),
                    cambio.producto.length > 40 ? cambio.producto.substring(0, 40) + '...' : cambio.producto,
                    cambio.unidadMedida,
                    cambio.cantidadCambiada.toString(),
                    format(new Date(cambio.fechaCambio), 'dd-MM-yyyy h:mm a'),
                    cambio.estadoProductoDevuelto,
                    cambio.nuevoProducto.length > 40 ? cambio.nuevoProducto.substring(0, 40) + '...' : cambio.nuevoProducto,
                  ]);

                  // Crear el contenido del PDF
                  doc.setFont('Helvetica', 'bold');
                  doc.setFontSize(28);
                  doc.text('Reporte de Cambios', 65, 40);

                  doc.setFont('Helvetica', 'normal');
                  doc.setFontSize(12);
                  doc.text(`# Venta:    ${numeroDocumento}`, 10, 50);
                  doc.text(`Cliente:     ${nombreCliente}`, 10, 55);
                  doc.text(`Dirección: ${direccionCliente}`, 10, 60);
                  doc.text(`Teléfono:  ${telefonoCliente}`, 10, 65);
                  doc.text(`Cédula:    ${cedulaCliente}`, 10, 70);
                  doc.text(`Fecha del Reporte : ${fechaCambio}`, 10, 75);

                  doc.setLineWidth(1);
                  doc.line(10, 80, 200, 80);

                  (doc as any).autoTable({
                    startY: 85,
                    head: [['ID Cambio', 'ID Venta', 'Producto', 'Unidad Medida', 'Cantidad Cambiada', 'Fecha de Cambio', 'Estado Producto Devuelto', 'Nuevo Producto']],
                    body: tableRows,
                    margin: { horizontal: 10 },
                    styles: { font: 'Helvetica', fontSize: 10, textColor: [0, 0, 0], halign: 'center' }, // Centrar el texto del cuerpo de la tabla
                    didDrawPage: (dataArg: any) => {
                      // Añadir número de página al pie de página
                      const pageCount = doc.getNumberOfPages(); // Obtenemos el número total de páginas
                      const pageNumber = dataArg.pageNumber; // Obtenemos el número de página actual
                      doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);
                    },
                    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' } // Centrar el texto del encabezado
                  });
                  // Calcular el espacio disponible en la página actual
                  const currentPageHeight = doc.internal.pageSize.height;
                  const yPosition = 270; // Establecer una posición de inicio
                  const availableSpace = currentPageHeight - yPosition;

                  // Agregar mensaje de agradecimiento si hay suficiente espacio, de lo contrario, agregar una nueva página
                  const message = '¡Nunca pierdas esta factura!';
                  const messageFontSize = 16;
                  const messageHeight = messageFontSize * 1.5; // Ajusta según sea necesario

                  if (availableSpace < messageHeight) {
                    doc.addPage(); // Agregar una nueva página si no hay suficiente espacio
                  }

                  // Agregar el mensaje al final de la página actual o al principio de una nueva página
                  const xPosition = (doc.internal.pageSize.width - doc.getStringUnitWidth(message) * messageFontSize / doc.internal.scaleFactor) / 2;
                  doc.setFontSize(messageFontSize);
                  doc.text(message, xPosition, yPosition);




                  // Obtener el base64 del PDF
                  const pdfData = doc.output('datauristring');

                  // Abrir el PDF en una nueva ventana del navegador
                  const win = window.open();
                  if (win) {
                    win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
                  } else {
                    console.error('No se pudo abrir la ventana del navegador.');
                  }
                },
                (error: any) => {
                  console.error('Error al obtener los cambios:', error);
                }
              );

            },
            (error: any) => {
              console.error('Error al obtener la venta por ID:', error);

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
                        this.pdf(cambio);
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
          )





        } else {
          console.error('La respuesta de la API indica un error:', response.msg);
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
                  this.pdf(cambio);
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

  ngAfterViewInit(): void {
    this.dataListaCambio.paginator = this.paginacionTabla;
  }

  aplicarFiltroTabla(event: Event) {
    const filtreValue = (event.target as HTMLInputElement).value;
    this.dataListaCambio.filter = filtreValue.trim().toLocaleLowerCase();
  }

  verMotivo(cambio: Cambio): void {
    this.dialog.open(ModalPrestamosComponent, {
      data: {
        comentarios: cambio.motivo || 'No hay motivos disponibles',

      }
    });
  }
  // En el componente TypeScript
  esNegativo(valor: number): boolean {
    return valor < 0;
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
