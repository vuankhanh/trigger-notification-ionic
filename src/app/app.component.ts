import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { homeOutline, homeSharp, settingsOutline, settingsSharp } from 'ionicons/icons';
import { ServerConfigurationStorageService, SocketService, socketStatusMessages } from './shared/service/socket.service';

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
  ],

})
export class AppComponent implements OnInit {
  private readonly socketService: SocketService = inject(SocketService);
  private readonly serverConfigurationStorageService: ServerConfigurationStorageService = inject(ServerConfigurationStorageService);

  serverAddress$ = this.serverConfigurationStorageService.serverAddress$

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

  }

  handleServerAddress(serverAddress: NetworkAdress) {
    this.serverConfigurationStorageService.updateServerConfiguration({ address: serverAddress });
    this.serverConfigurationStorageService.serverAddress = serverAddress;
    this.socketService.setServerAddress(serverAddress);
  }

  resetServerAddress(){
    this.serverConfigurationStorageService.serverAddress = null;
  }
}
