import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.myawesomeapp_ajvy9a',
  appName: 'My Awesome App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://mbig.in/',
    cleartext: true
  }
};

export default config;
