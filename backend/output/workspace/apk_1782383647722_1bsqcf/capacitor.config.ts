import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.myawesomeapp_1bsqcf',
  appName: 'My Awesome App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://en.wikipedia.org/wiki/Mobile_app',
    cleartext: true
  }
};

export default config;
