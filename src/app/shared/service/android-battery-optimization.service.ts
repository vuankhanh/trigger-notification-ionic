import { Injectable } from '@angular/core';
import { BatteryOptimization } from '@capawesome-team/capacitor-android-battery-optimization';

@Injectable({
  providedIn: 'root'
})
export class AndroidBatteryOptimizationService {
  isBatteryOptimizationEnabled = async () => {
    const { enabled } = await BatteryOptimization.isBatteryOptimizationEnabled();
    return enabled;
  };
  
  openBatteryOptimizationSettings = async () => {
    await BatteryOptimization.openBatteryOptimizationSettings();
  };
  
  requestIgnoreBatteryOptimization = async () => {
    await BatteryOptimization.requestIgnoreBatteryOptimization();
  };
}
