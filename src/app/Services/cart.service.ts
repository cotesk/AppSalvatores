import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Producto } from '../Interfaces/producto';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: Producto[] = [];
  private cartItemsSubject = new BehaviorSubject<Producto[]>(this.cartItems);

  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    // Cargar carrito desde localStorage al inicializar el servicio
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      this.cartItems = JSON.parse(storedCart);
      this.cartItemsSubject.next(this.cartItems);
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  addToCart(product: Producto) {
    const existingProduct = this.cartItems.find(item => item.idProducto === product.idProducto);
    if (existingProduct) {
      existingProduct.stock += 1;
    } else {
      product.stock = 1;
      this.cartItems.push(product);
    }
    this.cartItemsSubject.next(this.cartItems);
    this.saveToLocalStorage(); // Guardar cambios en localStorage
  }

  getCart(): Observable<Producto[]> {
    return this.cartItemsSubject.asObservable();
  }

  removeFromCart(product: Producto) {
    this.cartItems = this.cartItems.filter(item => item.idProducto !== product.idProducto);
    this.cartItemsSubject.next(this.cartItems);
    this.saveToLocalStorage(); // Guardar cambios en localStorage
  }

  removeFromCart2(index: number): Observable<void> {
    this.cartItems.splice(index, 1);
    this.cartItemsSubject.next(this.cartItems);
    this.saveToLocalStorage(); // Guardar cambios en localStorage
    return of(); // Puedes ajustar esto según tu lógica de observables
  }

  saveCartItems(cartItems: Producto[]): void {
    this.cartItems = cartItems;
    this.cartItemsSubject.next(cartItems);
    this.saveToLocalStorage(); // Guardar cambios en localStorage
  }

  getCartItems(): Producto[] {
    return this.cartItems;
  }

  getCartTotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + (parseInt(item.precioSinDescuento || '0') * item.stock),
      0
    );
  }

  clearCart() {
    this.cartItems = [];
    this.cartItemsSubject.next(this.cartItems);
    localStorage.removeItem('cartItems'); // Limpiar el carrito del localStorage
  }
}
