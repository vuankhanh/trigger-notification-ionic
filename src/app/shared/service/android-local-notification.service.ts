import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class AndroidLocalNotificationService {

  constructor() { }

  checkPermissionsAndRequestIfNotGranted = async () => {
    const permission = await LocalNotifications.requestPermissions();
    if (!permission) {
      await LocalNotifications.requestPermissions();
    }
  };
}
