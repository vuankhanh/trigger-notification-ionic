import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { IonApp, IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';

import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { SystemNotification, SystemNotificationListener } from 'capacitor4-notificationlistener';
import { CommonModule } from '@angular/common';
const sn = new SystemNotificationListener();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonLabel, 
    IonToolbar,
    IonHeader,
    IonApp,
    IonContent,
    IonTitle,
    IonList,
    IonItem,
    IonLabel
],
})
export class AppComponent implements OnInit {
  notifications: SystemNotification[] = [];
  notificationListener!: PluginListenerHandle;
  notificationRemovedListener!: PluginListenerHandle;

  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  constructor() {}

  ngOnInit() {
    this.checkPermissionsAndStartListening();
  }

  async checkPermissionsAndStartListening() {
    const isListening = await sn.isListening();
    if (!isListening) {
      await sn.requestPermission();
    }
    this.startListening();
  }

  async startListening() {
    await sn.startListening();

    this.notificationListener = sn.addListener('notificationReceivedEvent', (notification: SystemNotification) => {
      this.notifications.push(notification);
      this.cdr.detectChanges();
      console.log('Notification received:', notification);
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
