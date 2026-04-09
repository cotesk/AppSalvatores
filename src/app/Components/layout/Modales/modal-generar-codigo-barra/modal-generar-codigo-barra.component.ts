import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-generar-codigo-barra',
  templateUrl: './modal-generar-codigo-barra.component.html',
  styleUrl: './modal-generar-codigo-barra.component.css'
})
export class ModalGenerarCodigoBarraComponent {

  codigo: string = '';
  nombreProducto: string = '';
  valorInput: string = "";
  formularioGenerar: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<ModalGenerarCodigoBarraComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
  ) {

    this.formularioGenerar = this.fb.group({

      cantidad: ['', Validators.required],


    });




  }

  // generarEtiquetaCodigoBarras() {
  //   const cantidad = this.formularioGenerar.get('cantidad')!.value;
  //   const doc = new jsPDF();

  //   const etiquetaWidth = 50; // Ancho de cada etiqueta
  //   const etiquetaHeight = 25; // Alto de cada etiqueta
  //   const marginLeft = 5; // Margen izquierdo
  //   const marginTop = 5; // Margen superior
  //   const spacingX = 5; // Espacio horizontal entre etiquetas
  //   const spacingY = 5; // Espacio vertical entre etiquetas
  //   const etiquetasPorColumna = 3; // Número de etiquetas por columna
  //   const maxEtiquetasPorPagina = 20; // Número máximo de etiquetas por página
  //   const marcoAncho = 50; // Ancho del marco alrededor de la etiqueta
  //   const marcoAlto = 25; // Alto del marco alrededor de la etiqueta
  //   const nombreFontSize = 10; // Tamaño de fuente para el nombre del producto

  //   // Calcular el ancho total de las etiquetas y los márgenes horizontales
  //   const totalEtiquetasWidth = etiquetasPorColumna * (etiquetaWidth + spacingX) - spacingX;
  //   const marginLeftCentered = (doc.internal.pageSize.getWidth() - totalEtiquetasWidth) / 2;

  //   let etiquetasEnPagina = 0;
  //   let paginaNuevaNecesaria = false;

  //   for (let i = 0; i < cantidad; i++) {
  //     const fila = Math.floor(etiquetasEnPagina / etiquetasPorColumna);
  //     const columna = etiquetasEnPagina % etiquetasPorColumna;

  //     // Calcular la posición horizontal de la etiqueta
  //     const x = marginLeftCentered + columna * (etiquetaWidth + spacingX);

  //     // Calcular la posición vertical de la etiqueta
  //     const y = marginTop + fila * (etiquetaHeight + spacingY);

  //     // Dibujar el marco alrededor de la etiqueta
  //     doc.rect(x, y, marcoAncho, marcoAlto);

  //     // Calcular la posición horizontal para centrar el texto del nombre
  //     const nombreTextWidth = doc.getStringUnitWidth(this.data.nombre.slice(0, 20)) * nombreFontSize / doc.internal.scaleFactor;
  //     const nombreX = x + (marcoAncho - nombreTextWidth) / 2;

  //     // Agregar el nombre del producto centrado
  //     doc.setFontSize(nombreFontSize);
  //     doc.text(this.data.nombre.slice(0, 20), nombreX, y + 4);

  //     // Generar el código de barras
  //     const canvas = document.createElement('canvas');
  //     JsBarcode(canvas, this.data.codigo);
  //     const imageData = canvas.toDataURL('image/png');

  //     // Agregar el código de barras como imagen
  //     doc.addImage(imageData, 'PNG', x + 2, y + 6, etiquetaWidth - 4, etiquetaHeight - 8);

  //     etiquetasEnPagina++;

  //     if (columna === etiquetasPorColumna - 1 || i === cantidad - 1) {
  //       // Si es la última etiqueta de la fila o es la última etiqueta, añadir una nueva fila o página
  //       if (fila === Math.floor((maxEtiquetasPorPagina - 1) / etiquetasPorColumna) || i === cantidad - 1) {
  //         doc.addPage();
  //         etiquetasEnPagina = 0;
  //       }
  //     }
  //   }

  //   const pdfData = doc.output('datauristring');

  //   const win = window.open();
  //   if (win) {
  //     win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

  //     setTimeout(() => {
  //       const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
  //       if (pdfFrame) {
  //         pdfFrame.src = pdfData;
  //       } else {
  //         console.error('No se pudo encontrar el iframe para cargar el PDF.');
  //       }
  //     }, 1000);
  //   } else {
  //     console.error('No se pudo abrir la ventana del navegador.');
  //   }
  // }
  generarEtiquetaCodigoBarras() {
    const cantidad = this.formularioGenerar.get('cantidad')!.value;
    let cant :number = cantidad;
    if(cantidad<0 ||cantidad==''){
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Debe ingresar al menos una cantidad mayor a cero.',
      });
      return;

    }else{
      const etiquetaWidth = 50; // Ancho de cada etiqueta
      const etiquetaHeight = 25; // Alto de cada etiqueta
      const margenTotal = 50; // Margen total de la página (izquierdo + derecho)
      const marginLeft = (margenTotal - etiquetaWidth) / 2; // Margen izquierdo para centrar la etiqueta
      const marginTop = 5; // Margen superior
      const spacingY = 5; // Espacio vertical entre etiquetas
      const etiquetasPorPagina = 8; // Número de etiquetas por página
      const marcoAlto = 25; // Alto del marco alrededor de la etiqueta
      const nombreFontSize = 10; // Tamaño de fuente para el nombre del producto

      const doc = new jsPDF({
        unit: 'mm', // Utilizar milímetros como unidad de medida
        format: [etiquetaWidth, etiquetaHeight * etiquetasPorPagina + marginTop * 9] // Tamaño de página basado en el tamaño de la etiqueta y la cantidad de etiquetas por página
      });

      let etiquetasEnPagina = 0;

      for (let i = 0; i < cantidad; i++) {
        const fila = Math.floor(etiquetasEnPagina / etiquetasPorPagina);
        const y = marginTop + etiquetasEnPagina * (etiquetaHeight + spacingY);

        // Dibujar el marco alrededor de la etiqueta
        doc.rect(marginLeft, y, etiquetaWidth, marcoAlto);

        // Calcular la posición horizontal para centrar el texto del nombre
        const nombreTextWidth = doc.getStringUnitWidth(this.data.nombre.slice(0, 20)) * nombreFontSize / doc.internal.scaleFactor;
        const nombreX = marginLeft + (etiquetaWidth - nombreTextWidth) / 2;

        // Agregar el nombre del producto centrado
        doc.setFontSize(nombreFontSize);
        doc.text(this.data.nombre.slice(0, 20), nombreX, y + 4);

        // Generar el código de barras
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, this.data.codigo);
        const imageData = canvas.toDataURL('image/png');

        // Agregar el código de barras como imagen
        doc.addImage(imageData, 'PNG', marginLeft + 2, y + 6, etiquetaWidth - 4, etiquetaHeight - 8);

        etiquetasEnPagina++;

        if (etiquetasEnPagina === etiquetasPorPagina || i === cantidad - 1) {
          // Si se alcanza el límite de etiquetas por página o es la última etiqueta, añadir una nueva página
          if (i !== cantidad - 1) {
            doc.addPage();
          }
          etiquetasEnPagina = 0;
        }
      }

      const pdfData = doc.output('datauristring');

      const win = window.open();
      if (win) {
        win.document.write('<iframe id="pdfFrame" width="100%" height="100%"></iframe>');

        setTimeout(() => {
          const pdfFrame = win.document.getElementById('pdfFrame') as HTMLIFrameElement;
          if (pdfFrame) {
            pdfFrame.src = pdfData;
          } else {
            console.error('No se pudo encontrar el iframe para cargar el PDF.');
          }
        }, 1000);
      } else {
        console.error('No se pudo abrir la ventana del navegador.');
      }
    }

  }




}

