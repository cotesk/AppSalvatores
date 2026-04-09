import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MesaService } from '../../../../Services/mesa.service';
import { UsuariosService } from '../../../../Services/usuarios.service';
import { Mesa } from '../../../../Interfaces/mesa';
import { MatTableDataSource } from '@angular/material/table';
import { Pedido } from '../../../../Interfaces/pedido';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-solo-el-pedido',
  templateUrl: './editar-solo-el-pedido.component.html',
  styleUrl: './editar-solo-el-pedido.component.css'
})
export class EditarSoloElPedidoComponent {

  listaMesas: Mesa[] = [];
  // listaMesasFiltrada: Mesa[] = [];
  dataSource = new MatTableDataSource<Mesa>();

  formularioEditarPedido!: FormGroup;
  tipodePedido: string = "Local";
  mesaSeleccionado!: Mesa | null;
  private readonly CLAVE_SECRETA = '9P#5a^6s@Lb!DfG2@17#Co-Tes#07';
  pedido: Pedido;
  clienteFiltrado: string = '';
  constructor(private fb: FormBuilder,
    private mesasService: MesaService,
    private _usuarioServicio: UsuariosService,
    public dialogRef: MatDialogRef<EditarSoloElPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Pedido
  ) {

    console.log(data);
    this.pedido = data;


    this.formularioEditarPedido = this.fb.group({
      tipoPedido: ['', Validators.required],
      // mesa: ['', Validators.required],
      idMesa: ['', Validators.required],
      estadoPedido: ['', Validators.required],
      comentarioGeneral: [''],
      pagado: [false],
      cancelado: [false]
    });


    this.formularioEditarPedido.get('idMesa')?.valueChanges.subscribe(value => {
      console.log('Valor de búsqueda:', value); // Log del valor de búsqueda
      this.listaMesas = this.retornarProductoPorFiltro(value); // Filtrar lista
      console.log('Lista de categorías filtradas:', this.formularioEditarPedido); // Log de categorías filtradas
    });

  }

  retornarProductoPorFiltro(value: string): Mesa[] {
    console.log('Filtrando con valor:', value);
    console.log('Categorías disponibles:', this.listaMesas);

    if (!value) {
      return this.listaMesas; // Si no hay valor, retornar todas las categorías
    }

    const lowerCaseValue = value.toLowerCase(); // Normaliza el valor de búsqueda
    const filteredList = this.listaMesas.filter(categoria =>
      categoria.nombreMesa.toLowerCase().includes(lowerCaseValue)
    );

    console.log('Mesas filtradas:', filteredList);
    return filteredList;
  }

  ngOnInit(): void {

    if (this.data != null) {
      this.formularioEditarPedido.patchValue({
        tipoPedido: this.pedido.tipoPedido,
        // mesa: this.pedido.nombreMesa,
        idMesa: this.pedido.idMesa,
        estadoPedido: this.pedido.estadoPedido,
        comentarioGeneral: this.pedido.comentarioGeneral,
        pagado: this.pedido.pagado,
        cancelado: this.pedido.cancelado
      });



    }


    this.ListadeMesas();
  }

  guardarCambios() {
    if (this.formularioEditarPedido.invalid) return;


    const datosFormulario = this.formularioEditarPedido.value;

    // console.log(datosFormulario);
    // console.log(this.listaMesas);

    // 🔹 Buscar automáticamente la mesa seleccionada en la lista
    this.mesaSeleccionado = this.listaMesas.find(
      (m) => m.idMesa === datosFormulario.idMesa
    ) ?? null;

    if (!this.mesaSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se ha encontrado la mesa seleccionada.',
      });
      return;
    }

    // 🔹 Normalizamos texto para evitar errores de mayúsculas/minúsculas
    const tipoPedido = datosFormulario.tipoPedido.toLowerCase().trim();
    const tipoMesa = this.mesaSeleccionado.tipo.toLowerCase().trim();

    // 🔹 Validaciones permitidas
    const esValido =
      (tipoPedido === 'local' && tipoMesa === 'local') ||
      (tipoPedido === 'domicilio' && tipoMesa === 'de paso') ||
      (tipoPedido === 'recoger' && tipoMesa === 'de paso');

    if (!esValido) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el tipo de pedido',
        text: `El tipo de pedido "${datosFormulario.tipoPedido}" no se puede realizar para este tipo de mesa "${this.mesaSeleccionado.tipo}".`,
      });
      return;
    }

    const pedidoEditado: Pedido = {
      ...this.pedido, // trae los datos originales
      tipoPedido: datosFormulario.tipoPedido,
      idMesa: datosFormulario.idMesa,
      estadoPedido: datosFormulario.estadoPedido,
      comentarioGeneral: datosFormulario.comentarioGeneral,
      pagado: false,
      cancelado: false,
    };

    // console.log('Pedido actualizado:', pedidoEditado);

    // Llamar aquí a tu servicio para enviar al backend
    // this.pedidoService.actualizarPedido(pedidoEditado).subscribe(...)

     this.dialogRef.close(pedidoEditado); // opcional: cerrar el modal y pasar los datos actualizados
  }

  private ListadeMesas() {
    this.mesasService.lista().subscribe({
      next: (data) => {
        // console.log(data)
        if (data.status) {
          // Ordenar los productos alfabéticamente por nombre
          data.value.sort((a: Mesa, b: Mesa) => a.nombreMesa.localeCompare(b.nombreMesa));
          const lista = data.value as Mesa[];
          // this.listaMesas = lista;
          this.listaMesas = lista.filter(p => p.ocupada == 0 || p.idMesa == this.pedido.idMesa);
        }
      },
      error: (e) => {
        let idUsuario: number = 0;


        // Obtener el idUsuario del localStorage
        const usuarioString = localStorage.getItem('usuario');
        const bytes = CryptoJS.AES.decrypt(usuarioString!, this.CLAVE_SECRETA!);
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
                  this.ListadeMesas();
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


  filtrarEntradaMesa(event: any): void {
    const inputCliente = event.target.value;



    // Almacena el valor filtrado en la variable clienteFiltrado
    this.clienteFiltrado = inputCliente;

    // Establece el valor en el control del formulario
    this.formularioEditarPedido.get('mesa')?.setValue(this.clienteFiltrado);
  }

}
