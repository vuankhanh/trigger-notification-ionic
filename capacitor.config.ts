import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'trigger-notification-ionic',
  webDir: 'www',
  server: {
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
