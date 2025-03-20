import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NetworkAdress, ServerConfiguration } from '../interface/server-configuration.interface';
import { StorageService } from './storage.service';
import { DatePipe } from '@angular/common';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private socketStatusSubject: BehaviorSubject<TSocketEvent> = new BehaviorSubject<TSocketEvent>(EnumSocketEvent.Disconnect);
  public socketStatus$: Observable<TSocketEvent> = this.socketStatusSubject.asObservable();

  private readonly datePipe: DatePipe = inject(DatePipe);
  private destroy$: Subject<void> = new Subject<void>(); // Subject để dừng luồng RxJS
  constructor() { }

  get socketStatus(): TSocketEvent {
    return this.socketStatusSubject.getValue();
  }

  setServerAddress({ protocol, ipOrDomain, port = 80 }: NetworkAdress): void {
    const serverAddress = `${protocol}://${ipOrDomain}:${port}`;
    this.socket = io(serverAddress, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    this.connect();

    // Bắt đầu gửi ping mỗi 2 phút
    this.startPing();
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

    // Lắng nghe sự kiện 'pong' từ server
    this.socket.on('pong', (time: string) => {
      console.log('Pong received from server:', time);
    });
  }

  private startPing(): void {
    interval(10000) // Phát sự kiện mỗi 2 phút (120000ms)
      .pipe(takeUntil(this.destroy$)) // Dừng luồng khi nhận tín hiệu từ `destroy$`
      .subscribe(() => {
        if (this.socket && this.socket.connected) {
          const time = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
          this.socket.emit('ping', time);
          console.log(`Ping sent to server ${time}`);
        }
      });
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Gửi tín hiệu để dừng tất cả các luồng RxJS
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  private listen(event: string): Observable<any> {
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
  private readonly serverAddressSubject: BehaviorSubject<NetworkAdress | null> = new BehaviorSubject<NetworkAdress | null>(null);
  serverAddress$ = this.serverAddressSubject.asObservable();
  private readonly storageService: StorageService = inject(StorageService);

  get serverAddress(): NetworkAdress | null {
    return this.serverAddressSubject.getValue();
  }

  set serverAddress(serverAddress: NetworkAdress | null) {
    this.serverAddressSubject.next(serverAddress);
  }

  async getServerConfigurationStorage(): Promise<ServerConfiguration | null> {
    const serverConfigurationStorage = await this.storageService.getItem('serverConfiguration');
    let serverAddress: ServerConfiguration | null = null;
    if (serverConfigurationStorage) {
      try {
        serverAddress = JSON.parse(serverConfigurationStorage) as ServerConfiguration;
        this.serverAddressSubject.next(serverAddress.address);
        return serverAddress;
      } catch (error) {
        console.error('Error parsing server configuration:', error);
        serverAddress = null;
        this.serverAddressSubject.next(null);
        return null;
      }
    } else {
      serverAddress = null;
      this.serverAddressSubject.next(null);
      return null;
    }
  }

  async updateServerConfiguration(newConfig: Partial<ServerConfiguration>) {
    let serverAddress = await this.getServerConfigurationStorage();
    console.log(serverAddress);

    if (serverAddress) {
      serverAddress = {
        ...serverAddress,
        ...newConfig
      };
    } else {
      serverAddress = newConfig as ServerConfiguration;
    }
    await this.storageService.setItem('serverConfiguration', JSON.stringify(serverAddress));
  }
}

export const enum EnumSocketEvent {
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