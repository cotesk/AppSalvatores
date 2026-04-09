import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VentaService } from '../../../../Services/venta.service';
import { EditarTipoVenta } from '../../../../Interfaces/editarTipoVenta';
import Swal from 'sweetalert2';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-modal-editar-venta',
  templateUrl: './modal-editar-venta.component.html',
  styleUrls: ['./modal-editar-venta.component.css']
})
export class ModalEditarVentaComponent {

  editarForm: FormGroup;
  totalVentaReal: number = 0;

  tiposPago = [
    { nombre: "Efectivo", icono: "attach_money", color: "#4caf50" },
    { nombre: "Transferencia", icono: "account_balance", color: "#2196f3" },
    { nombre: "Combinado", icono: "sync_alt", color: "#ff9800" }
  ];

  tiposTransferencia = [
    { nombre: "Nequi", icono: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv733vhzl4XlJCl13S1VvTQ6gfwbpw_eZV_g&s" },
    { nombre: "Bancolombia", icono: "https://images.seeklogo.com/logo-png/42/1/bancolombia-logo-png_seeklogo-428092.png" },
    { nombre: "Daviplata", icono: "https://conectesunegocio.daviplata.com/sites/default/files/styles/original/public/2023-11/af2be4165905879.Y3JvcCwxNDAwLDEwOTUsMCwxNTI.png?itok=Fn_Y_HIf" }
  ];

  constructor(
    private ventaService: VentaService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalEditarVentaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    console.log("Data Modal:", data);

    this.totalVentaReal = this.parseTextoToNumber(data.totalTexto);

    this.editarForm = this.fb.group({
      TipoPago: [data.tipoPago || 'Efectivo', Validators.required],
      TipoTranferencia: [data.tipoTranferencia || ''],
      PrecioEfectivo: [0, [Validators.min(0)]],
      PrecioTransferencia: [0, [Validators.min(0)]],
      PrecioTransferenciaSegundo: [0]
    });

    this.aplicarTipoPagoInicial(data.tipoPago);

    // VALIDACIONES DINÁMICAS
    // this.editarForm.get("PrecioEfectivo")?.valueChanges.subscribe(() => this.validarMontos());
    // this.editarForm.get("PrecioTransferencia")?.valueChanges.subscribe(() => this.validarMontos());
  }

  parseTextoToNumber(texto: string): number {
    if (!texto) return 0;
    return Number(texto.replace(/\./g, '').replace(',', '.'));
  }

  aplicarTipoPagoInicial(tipo: string) {

    if (tipo === 'Efectivo') {
      this.editarForm.patchValue({
        PrecioEfectivo: this.totalVentaReal,
        PrecioTransferencia: 0,
        TipoTranferencia: ''
      });

    } else if (tipo === 'Transferencia') {
      this.editarForm.patchValue({
        PrecioEfectivo: 0,
        PrecioTransferencia: this.totalVentaReal
      });

    } else if (tipo === 'Combinado') {
      const mitad = this.totalVentaReal / 2;
      this.editarForm.patchValue({
        PrecioEfectivo: mitad,
        PrecioTransferencia: mitad
      });
    }
  }

  onTipoPagoChange(event: MatSelectChange) {
    const tipo = event.value;

    if (tipo === 'Efectivo') {
      this.editarForm.patchValue({
        PrecioEfectivo: this.totalVentaReal,
        PrecioTransferencia: 0,
        TipoTranferencia: ''
      });

    } else if (tipo === 'Transferencia') {
      this.editarForm.patchValue({
        PrecioEfectivo: 0,
        PrecioTransferencia: this.totalVentaReal
      });

    } else if (tipo === 'Combinado') {
      const mitad = this.totalVentaReal / 2;
      this.editarForm.patchValue({
        PrecioEfectivo: mitad,
        PrecioTransferencia: mitad
      });
    }
  }



  // Recalcular según tipo de pago
  recalcular(tipo: string) {
    if (tipo === "Efectivo") {
      this.editarForm.patchValue({
        PrecioEfectivo: this.totalVentaReal,
        PrecioTransferencia: 0
      });

    } else if (tipo === "Transferencia") {
      this.editarForm.patchValue({
        PrecioEfectivo: 0,
        PrecioTransferencia: this.totalVentaReal
      });

    } else if (tipo === "Combinado") {
      const mitad = this.totalVentaReal / 2;
      this.editarForm.patchValue({
        PrecioEfectivo: mitad,
        PrecioTransferencia: mitad
      });
    }
  }

  guardarCambios() {
    if (this.editarForm.invalid) {
      Swal.fire('Error', 'Por favor complete todos los campos correctamente', 'error');
      return;
    }
    console.log(this.data);

    const tipo = this.editarForm.value.TipoPago;
    let efectivo = Number(this.editarForm.value.PrecioEfectivo) || 0;
    let transferencia = Number(this.editarForm.value.PrecioTransferencia) || 0;
    let totalTexto = this.data.totalTexto;
    let precioTexto = this.data.precioEfectivoTexto;
    let transfeTexto = this.parseTextoToNumber(this.data.precioTransferenciaTexto);
    let transfeDosTexto = this.data.precioTransferenciaSegundoTexto;

    if (tipo == "Transferencia" || tipo == "Combinado") {
      if (this.editarForm.value.TipoTranferencia == "") {
        Swal.fire({ icon: 'error', title: 'Error', text: `Debes seleccionar el tipo de transferencia.` });
        return;
      }
    }

    // ❌ No permitir valores negativos
    if (efectivo < 0 || transferencia < 0) {
      Swal.fire("Error", "Los montos no pueden ser negativos.", "error");
      this.recalcular(tipo);
      return;
    }

    if (tipo === "Efectivo" && efectivo == this.totalVentaReal) {
      // Swal.fire("Error", "El Valor no es igual.", "error");
      // this.recalcular(tipo);
      // return;
    }
    if (tipo === "Transferencia" && transferencia == this.totalVentaReal) {
      // Swal.fire("Error", "El Valor no es igual.", "error");
      // this.recalcular(tipo);
      // return;
    }

    // ❌ No permitir que cada uno supere el total individualmente



    if (tipo === "Efectivo") {
      if (efectivo > this.totalVentaReal) {
        Swal.fire("Error", `El monto en efectivo no puede exceder ${this.totalVentaReal}.`, "error");
        this.recalcular(tipo);
        return;
      }


      if (efectivo < this.totalVentaReal) {
        Swal.fire("Error", "Los montos no son iguales.", "error");
        this.recalcular(tipo);
        return;
      }

      if (efectivo == this.totalVentaReal) {

      }

    }

    if (tipo === "Transferencia") {

      if (transferencia > this.totalVentaReal) {
        Swal.fire("Error", `El monto en transferencia no puede exceder ${this.totalVentaReal}.`, "error");
        this.recalcular(tipo);
        return;
      }

      if (transferencia < this.totalVentaReal) {
        Swal.fire("Error", "Los montos no son iguales.", "error");
        this.recalcular(tipo);
        return;
      }
      if (transferencia == this.totalVentaReal) {

      }
    }

    // 🔥 VALOR CLAVE: VALIDAR PAGO COMBINADO
    if (tipo === "Combinado") {
      const suma = efectivo + transferencia;

      // ❌ No permitir suma menor al total
      if (suma < this.totalVentaReal) {
        Swal.fire("Error", `Debes completar el total de ${this.totalVentaReal}. Aún faltan ${this.totalVentaReal - suma}.`, "error");
       this.recalcular(tipo);
        return;
      }

      // ❌ No permitir suma mayor al total
      if (suma > this.totalVentaReal) {
        Swal.fire("Error", `La suma no puede exceder ${this.totalVentaReal}.`, "error");
        this.recalcular(tipo);
        return;
      }

      if (suma == this.totalVentaReal) {


      }

    }

    const dto: EditarTipoVenta = {
      TipoPago: this.editarForm.value.TipoPago,
      TipoTranferencia: this.editarForm.value.TipoTranferencia,
      PrecioEfectivo: this.editarForm.value.PrecioEfectivo,
      PrecioTransferencia: this.editarForm.value.PrecioTransferencia,
      PrecioTransferenciaSegundo: this.editarForm.value.PrecioTransferenciaSegundo
    };

    this.ventaService.editarTipoDeVenta(this.data.idVenta, dto).subscribe({
      next: (res) => {
        if (res.status) {
          Swal.fire('Éxito', res.value, 'success');
          this.dialogRef.close(true);
        } else {
          Swal.fire('Error', res.msg, 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al actualizar la venta', 'error');
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
