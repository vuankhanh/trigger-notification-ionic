import { Injectable } from '@angular/core';
import { ForegroundService, Importance } from '@capawesome-team/capacitor-android-foreground-service';

@Injectable({
  providedIn: 'root'
})
export class AndroidBackgroundRunnerService {

  startForegroundService = async () => {
    await ForegroundService.startForegroundService({
      id: 1,
      title: 'Title',
      body: 'Body',
      smallIcon: 'ic_stat_icon_config_sample',
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
  };
  
  updateForegroundService = async () => {
    await ForegroundService.updateForegroundService({
      id: 1,
      title: 'Title',
      body: 'Body',
      smallIcon: 'ic_stat_icon_config_sample',
    });
  };
  
  stopForegroundService = async () => {
    await ForegroundService.stopForegroundService();
  };
  
  createNotificationChannel = async () => {
    await ForegroundService.createNotificationChannel({
      id: 'default',
      name: 'Default',
      description: 'Default channel',
      importance: Importance.Default,
    });
  };
  
  deleteNotificationChannel = async () => {
    await ForegroundService.deleteNotificationChannel({
      id: 'default',
    });
  };
}
