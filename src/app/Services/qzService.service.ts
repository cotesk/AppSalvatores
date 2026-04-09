import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { firstValueFrom } from 'rxjs';

declare const qz: any;

@Injectable({ providedIn: 'root' })
export class QzService {

    private urlApi: string = environment.endpoint + "Qz/";

    constructor(private http: HttpClient) {
        // Optional: qz.websocket.connect() lazy cuando haga print
    }

    configurarQz() {

        // CERTIFICADO
        qz.security.setCertificatePromise(() => {
            return this.http
                .get(this.urlApi + "certificate", { responseType: "text" })
                .toPromise(); // Promise nativa
        });


        // FIRMA DIGITAL
        qz.security.setSignaturePromise((toSign: string) => {
            // IMPORTANTE: Siempre devolver una Promise NATIVA
            return new Promise((resolve, reject) => {

                this.http.post<{ signature: string }>(
                    this.urlApi + "sign",
                    { toSign },
                    { responseType: "json" }
                ).toPromise()
                    .then(res => {
                        console.log("Firma generada:", res?.signature);
                        resolve(res?.signature || "");
                    })
                    .catch(err => {
                        console.error("Error firma:", err);
                        reject(err);
                    });

            });
        });


    }




    async connectIfNeeded() {
        if (!qz.websocket || !qz.websocket.isActive()) {
            await qz.websocket.connect();
        }
    }

    // async printHtml(html: string, printerName?: string) {
    //     await this.configureQz();
    //     await this.connectIfNeeded();

    //     const cfg = qz.configs.create(printerName || qz.configs.createDefaultPrinter()); // si no, default
    //     const data = [{
    //         type: 'html',
    //         format: 'plain',
    //         data: html
    //     }];

    //     await qz.print(cfg, data);
    // }
}
