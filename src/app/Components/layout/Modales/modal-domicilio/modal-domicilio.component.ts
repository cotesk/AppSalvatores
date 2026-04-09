import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DomicilioDialogData {
  idDomicilio?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  referencia?: string;
  porCobrar?: boolean;
}

@Component({
  selector: 'app-modal-domicilio',
  templateUrl: './modal-domicilio.component.html',
  styleUrl: './modal-domicilio.component.css'
})
export class ModalDomicilioComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalDomicilioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DomicilioDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', [ Validators.maxLength(80)]],
      direccion: [this.data?.direccion ?? '', [ Validators.maxLength(200)]],
      telefono: [this.data?.telefono ?? '', [ Validators.maxLength(30)]],
      referencia: [this.data?.referencia ?? '', [Validators.maxLength(200)]],
      porCobrar: [!!this.data?.porCobrar]
    });

    // Si el checkbox porCobrar se activa, autopoblar referencia
    this.form.get('porCobrar')?.valueChanges.subscribe(val => {
      const refCtrl = this.form.get('referencia');
      if (val) {
        refCtrl?.setValue('Domicilios por cobrar');
        refCtrl?.disable({ emitEvent: false });
      } else {
        refCtrl?.enable({ emitEvent: false });
        if (this.data?.referencia === 'Domicilios por cobrar') {
          refCtrl?.setValue('');
        }
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    const result = {
      ...this.data,
      ...this.form.getRawValue() // getRawValue para incluir campos deshabilitados
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
