
import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Producto } from './../../../../Interfaces/producto';
import { Categoria } from '../../../../Interfaces/categoria';
import { ProductoService } from '../../../../Services/producto.service';
import { CategoriaService } from '../../../../Services/categoria.service';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { UtilidadService } from '../../../../Reutilizable/utilidad.service';
import { environment } from '../../../../environments/environment.development';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { async } from 'rxjs';

import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../Services/usuarios.service';
import * as CryptoJS from 'crypto-js';
import { VerImagenProductoModalComponent } from '../ver-imagen-producto-modal/ver-imagen-producto-modal.component';
import { ModalCategoriaComponent } from '../modal-categoria/modal-categoria.component';

import { style } from '@angular/animations';



@Component({
  selector: 'app-modal-producto',
  templateUrl: './modal-producto.component.html',
  styleUrl: './modal-producto.component.css'
})
export class ModalProductoComponent implements OnInit {

  formularioProducto: FormGroup;

  tituloAccion: string = "Agregar";
  botonAccion: string = "Guardar";
  listaCategoria: Categoria[] = [];

  urlApi: string = environment.endpoint;
  public Urlimagen: string | null = null;
  public imageData: string | null = null;
  inputFileRef2: ElementRef<HTMLInputElement> | undefined;
  imagenBase64: string | null = null;
  numeroFormateado: string = '';
  nombreImagen: string = '';
  previsualizaciones: any[] = [];// Puedes asignar un valor por defecto, según el tipo de datos que necesites
  public archivos: any[] = []; // Si es un arreglo, puedes asignar un arreglo vacío como valor por defecto
  public loading: boolean = false;
  imagenes: any[] = [];
  imagenBlob: Blob = new Blob();
  modoEdicion: boolean = false;
  imagenPorDefecto: string = 'assets/Images/Caja.png';
  inputFileRef: ElementRef | undefined;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  step1FormGroup!: FormGroup;
  step2FormGroup!: FormGroup;
  step3FormGroup!: FormGroup;
  nuevoArchivo: File | null = null;
  tipodeFijo: string = "Si";
  precioCompra: number = 0;
  categoriaSeleccionada: number | null = null;
  listaCategoriaFiltro: Categoria[] = [];
  clienteFiltrado: string = '';
  imagenesSeleccionadas: { nombre: string, base64: string }[] = [];
  public ocultarStock: boolean = false;

  idProduct: number = 0; // Asegúrate de inicializar esta variable
  mostrarPrecioPorcion: boolean = false;

  // Asegúrate de inicializar esta lista
  constructor(
    private modalActual: MatDialogRef<ModalProductoComponent>,
    @Inject(MAT_DIALOG_DATA) public datosProducto: Producto, private fb: FormBuilder,
    private _categoriaServicio: CategoriaService, private _productoServicio: ProductoService,
    private _utilidadServicio: UtilidadService, private sanitizer: DomSanitizer,

    private _usuarioServicio: UsuariosService,

    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.previsualizaciones = [];

    // this.step1FormGroup = this.fb.group({
    //  caracteristicas: ['', Validators.required],
    //   Urlimagen: [''],
    //   imageData: [''],
    // });

    // this.step2FormGroup = this.fb.group({
    //   idCategoria: ['', Validators.required,],
    //   idProveedor: ['', Validators.required],
    //   nombre: ['', [Validators.required, Validators.maxLength(300)]],
    //   codigo: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(15)]],
    // });

    // this.step3FormGroup = this.fb.group({
    //   // Define los controles del paso 3
    // });


    this.formularioProducto = this.fb.group({

      nombre: ['', [Validators.required, Validators.maxLength(300)]],
      idCategoria: ['', Validators.required,],
      stock: ['', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(4)]],
      precio: ['', [Validators.required, Validators.maxLength(10)]],
      Urlimagen: [''],
      imageData: [''],
      unidadMedida: ['Unitario', Validators.required],
      porcion: ['0'],
      precioPorPorcionTexto: ['', [Validators.maxLength(10)]],
    });

    if (datosProducto != null) {
      this.tituloAccion = "Editar";
      this.botonAccion = "Actualizar";
      this.modoEdicion = true;
    }


    //  console.log(datosProducto);

    if (this.formularioProducto) {

      const idProductoAsignacion = datosProducto?.idProducto ?? 0; 
      // console.log(idProductoAsignacion);

      this.formularioProducto.get('unidadMedida')?.valueChanges.subscribe((value) => {
       
        if (value === 'Unitario') {

        }

        if (value === 'Heladeria') {

        }

        // else {

        //   this.formularioProducto.get('stock')?.setValue('0');
        //   this.formularioProducto.get('stock')?.enable();
        // }
      });

    }

    // if (datosProducto.tienePorcion! == 1) {
    //   this.mostrarPrecioPorcion = true
    // }




    this._categoriaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) {

          this.listaCategoria = data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Categoria[];
          this.listaCategoria = lista.filter(p => p.esActivo == 1)


        }
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
                  this.categoria();
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



    this.formularioProducto.get('idCategoria')?.valueChanges.subscribe(value => {
      // console.log('Valor de búsqueda:', value); // Log del valor de búsqueda
      this.listaCategoriaFiltro = this.retornarProductoPorFiltro(value); // Filtrar lista
    });

  }




  retornarProductoPorFiltro(value: string): Categoria[] {
    // console.log('Filtrando con valor:', value);
    // console.log('Categorías disponibles:', this.listaCategoria);

    if (!value) {
      return this.listaCategoria; // Si no hay valor, retornar todas las categorías
    }

    const lowerCaseValue = value.toLowerCase(); // Normaliza el valor de búsqueda
    const filteredList = this.listaCategoria.filter(categoria =>
      categoria.nombre.toLowerCase().includes(lowerCaseValue)
    );

  
    return filteredList;
  }


  // Método para calcular el precio de compra unitario
  calcularPrecioCompra(): void {
    if (this.formularioProducto.get('unidadMedida')?.value === "Ambas") {

      // Obtener los valores del formulario y asegurar que no sean null o undefined
      let precioPorCajaCompra = this.formularioProducto.get('precioPorCajaCompra')?.value || '';
      let cantidadPorCaja = this.formularioProducto.get('cantidadPorCaja')?.value || '';

      // Remover los puntos (si el formato de precio tiene puntos como separadores de miles)
      precioPorCajaCompra = precioPorCajaCompra.replace(/\./g, '');

      // Convertir los valores a número, si están vacíos asignar 0
      const precioNumerico = parseFloat(precioPorCajaCompra) || 0;
      const cantidadNumerica = parseFloat(cantidadPorCaja) || 0;

      // Si cualquiera de los valores es 0, el precioCompra será "0"
      if (precioNumerico === 0 || cantidadNumerica === 0) {
        this.formularioProducto.get('precioCompra')?.setValue('0');
      } else {
        // Calcular el precio por unidad
        this.precioCompra = precioNumerico / cantidadNumerica;

        // Asegurarse de que el valor sea un número entero si es necesario, o con 2 decimales
        const precioFormateado = Number.isInteger(this.precioCompra)
          ? this.precioCompra
          : this.precioCompra.toFixed(0);

        // Asignar el valor formateado al campo de precioCompra
        this.formularioProducto.get('precioCompra')?.setValue(precioFormateado.toString());
      }

      // Mostrar los valores en la consola para depuración
      console.log('Precio por caja compra:', precioNumerico);
      console.log('Cantidad por caja:', cantidadNumerica);
      console.log('Precio calculado:', this.precioCompra);
    }

  }

  categoria() {
    this._categoriaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) {

          this.listaCategoria = data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Categoria[];
          this.listaCategoria = lista.filter(p => p.esActivo == 1)


        }
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
                  this.categoria();
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



  // verImagen(): void {
  //   this.dialog.open(VerImagenProductoModalComponent, {
  //     data: {
  //       imagenUrl: this.previsualizaciones // Pasa directamente la URL segura
  //     }
  //   });
  // }

  verImagen(base64: string) {
    Swal.fire({
      title: 'Vista previa',
      html: `
      <div style="width:100%; display:flex; justify-content:center; align-items:center;">
        <img 
          src="${base64}" 
          alt="Imagen" 
          style="max-width: 100%; max-height: 400px; object-fit: contain;" 
        />
      </div>
    `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 600
    });
  }



  generarHtmlProveedor(proveedores: any[]): string {
    const formatearPesos = (valor: string | number | undefined): string => {
      const numero = Number(valor) || 0;
      return new Intl.NumberFormat('es-CO').format(numero);
    };

    let html = '<div style="text-align:left">';
    for (let p of proveedores) {
      html += `
      <div style="border-bottom:1px solid #ccc; padding:10px 0">
        <strong>Proveedor:</strong> ${p.nombreProveedor} <br>
        <strong>Precio Compra:</strong> $${formatearPesos(p.precioCompra)} <br>
        <strong>Precio Caja:</strong> $${formatearPesos(p.precioPorCajaCompra)} <br>
        <div style="display:flex; gap:10px; margin-top:5px; flex-wrap:wrap;">
          ${p.imagenUrl.map((img: string) =>
        `<a href="${img}" target="_blank">
                <img src="${img}" width="80" height="80" style="object-fit:cover; cursor:pointer;" />
              </a>`
      ).join('')
        }
        </div>
      </div>
    `;
    }
    html += '</div>';
    return html;
  }



  eliminarImagen(index: number): void {
    this.imagenesSeleccionadas.splice(index, 1);
  }

  iva() {
    this._productoServicio.iva().subscribe({

      next: (data) => {
        if (data.status) {

          if (!this.modoEdicion) {
            this.formularioProducto.get('iva')?.disable();
            let valorIva = data.value;

            // Convertir el valor a un número entero, eliminando comas y decimales
            if (typeof valorIva === 'string') {
              // Si el valor es una cadena, remueve las comas y convierte a número
              valorIva = Number(valorIva.replace(',', '.'));
            }

            // Redondear el número a un entero
            const ivaRedondeado = Math.round(valorIva);

            // Establecer el valor redondeado en el formulario
            this.formularioProducto.get('iva')?.setValue(ivaRedondeado);
          } else {
            // Swal.fire({
            //   icon: 'warning',
            //   title: 'Advertencia',
            //   text: 'Es aqui',
            // });
            // return;
            this.formularioProducto.get('iva')?.disable();
            // let valorIva = data.value;

            // // Convertir el valor a un número entero, eliminando comas y decimales
            // if (typeof valorIva === 'string') {
            //   // Si el valor es una cadena, remueve las comas y convierte a número
            //   valorIva = Number(valorIva.replace(',', '.'));
            // }

            // // Redondear el número a un entero
            // const ivaRedondeado = Math.round(valorIva);

            // // Establecer el valor redondeado en el formulario
            // this.formularioProducto.get('iva')?.setValue(ivaRedondeado);
          }


        }
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
                  this.iva();
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
  CategoriaCompleta() {
    this._categoriaServicio.listaCard().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        if (data.status) {
          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));
          this.listaCategoria = data.value as Categoria[];
          this.listaCategoriaFiltro = [...this.listaCategoria];
          console.log('Categorías cargadas:', this.listaCategoria);
        }
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
                  // this.actualizarListaProductos();
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
  ngOnInit(): void {
    this.formularioProducto.get('unidadMedida')?.valueChanges.subscribe(valor => {
      if (valor === 'Comida') {
        this.formularioProducto.get('stock')?.setValue(0);
        this.ocultarStock = true;
      } else {
        this.ocultarStock = false;
      }
    });

    // this.formularioProducto.get('porcion')?.valueChanges.subscribe(value => {
    //   this.mostrarPrecioPorcion = value === '1';
    // });

    this.iva();
    // this.CategoriaCompleta();
    this.categoria();
    const imagenBase64 = this.imagenBase64;
    const producto = this.data.producto;
    this.previsualizaciones = this.data.imagenUrl;

    //  console.log(this.datosProducto);

    if (this.datosProducto.tienePorcion! == 1) {
      this.mostrarPrecioPorcion = true
    }


    if (this.datosProducto != null) {

      this.idProduct = (this.datosProducto.idProducto);
      // console.log(this.idProduct);

      const precioNumerico = parseFloat(this.datosProducto.precio);
      const precioFormateado = precioNumerico.toFixed(0);


      const precioPorcionNumerico = parseFloat(this.datosProducto.precioPorPorcionTexto!);
      const precioPorcionFormateado = precioPorcionNumerico.toFixed(0);
      // let precioNumerico2 = parseFloat(this.datosProducto.precioCompra);
      // let precioFormateado2 = precioNumerico2.toFixed(0);

      // const precioNumerico3 = parseFloat(this.datosProducto.precioPorCaja!);
      // const precioFormateado3 = precioNumerico3.toFixed(0);

      // const precioNumerico4 = parseFloat(this.datosProducto.precioPorCajaCompra!);
      // const precioFormateado4 = precioNumerico4.toFixed(0);

      const iva = parseFloat(this.datosProducto.iva);
      const ivaFormateado = iva.toFixed(0);

      const descuentos = parseFloat(this.datosProducto.descuentos);
      const descuentosFormateado = descuentos.toFixed(0);



      const unidadMedida = this.datosProducto.unidadMedida
      // if (unidadMedida === 'Caja') {


      //   // this.formularioProducto.get('precioCompra')?.setValue('0');
      //   precioFormateado2 = "0";
      // }


      this.formularioProducto.patchValue({

        nombre: this.datosProducto.nombre,
        idCategoria: this.datosProducto.idCategoria,

        // stock: this.datosProducto.stock,
        stock: this.datosProducto.stock,
        precio: precioFormateado,
        precioPorPorcionTexto: precioPorcionFormateado,
        // precioPorCajaCompra: precioFormateado4,
        unidadMedida: this.datosProducto.unidadMedida,
        porcion: this.datosProducto.tienePorcion!.toString(),

        esActivo: this.datosProducto.esActivo.toString(),
        //esActivo: this.datosProducto.esActivo,
        imageData: [''],
        caracteristicas: this.datosProducto.caracteristicas,
        // idProveedor: this.datosProducto.idProveedor,
        // precioCompra: 0,
        descuentos: descuentosFormateado,
        iva: ivaFormateado,
        codigo: this.datosProducto.codigo,
      })

    }

    // console.log("Aqui");
    // // Ejecutar manualmente la lógica de cambio de unidad de medida:
    // const unidadMedida = this.formularioProducto.get('unidadMedida')?.value || (this.datosProducto ? this.datosProducto.unidadMedida : null);
    // console.log("Unidad de medida:", unidadMedida);
    // if (unidadMedida === 'Caja') {
    //   this.formularioProducto.get('precio')?.setValue('0');
    //   this.formularioProducto.get('precio')?.disable();
    //   this.formularioProducto.get('cantidadPorCaja')?.enable();
    //   this.formularioProducto.get('precioPorCaja')?.enable();
    // } else if (unidadMedida === 'Unitario') {
    //   this.formularioProducto.get('precioPorCaja')?.setValue('0');
    //   this.formularioProducto.get('precioPorCaja')?.disable();
    //   this.formularioProducto.get('cantidadPorCaja')?.setValue(0);
    //   this.formularioProducto.get('cantidadPorCaja')?.disable();
    //   this.formularioProducto.get('precio')?.enable();
    // } else {
    //   this.formularioProducto.get('precio')?.enable();
    //   this.formularioProducto.get('precioPorCaja')?.enable();
    //   this.formularioProducto.get('cantidadPorCaja')?.enable();
    //   this.calcularPrecioCompra();
    // }

  }


  onPorcionChange(valor: string) {
    this.mostrarPrecioPorcion = valor === '1';

    // Si cambia a "No", limpiar el campo
    if (valor === '0') {
      this.formularioProducto.get('precioPorPorcionTexto')?.setValue('0');
    }else{
      this.formularioProducto.get('precioPorPorcionTexto')?.setValue('0');
    }
  }

  formatearNumero(event: any, campo: string): void {
    let valorInput = event.target.value.replace(/\./g, ''); // Elimina los puntos existentes

    // Verifica si el valor es un número válido antes de formatear
    if (valorInput !== '' && !isNaN(parseFloat(valorInput))) {
      valorInput = parseFloat(valorInput).toLocaleString('es-CO', { maximumFractionDigits: 2 });
      this.numeroFormateado = valorInput;

      // Actualiza el valor formateado en el formulario
      this.formularioProducto.get(campo)?.setValue(valorInput);
    } else {
      // Si el valor no es un número válido o está vacío, establece el valor en blanco en el formulario
      this.numeroFormateado = '';
      this.formularioProducto.get(campo)?.setValue('');
    }
  }




  selectFile(event: any): void {
    const archivos: FileList = event.target.files;

    if (archivos && archivos.length + this.imagenesSeleccionadas.length <= 6) {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const lector = new FileReader();
        lector.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            this.imagenesSeleccionadas.push({
              nombre: archivo.name,
              base64: e.target.result
            });
          }
        };
        lector.readAsDataURL(archivo);
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Límite de imágenes',
        text: 'Solo puedes subir hasta 6 imágenes por producto.',
      });
    }

    // Limpiar input file
    event.target.value = '';
  }


  limpiarImagen(): void {
    this.formularioProducto.patchValue({
      imageData: '',
    });
    this.previsualizaciones = [];
    this.imagenBase64 = null;
  }

  // obtenerUrlSeguraDeImagen(): SafeUrl | null {
  //   const safeUrl = this.imagenBase64 ? this.sanitizer.bypassSecurityTrustUrl(this.imagenBase64) : null;

  //   return safeUrl;
  // }
  obtenerUrlSeguraDeImagen(): SafeUrl | null {
    const safeUrl = this.imagenBase64
      ? this.sanitizer.bypassSecurityTrustUrl(this.imagenBase64)
      : null;

    return safeUrl;
  }

  letrasValidator() {
    return (control: FormControl) => {
      const nombre = control.value;
      const soloLetras = /^[a-zA-Z]+$/.test(nombre);
      return soloLetras ? null : { letrasValidator: true };
    };
  }


  generarCodigoAleatorio() {
    const codigoAleatorio = Math.floor(Math.random() * Math.pow(10, 15)).toString().padStart(15, '0');
    this.formularioProducto.get('codigo')?.setValue(codigoAleatorio);
  }

  VerInfo(event: MouseEvent) {
    event.stopPropagation();
    Swal.fire({
      icon: 'info',
      title: 'Información sobre cómo funciona el precio fijo',
      text: 'Es cuando tu quieres que un producto tenga un precio fijo, por ejemplo, un cargador con un precio de $30,000. Si seleccionas precio fijo, el precio incluirá el IVA. Por otro lado, si no seleccionas precio fijo y el IVA es del 19%, el producto se registrará con un precio de $35,700 aplicando el IVA.',
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: 'Aceptar',
      customClass: {
        container: 'ver-info-popup',
        htmlContainer: 'ver-info-html',
      },
      didOpen: (popup) => {
        setTimeout(() => { // Esperar un breve momento para asegurar que el modal esté completamente abierto
          const swalTextElement = popup.querySelector('.swal2-text');
          if (swalTextElement) {
            (swalTextElement as HTMLElement).style.textAlign = 'justify'; // Alineación del texto a la justificación
          }
        }, 100); // Ajusta el tiempo de espera según sea necesario
      }
    });
  }



  async guardarEditar_Producto() {


    const usuarioString = localStorage.getItem('usuario');
    const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA);
    const datosDesencriptados = bytes.toString(CryptoJS.enc.Utf8);
    const usuario = JSON.parse(datosDesencriptados);
    const idUsuarioLocalStorage = usuario ? usuario.idUsuario : null;

    if (this.formularioProducto.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `Por favor, complete todos los campos correctamente`,
      });
      return;
    }
    //si no hay datos de editar entra para que haga la imagen 
    if (this.datosProducto == null) {
      // Si no hay imágenes seleccionadas, usar imagen por defecto
      if (this.imagenesSeleccionadas.length === 0) {
        const rutaPorDefecto = 'assets/Images/PorDefecto.png';

        try {
          const response = await fetch(rutaPorDefecto);
          const blob = await response.blob();

          const base64 = await this.blobToBase64(blob) as string;
          const nombreAleatorio = `PorDefecto_${Math.floor(10000 + Math.random() * 90000)}.png`;

          this.imagenesSeleccionadas.push({
            nombre: nombreAleatorio,
            base64: base64
          });

          console.log('Imagen por defecto añadida:', nombreAleatorio);
        } catch (error) {
          console.error('Error al cargar imagen por defecto:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la imagen por defecto.',
          });
          return;
        }
      }

    }


    this.procesarArchivo();



  }

  token() {
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
              this.guardarEditar_Producto();
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


  blobToBase64(blob: Blob): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result!);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  base64ToByteArray(base64: string): number[] {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Array.from(bytes);
  }



  procesarArchivo() {


    // Obtener la cantidad actual del producto antes de realizar cambios
    const cantidadActual = this.datosProducto ? this.datosProducto.stock : 0;

    // Verificar si hay un stock almacenado en la base de datos y es mayor a cero
    const stockBaseDatos = cantidadActual > 0 ? cantidadActual : 0;
    // Obtener la cadena de base64 de la imagen seleccionada
    // const imagenBase64 = this.imagenBase64;

    // // Verificar si no se seleccionó ninguna imagen
    // if (!this.modoEdicion && !imagenBase64) {
    //   // this._utilidadServicio.mostrarAlerta("Debe seleccionar una imagen", "Error");
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Error!',
    //     text: `Debe seleccionar una imagen`,
    //   });
    //   return;
    // }
    // Obtener el estado actual del producto
    const estadoActual = this.datosProducto ? this.datosProducto.esActivo : 1;

    // Usar el valor del formulario si se ha realizado un cambio, de lo contrario, conservar el valor actual
    const nuevoEstado = this.formularioProducto.value.esActivo !== undefined ? this.formularioProducto.value.esActivo : estadoActual;


    // Obtener el estado actual del producto
    const estadoActualPorcion = this.datosProducto ? this.datosProducto.tienePorcion : 0;

    // Usar el valor del formulario si se ha realizado un cambio, de lo contrario, conservar el valor actual
    const nuevoEstadoProcion = this.formularioProducto.value.porcion !== undefined ? this.formularioProducto.value.porcion : estadoActualPorcion;


    let precioString = this.formularioProducto.value.precio;
    let precioPorcionString = this.formularioProducto.value.precioPorPorcionTexto;

    //   console.log(precioPorcionString);
    // if ( precioPorcionString == 'NaN') {
    //      console.log("entroo");
    //   precioPorcionString == "0"
    // }

    // console.log(precioPorcionString);


    // let precioCompraString = this.formularioProducto.value.precioCompra;
    let precioCompraString = this.formularioProducto.get('precioCompra')?.value ?? "0";

    let suma: number;
    let sumaporcion: number;

    let sumaCaja: number;
    let sumaCajaCompra: number;
    let precioCom: number;
    let precioX = this.formularioProducto.value.precio;


    precioString = precioString ? precioString.replace(/\./g, '') : "0";
    suma = precioString;

    precioPorcionString = precioPorcionString ? precioPorcionString.replace(/\./g, '') : "0";
    sumaporcion = precioPorcionString;

    let stock: any
    console.log(this.formularioProducto.value.unidadMedida);
    if (this.formularioProducto.value.unidadMedida == "Unitario") {

      stock = this.formularioProducto.value.stock;
    } 
    else if (this.formularioProducto.value.unidadMedida == "Heladeria") {

      stock = this.formularioProducto.value.stock;
    }
    else {
      stock = 0;
    }



    const codigoAleatorio = Math.floor(100000 + Math.random() * 900000).toString();


    const _producto: Producto = {
      idProducto: this.datosProducto == null ? 0 : this.datosProducto.idProducto,
      nombre: this.formularioProducto.value.nombre,
      // idCategoria: this.formularioProducto.value.idCategoria?.idCategoria,
      idCategoria: this.formularioProducto.value.idCategoria,
      descripcionCategoria: "",
      precio: suma.toString(),
      precioPorPorcionTexto: sumaporcion.toString(),
      // stock: this.formularioProducto.value.stock,
      stock: stock,
      //esActivo: parseInt(this.formularioProducto.value.esActivo),
      esActivo: nuevoEstado,
      tienePorcion: nuevoEstadoProcion,
      imageData: this.imageData ? [this.imageData.split(',')[1]] : [],
      caracteristicas: "Ninguna",
      iva: "19",
      descuentos: "0",
      codigo: codigoAleatorio,
      imagenUrl: [],
      // nombreImagen: this.nombreImagen,
      nombreImagen: this.nombreImagen ? [this.nombreImagen] : [],
      unidadMedida: this.formularioProducto.value.unidadMedida,
      imagenes: this.imagenesSeleccionadas.map(img => ({
        nombreImagen: img.nombre,
        imageData: img.base64.split(',')[1],
        imagenUrl: ""
      }))


    };
    // if (_producto.stock <= 0) {

    //   this._utilidadServicio.mostrarAlerta("Digite un Stok mayor a Cero ", "ERROR!");
    // } else {
    //this.token();
     console.log(_producto);
    if (this.datosProducto == null) {
      this._productoServicio.guardar(_producto).subscribe({
        next: (data) => {
          if (data.status) {
            Swal.fire({
              icon: 'success',
              title: 'Producto Registrado',
              text: `El producto fue registrado`,
            });
            // this._utilidadServicio.mostrarAlerta("El producto fue registrado", "Exito");
            this.modalActual.close("true");
          } else {
            if (data.msg == "Ya existe un producto con el mismo nombre") {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `Ya existe un producto con el mismo nombre`,
              });


            } else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `No se pudo guardar el producto`,
              });

            }

            // this._utilidadServicio.mostrarAlerta("Ya existe un producto con ese mismo nombre", "Error");
          }
        },
        error: (error) => {
          console.log(error);
          // if (error == "Ocurrió un error en la solicitud. Por favor, inténtelo de nuevo más tarde.") {
          // console.log(e.error.errors);

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
                    this.guardarEditar_Producto();
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
    } else {
      // console.log(_producto);
      this._productoServicio.editar(_producto).subscribe({
        next: (data) => {
           console.log(data);
          if (data.status) {
            Swal.fire({
              icon: 'success',
              title: 'Producto Editado',
              text: `El producto fue editado.`,
            });
            // this._utilidadServicio.mostrarAlerta("El producto fue registrado", "Exito");
            this.modalActual.close("true");
          } else {
            if (data.msg == "Ya existe un producto con el mismo nombre") {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `Ya existe un producto con el mismo nombre`,
              });


            } else {
              Swal.fire({
                icon: 'error',
                title: 'ERROR',
                text: `No se pudo editar el producto`,
              });

            }

            // this._utilidadServicio.mostrarAlerta("Ya existe un producto con ese mismo nombre", "Error");
          }
        },
        error: (e) => {

          console.error('Error es :', e);
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
                    this.guardarEditar_Producto();
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
    // }


  }
  cargarCategoria() {
    this._categoriaServicio.lista().subscribe({

      next: (data) => {
        if (data.status) {

          this.listaCategoria = data.value.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));

          const lista = data.value as Categoria[];
          this.listaCategoria = lista.filter(p => p.esActivo == 1)


        }
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
                  this.cargarCategoria();
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


  nuevoCategoria(event: MouseEvent): void {
    event.stopPropagation();
    this.dialog.open(ModalCategoriaComponent, {
      disableClose: true

    }).afterClosed().subscribe(resultado => {
      this.cargarCategoria();
    });
  }


  onCategoriaSelected(option: any): void {
    this.categoriaSeleccionada = option.idCategoria;  // Guardar la categoría seleccionada

  }

  filtrarEntrada(event: any): void {
    const inputCliente = event.target.value;

    if (/^\d+$/.test(inputCliente)) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `No se puede digitar numero.`,
      });
      // Aquí, se puede mostrar una alerta o desactivar el botón de agregar.
      // this._utilidadServicio.mostrarAlerta('No se puede digitar numero.', 'ERROR!');
      // this.clienteSeleccionado = null!;
      // this.formularioProductoVenta.patchValue({
      //   cliente: null,
      //   clienteId: null,
      // });

      // Limpiar el texto del cliente seleccionado
      this.formularioProducto.get('categoria')?.setValue('');
    }
    if (inputCliente == "") {

      this.categoriaSeleccionada = inputCliente;  // Guardar la categoría seleccionada
      // this.aplicarFiltroCard();
    }

    const soloLetras = inputCliente.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '');

    // Almacena el valor filtrado en la variable clienteFiltrado
    this.clienteFiltrado = soloLetras;

    // Establece el valor en el control del formulario
    this.formularioProducto.get('categoria')?.setValue(this.clienteFiltrado);
  }

  mostrarCategoria(categoria: Categoria): string {

    return categoria ? categoria.nombre : '';

  }
  mostrarListaCategoria(): void {


    this.listaCategoriaFiltro = this.listaCategoria;

  }

  lastItem(item: any, list: any[]): boolean {
    return item === list[list.length - 1];
  }

}
