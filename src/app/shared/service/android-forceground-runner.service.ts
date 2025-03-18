import { inject, Injectable } from '@angular/core';
import { ForegroundService, Importance } from '@capawesome-team/capacitor-android-foreground-service';
import { BehaviorSubject } from 'rxjs';
import { AndroidLocalNotificationService } from './android-local-notification.service';

@Injectable({
  providedIn: 'root'
})
export class AndroidForcegroundRunnerService {
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

  startForegroundService = async () => {
    if (!this.forcegroundServiceStatusSubject.value) {
      console.log('Starting Foreground Service...');
      await ForegroundService.startForegroundService({
        id: 1,
        title: 'Dịch vụ Trigger Notification',
        body: 'Dịch vụ đang được chạy trong Forceground',
        smallIcon: 'ic_hardware',
        buttons: [
          {
            title: 'Button 1',
            id: 1,
          },
          {
            title: 'Button 2',
            id: 2,
          },
        ],
        silent: false,
        notificationChannelId: 'default',
      });
      this.forcegroundServiceStatusSubject.next(true);
      console.log('Foreground Service started.');
    } else {
      console.log('Foreground Service is already running...');
      return;
    }
  };
  
  // updateForegroundService = async () => {
  //   await ForegroundService.updateForegroundService({
  //     id: 1,
  //     title: 'Title',
  //     body: 'Body',
  //     smallIcon: 'ic_hardware',
  //   });
  // };
  
  stopForegroundService = async () => {
    if (this.forcegroundServiceStatusSubject.value) {
      await ForegroundService.stopForegroundService();
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
