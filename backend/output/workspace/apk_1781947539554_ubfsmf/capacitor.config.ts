import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.lol_ubfsmf',
  appName: 'lol',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://mbig.in/',
    cleartext: true
  }
};

export default config;
