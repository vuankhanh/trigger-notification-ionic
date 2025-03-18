import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NetworkAdress, ServerConfiguration } from '../interface/server-configuration.interface';
import { StorageService } from './storage.service';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private socketStatusSubject: BehaviorSubject<TSocketEvent> = new BehaviorSubject<TSocketEvent>(EnumSocketEvent.Disconnect);
  public socketStatus$: Observable<TSocketEvent> = this.socketStatusSubject.asObservable();
  constructor() { }

  setServerAddress({ protocol, ipOrDomain, port = 80 }: NetworkAdress): void {
    this.disconnect();

    const serverAddress = `${protocol}://${ipOrDomain}:${port}`;
    this.socket = io(serverAddress, {
      transports: ['websocket']
    });
    this.connect();
  }

  private connect(): void {
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

@Injectable({
  providedIn: 'root'
})
export class ServerConfigurationStorageService {
  private readonly storageService: StorageService = inject(StorageService);
  
  async getServerConfigurationStorage(): Promise<ServerConfiguration | null> {
    const serverConfigurationStorage = await this.storageService.getItem('serverConfiguration');
    if (serverConfigurationStorage) {
      try {
        return JSON.parse(serverConfigurationStorage) as ServerConfiguration;
      } catch (error) {
        console.error('Error parsing server configuration:', error);
        return null;
      }
    } else {
      return null;
    }
  }

  async updateServerConfiguration(newConfig: Partial<ServerConfiguration>) {
    let serverAddress = await this.getServerConfigurationStorage();
    console.log(serverAddress);
    
    if(serverAddress) {
      serverAddress = {
        ...serverAddress,
        ...newConfig
      };
    }else{
      serverAddress = newConfig as ServerConfiguration;
    }
    await this.storageService.setItem('serverConfiguration', JSON.stringify(serverAddress));
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