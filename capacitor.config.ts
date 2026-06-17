import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dalelogo.pokedex',
  appName: 'PokéDex',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    StatusBar: { style: 'DARK', backgroundColor: '#CC0000' },
  },
};

export default config;
