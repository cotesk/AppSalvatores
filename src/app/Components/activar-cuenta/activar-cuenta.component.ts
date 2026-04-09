
import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { UsuariosService } from '../../Services/usuarios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-activar-cuenta',
  templateUrl: './activar-cuenta.component.html',
  styleUrl: './activar-cuenta.component.css'
})
export class ActivarCuentaComponent {

  token: string | undefined;
  correo: string | undefined;
  message: string | undefined;
  ocultarPassword: boolean = true;
  passwordErrors: string[] = [];
  constructor(
    private fb: FormBuilder,
    private _usuario: UsuariosService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    this.correo = this.route.snapshot.queryParams['correo'];
  }

  activarCuenta() {
    this._usuario.activacion(this.correo!,this.token!).subscribe(response => {
      this.message = response.value;
      Swal.fire({
        icon: 'success',
        title: 'Ok',
        text: 'Se ha activado el usuario.'
      });
      if (response.status) {
        this.router.navigate(['/login']);
      }
    },
    error =>{
      Swal.fire({
        icon: 'error',
        title: 'ERROR!',
        text: 'Error al activar la cuenta.'
      });

    }


    );
  }



}
