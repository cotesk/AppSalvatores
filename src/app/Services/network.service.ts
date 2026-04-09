import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  isSlowConnection(): boolean {
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (!connection) return false;

    return connection.effectiveType === '2g' ||
           connection.effectiveType === 'slow-2g' ||
           connection.downlink < 1;
  }
}
