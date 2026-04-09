import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { Mesa } from '../../../../Interfaces/mesa';
import { MesaService } from '../../../../Services/mesa.service';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-modal-mesas',
  templateUrl: './modal-mesas.component.html',
  styleUrl: './modal-mesas.component.css'
})
export class ModalMesasComponent implements OnInit {



  formularioCategoria: FormGroup;

  tituloAccion: string = "Agregar";
  botonAccion: string = "Guardar";
  listaMesa: Mesa[] = [];
  modoEdicion: boolean = true;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  constructor(private modalActual: MatDialogRef<ModalMesasComponent>,
    @Inject(MAT_DIALOG_DATA) public datosMesa: Mesa, private fb: FormBuilder,
    private _mesaServicio: MesaService,
    private _utilidadServicio: UtilidadService,
    private _usuarioServicio: UsuariosService,

  ) {


    this.formularioCategoria = this.fb.group({

      nombreMesa: ['', [Validators.required, Validators.maxLength(40)]],
      tipo: ['', [Validators.required]],
      ocupada: ['0',],


    });
    if (datosMesa != null) {
      this.tituloAccion = "Editar";
      this.botonAccion = "Actualizar";
      this.modoEdicion = false;
    }



    this._mesaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) this.listaMesa = data.value
        console.log(this.listaMesa);
      },
      error: (e) => {
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

    })



  }

  lista() {
    this._mesaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) this.listaMesa = data.value
      },
      error: (e) => {
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

    })

  }

  ngOnInit(): void {

    if (this.datosMesa != null) {
      this.formularioCategoria.patchValue({
        nombreMesa: this.datosMesa.nombreMesa,
        tipo: this.datosMesa.tipo,
        ocupada: this.datosMesa.ocupada?.toString() || 'valor_predeterminado',

      })

    }



  }

  letrasSinNumerosValidator() {
    return (control: FormControl) => {
      const nombre = control.value;
      const contieneNumeros = /\d/.test(nombre); // Verifica si hay al menos un dígito
      return contieneNumeros ? { letrasSinNumerosValidator: true } : null;
    };
  }


  guardarEditar_mesa() {


    const _mesa: Mesa = {
      idMesa: this.datosMesa == null ? 0 : this.datosMesa.idMesa,
      nombreMesa: this.formularioCategoria.value.nombreMesa,
      tipo: this.formularioCategoria.value.tipo,
      ocupada: parseInt(this.formularioCategoria.value.ocupada),
    }


    if (this.datosMesa == null) {

      let existeMesaDePaso
      if (this.formularioCategoria.value.tipo == "De paso") {
        existeMesaDePaso = this.listaMesa.some(mesa => mesa.tipo === "De paso");
      }



      // console.log(existeMesaDePaso);


      if (existeMesaDePaso) {
        Swal.fire({
          icon: 'warning',
          title: 'Mesa ya existente',
          text: `Ya existe una mesa de paso`,
        });
        return
      } else {
        this._mesaServicio.guardar(_mesa).subscribe({

          next: (data) => {


            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Mesa Registrada',
                text: `La mesa fue registrada`,
              });
              // this._utilidadServicio.mostrarAlerta("El usuario fue registrado", "Exito");
              this.modalActual.close("true");
              // this.actualizarLocalStorage(_usuario);
            } else {
              if (data.msg == "El nombre de la mesa ya existe.") {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `El nombre de la mesa ya existe.`,
                });


              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `No se pudo guardar la mesa`,
                });

              }

            }

          },
          error: (e) => {


            // Swal.fire({
            //   icon: 'error',
            //   title: 'ERROR',
            //   text: ` el cliente  editar`,
            // });
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
                      this.guardarEditar_mesa();
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


        })

      }


    } else {



      let existeMesaDePaso
      if (this.formularioCategoria.value.tipo == "De paso") {
        existeMesaDePaso = this.listaMesa.some(mesa =>
          mesa.tipo === "De paso" && mesa.idMesa !== this.datosMesa?.idMesa
        );
      }

      if (existeMesaDePaso) {
        Swal.fire({
          icon: 'warning',
          title: 'Mesa ya existente',
          text: `Ya existe otra mesa de paso`,
        });
        return;
      } else {
        this._mesaServicio.editar(_mesa).subscribe({

          next: (data) => {
            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Mesa Editada',
                text: `La mesa fue editada.`,
              });
              // this._utilidadServicio.mostrarAlerta("El usuario fue registrado", "Exito");
              this.modalActual.close("true");
              // this.actualizarLocalStorage(_usuario);
            } else {
              if (data.msg == "El nombre de la mesa ya existe.") {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `El nombre de la mesa ya existe.`,
                });


              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `No se pudo guardar la mesa`,
                });

              }

            }
          },
          error: (e) => {


            // Swal.fire({
            //   icon: 'error',
            //   title: 'ERROR',
            //   text: ` el cliente  editar`,
            // });
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
                      this.guardarEditar_mesa();
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

        })


      }


    }


  }



}
