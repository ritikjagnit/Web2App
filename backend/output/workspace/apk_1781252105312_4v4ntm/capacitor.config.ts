import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.testgoogleapp_4v4ntm',
  appName: 'Test Google App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://google.com',
    cleartext: true
  }
};

export default config;
