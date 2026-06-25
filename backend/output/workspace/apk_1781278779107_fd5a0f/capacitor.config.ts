import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.mbig_fd5a0f',
  appName: 'Mbig',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://mbig.in/',
    cleartext: true
  }
};

export default config;
