import { DetalleVenta } from './../../../../Interfaces/detalle-venta';
import { Component, HostListener, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Venta } from '../../../../Interfaces/venta';

import { ModalCaracteristicasProductoComponent } from '../modal-caracteristicas-producto/modal-caracteristicas-producto.component';
import { MatDialog } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import moment from 'moment';
import 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { EmpresaService } from '../../../../Services/empresa.service';
import { Empresa } from '../../../../Interfaces/empresa';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as QRCode from 'qrcode';


@Component({
  selector: 'app-modal-detalle-venta',
  templateUrl: './modal-detalle-venta.component.html',
  styleUrl: './modal-detalle-venta.component.css'
})
export class ModalDetalleVentaComponent implements OnInit {

  id: string = "";
  fechaRegistro: string = "";
  numeroDocumento: string = "";
  idCaja: number = 0;
  idPedido: number = 0;
  tipoPago: string = "";
  total: string = "";
  ganancia: string = "";
  intereses: number = 0;
  estadoVenta: string = "";
  tipoPagoVenta: string = "";
  anulada: boolean = false;
  precioEfectivo: string = "";
  precioTransferencia: string = "";
  precioTransferenciaDos: string = "";
  detalleVenta: DetalleVenta[] = []
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  // valorIngresado: number = 0;
  columnasTabla: string[] = ['producto', 'verCaracteristicas', 'unidadMedida', 'cantidad', 'precio', 'precioPagadoTexto', 'total'];
  isMobile: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) { // Especificamos el tipo de evento
    this.checkMobile();
  }

  constructor(@Inject(MAT_DIALOG_DATA) public _venta: Venta, private dialog: MatDialog,
    private empresaService: EmpresaService,
    private _usuarioServicio: UsuariosService,
  ) {
    // console.log(_venta);
    this.fechaRegistro = _venta.fechaRegistro!;
    this.numeroDocumento = _venta.numeroDocumento!;
    this.idCaja = _venta.idCaja;
    this.tipoPago = _venta.tipoPago;
    this.total = _venta.totalTexto;
    this.ganancia = _venta.gananciaTexto;
    // this.intereses = _venta.intereses!;
    this.estadoVenta = _venta.estadoVenta!;
    this.anulada = _venta.anulada;
    this.detalleVenta = _venta.detalleVenta;
    this.precioEfectivo = _venta.precioEfectivoTexto;
    this.precioTransferencia = _venta.precioTransferenciaTexto;
    this.precioTransferenciaDos = _venta.precioTransferenciaSegundoTexto;
    this.tipoPagoVenta = _venta.tipoTranferencia;
    this.idPedido = _venta.idPedido;
    // console.log(this.ganancia);

    this.empresaService.lista().subscribe({
      next: (response) => {
        // Verificar si la respuesta tiene éxito (status = true)
        if (response.status) {
          const empresas = response.value as Empresa[];

          // Verificar si hay al menos una empresa en la lista
          if (empresas && empresas.length > 0) {
            // Tomamos la primera empresa de la lista
            const empresa = empresas[0];

            // Extraer los datos de la empresa
            const nombreEmpresa = empresa.nombreEmpresa;
            const direccion = empresa.direccion;
            const telefono = empresa.telefono;
            const logo = empresa.logo;
            const rut = empresa.rut;
            // Aquí puedes agregar estos datos al documento PDF según tus necesidades
          } else {
            console.error('No se encontraron empresas en la lista');
          }
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
                  this.lista();
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



  checkMobile() {
    this.isMobile = window.innerWidth <= 768; // Ajusta el ancho según tus necesidades
  }


  getTransferNames(): string[] {
    if (!this.tipoPagoVenta) return [];
    return this.tipoPagoVenta.split('/');
  }


  lista() {
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
              this.lista();
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

  ngOnInit(): void {
    this.checkMobile();
  }

  verCaracteristicas(producto: DetalleVenta): void {
    console.log(producto);
    this.dialog.open(ModalCaracteristicasProductoComponent, {
      data: {
        caracteristicas: producto.descripcionCaracteristica || 'No hay características disponibles',
        nombre: producto.descripcionProducto,
        imagenes: producto.imagenUrl
      }
    });
  }
  formatearNumero(numero: string): string {
    if (!numero) return '0';

    // Reemplaza la coma por punto para que funcione con parseFloat
    const valorNumerico = parseFloat(numero.replace(',', '.'));

    if (!isNaN(valorNumerico)) {
      // Convierte a entero redondeando hacia abajo (opcional)
      const entero = Math.floor(valorNumerico);

      // Devuelve con formato de miles, sin decimales
      return entero.toLocaleString('es-CO');
    } else {
      return numero;
    }
  }


  formatearNumero2(valor: number): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(valor);
  }


  confirmarGeneracionFactura() {
    Swal.fire({
      title: 'Seleccionar el tipo de factura',
      input: 'radio',
      inputOptions: {
        'ticket': 'Ticket',
        'factura': 'Factura',
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor selecciona un tipo de factura.';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
    }).then((result) => {

      if (result.isConfirmed) {

        // Capturar el valor seleccionado
        const tipo = result.value;

        if (tipo == "ticket") {
          this.ticket();
        } else {
          this.generatePDF();
        }


      } else {

        // El usuario canceló la operación
        Swal.fire('Cancelado', `No se generó el ticket. Número de venta: `, 'info');

      }
    });



  }


  calcularSubTotalProducto(element: any): string {
    const precio = parseFloat(element.precioTexto?.replace(',', '.') || '0');
    const cantidad = parseFloat(element.cantidad || '0');
    const total = precio * cantidad;

    return this.formatearNumero2(total);
  }




  ticket() {
    Swal.fire({
      title: 'Seleccionar Tamaño del Ticket',
      input: 'radio',
      inputOptions: {
        '58': '58mm',
        '80': '80mm',
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor selecciona un tamaño de ticket';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonColor: '#1337E8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const tamañoTicket = result.value;

        this.empresaService.lista().subscribe({
          next: async (response) => {
            if (response.status) {
              if (!this.anulada) {
                const empresas = response.value as Empresa[];
                const empresa = empresas[0];
                const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
                const direccion2 = empresa ? empresa.direccion : 'No disponible';
                const telefono2 = empresa ? empresa.telefono : 'No disponible';
                const correo = empresa ? empresa.correo : 'No disponible';
                const rut = empresa ? empresa.rut : 'No disponible';

                // Cálculo del largo dinámico
                const filasProductos = this.detalleVenta.length;
                const largoBase = 80; // Largo base en mm
                const largoPorFila = 5; // Largo adicional por fila
                const margenFinal = 10; // Espacio adicional para mensajes finales
                const largoTotal = largoBase + filasProductos * largoPorFila + margenFinal;

                const fechaActual = new Date();
                const dia = fechaActual.getDate().toString().padStart(2, '0');
                const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses empiezan desde 0
                const año = fechaActual.getFullYear();
                let hora = fechaActual.getHours();
                const minuto = fechaActual.getMinutes().toString().padStart(2, '0');

                // Convertir a formato de 12 horas
                const formato12 = hora >= 12 ? 'PM' : 'AM';
                hora = hora % 12 || 12; // Cambia de 24 horas a 12 horas, y asegura que 0 sea 12

                const fechaFormateada = `${dia}/${mes}/${año} ${hora}:${minuto} ${formato12}`;

                console.log(fechaFormateada);

                const urlQR = `https://appsistemaventa2024.web.app/menu/consultar_Venta?venta=${this._venta.numeroDocumento}`;
                const qrImageBase64 = await QRCode.toDataURL(urlQR);

                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, this._venta.numeroDocumento! + this.idCaja, {
                  format: 'CODE128', // Puedes elegir el formato de código de barras que desees
                  displayValue: false, // Oculta el valor (en este caso, el número de documento)
                });

                // Obtener la imagen base64 del código de barras generado
                const barcodeImageBase64 = barcodeCanvas.toDataURL();

                // Configuración de tamaño de página y márgenes
                const MM_TO_PT = 2.83465;

                const pageSize = tamañoTicket === '58' ? { width: 58, height: 'auto' } : { width: 100, height: 'auto' };


                // Configurar los márgenes para ajustarse mejor
                const pageMargins = tamañoTicket === '58' ? [5, 5, 5, 5] : [5, 5, 5, 5]; // Márgenes ajustados

              const mensaje = tamañoTicket === '58' ?
                "***** Ticket de Venta *****"
                :
                "********** Ticket de Venta **********"

              const linea = tamañoTicket === '58' ?
                  "----------------------"
                  :
                  "----------------------------"

                let vueltos: any;
                let PrecioEfectivos: any;
                let PrecioTransferencias: any;
                let totalVenta: any;
                let totalPagado: any;
                console.log(this.tipoPago);
                if (this.tipoPago == "Transferencia") {
                  vueltos = 0;
                }
                else if (this.tipoPago == "Combinado") {
                  PrecioEfectivos = parseFloat(this.precioEfectivo) || 0;
                  PrecioTransferencias = parseFloat(this.precioTransferencia) || 0;

                  // Reemplaza coma por punto antes de parsear
                  const totalVenta = parseFloat((this._venta.totalTexto ?? '0').replace(',', '.')) || 0;

                  const totalPagado = PrecioEfectivos + PrecioTransferencias;

                  // Calcula vueltos correctamente
                  vueltos = totalPagado >= totalVenta ? totalPagado - totalVenta : 0;

                  console.log('totalVenta:', totalVenta);
                  console.log('totalPagado:', totalPagado);
                  console.log('vueltos:', vueltos);
                }

                else if (this.tipoPago == "Fiado") {
                  vueltos = 0;
                }
                else {
                  vueltos = this.formatearNumero((parseFloat(this.detalleVenta[0].precioPagadoTexto) - parseFloat(this._venta.totalTexto)).toString())

                }


                const documentDefinition: any = {
                  pageSize,
                  pageMargins: [2, 3, 5, 1],
                  content: [
                    // Información de la empresa
                    {
                      text: nombreEmpresa,
                      style: 'header',
                      alignment: 'center',
                    },
                    {
                      text: `NIT: ${rut}`,
                      style: 'subheader',
                      alignment: 'center',
                    },
                    {
                      text: `Dirección: ${direccion2}`,
                      style: 'subheader',
                      alignment: 'center',
                    },
                    {
                      text: `Teléfono: ${telefono2}`,
                      style: 'subheader',
                      alignment: 'center',
                    },
                    {
                      text: `Correo: ${correo}`,
                      style: 'subheader',
                      alignment: 'center',
                    },
                    {
                      text: `${mensaje}`,
                      style: 'title',
                      alignment: 'center',
                    },
                    {
                      text: `Cajero #  ${this.idCaja}`,
                      style: 'content',
                    },
                    {
                      text: `Fecha de Emisión: ${fechaFormateada}`,
                      style: 'content',
                    },
                    {
                      text: `# de Venta: ${this._venta.numeroDocumento || 'N/A'}`,
                      style: 'content',
                    },

                    // {
                    //   text: `Cliente: ${this.detalleVenta.length > 0 ? this.detalleVenta[0].descripcionCliente : 'N/A'}`,
                    //   style: 'content',
                    // },

                    {
                      text: `Tipo de pago: ${this.tipoPago}`,
                      style: 'content',
                    },
                    ...(this.tipoPago === 'Combinado' || this.tipoPago === 'Transferencia' ? [
                      { text: `Medio de Pago: ${this.tipoPagoVenta}`, style: 'subheader' },

                    ] : []),
                    {
                      text: `${linea}`,
                      style: 'divider',
                    },
                    // Tabla de productos
                    {
                      table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                          ['Prod.', 'P. Unit.', 'Cant', 'Total'],
                          ...this.detalleVenta.map((item) => [
                            item.descripcionProducto.substring(0, tamañoTicket === '58' ? 20 : 30), // Ajuste del límite de caracteres
                            this.formatearNumero(item.precioTexto),
                            item.cantidad,
                            this.formatearNumero2(item.cantidad * parseInt(item.precioTexto)),
                          ]),
                        ],
                      },
                      style: 'table', alignment: 'center',
                      // layout: 'noBorders', // Aquí añadimos esta propiedad para evitar bordes y márgenes
                      layout: {
                        // Reducir el tamaño de fuente y el tamaño de las celdas para acercarlas
                        defaultBorder: false,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        paddingLeft: () => 0, // Reducir el espacio interno a la izquierda de las celdas
                        paddingRight: () => 0.5, // Reducir el espacio interno a la derecha de las celdas
                        paddingTop: () => 0, // Reducir el espacio superior, le quita espacio de uno arriba de otro
                        paddingBottom: () => 0, // Reducir el espacio inferior
                      },
                      margin: [0, 0, 0, 0]
                    },
                    {
                      text: `${linea}`,
                      style: 'divider',
                    },
                    { text: '', style: 'divider' },
                    {
                      text: `Recibido: ${this.formatearNumero(this.detalleVenta[0].precioPagadoTexto)} $`,
                      alignment: 'right', style: 'content'
                    },
                    {
                      text: `Total de la Venta: ${this.formatearNumero(this._venta.totalTexto)} $`,
                      alignment: 'right', style: 'content'
                    },
                    {
                      text: '------------------------',
                      alignment: 'right', style: 'divider'
                    },
                    // 👇 INSERTAMOS CONDICIÓN AQUÍ
                    ...(this.tipoPago === 'Combinado' ? [
                      {
                        text: `Pago en efectivo: ${this.formatearNumero(this.precioEfectivo)} $`,
                        alignment: 'right',
                        style: 'content',
                        margin: [0, 2, 0, 0]
                      },
                      {
                        text: `Pago por transferencia: ${this.formatearNumero(this.precioTransferencia)} $`,
                        alignment: 'right',
                        style: 'content',
                        margin: [0, 2, 0, 0]
                      },

                      ...(this.precioEfectivo! > totalVenta! ? [
                        {
                          text: `Vueltos en efectivo : ${vueltos.toLocaleString('es-CO',
                            { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'content', margin: [0, 5, 0, 0]
                        },
                      ] : []),

                      ...(this.precioEfectivo! > totalVenta! ? [
                        {
                          text: `Vueltos en transferencia : ${vueltos.toLocaleString('es-CO',
                            { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'content', margin: [0, 5, 0, 0]
                        },
                      ] : []),
                      ...(totalVenta! == totalPagado! ? [
                        {
                          text: `Vueltos : ${vueltos.toLocaleString('es-CO',
                            { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'content', margin: [0, 5, 0, 0]
                        },
                      ] : [


                        {
                          text: `Vueltos : ${vueltos.toLocaleString('es-CO',
                            { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'content', margin: [0, 5, 0, 0]
                        },


                      ]),

                    ] : []),

                    ...(this.tipoPago !== 'Combinado' ? [
                      {
                        text: `Vueltos : ${vueltos.toLocaleString('es-CO',
                          { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $`, alignment: 'right', style: 'content', margin: [0, 5, 0, 0]
                      },
                    ] : []),

                    {
                      text: `${linea}`,
                      style: 'divider',
                    },
                    // { text: 'Su ticket ID es:', style: 'subheader' },
                    // { image: barcodeImageBase64, alignment: 'center', margin: [0, 0], fit: [90, 90] }, // Agregar la imagen del código de barras
                    { text: 'Escanee su venta:', alignment: 'center', style: 'content' },
                    { image: qrImageBase64, alignment: 'center', margin: [0, 0], fit: [65, 65] },
                    {
                      text: `${linea}`,
                      style: 'divider',
                    },
                    {
                      text: '¡Gracias por su compra!',
                      alignment: 'center',
                      style: 'header',
                      margin: [0, 10, 0, 0],
                    },
                    {
                      text: 'Esperamos volver a servirle muy pronto.',
                      alignment: 'center',
                      style: 'subheader',
                      margin: [0, 0, 0, 5],
                    },
                    {
                      text: [
                        { text: '¿Interesado en este sistema o uno similar? ', bold: true },
                        'Contáctame: '
                      ],
                      alignment: 'center',
                      style: 'subheader',
                      margin: [0, 15, 0, 0],
                    },
                    {
                      text: [
                        { text: 'Carlos Cotes\n', bold: true },
                        ' 301 209 1145\n',
                        ' carloscotes48@gmail.com\n'
                      ],
                      alignment: 'center',
                      style: 'subheader',
                      // color: '#555555'
                    },
                    { text: '\n\n', style: 'divider', },


                  ],
                  styles: {
                    header: {
                      fontSize: 5,
                      bold: true,
                    },
                    subheader: {
                      fontSize: 4,
                      bold: true,
                    },
                    title: {
                      fontSize: 5,
                      bold: true,
                      margin: [0, 2, 0, 2],
                    },
                    content: {
                      fontSize: 4,
                      bold: true,
                    },
                    divider: {
                      margin: [0, 2, 0, 2],
                    },
                    table: {
                      bold: true,
                      fontSize: 4, // Reducir el tamaño de fuente a 5
                      color: 'black',
                      margin: [0, 0, 0, 0],
                    },
                  },
                };

                pdfMake.vfs = pdfFonts.pdfMake.vfs;
                const pdfDoc = pdfMake.createPdf(documentDefinition);

                pdfDoc.getBase64((data) => {
                  // Abrir el PDF en una nueva ventana del navegador
                  const win = window.open();
                  if (win) {
                    win.document.write('<iframe width="100%" height="100%" src="data:application/pdf;base64,' + data + '"></iframe>');
                  } else {
                    console.error('No se pudo abrir la ventana del navegador.');
                  }
                });
              } else {
                Swal.fire({
                  icon: 'warning',
                  title: 'Advertencia',
                  text: 'No se puede generer un ticket para una venta anulada.',
                });
              }
            }
          },
          error: (err) => console.error(err),
        });
      } else {
        Swal.fire('Cancelado', 'Venta Registrada, pero no se generó el ticket.', 'info');
      }
    });
  }


  generatePDF(): void {

    // Llamada al servicio para obtener la información de la empresa
    this.empresaService.lista().subscribe({
      next: async (response) => {
        // Verificar si la respuesta tiene éxito (status = true)
        if (response.status) {

          const urlQR = `https://appsistemaventa2024.web.app/menu/consultar_Venta?venta=${this._venta.numeroDocumento}`;
          const qrImageBase64 = await QRCode.toDataURL(urlQR);


          if (this.anulada == false) {



            const empresas = response.value as Empresa[];

            const empresa = empresas[0];

            // Extraer los datos de la empresa
            const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
            const direccion2 = empresa ? empresa.direccion : 'No disponible';
            const telefono2 = empresa ? empresa.telefono : 'No disponible';
            const correo = empresa ? empresa.correo : 'No disponible';
            const rut = empresa ? empresa.rut : 'No disponible';
            const logoBase64 = empresa ? empresa.logo : '';
            // Agregar prefijo al logo base64
            const logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;



            // Recuperar el nombre de usuario del localStorage
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
              doc.addImage(logo, 'PNG', 165, 10, logoWidth, logoHeight);
            }
            // Add logo to the PDF


            // Add title to the PDF
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(28);  // Increase the font size for the title
            doc.text('Detalle de Venta', 70, 40);  // Adjust the position of the title

            // Add date to the PDF
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            // doc.text(`Fecha de creación de la factura: ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 50);  // Adjust the position of the date
            doc.text(`Fecha de creación de la factura: ${moment().format('DD/MM/YYYY hh:mm A')}`, 20, 50);

            // const FechaRegistro = this._venta.fechaRegistro || 'N/A';
            const FechaRegistro = moment(this._venta.fechaRegistro, 'DD/MM/YYYY hh:mm A').format('DD/MM/YYYY hh:mm A');
            doc.text(`Fecha de creación de la venta: ${FechaRegistro} `, 20, 55);


            // Add a line separator after the header
            doc.setLineWidth(1);
            doc.line(20, 58, 190, 58);  // Adjust the line position

            // Add client information to the PDF
            const numeroDocumento = this._venta.numeroDocumento || 'N/A';
            // const clienteInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].descripcionCliente : 'N/A';
            // const TelefonoInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].telefonoTexto : 'N/A';
            // const direccionInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].direccionTexto : 'N/A';
            // const cedulaInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].cedulaTexto?.toString() || '' : '';
            const tipoPago = this.tipoPago;
            const tipoPagoVenta = this.tipoPagoVenta;
            // Add barcode
            // const barcodeValue = numeroDocumento + cedulaInfo;
            const barcodeValue = numeroDocumento;
            const barcodeWidth = 54;
            const barcodeHeight = 20;
            // const barcodeX = (doc.internal.pageSize.width - barcodeWidth) / 2; // Centra horizontalmente
            const barcodeX = 80
            const barcodeY = 96; // Ajusta la posición vertical según sea necesario

            // this.generateBarcode(doc, barcodeValue, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
            // doc.setFontSize(10);
            // doc.text(barcodeValue, barcodeX + 19, barcodeY + barcodeHeight + 2);

            doc.setFontSize(12);
            doc.text('# de Factura:', 20, 64);
            doc.text(numeroDocumento, 80, 64);

            // doc.text('Nombre del Cliente:', 20, 70);
            // doc.text(clienteInfo, 80, 70);

            // doc.text('Cedula del Cliente:', 20, 76);
            // doc.text(cedulaInfo, 80, 76);

            // doc.text('Direccion del Cliente:', 20, 82);
            // doc.text(direccionInfo, 80, 82);

            // doc.text('Telefono del Cliente:', 20, 88);
            // doc.text(TelefonoInfo, 80, 88);

            doc.text('Tipo de Pago:', 20, 94);
            doc.text(tipoPago, 80, 94);

            // doc.text('Su ticket ID es:', 20, 110);
            doc.text('Escanee su venta:', 25, 6);
            doc.addImage(qrImageBase64, 'PNG', 25, 8, 37, 37);

            if (this._venta.tipoPago == "Combinado" || this._venta.tipoPago == "Transferencia") {
              doc.text('Medio de Pago:', 20, 100);
              doc.text(tipoPagoVenta, 80, 100);
            }

            // Add table to the PDF
            const columns = ['#', 'Producto', 'Unidad Medida', 'Descuentos', 'Precio', 'Cantidad', 'Sub Total', 'Total'];
            const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
            const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico

            const fileName = `ReporteVentas_${uniqueIdentifier}_${currentDate}.pdf`;

            const data = this.detalleVenta.map((item, index) => [
              { content: `${index + 1}`, styles: { textColor: [0, 0, 255] } },
              {
                content: `${item.descripcionProducto.length > 40 ? item.descripcionProducto.substring(0, 40) + '...' : item.descripcionProducto}`,
                styles: { textColor: [0, 0, 0] }
              },
              { content: `${item.unidadMedidaTexto.toString()}`, styles: { textColor: [0, 0, 0] } },
              { content: `${this.formatearNumero(item.descuentosTexto)}%`, styles: { textColor: [0, 0, 255] } },
              { content: `${this.formatearNumero(item.precioTexto)}`, styles: { textColor: [0, 0, 0] } },
              { content: `${item.cantidad.toString()}`, styles: { textColor: [0, 0, 0] } },

              // Sub Total = precio * cantidad
              {
                content: this.formatearNumero((parseFloat(item.precioTexto) * item.cantidad).toString()),
                styles: { textColor: [0, 0, 0] }
              },

              // Total (puede incluir descuentos, impuestos, etc.)
              { content: `${this.formatearNumero(item.totalTexto)}`, styles: { textColor: [0, 0, 0] } },
            ]);


            // AutoTable options for a cleaner appearance
            const tableOptions = {

              margin: { horizontal: 10 },
              styles: { font: 'Helvetica', fontSize: 10 },
              headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            };
            // Definir el estilo de la tabla para centrar el texto
            const tableStyles = {
              valign: 'middle', // Centra verticalmente el contenido de la celda
              halign: 'center' // Centra horizontalmente el contenido de la celda
            };

            const autoTableConfig = {
              startY: 102,
              head: [columns],
              body: data,
              ...tableOptions,
              styles: {
                ...tableStyles, // Agregar los estilos de la tabla personalizados
                // También puedes agregar otros estilos aquí si lo deseas
              }, didDrawPage: (dataArg: any) => {
                // Añadir número de página al pie de página
                const pageCount = doc.getNumberOfPages(); // Obtenemos el número total de páginas
                const pageNumber = dataArg.pageNumber; // Obtenemos el número de página actual
                doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);
              },
            };

            // Dibuja la tabla
            (doc as any).autoTable({
              ...autoTableConfig,

            });

            // Dibujar el mensaje de agradecimiento
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(28);

            // Obtiene la altura total que ocupó la tabla
            const tableHeight = (doc as any).autoTable.previous.finalY;

            // // Calcular la posición Y para el mensaje de agradecimiento
            // let currentY = tableHeight + 40;

            // // Verificar si hay suficiente espacio en la página actual
            // if (currentY + 20 > doc.internal.pageSize.height) {
            //   doc.addPage(); // Agrega una nueva página
            //   currentY = 20; // Restablece la posición Y
            // }

            // // Dibujar el mensaje de agradecimiento
            // doc.text('¡Gracias por tu compra!', 10, currentY);

            // Calcula la posición Y para la información adicional
            let infoY = tableHeight + 20; // Ajusta según sea necesario

            // Verifica si la información adicional se ajustará en la página actual
            if (infoY + 30 > 290) {
              doc.addPage();
              infoY = 20;
            }


            let precioPagado
            let vueltos
            let valorIngresadoStr
            let vueltosStr
            let suma
            let PrecioEfectivos: any;
            let PrecioTransferencias: any;
            let totalVenta: any;
            let totalPagado: any;
            console.log(this.tipoPago);
            if (this.tipoPago == "Transferencia") {
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              totalVenta = this.formatearNumero(this.total.toString());
              vueltos = 0;
            }
            else if (this.tipoPago == "Combinado") {
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              totalVenta = this.formatearNumero(this.total.toString());



              PrecioEfectivos = parseFloat(this.precioEfectivo) || 0;
              PrecioTransferencias = parseFloat(this.precioTransferencia) || 0;

              // Reemplaza coma por punto antes de parsear
              const totalVentas = parseFloat((this._venta.totalTexto ?? '0').replace(',', '.')) || 0;

              const totalPagado = PrecioEfectivos + PrecioTransferencias;

              // Calcula vueltos correctamente
              vueltos = totalPagado >= totalVentas ? totalPagado - totalVentas : 0;

              // console.log('totalVenta:', totalVentas);
              // console.log('totalPagado:', totalPagado);
              // console.log('vueltos:', vueltos);

              vueltosStr = this.formatearNumero(vueltos.toFixed(0)).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            } else {
              // Add payment information to the PDF
              totalVenta = this.formatearNumero(this.total.toString());
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              vueltos = precioPagado - parseFloat(this.total.replace(',', '.'));

              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              vueltosStr = this.formatearNumero(vueltos.toFixed(0)).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');



            }



            // Dibuja la información adicional
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            // doc.text(`Tipo de Pago:           ${tipoPago}`, 130, infoY);
            doc.text(`Recibido:                   ${valorIngresadoStr} $`, 130, infoY);
            doc.text(`Total de la Venta:      ${totalVenta} $`, 130, infoY + 7);
            doc.setLineWidth(0.5);
            doc.line(130, infoY + 14, 195, infoY + 14);
            // doc.text(`Vueltos:                     ${vueltosStr} $`, 130, infoY + 30);
            // Condición para mostrar "Vueltos" o "Comisiones de MercadoPago"
            if (tipoPago === "Tarjeta de Crédito") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Tarjeta de Débito") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Ticket de Pago") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Pago en Efectivo") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Pago en Efecty") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Reembolsado") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Mercado Pago") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Tarjeta Prepaga") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Transferencia") {

            }
            else if (tipoPago === "Combinado") {
              doc.text(`Precio Efectivo:             ${this.formatearNumero(this.precioEfectivo)} $`, 130, infoY + 23);
              doc.text(`Precio Transferencia:        ${this.formatearNumero(this.precioTransferencia)} $`, 130, infoY + 30);
              doc.text(`Vueltos:                     ${(vueltosStr)} $`, 130, infoY + 37);
            }
            else {
              doc.text(`Vueltos:                     ${vueltosStr} $`, 130, infoY + 23);
            }
            // Calcular el espacio disponible en la página actual
            const currentPageHeight = doc.internal.pageSize.height;
            const yPosition = 270; // Establecer una posición de inicio
            const availableSpace = currentPageHeight - yPosition;

            // Agregar mensaje de agradecimiento si hay suficiente espacio, de lo contrario, agregar una nueva página
            const message = '¡Gracias por tu compra!';
            const messageFontSize = 16;
            const messageHeight = messageFontSize * 1.5; // Ajusta según sea necesario

            if (availableSpace < messageHeight) {
              doc.addPage(); // Agregar una nueva página si no hay suficiente espacio
            }

            // Agregar el mensaje al final de la página actual o al principio de una nueva página
            // Ajuste para mover el texto más a la izquierda
            const leftOffset = 20; // Ajusta este valor según el espacio que desees mover
            const xPosition = (doc.internal.pageSize.width - doc.getStringUnitWidth(message) * messageFontSize / doc.internal.scaleFactor) / 2 - leftOffset;
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

            // Save the PDF
            // doc.save(fileName);









          } else {




            const empresas = response.value as Empresa[];

            const empresa = empresas[0];

            // Extraer los datos de la empresa
            const nombreEmpresa = empresa ? empresa.nombreEmpresa : 'No disponible';
            const direccion2 = empresa ? empresa.direccion : 'No disponible';
            const telefono2 = empresa ? empresa.telefono : 'No disponible';
            const correo = empresa ? empresa.correo : 'No disponible';
            const rut = empresa ? empresa.rut : 'No disponible';
            const logoBase64 = empresa ? empresa.logo : '';
            // Agregar prefijo al logo base64
            const logoBase64WithPrefix = 'data:image/png;base64,' + logoBase64;



            // Recuperar el nombre de usuario del localStorage
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
              doc.addImage(logo, 'PNG', 165, 10, logoWidth, logoHeight);
            }
            // Add logo to the PDF


            // Add title to the PDF
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(28);  // Increase the font size for the title
            doc.text('Detalle de Venta', 70, 40);  // Adjust the position of the title

            // Add date to the PDF
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            // doc.text(`Fecha de creación de la factura: ${moment().format('YYYY-MM-DD hh:mm:ss A')}`, 20, 50);  // Adjust the position of the date
            doc.text(`Fecha de creación de la factura: ${moment().format('DD/MM/YYYY hh:mm A')}`, 20, 50);

            // const FechaRegistro = this._venta.fechaRegistro || 'N/A';
            const FechaRegistro = moment(this._venta.fechaRegistro, 'DD/MM/YYYY hh:mm A').format('DD/MM/YYYY hh:mm A');
            doc.text(`Fecha de creación de la venta: ${FechaRegistro} `, 20, 55);

            // Add a line separator after the header
            doc.setLineWidth(1);
            doc.line(20, 58, 190, 58);  // Adjust the line position

            // Add client information to the PDF
            const numeroDocumento = this._venta.numeroDocumento || 'N/A';
            // const clienteInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].descripcionCliente : 'N/A';
            // const TelefonoInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].telefonoTexto : 'N/A';
            // const direccionInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].direccionTexto : 'N/A';
            // const cedulaInfo = this.detalleVenta.length > 0 ? this.detalleVenta[0].cedulaTexto?.toString() || '' : '';
            const tipoPago = this.tipoPago;
            const tipoPagoVenta = this.tipoPagoVenta;
            // Add barcode
            // const barcodeValue = numeroDocumento + cedulaInfo;
            const barcodeValue = numeroDocumento;
            const barcodeWidth = 54;
            const barcodeHeight = 20;
            // const barcodeX = (doc.internal.pageSize.width - barcodeWidth) / 2; // Centra horizontalmente
            const barcodeX = 80
            const barcodeY = 96; // Ajusta la posición vertical según sea necesario

            // this.generateBarcode(doc, barcodeValue, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
            // doc.setFontSize(10);
            // doc.text(barcodeValue, barcodeX + 19, barcodeY + barcodeHeight + 2);

            doc.setFontSize(12);
            doc.text('# de Factura:', 20, 64);
            doc.text(numeroDocumento, 80, 64);

            // doc.text('Nombre del Cliente:', 20, 70);
            // doc.text(clienteInfo, 80, 70);

            // doc.text('Cedula del Cliente:', 20, 76);
            // doc.text(cedulaInfo, 80, 76);

            // doc.text('Direccion del Cliente:', 20, 82);
            // doc.text(direccionInfo, 80, 82);

            // doc.text('Telefono del Cliente:', 20, 88);
            // doc.text(TelefonoInfo, 80, 88);

            doc.text('Tipo de Pago:', 20, 94);
            doc.text(tipoPago, 80, 94);

            doc.text('Escanee su venta:', 25, 6);
            doc.addImage(qrImageBase64, 'PNG', 25, 8, 37, 37);

            if (this._venta.tipoPago == "Combinado" || this._venta.tipoPago == "Transferencia") {
              doc.text('Medio de Pago:', 20, 100);
              doc.text(tipoPagoVenta, 80, 100);
            }


            // Add table to the PDF
            const columns = ['#', 'Producto', 'Unidad Medida', 'Descuentos', 'Precio', 'Cantidad', 'Sub Total', 'Total'];
            const uniqueIdentifier = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
            const currentDate = moment().format('YYYYMMDD-HHmmss'); // Fecha y hora actual en formato específico

            const fileName = `ReporteVentas_${uniqueIdentifier}_${currentDate}.pdf`;

            const data = this.detalleVenta.map((item, index) => [
              { content: `${index + 1}`, styles: { textColor: [0, 0, 255] } },
              {
                content: `${item.descripcionProducto.length > 40 ? item.descripcionProducto.substring(0, 40) + '...' : item.descripcionProducto}`,
                styles: { textColor: [0, 0, 0] }
              },
              { content: `${item.unidadMedidaTexto.toString()}`, styles: { textColor: [0, 0, 0] } },
              { content: `${this.formatearNumero(item.descuentosTexto)}%`, styles: { textColor: [0, 0, 255] } },
              { content: `${this.formatearNumero(item.precioTexto)}`, styles: { textColor: [0, 0, 0] } },
              { content: `${item.cantidad.toString()}`, styles: { textColor: [0, 0, 0] } },

              // Sub Total = precio * cantidad
              {
                content: this.formatearNumero((parseFloat(item.precioTexto) * item.cantidad).toString()),
                styles: { textColor: [0, 0, 0] }
              },

              // Total (puede incluir descuentos, impuestos, etc.)
              { content: `${this.formatearNumero(item.totalTexto)}`, styles: { textColor: [0, 0, 0] } },
            ]);

            // AutoTable options for a cleaner appearance
            const tableOptions = {

              margin: { horizontal: 10 },
              styles: { font: 'Helvetica', fontSize: 10 },
              headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            };
            // Definir el estilo de la tabla para centrar el texto
            const tableStyles = {
              valign: 'middle', // Centra verticalmente el contenido de la celda
              halign: 'center' // Centra horizontalmente el contenido de la celda
            };

            const autoTableConfig = {
              startY: 103,
              head: [columns],
              body: data,
              ...tableOptions,
              styles: {
                ...tableStyles, // Agregar los estilos de la tabla personalizados
                // También puedes agregar otros estilos aquí si lo deseas
              }, didDrawPage: (dataArg: any) => {
                const pageCount = doc.getNumberOfPages();
                const pageNumber = dataArg.pageNumber;
                doc.setFontSize(10);
                doc.setTextColor(0); // Asegúrate que el número de página esté en negro
                doc.text(`Página ${pageNumber} de ${pageCount}`, 170, 290);

                // Texto de fondo "Anulada"
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const text = 'Anulada';
                const gap = 180;

                doc.setFontSize(60);
                doc.setFont('Helvetica', 'bold');
                doc.setTextColor(255, 0, 0); // Rojo fuerte

                // Aplicar opacidad si está disponible
                const gState = (doc as any).GState ? new (doc as any).GState({ opacity: 0.1 }) : null;
                if (gState && (doc as any).setGState) {
                  (doc as any).setGState(gState);
                }

                for (let y = -pageHeight; y < pageHeight * 2; y += gap) {
                  for (let x = -pageWidth; x < pageWidth * 2; x += gap) {
                    doc.saveGraphicsState?.();
                    doc.text(text, x, y, { angle: -45 });
                    doc.restoreGraphicsState?.();
                  }
                }

                // Restaurar propiedades para el resto del documento
                if ((doc as any).setGState) {
                  // Restaurar opacidad a 1 si se usó GState
                  (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
                }

                doc.setTextColor(0); // Negro
                doc.setFontSize(12);
              }

            };

            // Dibuja la tabla
            (doc as any).autoTable({
              ...autoTableConfig,

            });

            // Dibujar el mensaje de agradecimiento
            doc.setTextColor(0, 0, 0);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(28);

            // Obtiene la altura total que ocupó la tabla
            const tableHeight = (doc as any).autoTable.previous.finalY;

            // // Calcular la posición Y para el mensaje de agradecimiento
            // let currentY = tableHeight + 40;

            // // Verificar si hay suficiente espacio en la página actual
            // if (currentY + 20 > doc.internal.pageSize.height) {
            //   doc.addPage(); // Agrega una nueva página
            //   currentY = 20; // Restablece la posición Y
            // }

            // // Dibujar el mensaje de agradecimiento
            // doc.text('¡Gracias por tu compra!', 10, currentY);

            // Calcula la posición Y para la información adicional
            let infoY = tableHeight + 20; // Ajusta según sea necesario

            // Verifica si la información adicional se ajustará en la página actual
            if (infoY + 30 > 290) {
              doc.addPage();
              infoY = 20;
            }

            let precioPagado
            let vueltos
            let valorIngresadoStr
            let vueltosStr
            let suma
            let PrecioEfectivos: any;
            let PrecioTransferencias: any;
            let totalVenta: any;
            let totalPagado: any;
            console.log(this.tipoPago);
            if (this.tipoPago == "Transferencia") {
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              totalVenta = this.formatearNumero(this.total.toString());
              vueltos = 0;
            }
            else if (this.tipoPago == "Combinado") {
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              totalVenta = this.formatearNumero(this.total.toString());



              PrecioEfectivos = parseFloat(this.precioEfectivo) || 0;
              PrecioTransferencias = parseFloat(this.precioTransferencia) || 0;

              // Reemplaza coma por punto antes de parsear
              const totalVentas = parseFloat((this._venta.totalTexto ?? '0').replace(',', '.')) || 0;

              const totalPagado = PrecioEfectivos + PrecioTransferencias;

              // Calcula vueltos correctamente
              vueltos = totalPagado >= totalVentas ? totalPagado - totalVentas : 0;

              // console.log('totalVenta:', totalVentas);
              // console.log('totalPagado:', totalPagado);
              // console.log('vueltos:', vueltos);

              vueltosStr = this.formatearNumero(vueltos.toFixed(0)).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            } else {
              // Add payment information to the PDF
              totalVenta = this.formatearNumero(this.total.toString());
              precioPagado = parseFloat(this.detalleVenta[0].precioPagadoTexto.replace(',', '.'));
              vueltos = precioPagado - parseFloat(this.total.replace(',', '.'));

              valorIngresadoStr = this.formatearNumero(precioPagado.toFixed(2));
              vueltosStr = this.formatearNumero(vueltos.toFixed(0)).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');



            }


            // Dibuja la información adicional
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            // doc.text(`Tipo de Pago:           ${tipoPago}`, 130, infoY);
            doc.text(`Recibido:                   ${valorIngresadoStr} $`, 130, infoY);
            doc.text(`Total de la Venta:      ${totalVenta} $`, 130, infoY + 7);
            doc.setLineWidth(0.5);
            doc.line(130, infoY + 14, 195, infoY + 14);
            // doc.text(`Vueltos:                     ${vueltosStr} $`, 130, infoY + 30);
            // Condición para mostrar "Vueltos" o "Comisiones de MercadoPago"
            if (tipoPago === "Tarjeta de Crédito") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Tarjeta de Débito") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Ticket de Pago") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Pago en Efectivo") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Pago en Efecty") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Reembolsado") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Mercado Pago") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Tarjeta Prepaga") {
              doc.text(`Comisiones:               ${vueltosStr} $`, 130, infoY + 23);
            }
            else if (tipoPago === "Transferencia") {

            }
            else if (tipoPago === "Combinado") {
              doc.text(`Precio Efectivo:             ${this.formatearNumero(this.precioEfectivo)} $`, 130, infoY + 23);
              doc.text(`Precio Transferencia:        ${this.formatearNumero(this.precioTransferencia)} $`, 130, infoY + 30);
              doc.text(`Vueltos:                     ${(vueltosStr)} $`, 130, infoY + 37);
            }
            else {
              doc.text(`Vueltos:                     ${vueltosStr} $`, 130, infoY + 23);
            }
            // Calcular el espacio disponible en la página actual
            const currentPageHeight = doc.internal.pageSize.height;
            const yPosition = 270; // Establecer una posición de inicio
            const availableSpace = currentPageHeight - yPosition;

            // Agregar mensaje de agradecimiento si hay suficiente espacio, de lo contrario, agregar una nueva página
            const message = '¡Gracias por tu compra!';
            const messageFontSize = 16;
            const messageHeight = messageFontSize * 1.5; // Ajusta según sea necesario

            if (availableSpace < messageHeight) {
              doc.addPage(); // Agregar una nueva página si no hay suficiente espacio
            }

            // Agregar el mensaje al final de la página actual o al principio de una nueva página
            const leftOffset = 20; // Ajusta este valor según el espacio que desees mover
            const xPosition = (doc.internal.pageSize.width - doc.getStringUnitWidth(message) * messageFontSize / doc.internal.scaleFactor) / 2 - leftOffset;
            doc.setFontSize(messageFontSize);
            doc.text(message, xPosition, yPosition);

            // doc.setTextColor(255, 0, 0); // Cambia el color del texto a rojo
            // doc.setFontSize(45); // Establece el tamaño de fuente
            // doc.text('ANULADA', 3, 25); // Agrega el texto "ANULADA" como marca de agua


            // Obtener el base64 del PDF
            const pdfData = doc.output('datauristring');

            // Abrir el PDF en una nueva ventana del navegador
            const win = window.open();
            if (win) {
              win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
            } else {
              console.error('No se pudo abrir la ventana del navegador.');
            }

            // Save the PDF
            // doc.save(fileName);







          }



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
                  this.generatePDF();
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

  generateBarcode(doc: jsPDF, value: string, x: number, y: number, width: number, height: number): void {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      format: 'CODE128',
      displayValue: false,
    });

    const barcodeImage = canvas.toDataURL('image/png');
    doc.addImage(barcodeImage, 'PNG', x, y, width, height);
  }

}

