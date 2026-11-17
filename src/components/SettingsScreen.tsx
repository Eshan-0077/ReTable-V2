import React, { useRef, useState } from 'react';
import { Bell, Download, Upload, RotateCcw, Sun, Moon, Monitor, Check, Snowflake, Vibrate } from 'lucide-react';
import { ACCENT_PALETTES } from '../theme/tokens';
import type { NotificationPermissionState } from '../services/notificationScheduler';
import type {
  AppSettings,
  LeadTimeOption,
  ScheduledReminder,
  ThemeMode,
} from '../types/timetable';

interface SettingsScreenProps {
  settings: AppSettings;
  permissionState: NotificationPermissionState;
  scheduledCount: number;
  nextReminder: ScheduledReminder | null;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onRequestPermission: () => void;
  onOpenExactAlarmSettings: () => void;
  onSendTestNotification: () => Promise<{ sent: boolean; message: string }>;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => { ok: boolean; message: string };
  onResetTimetable: () => void;
}

const LEAD_TIMES: LeadTimeOption[] = [5, 10, 15, 30];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  permissionState,
  scheduledCount,
  nextReminder,
  onUpdateSettings,
  onRequestPermission,
  onOpenExactAlarmSettings,
  onSendTestNotification,
  onExportJson,
  onImportJson,
  onResetTimetable,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleTestClick = async () => {
    const res = await onSendTestNotification();
    setFeedback({ kind: res.sent ? 'ok' : 'err', text: res.message });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = onImportJson(content);
      setFeedback({ kind: res.ok ? 'ok' : 'err', text: res.message });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = () => {
    onResetTimetable();
    setConfirmReset(false);
    setFeedback({
      kind: 'ok',
      text: 'Timetable and slot timings reset to your preloaded college schedule.',
    });
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" aria-hidden="true" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" aria-hidden="true" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Reminders, pastel colors &amp; local backup
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Settings
        </h1>
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 ${
            feedback.kind === 'ok'
              ? 'liquid-glass-tint text-[var(--accent-text)]'
              : 'bg-rose-100/80 dark:bg-rose-950/50 backdrop-blur-xl border border-rose-300/70 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Appearance & Pastel Palette */}
      <section className="rounded-3xl liquid-glass p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Appearance &amp; colors
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Pick a pastel refraction tint and light or dark mode
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Pastel color theme
              </label>
              {settings.glassProMax && (
                <span className="text-[11px] font-medium text-[var(--accent-text)]">
                  Arctic glass active
                </span>
              )}
            </div>
            <div
              role="group"
              aria-label="Pastel color palette"
              className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2.5"
            >
              {ACCENT_PALETTES.map((pal) => {
                const active = settings.accentPalette === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    data-haptic="selection"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({ accentPalette: pal.id })}
                    className={`min-h-[48px] px-3 py-2 rounded-2xl flex items-center gap-2.5 text-sm font-medium cursor-pointer ${
                      active
                        ? 'liquid-glass-tint text-[var(--accent-text)]'
                        : 'liquid-glass-muted text-slate-700 dark:text-slate-200 hover:border-[var(--glass-tint-border)]'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 border border-black/10 dark:border-white/20"
                      style={{ backgroundColor: pal.swatchLight }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{pal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--glass-border-subtle)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label
              htmlFor="toggle-glass-pro-max"
              className="text-sm font-semibold text-slate-900 dark:text-slate-50 inline-flex items-center gap-2"
            >
              <Snowflake
                className={`w-4 h-4 shrink-0 ${
                  settings.glassProMax
                    ? 'text-[var(--accent-text)]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>Glass Pro Max</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ultra-translucent cold liquid glass with optical caustic refraction
            </p>
          </div>
          <button
            id="toggle-glass-pro-max"
            type="button"
            role="switch"
            aria-checked={settings.glassProMax}
            aria-label="Toggle Glass Pro Max"
            onClick={() => onUpdateSettings({ glassProMax: !settings.glassProMax })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.glassProMax
                ? 'bg-[var(--accent-solid)] shadow-[0_0_16px_rgba(125,216,250,0.55)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.glassProMax ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--glass-border-subtle)]">
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Brightness mode
          </label>
          <div
            role="group"
            aria-label="Theme mode"
            className="mt-2.5 grid grid-cols-3 gap-2 p-1 rounded-2xl liquid-track"
          >
            {themeOptions.map((opt) => {
              const active = settings.themeMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-haptic="selection"
                  aria-pressed={active}
                  onClick={() => onUpdateSettings({ themeMode: opt.value })}
                  className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-fg)]'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--glass-border-subtle)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label
              htmlFor="toggle-haptics"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 inline-flex items-center gap-2"
            >
              <Vibrate
                className={`w-4 h-4 shrink-0 ${
                  settings.hapticsEnabled
                    ? 'text-[var(--accent-text)]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>Button haptics</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tactile feedback when pressing buttons, tabs, and switches
            </p>
          </div>
          <button
            id="toggle-haptics"
            type="button"
            role="switch"
            aria-checked={settings.hapticsEnabled}
            aria-label="Toggle button haptics"
            onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.hapticsEnabled
                ? 'bg-[var(--accent-solid)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Reminders section */}
      <section className="rounded-3xl liquid-glass divide-y divide-[var(--glass-border-subtle)] overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Class reminders
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Channel: Class reminders · {scheduledCount} upcoming notifications queued
            {nextReminder ? ` · Next at ${nextReminder.triggerTimeLabel}` : ''}
          </p>

          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Reminder lead time before class
            </label>
            <div
              role="group"
              aria-label="Reminder lead time"
              className="mt-2 grid grid-cols-4 gap-2 p-1 rounded-2xl liquid-track"
            >
              {LEAD_TIMES.map((mins) => {
                const active = settings.leadTimeMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    data-haptic="selection"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({ leadTimeMinutes: mins })}
                    className={`min-h-[44px] rounded-xl text-sm font-semibold cursor-pointer tabular-nums ${
                      active
                        ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-fg)]'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Morning Summary */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <label
              htmlFor="toggle-morning-summary"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 block"
            >
              Daily morning summary
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lists all classes for the day in order
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="sr-only" htmlFor="morning-summary-time">
              Morning summary time
            </label>
            <input
              id="morning-summary-time"
              type="time"
              value={settings.morningSummaryTime}
              disabled={!settings.morningSummaryEnabled}
              onChange={(e) =>
                onUpdateSettings({ morningSummaryTime: e.target.value || '07:30' })
              }
              className="min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3 py-1.5 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 disabled:opacity-45"
            />
            <button
              id="toggle-morning-summary"
              type="button"
              role="switch"
              aria-checked={settings.morningSummaryEnabled}
              aria-label="Toggle daily morning summary"
              onClick={() =>
                onUpdateSettings({
                  morningSummaryEnabled: !settings.morningSummaryEnabled,
                })
              }
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
                settings.morningSummaryEnabled
                  ? 'bg-[var(--accent-solid)]'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                  settings.morningSummaryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sound */}
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="toggle-sound"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 block"
            >
              Notification sound
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Play default alert sound for reminders
            </p>
          </div>
          <button
            id="toggle-sound"
            type="button"
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Toggle notification sound"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.soundEnabled
                ? 'bg-[var(--accent-solid)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Vibration */}
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="toggle-vibration"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 block"
            >
              Vibration
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vibrate device when a class reminder fires
            </p>
          </div>
          <button
            id="toggle-vibration"
            type="button"
            role="switch"
            aria-checked={settings.vibrationEnabled}
            aria-label="Toggle notification vibration"
            onClick={() =>
              onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })
            }
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.vibrationEnabled
                ? 'bg-[var(--accent-solid)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Unnamed empty slots toggle */}
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="toggle-empty-slots"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 block"
            >
              Notify for unnamed slots
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Off by default; sends alerts even for open slot codes without a course name
            </p>
          </div>
          <button
            id="toggle-empty-slots"
            type="button"
            role="switch"
            aria-checked={settings.notifyEmptySlots}
            aria-label="Toggle notifications for unnamed slots"
            onClick={() =>
              onUpdateSettings({ notifyEmptySlots: !settings.notifyEmptySlots })
            }
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.notifyEmptySlots
                ? 'bg-[var(--accent-solid)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.notifyEmptySlots ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Lunch break toggle */}
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="toggle-lunch"
              className="text-sm font-medium text-slate-900 dark:text-slate-100 block"
            >
              Notify for Lunch break
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Off by default (13:10 – 13:15 unless customized)
            </p>
          </div>
          <button
            id="toggle-lunch"
            type="button"
            role="switch"
            aria-checked={settings.notifyLunch}
            aria-label="Toggle notifications for lunch break"
            onClick={() => onUpdateSettings({ notifyLunch: !settings.notifyLunch })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              settings.notifyLunch
                ? 'bg-[var(--accent-solid)]'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                settings.notifyLunch ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Permissions & Test */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/30 dark:bg-white/[0.03]">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Permission status:{' '}
              {permissionState.notifications === 'granted' ? (
                <span className="text-[var(--accent-text)] inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Granted
                </span>
              ) : permissionState.notifications === 'denied' ? (
                <span className="text-rose-600 dark:text-rose-400">Blocked</span>
              ) : permissionState.notifications === 'unsupported' ? (
                <span>Not supported in this browser</span>
              ) : (
                <span>Not requested yet</span>
              )}
            </p>
            {permissionState.isNativeAndroid && (
              <p>
                Exact alarms (SCHEDULE_EXACT_ALARM):{' '}
                {permissionState.exactAlarm === 'granted' ? 'Allowed' : 'Needs approval'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {permissionState.notifications === 'prompt' && (
              <button
                type="button"
                onClick={onRequestPermission}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-solid)] text-[var(--accent-solid-fg)] hover:bg-[var(--accent-solid-hover)] cursor-pointer"
              >
                Grant permission
              </button>
            )}
            {permissionState.isNativeAndroid &&
              permissionState.exactAlarm === 'denied' && (
                <button
                  type="button"
                  onClick={onOpenExactAlarmSettings}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                >
                  Allow exact alarms
                </button>
              )}
            <button
              type="button"
              onClick={handleTestClick}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-muted text-slate-800 dark:text-slate-100 hover:border-[var(--glass-tint-border)] cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              Send test alert
            </button>
          </div>
        </div>
      </section>

      {/* Backup & Reset */}
      <section className="rounded-3xl liquid-glass p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Backup &amp; reset
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Export or restore your timetable, custom timings, and color preferences as a local JSON file
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onExportJson();
              setFeedback({ kind: 'ok', text: 'Timetable backup exported as JSON.' });
            }}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium liquid-glass-muted text-slate-800 dark:text-slate-100 hover:border-[var(--glass-tint-border)] cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export backup
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium liquid-glass-muted text-slate-800 dark:text-slate-100 hover:border-[var(--glass-tint-border)] cursor-pointer"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import timetable JSON file"
            onChange={handleFileChange}
          />

          {!confirmReset ? (
            <button
              type="button"
              data-haptic="warning"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border border-rose-300/70 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 cursor-pointer sm:ml-auto"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset to my timetable
            </button>
          ) : (
            <div className="w-full rounded-2xl border border-rose-300/70 dark:border-rose-800/70 bg-rose-100/65 dark:bg-rose-950/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-medium text-rose-800 dark:text-rose-200">
                Restore the original preloaded timetable and slot timings? Any custom course names, times, and notes will be overwritten.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-haptic="success"
                  onClick={handleConfirmReset}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Confirm reset
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
