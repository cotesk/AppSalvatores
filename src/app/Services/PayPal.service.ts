import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayPalService {


  private urlApi: string = environment.endpoint + "paypal/"

  constructor(private http: HttpClient) { }

  confirmPayment(token: string, payerId: string) {
    const url = `${this.urlApi}pago-exitoso?token=${token}&PayerID=${payerId}`;
    return this.http.get(url, { responseType: 'text' });
  }
}
