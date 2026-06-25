import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.mbig_iexsab',
  appName: 'Mbig',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://mbig.in/',
    cleartext: true
  }
};

export default config;
