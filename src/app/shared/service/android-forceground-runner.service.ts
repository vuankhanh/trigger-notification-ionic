import { inject, Injectable } from '@angular/core';
import { ButtonClickedEvent, ForegroundService, Importance } from '@capawesome-team/capacitor-android-foreground-service';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { AndroidLocalNotificationService } from './android-local-notification.service';
import { EnumSocketEvent, SocketService, TSocketEvent } from './socket.service';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AndroidForcegroundRunnerService {
  private readonly socketService: SocketService = inject(SocketService);
  private readonly androidLocalNotificationService: AndroidLocalNotificationService = inject(AndroidLocalNotificationService);

  private readonly forcegroundServiceStatusSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  forcegroundServiceStatus$ = this.forcegroundServiceStatusSubject.asObservable();

  checkPermissionAndRequestIfNotGranted = async () => {
    await this.androidLocalNotificationService.checkPermissionsAndRequestIfNotGranted();
    const permission = await ForegroundService.checkPermissions();
    if (!permission) {
      await ForegroundService.requestPermissions();
    }
  }

  startForegroundService = async (socketStatus: string) => {
    if (!this.forcegroundServiceStatusSubject.value) {
      console.log('Starting Foreground Service...');
      await ForegroundService.startForegroundService({
        id: 1,
        title: 'Dịch vụ Trigger Notification',
        body: `Trạng thái kết nối: ${socketStatus}`,
        smallIcon: 'ic_hardware',
        silent: false,
        notificationChannelId: 'default',
      });
      // Giữ thiết bị hoạt động
      await KeepAwake.keepAwake();
      this.forcegroundServiceStatusSubject.next(true);
      console.log('Foreground Service started.');
    } else {
      console.log('Foreground Service is already running...');
      return;
    }
  };

  updateForcegroundBodyNotification = async (socketStatus: string) => {
    await ForegroundService.updateForegroundService({
      id: 1,
        title: 'Dịch vụ Trigger Notification',
        body: `Trạng thái kết nối: ${socketStatus}`,
        smallIcon: 'ic_hardware',
        silent: false,
        notificationChannelId: 'default',
    });
  };
  
  stopForegroundService = async () => {
    if (this.forcegroundServiceStatusSubject.value) {
      await ForegroundService.stopForegroundService();
      // Tắt chế độ giữ thiết bị hoạt động
      await KeepAwake.allowSleep();
      this.forcegroundServiceStatusSubject.next(false);
      console.log('Foreground Service stopped.');
    } else {
      console.log('Foreground Service is not running.');
    }
  };
  
  createNotificationChannel = async () => {
    await ForegroundService.createNotificationChannel({
      id: 'default',
      name: 'Default',
      description: 'Default channel',
      importance: Importance.High,
    });
  };
  
  deleteNotificationChannel = async () => {
    await ForegroundService.deleteNotificationChannel({
      id: 'default',
    });
  };
}
