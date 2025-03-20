import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  constructor() { }

  async listentNetworkStatus() {
    await Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed', status.connectionType);
      console.log('Is connected?', status.connected);
    });
  }

  async getNetworkStatus() {
    const status = await Network.getStatus();
    return status;
  }
}
