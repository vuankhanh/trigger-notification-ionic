import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Platform, ModalController, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonLabel, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton } from '@ionic/angular/standalone';

//Service
import { SystemNotification } from 'capacitor4-notificationlistener';
import { StorageService } from 'src/app/shared/service/storage.service';
import { AndroidNotificationListenerService } from 'src/app/shared/service/android-notification-listener.service';
import { AndroidForcegroundRunnerService } from 'src/app/shared/service/android-forceground-runner.service';
import { SocketService, socketStatusMessages } from 'src/app/shared/service/socket.service';

//Util
import { StringAnalysisUtil } from 'src/app/shared/utitl/string-analysis.utitl';

//Rxjs
import { BehaviorSubject, distinctUntilChanged, filter, lastValueFrom, map, Observable, of, Subscription, switchMap, take, tap } from 'rxjs';
import { NotificationConfigurationPage } from 'src/app/shared/page/home/notification-configuration/notification-configuration.page';
import { INotificatonConfiguration } from 'src/app/shared/interface/notificaton-configuration.interface';

// Hàm so sánh tùy chỉnh để so sánh hai đối tượng
const compareObjects = (prev: any, curr: any) => {
  return JSON.stringify(prev) === JSON.stringify(curr);
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,

    IonHeader,
    IonButton,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonItem,
    IonLabel,
    IonListHeader,
    IonList,
    IonContent,
    IonTitle,
    IonToolbar,

  ],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly storageService: StorageService = inject(StorageService);
  private readonly socketService: SocketService = inject(SocketService);
  private readonly androidNotificationListenerService: AndroidNotificationListenerService = inject(AndroidNotificationListenerService);
  private readonly androidForcegroundRunnerService: AndroidForcegroundRunnerService = inject(AndroidForcegroundRunnerService);
  private readonly platform: Platform = inject(Platform);

  private readonly modalCtrl: ModalController = inject(ModalController);

  forcegroundServiceStatus$: Observable<boolean> = this.androidForcegroundRunnerService.forcegroundServiceStatus$;
  notificationPackage$: BehaviorSubject<string | 'all' | null> = new BehaviorSubject<string | 'all' | null>('all');

  private socketStatus$ = this.socketService.socketStatus$.pipe(
    map((status) => socketStatusMessages[status]),
    distinctUntilChanged()
  );

  private socketChangedAfterForcegroundServiceStart$: Observable<string> = this.socketStatus$.pipe(
    switchMap((status) => this.androidForcegroundRunnerService.forcegroundServiceStatus$.pipe(
      filter((status) => !!status),
      map(() => status)
    ))
  );

  private readonly notifications$: Observable<SystemNotification> = this.androidNotificationListenerService.notifications$.pipe(
    filter((notification) => !!notification),
    distinctUntilChanged(compareObjects),
    //Filter value thêm notificationPackage$ để lọc ra thông báo từ ứng dụng cần
    switchMap(notification => this.notificationPackage$.pipe(
      tap((notificationPackage) => console.log('Notification:', notificationPackage)),
      filter(notificationPackage => notificationPackage != null),
      filter(notificationPackage => {
        if (notificationPackage === 'all') {
          return true;
        } else {
          return notification.package === notificationPackage
        }
      }),
      map(() => notification)
    ))
  );

  notifications: SystemNotification[] = [];

  private readonly subscription: Subscription = new Subscription();

  async ngOnInit() { }

  async ionViewDidEnter() {
    const forcegroundServiceStatusPromise: Promise<boolean> = lastValueFrom(this.forcegroundServiceStatus$.pipe(
      take(1)
    ));
    const forcegroundServiceStatus = await forcegroundServiceStatusPromise;
    if (!forcegroundServiceStatus) {
      await this.startForcegroundService();
      this.listenOnSocketStatusAfterForcegroundServiceStart();
    };
  }

  private async checkPackageStorage() {
    const packageStorage = await this.storageService.getItem('notificationPackage');
    console.log('Package storage:', packageStorage);

    if (packageStorage) {
      this.notificationPackage$.next(packageStorage);
    } else {
      const modal = await this.modalCtrl.create({
        component: NotificationConfigurationPage,
        componentProps: {
          data: {
            notificationPackage: packageStorage
          }
        }
      });
      modal.present();

      const dataWillDismiss = await modal.onWillDismiss();

      const notificatonConfiguration: INotificatonConfiguration = dataWillDismiss.data;
      const role: 'confirm' | 'cancel' = dataWillDismiss.role as 'confirm' | 'cancel';
      if (role === 'confirm') {
        let packageName = notificatonConfiguration.packageName;
        if (packageName === '') packageName = 'all';
        this.notificationPackage$.next(packageName);
        await this.storageService.setItem('notificationPackage', packageName);
      }
    }
  }

  private async checkPermissionsAndStartListening() {
    await this.androidNotificationListenerService.checkPermissionsAndStartListening();
  }

  private listenNotification() {
    this.subscription.add(
      this.notifications$.subscribe((notification) => {
        this.notifications.push(notification);
        this.notifications = [...this.notifications];
        this.cdr.detectChanges();

        const notificationText = notification.text;
        const allAmounts = StringAnalysisUtil.extractMonetaryAmounts(notificationText);
        const convertToIntegers = StringAnalysisUtil.convertToIntegers(allAmounts);

        if (convertToIntegers.length === 0) return;
        const amount = convertToIntegers[0];
        this.socketService.sendMessage('the-new-payment', { amount });
      })
    )
  }

  async startForcegroundService() {
    const socketStatusPromise: Promise<string> = lastValueFrom(this.socketStatus$.pipe(take(1)));
    const status = await socketStatusPromise;
    await this.androidForcegroundRunnerService.checkPermissionAndRequestIfNotGranted();
    await this.androidForcegroundRunnerService.createNotificationChannel();
    await this.androidForcegroundRunnerService.startForegroundService(status);
    const isAndroid = this.platform.is('android');
    await this.checkPackageStorage();
    if (isAndroid) this.checkPermissionsAndStartListening();
    this.listenNotification();
  }

  async stopForcegroundService() {
    await this.androidForcegroundRunnerService.stopForegroundService();
    this.subscription.unsubscribe();
  }

  private listenOnSocketStatusAfterForcegroundServiceStart() {
    this.subscription.add(
      this.socketChangedAfterForcegroundServiceStart$.subscribe((status) => {
       this.androidForcegroundRunnerService.updateForcegroundBodyNotification(status);
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
