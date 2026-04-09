import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Usuario } from '../../../../Interfaces/usuario';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';

@Component({
  selector: 'app-modal-prueba',
  templateUrl: './modal-prueba.component.html',
  styleUrl: './modal-prueba.component.css'
})
export class ModalPruebaComponent implements OnInit {
  empForm: FormGroup;
  inputFileRef: ElementRef | undefined;
  education: string[] = [
    'Matric',
    'Diploma',
    'Intermediate',
    'Graduate',
    'Post Graduate',
  ];
  modoEdicion: boolean = false;
  public previsualizacion: SafeUrl | null = null;
  imagenBase64: string | null = null;
  imagenSeleccionada: boolean = false;
  public imageData: string | null = null;
  nuevoArchivo: File | null = null;
  constructor(
    private _fb: FormBuilder,
    // private _empService: EmployeeService,
    private modalActual: MatDialogRef<ModalPruebaComponent>,
    @Inject(MAT_DIALOG_DATA)  public datosUsuario: Usuario,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    // private _coreService: CoreService
  ) {
    this.empForm = this._fb.group({
      firstName: '',
      lastName: '',
      email: '',
      dob: '',
      gender: '',
      education: '',
      company: '',
      experience: '',
      package: '',
    });
  }

  ngOnInit(): void {

  }
  onFormSubmit() {


  }
  verImagen(): void {
    this.dialog.open(VerImagenProductoModalComponent, {
      data: {
        imageData: this.previsualizacion
      }
    });
  }
  limpiarImagen(): void {
    this.empForm.patchValue({
      imageData: '',
    });
    this.previsualizacion = null;
    this.imagenBase64 = null;
    this.imagenSeleccionada = false;

  }
  obtenerUrlSeguraDeImagen(): SafeUrl | null {
    const safeUrl = this.imagenBase64
      ? this.sanitizer.bypassSecurityTrustUrl(this.imagenBase64)
      : null;

    return safeUrl;
  }
  selectFile(event: any): void {
    if (!this.modoEdicion) { // Solo si no estás en modo de edición
      const archivo = event.target.files[0];

      if (archivo) {
        const lector = new FileReader();
        lector.onload = (e) => {
          this.imagenBase64 = e.target?.result as string;

          console.log('Imagen Base64:', this.imagenBase64);
          console.log('previsualizacion:', this.previsualizacion);

          if (typeof e.target?.result === 'string') {
            // Crea una URL segura para la imagen
            this.previsualizacion = this.sanitizer.bypassSecurityTrustUrl(e.target?.result);
            this.imageData = this.imagenBase64;
            this.imagenSeleccionada = true;
            this.nuevoArchivo = archivo;
          } else {
            console.error('El resultado no es una cadena.');
          }
        };
        lector.readAsDataURL(archivo);
      }
      // Actualiza la referencia directamente desde el evento de cambio
      if (event.target) {
        event.target.value = '';
      }
    }
  }
}
