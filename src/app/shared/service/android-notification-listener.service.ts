import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { SystemNotification, SystemNotificationListener } from 'capacitor4-notificationlistener';
import { BehaviorSubject } from 'rxjs';
const sn = new SystemNotificationListener();

@Injectable({
  providedIn: 'root'
})
export class AndroidNotificationListenerService {
  notifications$: BehaviorSubject<SystemNotification> = new BehaviorSubject<SystemNotification>(null as any);

  private notificationListener!: PluginListenerHandle;
  private notificationRemovedListener!: PluginListenerHandle;

  async checkPermissionsAndStartListening() {
    const isListening = await sn.isListening();
    console.log('isListening', isListening);
    if (!isListening) {
      await sn.requestPermission();
    }
    await this.startListening();
  }

  async startListening() {
    await sn.startListening();

    this.notificationListener = sn.addListener('notificationReceivedEvent', (notification: SystemNotification) => {
      console.log('Notification received:', notification);
      this.notifications$.next(notification);
    });

    this.notificationRemovedListener = sn.addListener('notificationRemovedEvent', (notification: SystemNotification) => {
      console.log('Notification removed:', notification);
      // You can add logic here to remove the notification from the list if needed
    });
  }

  async stopListening() {
    await sn.stopListening();
    if (this.notificationListener) {
      this.notificationListener.remove();
    }

    if (this.notificationRemovedListener) {
      this.notificationRemovedListener.remove();
    }
  }
}
