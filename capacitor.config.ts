import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timetablereminder.app',
  appName: 'Timetable Reminder',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notifications',
      iconColor: '#0D9488',
    },
  },
};

export default config;
