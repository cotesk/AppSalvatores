import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Pedido } from '../../../../Interfaces/pedido';
import { DetallePedido } from '../../../../Interfaces/detalle-pedido';
import { Producto } from '../../../../Interfaces/producto';
import { ProductoService } from '../../../../Services/producto.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PedidoService } from '../../../../Services/pedido.service';
import Swal from 'sweetalert2';
import { SignalRService } from '../../../../Services/signalr.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar-pedido-dialog',
  templateUrl: './editar-pedido-dialog.component.html',
  styleUrl: './editar-pedido-dialog.component.css'
})
export class EditarPedidoDialogComponent implements OnInit {
  pedido: Pedido;
  productosDisponibles: Producto[] = [];
  nombreProductoBuscado: any = null;
  productosFiltrados: Producto[] = [];
  stockProductoBuscado: any = null;
  precioUnitario: any = null;
  precioPorcion: any = null;
  tienePorcion: any = null;
  precioPorPorcionSeleccionado: { [key: number]: boolean } = {};

  precioUnitarioNormalizado: any;
  precioPorcionNormalizado: any;

  nuevoProducto: Partial<DetallePedido> = {
    idProducto: undefined,
    cantidad: 1,
    comentario: '',
    descripcionProducto: "",

  };


  columnasDetalle: string[] = [
    'descripcionProducto',
    'cantidad',
    'precioUnitarioTexto',
    'unidadMedidaTexto',
    'subTotal',
    // 'totalTexto',
    'comentario',
    'acciones'
  ];

  constructor(
    public dialogRef: MatDialogRef<EditarPedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Pedido,
    public productoService: ProductoService,
    public pedidoService: PedidoService,
    private signalRService: SignalRService,
    private router: Router

  ) {
    // console.log(data);
    this.pedido = data;
  }

  agregarProducto(nuevoProducto: Partial<DetallePedido>) {
    // console.log("Intentando agregar:", nuevoProducto);


    if (nuevoProducto.unidadMedidaTexto == "Unitario" && this.stockProductoBuscado <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar el pedido',
        text: `No hay suficiente stock para el producto ${nuevoProducto!.descripcionProducto}.`
      });
      return;


    } else {

      // console.log("Intentando agregar:", this.pedido.detallePedidos);

      if (!nuevoProducto.idProducto) {
        console.warn("Producto inválido, falta idProducto.");
        return;
      }

      // Asegurarse que el arreglo exista
      if (!this.pedido.detallePedidos) {
        this.pedido.detallePedidos = [];
      }

      const precioNuevo = this.normalizarPrecio(nuevoProducto.precioUnitarioTexto);

      const existente = this.pedido.detallePedidos.find(p =>
        p.idProducto === nuevoProducto.idProducto &&
        this.normalizarPrecio(p.precioUnitarioTexto) === precioNuevo
      );


      const cantidad = nuevoProducto.cantidad || 1;
      const precioUnitario = parseFloat(nuevoProducto.precioUnitarioTexto || '0');
      const total = cantidad * precioUnitario;
      // console.log(existente);
      if (existente) {
        existente.cantidad += cantidad;
        existente.comentario = [existente.comentario, nuevoProducto.comentario].filter(Boolean).join(' / ');
        existente.precioUnitarioTexto = precioUnitario.toString();
        existente.totalTexto = (existente.cantidad * precioUnitario).toString();
      } else {
        // console.log("Producto nuevo, agregando a detallePedidos");

        const productoNuevo: DetallePedido = {
          idProducto: nuevoProducto.idProducto!,
          descripcionProducto: nuevoProducto.descripcionProducto || '',
          idMesa: nuevoProducto.idMesa!,
          nombreMesa: nuevoProducto.nombreMesa || '',
          tipoMesa: nuevoProducto.tipoMesa || '',
          cantidad: nuevoProducto.cantidad || 1,
          precioUnitarioTexto: nuevoProducto.precioUnitarioTexto!,
          unidadMedidaTexto: nuevoProducto.unidadMedidaTexto || '',
          comentario: nuevoProducto.comentario || '',
          totalTexto: nuevoProducto.totalTexto!,
        };
        // console.log(productoNuevo);
        this.pedido.detallePedidos.push(productoNuevo);
        // console.log(this.pedido.detallePedidos);

        //  Fuerza la actualización visual
        this.pedido.detallePedidos = [...this.pedido.detallePedidos];
      }

      // console.log("Detalle actualizado:", this.pedido.detallePedidos);

    }


  }


  normalizarPrecio(valor: string | undefined | null): number {
    if (!valor) return 0;

    return Number(
      valor
        .toString()
        .replace(/\./g, '') // quitar miles
        .replace(/,/g, '.') // convertir coma decimal a punto
    );
  }


  cambiarCantidad(detalle: any, cambio: number) {
    const nuevaCantidad = detalle.cantidad + cambio;
    if (nuevaCantidad >= 1) {
      detalle.cantidad = nuevaCantidad;
      let suma: number = 0;
      suma = parseInt(detalle.cantidad) * parseInt(detalle.precioUnitarioTexto);
      detalle.totalTexto = suma.toString();
      console.log(detalle);
    }
  }


  // Método que filtra los productos mientras escribes
  filtrarProductosPorNombre() {
    const termino = typeof this.nombreProductoBuscado === 'string'
      ? this.nombreProductoBuscado.toLowerCase()
      : this.nombreProductoBuscado?.nombre?.toLowerCase() || '';

    this.productosFiltrados = this.productosDisponibles.filter(p =>
      p.nombre.toLowerCase().includes(termino)
    );
  }


  // Cuando seleccionas una opción del autocomplete
  seleccionarProducto(event: MatAutocompleteSelectedEvent) {

    const productoSeleccionado = event.option.value;
    // console.log(productoSeleccionado);
    this.nombreProductoBuscado = productoSeleccionado; // Asigna el objeto, no el string
    this.stockProductoBuscado = productoSeleccionado.stock;
    this.nuevoProducto.idProducto = productoSeleccionado.idProducto;
    this.nuevoProducto.precio = productoSeleccionado.precio;
    this.nuevoProducto.cantidad = 1;
    this.nuevoProducto.totalTexto = (parseFloat(productoSeleccionado.precio) * 1).toString();
    this.tienePorcion = productoSeleccionado.tienePorcion;
    this.precioPorcion = productoSeleccionado.precioPorPorcionTexto;
    this.precioUnitario = productoSeleccionado.precio;
    this.precioUnitarioNormalizado = this.formatearNumero(this.precioUnitario);
    this.precioPorcionNormalizado = this.formatearNumero(this.precioPorcion);
  }


  mostrarNombreProducto(producto: any): string {
    return producto ? producto.nombre : '';
  }




  eliminarProducto(item: any) {
    if (this.pedido.detallePedidos.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: 'El pedido debe tener al menos un producto.',
      });
      return;
    }

    // this.pedido.detallePedidos = this.pedido.detallePedidos.filter(d => d.idProducto !== idProducto);
    this.pedido.detallePedidos = this.pedido.detallePedidos.filter(d => d !== item);
  }

  calcularTotalGeneral(): string {
    let total = 0;

    for (const d of this.pedido.detallePedidos) {
      const precio = parseFloat(d.precioUnitarioTexto);
      const subtotal = precio * d.cantidad;
      total += subtotal;
    }

    return this.formatearNumero(total.toString());
  }

  calcularTotalPedido(): number {
    let total = 0;

    for (const d of this.pedido.detallePedidos) {
      const precio = parseFloat(d.precioUnitarioTexto);
      total += precio * d.cantidad;
    }

    return total;
  }

  formatearConDosDecimales(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  calcularCantidadProductosTexto(): string {
    let totalCantidad = 0;

    for (const d of this.pedido.detallePedidos) {
      totalCantidad += d.cantidad;
    }

    // Retornar con formato ,00
    return this.formatearConDosDecimales(totalCantidad);
  }


  guardar() {
    this.pedido.fechaHora = new Date().toISOString();

    // //  Recalcular totalTexto de cada DETALLE
    // for (const d of this.pedido.detallePedidos) {
    //   const precio = parseFloat(d.precioUnitarioTexto);
    //   const subtotal = precio * d.cantidad;

    //   //  Total del detalle con ,00
    //   d.totalTexto = this.formatearConDosDecimales(subtotal);
    // }

    // //  Calcular total general
    // const totalCalculado = this.calcularTotalPedido();

    // //  Total del pedido con ,00
    // this.pedido.totalTexto = this.formatearConDosDecimales(totalCalculado);

    //  this.pedido.cantidadProductoTexto = this.calcularCantidadProductosTexto();

    const pedidoAEnviar = this.prepararPedidoParaEnviar();

    // console.log("Pedido listo para enviar:", pedidoAEnviar);

    this.pedidoService.actualizarPedido(
      pedidoAEnviar.idPedido,
      pedidoAEnviar
    ).subscribe({
      next: (data) => {
        // console.log(data);
        this.dialogRef.close(this.pedido);
      },
      error: err => {
        // console.error('Error al actualizar pedido', err);

        const mensajeError = typeof err.error === 'string' ? err.error : 'Ocurrió un error al actualizar el pedido.';

        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar el pedido',
          text: mensajeError
        });
      }
    });
  }


  prepararPedidoParaEnviar() {

    // Calculamos el total general del pedido
    const totalPedido = this.pedido.detallePedidos
      .reduce((acc, d) => acc + (d.cantidad * parseFloat(d.precioUnitarioTexto.replace(',', '.'))), 0);

    // const cantidadProductos = this.pedido.detallePedidos
    //   .reduce((acc, d) => acc + d.cantidad, 0);
    const cantidadProductos = this.pedido.detallePedidos.length;


    // this.calcularCantidadProductosTexto();

    const pedidoLimpio: any = {
      idPedido: this.pedido.idPedido,
      idMesa: this.pedido.idMesa,
      idUsuario: this.pedido.idUsuario,
      fechaHora: this.pedido.fechaHora,
      pagado: this.pedido.pagado,
      cancelado: this.pedido.cancelado,
      comentarioGeneral: this.pedido.comentarioGeneral,
      estadoPedido: this.pedido.estadoPedido,
      tipoPedido: this.pedido.tipoPedido,

      
      total: totalPedido,
      cantidadProducto: cantidadProductos,

      detallePedidos: this.pedido.detallePedidos.map((d: any) => {
        const precio = parseFloat(d.precioUnitarioTexto.replace(',', '.'));
        return {
          idDetallePedido: d.idDetallePedido ?? 0,
          idPedido: this.pedido.idPedido,
          idProducto: d.idProducto,
          idMesa: this.pedido.idMesa,
          cantidad: d.cantidad,
          precioUnitario: precio,
          total: d.cantidad * precio,
          comentario: d.comentario,
          unidadMedida: d.unidadMedidaTexto
        };
      })
    };

    return pedidoLimpio;
  }



  cancelar() {
    this.dialogRef.close(null); // No hacer cambios
  }

  formatearNumero(numero: string): string {
    // Convierte la cadena a número
    const valorNumerico = parseFloat(numero.replace(',', '.'));

    // Verifica si es un número válido
    if (!isNaN(valorNumerico)) {
      // Formatea el número con comas como separadores de miles y dos dígitos decimales
      return valorNumerico.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
      // Devuelve la cadena original si no se puede convertir a número
      return numero;
    }
  }
  formatearNumero2(numero: any): string {
    if (typeof numero === 'number' && !isNaN(numero)) {
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } else {
      return 'N/A';
    }
  }


  calcularTotalCaja(element: any): string {
    const precio = parseFloat(element.precioUnitarioTexto || '0');
    const cantidad = parseFloat(element.cantidad || '0');


    // console.log(saldoInicial);
    const total = precio * cantidad;


    // console.log(suma);
    return this.formatearNumero2(total);
  }

  agregarProductoDesdeFormulario() {

    console.log(this.nuevoProducto);


    if (!this.nuevoProducto.idProducto || this.nuevoProducto.cantidad! < 1) {
      Swal.fire({
        icon: 'warning',
        title: '¡Producto no válido!',
        text: 'Debes seleccionar un producto y asignar una cantidad mayor a cero.',
        confirmButtonText: 'Entendido',
        timer: 2500
      });
      return;
    }

    let precioUnitario: number;

    const producto = this.productosDisponibles.find(p => p.idProducto === this.nuevoProducto.idProducto);
    if (!producto) return;

    // console.log(producto);

    const esPorcion = this.precioPorPorcionSeleccionado[this.nuevoProducto!.idProducto] === true;

    if (esPorcion) {
      precioUnitario = parseFloat(producto.precioPorPorcionTexto!.replace(',', '.'));
    } else {
      precioUnitario = parseFloat(producto.precio.replace(',', '.'));
    }


    const cantidad = this.nuevoProducto.cantidad!;
    const total = precioUnitario * cantidad;

    const nuevoDetalle: DetallePedido = {
      idProducto: producto.idProducto,
      descripcionProducto: producto.nombre,
      idMesa: this.pedido.idMesa,
      nombreMesa: this.pedido.nombreMesa,
      tipoMesa: producto.unidadMedida === 'Comida' ? 'De paso' : 'Local',
      cantidad: cantidad,                                // 👈 numérico
      precioUnitarioTexto: precioUnitario.toString(),
      totalTexto: total.toString(),
      unidadMedidaTexto: producto.unidadMedida!,
      comentario: this.nuevoProducto.comentario?.trim() || '',
    };

    console.log(nuevoDetalle);

    this.agregarProducto(nuevoDetalle);

    // Limpiar campos
    this.nuevoProducto = {

      cantidad: 1,
      comentario: ''
    };

    //  this.nombreProductoBuscado = '';
  }


  ngOnInit() {






    this.productoService.lista().subscribe({
      next: (respuesta: any) => {
        // console.log(respuesta);
        if (respuesta.status) {
          this.productosDisponibles = respuesta.value;
          this.productosFiltrados = respuesta.value; // mostrar todos al principio
        } else {
          console.warn('No se pudo obtener productos');
        }
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
      }
    });
  }



}
