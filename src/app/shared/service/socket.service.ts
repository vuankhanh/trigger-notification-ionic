import { inject, Injectable } from '@angular/core';
import { SystemNotification } from 'capacitor4-notificationlistener';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  constructor(
    private mySocket: MySocket
  ) { }

  emitNewPayment(payment: SystemNotification) {
    this.mySocket.emit('the-new-payment', payment);
  }

  get listenSocketReconnect$(): Observable<string> {
    return this.mySocket.socketEvent$
  }
}

@Injectable({
  providedIn: SocketService
})
export class MySocket {
  private socket!: Socket;
  constructor() {
    this.connect();
  }

  connect() {
    try {
      this.socket = io(environment.backend);
    } catch (error) {
      console.error('Error connecting to socket', error);
    }
  }

  get socketEvent$(): Observable<string> {
    return new Observable((subscriber) => {
      let isConnected = false;
      this.socket.on('connect', () => {
        console.log(isConnected);
        if (isConnected) {
          subscriber.next('reconnect');
        } else {
          subscriber.next('connect');
        }
        isConnected = true;
      });

      this.socket.on('disconnect', () => {
        subscriber.next('disconnect');
      });
    });
  }

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }
}