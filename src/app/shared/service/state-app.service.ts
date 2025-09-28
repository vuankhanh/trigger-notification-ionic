import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class StateAppService {
  
  constructor() {}

  ionViewDidEnter() {
    this.appListener();
  }
  
  private appListener() {
    App.addListener('appStateChange', (state) => {
      console.log('App state changed. Is active?', state.isActive);
    });
  }
}
