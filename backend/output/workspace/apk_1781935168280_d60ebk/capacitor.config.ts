import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appweaver.mypwaappviastufflas_d60ebk',
  appName: 'My PWA App (via Stufflas)',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://example.com',
    cleartext: true
  }
};

export default config;
