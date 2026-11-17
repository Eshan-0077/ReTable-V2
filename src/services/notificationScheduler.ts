import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { AppSettings, ScheduledReminder, TimetableMap } from '../types/timetable';
import { buildNotificationPlan } from '../utils/timetableLogic';

export const CLASS_REMINDERS_CHANNEL_ID = 'class-reminders';
export const CLASS_REMINDERS_CHANNEL_NAME = 'Class reminders';

export type PermissionStatusKind = 'granted' | 'denied' | 'prompt' | 'unsupported';
export type ExactAlarmStatusKind = 'granted' | 'denied' | 'not-applicable';

export interface NotificationPermissionState {
  isNativeAndroid: boolean;
  notifications: PermissionStatusKind;
  exactAlarm: ExactAlarmStatusKind;
}

const activeWebTimers: number[] = [];

function clearWebTimers(): void {
  while (activeWebTimers.length > 0) {
    const id = activeWebTimers.pop();
    if (id !== undefined) {
      window.clearTimeout(id);
    }
  }
}

export async function getPermissionState(): Promise<NotificationPermissionState> {
  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      let notifications: PermissionStatusKind = 'prompt';
      if (perm.display === 'granted') notifications = 'granted';
      else if (perm.display === 'denied') notifications = 'denied';

      let exactAlarm: ExactAlarmStatusKind = 'not-applicable';
      if (isNativeAndroid) {
        try {
          const exact = await LocalNotifications.checkExactNotificationSetting();
          exactAlarm = exact.exact_alarm === 'granted' ? 'granted' : 'denied';
        } catch {
          exactAlarm = 'not-applicable';
        }
      }

      return { isNativeAndroid, notifications, exactAlarm };
    } catch {
      return { isNativeAndroid, notifications: 'prompt', exactAlarm: 'not-applicable' };
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      isNativeAndroid: false,
      notifications: 'unsupported',
      exactAlarm: 'not-applicable',
    };
  }

  const webPerm = Notification.permission;
  const notifications: PermissionStatusKind =
    webPerm === 'granted' ? 'granted' : webPerm === 'denied' ? 'denied' : 'prompt';

  return {
    isNativeAndroid: false,
    notifications,
    exactAlarm: 'not-applicable',
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.requestPermissions();
    } catch {
      // Handled by state check below
    }
    return getPermissionState();
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission rejection error
    }
  }
  return getPermissionState();
}

export async function openExactAlarmSettings(): Promise<NotificationPermissionState> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.changeExactNotificationSetting();
    } catch {
      // Device may not support exact alarm intent
    }
  }
  return getPermissionState();
}

async function ensureAndroidChannel(settings: AppSettings): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }
  try {
    await LocalNotifications.createChannel({
      id: CLASS_REMINDERS_CHANNEL_ID,
      name: CLASS_REMINDERS_CHANNEL_NAME,
      description: 'Pre-class reminders and morning schedule summaries',
      importance: 4,
      visibility: 1,
      sound: settings.soundEnabled ? 'default' : undefined,
      vibration: settings.vibrationEnabled,
    });
  } catch {
    // Channel creation can fail on older webviews
  }
}

async function fireWebNotification(title: string, body: string, onNavigateToday?: () => void): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          tag: `timetable-${Date.now()}`,
          data: { route: 'today' },
        });
        return;
      }
    }
  } catch {
    // Fallback to Notification constructor
  }

  const notif = new Notification(title, { body });
  notif.onclick = () => {
    window.focus();
    onNavigateToday?.();
    notif.close();
  };
}

export async function syncScheduledNotifications(
  timetable: TimetableMap,
  settings: AppSettings,
  onNavigateToday?: () => void,
): Promise<ScheduledReminder[]> {
  const plan = buildNotificationPlan(timetable, settings, new Date());

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureAndroidChannel(settings);
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        if (plan.length > 0) {
          await LocalNotifications.schedule({
            notifications: plan.map((reminder) => ({
              id: reminder.id,
              title: reminder.title,
              body: reminder.body,
              channelId: CLASS_REMINDERS_CHANNEL_ID,
              schedule: {
                at: new Date(reminder.triggerAtMs),
                allowWhileIdle: true,
              },
              sound: settings.soundEnabled ? 'default' : undefined,
              extra: {
                route: 'today',
                day: reminder.day,
                slotId: reminder.slotId ?? '',
              },
            })),
          });
        }
      }
    } catch {
      // Ignore native scheduling errors if permissions not yet granted
    }
    return plan;
  }

  // Web fallback: schedule upcoming timers within the next 24 hours
  clearWebTimers();
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const nowMs = Date.now();
    const horizonMs = 24 * 60 * 60 * 1000;

    plan.forEach((reminder) => {
      const delay = reminder.triggerAtMs - nowMs;
      if (delay > 0 && delay <= horizonMs) {
        const timerId = window.setTimeout(() => {
          void fireWebNotification(reminder.title, reminder.body, onNavigateToday);
        }, delay);
        activeWebTimers.push(timerId);
      }
    });
  }

  return plan;
}

export async function sendTestNotification(
  settings: AppSettings,
  onNavigateToday?: () => void,
): Promise<{ sent: boolean; message: string }> {
  const title = 'ASE2009-LP';
  const body = `11:40–13:10 · Room AR-103 · starts in ${settings.leadTimeMinutes} min`;

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureAndroidChannel(settings);
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        return {
          sent: false,
          message: 'Please grant notification permission first.',
        };
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title,
            body,
            channelId: CLASS_REMINDERS_CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 1200), allowWhileIdle: true },
            sound: settings.soundEnabled ? 'default' : undefined,
            extra: { route: 'today' },
          },
        ],
      });
      return { sent: true, message: 'Test reminder scheduled for 1 second from now.' };
    } catch {
      return { sent: false, message: 'Could not schedule native notification.' };
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, message: 'Browser notifications are not supported here.' };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, message: 'Notification permission has not been granted yet.' };
  }

  await fireWebNotification(title, body, onNavigateToday);
  return { sent: true, message: 'Sample reminder notification sent.' };
}

export function registerNotificationTapListener(onNavigateToday: () => void): () => void {
  if (Capacitor.isNativePlatform()) {
    let removed = false;
    let handlePromise = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      () => {
        if (!removed) onNavigateToday();
      },
    );
    return () => {
      removed = true;
      void handlePromise.then((h) => h.remove());
    };
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'OPEN_TODAY') {
      onNavigateToday();
    }
  };
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }
  return () => {};
}
