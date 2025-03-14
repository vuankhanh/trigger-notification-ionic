import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { IonApp, IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { SystemNotification } from 'capacitor4-notificationlistener';
import { CommonModule } from '@angular/common';
// import { SocketService } from './shared/service/socket.service';
import { AndroidNotificationListenerService } from './shared/service/android-notification-listener.service';
import { AndroidBackgroundRunnerService } from './shared/service/android-background-runner.service';
import { distinctUntilChanged, filter, Observable } from 'rxjs';

// Hàm so sánh tùy chỉnh để so sánh hai đối tượng
const compareObjects = (prev: any, curr: any) => {
  return JSON.stringify(prev) === JSON.stringify(curr);
};

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
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  // private readonly socketService: SocketService = inject(SocketService);
  private readonly androidNotificationListenerService: AndroidNotificationListenerService = inject(AndroidNotificationListenerService);
  // private readonly androidBackgroundRunnerService: AndroidBackgroundRunnerService = inject(AndroidBackgroundRunnerService);
  private readonly platform: Platform = inject(Platform);

  notifications$: Observable<SystemNotification> = this.androidNotificationListenerService.notifications$.pipe(
    filter((notification) => !!notification),
    distinctUntilChanged(compareObjects),
  );

  notifications: SystemNotification[] = [];

  ngOnInit() {
    const isAndroid = this.platform.is('android');
    if(isAndroid) this.checkPermissionsAndStartListening();
  }

  async checkPermissionsAndStartListening() {
    this.androidNotificationListenerService.checkPermissionsAndStartListening();
    this.notifications$.subscribe((notification) => {
      this.notifications.push(notification);
      this.notifications = [...this.notifications];
      console.log('Notifications:', this.notifications);
      
      this.cdr.detectChanges();
    });
  }
}
