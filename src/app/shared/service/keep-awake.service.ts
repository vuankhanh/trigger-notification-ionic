import { Injectable } from '@angular/core';
import { KeepAwake } from '@gachlab/capacitor-keep-awake-plugin';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class KeepAwakeService {
  private allowSleepSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  allowSleep$ = this.allowSleepSubject.asObservable();
  constructor() { }

  allowSleep = async () => {
    const result = await KeepAwake.allowSleep();
    this.allowSleepSubject.next(result.isAllowdSleep);
  }

  dontAllowSleep = async () => {
    const result = await KeepAwake.dontAllowSleep();
    this.allowSleepSubject.next(result.isAllowdSleep);
  };
}
