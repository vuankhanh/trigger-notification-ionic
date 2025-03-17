import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { NetworkAdress } from '../interface/server-configuration.interface';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private socketStatusSubject: BehaviorSubject<TSocketEvent> = new BehaviorSubject<TSocketEvent>(EnumSocketEvent.Disconnect);
  public socketStatus$: Observable<TSocketEvent> = this.socketStatusSubject.asObservable();
  constructor() { }

  setServerAddress({ protocol, ipOrDomain, port = 80 }: NetworkAdress): void {

    const serverAddress = `${protocol}://${ipOrDomain}:${port}`;

    this.socket = io(serverAddress, {
      transports: ['websocket'],
      withCredentials: true
    });
  }

  connect(): void {
    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        this.socketStatusSubject.next(EnumSocketEvent.Connect);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        this.socketStatusSubject.next(EnumSocketEvent.Disconnect);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.socketStatusSubject.next(EnumSocketEvent.ConnectError);
      });

      this.socket.on('connect_timeout', (timeout) => {
        console.error('Socket.IO connection timeout:', timeout);
        this.socketStatusSubject.next(EnumSocketEvent.ConnectTimeout);
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        this.socketStatusSubject.next(EnumSocketEvent.Error);
      });

      this.socket.on('reconnect_attempt', () => {
        console.log('Socket.IO reconnect attempt');
        this.socketStatusSubject.next(EnumSocketEvent.ReconnectAttempt);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Socket.IO reconnect failed');
        this.socketStatusSubject.next(EnumSocketEvent.ReconnectFailed);
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendMessage(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  listen(event: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(event, (data) => {
        observer.next(data);
      });
    });
  }
}

const enum EnumSocketEvent {
  Connect = 'connect',
  Disconnect = 'disconnect',
  ConnectError = 'connect_error',
  ConnectTimeout = 'connect_timeout',
  Error = 'error',
  ReconnectAttempt = 'reconnect_attempt',
  ReconnectFailed = 'reconnect_failed'
}

export const socketStatusMessages: { [key in TSocketEvent]: string } = {
  [EnumSocketEvent.Connect]: 'Đã kết nối',
  [EnumSocketEvent.Disconnect]: 'Ngắt kết nối',
  [EnumSocketEvent.ConnectError]: 'Lỗi kết nối',
  [EnumSocketEvent.ConnectTimeout]: 'Hết thời gian kết nối',
  [EnumSocketEvent.Error]: 'Lỗi',
  [EnumSocketEvent.ReconnectAttempt]: 'Thử kết nối lại',
  [EnumSocketEvent.ReconnectFailed]: 'Kết nối lại thất bại'
};

export type TSocketEvent = `${EnumSocketEvent}`;