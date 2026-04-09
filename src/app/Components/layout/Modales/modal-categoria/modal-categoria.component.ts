import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators ,FormControl} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { Categoria } from '../../../../Interfaces/categoria';
import { CategoriaService } from '../../../../Services/categoria.service';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';


@Component({
  selector: 'app-modal-categoria',
  templateUrl: './modal-categoria.component.html',
  styleUrl: './modal-categoria.component.css'
})
export class ModalCategoriaComponent implements OnInit {

  formularioCategoria: FormGroup;

  tituloAccion: string = "Agregar";
  botonAccion: string = "Guardar";
  listaCategoria: Categoria[] = [];
  modoEdicion: boolean = true;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
constructor(private modalActual: MatDialogRef<ModalCategoriaComponent>,
  @Inject(MAT_DIALOG_DATA) public datosCategoria: Categoria,  private fb: FormBuilder,
  private _categoriaServicio: CategoriaService,
  private _utilidadServicio: UtilidadService,
  private _usuarioServicio: UsuariosService,

  ){


    this.formularioCategoria = this.fb.group({

      nombre: ['', [Validators.required, this.letrasSinNumerosValidator(), Validators.maxLength(40)]],
      esActivo: ['1',],


    });
    if (datosCategoria != null) {
      this.tituloAccion = "Editar";
      this.botonAccion = "Actualizar";
      this.modoEdicion = false;
    }



    this._categoriaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) this.listaCategoria = data.value
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

  lista(){
    this._categoriaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) this.listaCategoria = data.value
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

    if (this.datosCategoria != null) {
      this.formularioCategoria.patchValue({
       nombre: this.datosCategoria.nombre,
       esActivo: this.datosCategoria.esActivo?.toString() || 'valor_predeterminado',

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


  guardarEditar_Categoria() {


    const _categoria: Categoria = {
      idCategoria: this.datosCategoria == null ? 0 : this.datosCategoria.idCategoria,
      nombre: this.formularioCategoria.value.nombre,
      // esActivo: this.formularioCategoria.value.esActivo,
      esActivo: parseInt(this.formularioCategoria.value.esActivo),
    }


    if (this.datosCategoria == null) {

      this._categoriaServicio.guardar(_categoria).subscribe({

          next: (data) => {


            if (data.status) {
              Swal.fire({
                icon: 'success',
                title: 'Categoria Registrada',
                text: `La Categoria fue registrado`,
              });
              // this._utilidadServicio.mostrarAlerta("El usuario fue registrado", "Exito");
              this.modalActual.close("true");
              // this.actualizarLocalStorage(_usuario);
            } else {
              if (data.msg == "El nombre de la categoria ya existe.") {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `El nombre de la categoria ya existe.`,
                });


              }else {
                Swal.fire({
                  icon: 'error',
                  title: 'ERROR',
                  text: `No se pudo guardar el producto`,
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
                    this.guardarEditar_Categoria();
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
    }else{

      this._categoriaServicio.editar(_categoria).subscribe({

        next: (data) => {
          if (data.status) {
            Swal.fire({
              icon: 'success',
              title: 'Categoria Editada',
              text: `La Categoria fue editada.`,
            });
            // this._utilidadServicio.mostrarAlerta("El usuario fue registrado", "Exito");
            this.modalActual.close("true");
            // this.actualizarLocalStorage(_usuario);
          } else {
            if (data.msg == "El nombre de la categoria ya existe.") {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `El nombre de la categoria ya existe.`,
              });


            }else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `No se pudo guardar el producto`,
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
                    this.guardarEditar_Categoria();
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
