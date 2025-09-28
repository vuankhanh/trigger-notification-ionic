import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonLabel, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton } from '@ionic/angular/standalone';

//Service
import { SystemNotification } from 'capacitor4-notificationlistener';
import { StorageService } from 'src/app/shared/service/storage.service';
import { AndroidNotificationListenerService } from 'src/app/shared/service/android-notification-listener.service';
import { AndroidForcegroundRunnerService } from 'src/app/shared/service/android-forceground-runner.service';
// import { NetworkService } from 'src/app/shared/service/network.service';
import { KeepAwakeService } from 'src/app/shared/service/keep-awake.service';

//Util
import { StringAnalysisUtil } from 'src/app/shared/utitl/string-analysis.utitl';

//Rxjs
import { BehaviorSubject, distinctUntilChanged, filter, interval, lastValueFrom, map, Observable, Subscription, switchMap, take, tap } from 'rxjs';
import { NotificationConfigurationPage } from 'src/app/shared/page/home/notification-configuration/notification-configuration.page';
import { INotificatonConfiguration } from 'src/app/shared/interface/notificaton-configuration.interface';
import { HttpRequestService } from 'src/app/shared/service/http-request.service';

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
  private readonly allowAwakeService: KeepAwakeService = inject(KeepAwakeService);
  private readonly androidNotificationListenerService: AndroidNotificationListenerService = inject(AndroidNotificationListenerService);
  private readonly androidForcegroundRunnerService: AndroidForcegroundRunnerService = inject(AndroidForcegroundRunnerService);
  private readonly httpRequestService: HttpRequestService = inject(HttpRequestService);
  private readonly modalCtrl: ModalController = inject(ModalController);

  forcegroundServiceStatus$: Observable<boolean> = this.androidForcegroundRunnerService.forcegroundServiceStatus$;
  notificationPackage$: BehaviorSubject<string | 'all' | null> = new BehaviorSubject<string | 'all' | null>('all');

  isAllowSleep$: Observable<boolean> = this.allowAwakeService.allowSleep$;

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
    try {
      const forcegroundServiceStatusPromise: Promise<boolean> = lastValueFrom(this.forcegroundServiceStatus$.pipe(
        take(1)
      ));

      const forcegroundServiceStatus = await forcegroundServiceStatusPromise;
      if (!forcegroundServiceStatus) {
        await this.startForcegroundService();
      };
    } catch (error) {
      console.error('Error in ionViewDidEnter:', error);
    }
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
      this.notifications$.subscribe(async (notification) => {
        this.notifications.push(notification);
        this.notifications = [...this.notifications];
        this.cdr.detectChanges();

        console.log(`Notification: ${JSON.stringify(notification)}`);

        const notificationText = notification.text;
        const allAmounts = StringAnalysisUtil.extractMonetaryAmounts(notificationText);
        const convertToIntegers = StringAnalysisUtil.convertToIntegers(allAmounts);
        
        if (convertToIntegers.length === 0) return;
        const amount = convertToIntegers[0];
        this.httpRequestService.postData('http://192.168.1.5:3100', amount);

      })
    )
  }

  testServer(){
    this.subscription.add(
      interval(10000).subscribe(async() => {
        await this.httpRequestService.testServer('http://192.168.1.5:3100')
      })
    )
  }

  async startForcegroundService() {
    await this.androidForcegroundRunnerService.checkPermissionAndRequestIfNotGranted();
    await this.androidForcegroundRunnerService.createNotificationChannel();
    await this.androidForcegroundRunnerService.startForegroundService();
    await this.checkPackageStorage();
    this.checkPermissionsAndStartListening();
    this.listenNotification();
    this.testServer();
  }

  async stopForcegroundService() {
    await this.androidForcegroundRunnerService.stopForegroundService();
    this.subscription.unsubscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
