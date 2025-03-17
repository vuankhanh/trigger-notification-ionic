import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { homeOutline, homeSharp, settingsOutline, settingsSharp } from 'ionicons/icons';
import { SocketService, socketStatusMessages } from './shared/service/socket.service';
import { StorageService } from './shared/service/storage.service';

import { BehaviorSubject, map } from 'rxjs';
import { NetworkAdress, ServerConfiguration } from './shared/interface/server-configuration.interface';
import { ServerConfigurationComponent } from './shared/component/server-configuration/server-configuration.component';
import { IonItem, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonIcon, IonLabel, IonFooter, IonButton, IonRouterOutlet } from "@ionic/angular/standalone";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,

    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonMenuToggle,
    IonIcon,
    IonLabel,
    IonFooter,
    IonButton,
    IonItem,
    IonRouterOutlet,

    ServerConfigurationComponent
]
})
export class AppComponent implements OnInit {
  private readonly socketService: SocketService = inject(SocketService);
  private readonly storageService: StorageService = inject(StorageService);

  private readonly serverAddressSubject: BehaviorSubject<NetworkAdress | null> = new BehaviorSubject<NetworkAdress | null>(null);
  serverAddress$ = this.serverAddressSubject.asObservable();

  socketStatus$ = this.socketService.socketStatus$.pipe(
    map((status) => socketStatusMessages[status])
  );
  
  appPages = [
    { title: 'Trang chủ', url: '/home', icon: 'home' },
    { title: 'Cấu hình', url: '/configuration', icon: 'settings' },
  ];

  constructor() {
    addIcons({ homeOutline, homeSharp, settingsOutline, settingsSharp });
  }

  ngOnInit(): void {
    this.setServerAddress();
    // this.socketService.connect();
    this.serverAddress$.subscribe((serverAddress) => {
      if (serverAddress){
        this.socketService.setServerAddress(serverAddress);
      }
    });
  }

  private async setServerAddress() {
    const serverConfiguration = await this.getServerConfigurationStorage();
    if (serverConfiguration) {
      this.serverAddressSubject.next(serverConfiguration.address);
    }
  }

  private async getServerConfigurationStorage(): Promise<ServerConfiguration | null> {
    const serverConfigurationStorage = await this.storageService.getItem('serverConfiguration');
    if (serverConfigurationStorage) {
      try {
        return JSON.parse(serverConfigurationStorage) as ServerConfiguration;
      } catch (error) {
        console.error('Error parsing server configuration:', error);
        return null;
      }
    }else {
      return null;
    }
  }

  handleServerAddress(serverAddress: NetworkAdress) {
    this.serverAddressSubject.next(serverAddress);
    this.updateServerConfiguration({ address: serverAddress });
  }

  async updateServerConfiguration(newConfig: Partial<ServerConfiguration>) {
    let serverAddress = await this.getServerConfigurationStorage();
    console.log(serverAddress);
    
    if(serverAddress) {
      serverAddress = {
        ...serverAddress,
        ...newConfig
      };
    }else{
      serverAddress = newConfig as ServerConfiguration;
    }
    await this.storageService.setItem('serverConfiguration', JSON.stringify(serverAddress));
  }

  resetServerAddress(){
    this.serverAddressSubject.next(null);
  }
}
