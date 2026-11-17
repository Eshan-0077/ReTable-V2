import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { CalendarDays, Clock, Settings as SettingsIcon } from 'lucide-react';
import { ClassDetailSheet } from './components/ClassDetailSheet';
import { HexWaveBackdrop } from './components/HexWaveBackdrop';
import { SettingsScreen } from './components/SettingsScreen';
import { SlotTimeSheet } from './components/SlotTimeSheet';
import { TodayScreen } from './components/TodayScreen';
import { WeekScreen } from './components/WeekScreen';
import { DAYS_OF_WEEK } from './data/preloadedTimetable';
import {
  createBackupJson,
  loadSettings,
  loadTimetable,
  parseBackupJson,
  resetToPreloadedTimetable,
  saveSettings,
  saveTimetable,
  updateClassEntry,
} from './repository/timetableRepository';
import {
  getPermissionState,
  openExactAlarmSettings,
  registerNotificationTapListener,
  requestNotificationPermission,
  sendTestNotification,
  syncScheduledNotifications,
  type NotificationPermissionState,
} from './services/notificationScheduler';
import type {
  AppSettings,
  ClassEntry,
  DayOfWeek,
  ScheduledReminder,
  SlotId,
  SlotTimeRange,
  TimeSlotDef,
  TimetableMap,
} from './types/timetable';
import { DROPLET_SPRING } from './utils/fluidMotion';
import {
  buildTimelineForDay,
  getDayOfWeekFromDate,
  getMinutesOfDay,
  getNowNextState,
} from './utils/timetableLogic';
import { resolveThemeCanvasHex } from './utils/themeColor';
import { registerGlobalButtonHaptics, setHapticsEnabled } from './utils/haptics';

type ActiveTab = 'today' | 'week' | 'settings';
const TAB_ORDER: ActiveTab[] = ['today', 'week', 'settings'];

export default function App() {
  const [timetable, setTimetable] = useState<TimetableMap>(() => loadTimetable());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const activeTabRef = useRef<ActiveTab>('today');
  const [tabDirection, setTabDirection] = useState<number>(0);
  const [now, setNow] = useState<Date>(() => new Date());

  const realToday = useMemo(() => getDayOfWeekFromDate(now), [now]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() =>
    getDayOfWeekFromDate(new Date()),
  );
  const [dayDirection, setDayDirection] = useState<number>(0);
  const [editingTarget, setEditingTarget] = useState<{
    entry: ClassEntry;
    slot: TimeSlotDef;
  } | null>(null);
  const [editingSlotTime, setEditingSlotTime] = useState<TimeSlotDef | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    isNativeAndroid: false,
    notifications: 'prompt',
    exactAlarm: 'not-applicable',
  });
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);

  // Live clock tick (15s interval + tab focus sync)
  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = window.setInterval(tick, 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Theme, pastel palette & Glass Pro Max application
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-palette',
      settings.accentPalette || 'sage',
    );
  }, [settings.accentPalette]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-glass',
      settings.glassProMax ? 'pro-max' : 'standard',
    );
  }, [settings.glassProMax]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (settings.themeMode === 'dark') return true;
    if (settings.themeMode === 'light') return false;
    return (
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    const applyTheme = () => {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark =
        settings.themeMode === 'dark' ||
        (settings.themeMode === 'system' && prefersDark);
      setIsDarkMode(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
    };

    applyTheme();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (mq && settings.themeMode === 'system') {
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [settings.themeMode]);

  useEffect(() => {
    const themeHex = resolveThemeCanvasHex(
      settings.accentPalette || 'sage',
      isDarkMode,
      Boolean(settings.glassProMax),
    );
    const root = document.documentElement;
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
    root.style.backgroundColor = themeHex;
    const meta =
      document.getElementById('app-theme-color') ??
      document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', themeHex);
    }
  }, [settings.accentPalette, isDarkMode, settings.glassProMax]);

  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled ?? true);
  }, [settings.hapticsEnabled]);

  useEffect(() => {
    return registerGlobalButtonHaptics();
  }, []);

  // Register Service Worker in browser & inspect notification permissions
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore SW registration failure in restricted environments
      });
    }
    void getPermissionState().then(setPermissionState);
  }, []);

  const selectDayWithDirection = useCallback((nextDay: DayOfWeek) => {
    setSelectedDay((prevDay) => {
      if (prevDay === nextDay) return prevDay;
      const prevIdx = DAYS_OF_WEEK.indexOf(prevDay);
      const nextIdx = DAYS_OF_WEEK.indexOf(nextDay);
      setDayDirection(nextIdx >= prevIdx ? 1 : -1);
      return nextDay;
    });
  }, []);

  const switchTab = useCallback((nextTab: ActiveTab) => {
    const prevTab = activeTabRef.current;
    if (prevTab === nextTab) return;
    const prevIdx = TAB_ORDER.indexOf(prevTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    activeTabRef.current = nextTab;
    setTabDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleNavigateToday = useCallback(() => {
    selectDayWithDirection(getDayOfWeekFromDate(new Date()));
    switchTab('today');
  }, [selectDayWithDirection, switchTab]);

  useEffect(() => {
    return registerNotificationTapListener(handleNavigateToday);
  }, [handleNavigateToday]);

  // Reschedule notifications whenever timetable or settings change
  useEffect(() => {
    let active = true;
    void syncScheduledNotifications(timetable, settings, handleNavigateToday).then(
      (plan) => {
        if (active) setScheduledReminders(plan);
      },
    );
    return () => {
      active = false;
    };
  }, [timetable, settings, handleNavigateToday]);

  const nowMinutes = useMemo(() => getMinutesOfDay(now), [now]);
  const isViewingRealToday = selectedDay === realToday;

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [now]);

  // Today tab displays ONLY slots that have classes in them (plus Lunch break), using effective custom times
  const timeline = useMemo(
    () =>
      buildTimelineForDay(timetable, selectedDay, nowMinutes, isViewingRealToday, {
        excludeEmptySlots: true,
        slotOverrides: settings.slotOverrides,
      }),
    [timetable, selectedDay, nowMinutes, isViewingRealToday, settings.slotOverrides],
  );

  const nowNext = useMemo(
    () =>
      getNowNextState(timetable, selectedDay, nowMinutes, isViewingRealToday, {
        excludeEmptySlots: true,
        slotOverrides: settings.slotOverrides,
      }),
    [timetable, selectedDay, nowMinutes, isViewingRealToday, settings.slotOverrides],
  );

  const handleSaveClassDetail = (patch: {
    courseName: string;
    courseCode: string;
    room: string;
    teacher: string;
    notes: string;
    startTime?: string;
    endTime?: string;
  }) => {
    if (!editingTarget) return;
    const updated = updateClassEntry(
      timetable,
      editingTarget.entry.day,
      editingTarget.entry.slotId,
      patch,
    );
    setTimetable(updated);
    setEditingTarget(null);
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const handleSaveSlotTime = (slotId: SlotId, range: SlotTimeRange | null) => {
    const nextOverrides = { ...(settings.slotOverrides ?? {}) };
    if (range === null) {
      delete nextOverrides[slotId];
    } else {
      nextOverrides[slotId] = range;
    }
    handleUpdateSettings({ slotOverrides: nextOverrides });
  };

  const handleRequestPermission = async () => {
    const nextState = await requestNotificationPermission();
    setPermissionState(nextState);
    const plan = await syncScheduledNotifications(
      timetable,
      settings,
      handleNavigateToday,
    );
    setScheduledReminders(plan);
  };

  const handleOpenExactAlarmSettings = async () => {
    const nextState = await openExactAlarmSettings();
    setPermissionState(nextState);
  };

  const handleSendTestNotification = async () => {
    return sendTestNotification(settings, handleNavigateToday);
  };

  const handleExportJson = () => {
    const json = createBackupJson(timetable, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-reminder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonText: string) => {
    const res = parseBackupJson(jsonText, settings);
    if (!res.ok) {
      return { ok: false, message: res.error };
    }
    setTimetable(res.data.timetable);
    saveTimetable(res.data.timetable);
    setSettings(res.data.settings);
    saveSettings(res.data.settings);
    return { ok: true, message: 'Timetable and settings restored from backup.' };
  };

  const handleResetTimetable = () => {
    const fresh = resetToPreloadedTimetable();
    setTimetable(fresh);
    handleUpdateSettings({ slotOverrides: {} });
  };

  const handleJumpToDayFromWeek = (day: DayOfWeek) => {
    selectDayWithDirection(day);
    switchTab('today');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-[100dvh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Base Canvas Layer */}
        <div
          className="fixed inset-0 pointer-events-none -z-20 bg-[var(--bg-canvas)]"
          aria-hidden="true"
        />

        {/* Interactive Hexagonal Wave Backdrop with Color-Scheme Flip */}
        <HexWaveBackdrop
          accentPalette={settings.accentPalette}
          isDark={isDarkMode}
          isProMax={settings.glassProMax}
        />

        {/* Desktop Floating Liquid Glass Header */}
        <header className="hidden md:block sticky top-3 z-30 px-6">
          <div className="max-w-5xl mx-auto px-5 h-14 rounded-2xl liquid-glass-strong grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <button
              type="button"
              onClick={handleNavigateToday}
              className="justify-self-start text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Timetable Reminder
            </button>

            <nav
              aria-label="Primary navigation"
              className="flex items-center gap-1 p-1 rounded-xl liquid-track"
            >
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'settings', label: 'Settings' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-haptic="selection"
                    onClick={() => switchTab(tab.id)}
                    className={`relative min-h-[36px] px-4 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'text-[var(--accent-text)]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="desktop-nav-pill"
                        transition={DROPLET_SPRING}
                        className="absolute inset-0 rounded-lg liquid-glass-strong"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div aria-hidden="true" />
          </div>
        </header>

        {/* Mobile Compact Glass Header */}
        <header className="md:hidden sticky top-0 z-30 liquid-glass-strong border-x-0 border-t-0 rounded-none">
          <div className="px-4 h-12 flex items-center justify-between">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Timetable Reminder
            </span>
            {!isViewingRealToday && activeTab === 'today' && (
              <button
                type="button"
                onClick={handleNavigateToday}
                className="text-xs font-semibold text-[var(--accent-text)] px-2.5 py-1.5 rounded-lg"
              >
                Today
              </button>
            )}
          </div>
        </header>

        {/* Main Content with Fast Standard Slide Tab Transitions */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-12 overflow-x-clip">
          <div className="overflow-x-clip">
            <motion.div
              key={activeTab}
              initial={
                tabDirection === 0
                  ? false
                  : { opacity: 0, x: tabDirection > 0 ? 22 : -22 }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'today' && (
                <TodayScreen
                  selectedDay={selectedDay}
                  dayDirection={dayDirection}
                  realToday={realToday}
                  formattedDate={formattedDate}
                  timeline={timeline}
                  nowNext={nowNext}
                  permissionState={permissionState}
                  onSelectDay={selectDayWithDirection}
                  onOpenClassDetail={(item) => {
                    if (item.entry) {
                      setEditingTarget({ entry: item.entry, slot: item.slot });
                    }
                  }}
                  onRequestPermission={handleRequestPermission}
                  onOpenExactAlarmSettings={handleOpenExactAlarmSettings}
                  onOpenSettings={() => switchTab('settings')}
                  onOpenWeek={() => switchTab('week')}
                />
              )}

              {activeTab === 'week' && (
                <WeekScreen
                  timetable={timetable}
                  slotOverrides={settings.slotOverrides}
                  realToday={realToday}
                  selectedDay={selectedDay}
                  onSelectDay={selectDayWithDirection}
                  onJumpToDay={handleJumpToDayFromWeek}
                  onEditClass={(entry, slot) => setEditingTarget({ entry, slot })}
                  onEditSlotTime={(slot) => setEditingSlotTime(slot)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  settings={settings}
                  permissionState={permissionState}
                  scheduledCount={scheduledReminders.length}
                  nextReminder={scheduledReminders[0] ?? null}
                  onUpdateSettings={handleUpdateSettings}
                  onRequestPermission={handleRequestPermission}
                  onOpenExactAlarmSettings={handleOpenExactAlarmSettings}
                  onSendTestNotification={handleSendTestNotification}
                  onExportJson={handleExportJson}
                  onImportJson={handleImportJson}
                  onResetTimetable={handleResetTimetable}
                />
              )}
            </motion.div>
          </div>
        </main>

        {/* Mobile Floating Liquid Glass Bottom Dock */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-40 rounded-2xl liquid-glass-strong"
        >
          <div className="grid grid-cols-3 h-14 p-1 gap-1">
            {(
              [
                { id: 'today', label: 'Today', icon: Clock },
                { id: 'week', label: 'Week', icon: CalendarDays },
                { id: 'settings', label: 'Settings', icon: SettingsIcon },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-haptic="selection"
                  onClick={() => switchTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold rounded-xl cursor-pointer ${
                    active
                      ? 'text-[var(--accent-text)]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      transition={DROPLET_SPRING}
                      className="absolute inset-0 rounded-xl liquid-glass-tint"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="relative z-10 w-5 h-5" aria-hidden="true" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Class Detail & Custom Time Edit Sheet */}
        <ClassDetailSheet
          entry={editingTarget?.entry ?? null}
          slot={editingTarget?.slot ?? null}
          slotOverrides={settings.slotOverrides}
          onClose={() => setEditingTarget(null)}
          onSave={handleSaveClassDetail}
        />

        {/* Weekly Slot Timing Sheet */}
        <SlotTimeSheet
          slot={editingSlotTime}
          slotOverrides={settings.slotOverrides}
          onClose={() => setEditingSlotTime(null)}
          onSave={handleSaveSlotTime}
        />
      </div>
    </MotionConfig>
  );
}
