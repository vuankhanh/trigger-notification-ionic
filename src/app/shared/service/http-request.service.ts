import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {

  async testServer(host: string) {
    const url = `${host}`;
    try {
      const response = await CapacitorHttp.get({ url });
      console.log('GET Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('GET Error:', error);
    }
  }
  async postData(host: string, amount: number) {
    const url = `${host}/the-new-payment`;
    try {
      const response = await CapacitorHttp.post({
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          amount
        }
      });
      console.log('POST Response:', response.data);
    } catch (error) {
      console.error('POST Error:', error);
    }
  }
}
