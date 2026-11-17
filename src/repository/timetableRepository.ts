import { createPreloadedTimetable, DEFAULT_SETTINGS } from '../data/preloadedTimetable';
import type {
  AppSettings,
  ClassEntry,
  DayOfWeek,
  SlotId,
  TimetableBackupPayload,
  TimetableMap,
} from '../types/timetable';
import { validateBackupPayload } from '../utils/timetableLogic';

const TIMETABLE_STORAGE_KEY = 'timetable_reminder_data_v1';
const SETTINGS_STORAGE_KEY = 'timetable_reminder_settings_v1';

export function loadTimetable(): TimetableMap {
  try {
    const raw = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!raw) {
      return createPreloadedTimetable();
    }
    const parsed = JSON.parse(raw) as TimetableMap;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.MONDAY)) {
      return createPreloadedTimetable();
    }
    return parsed;
  } catch {
    return createPreloadedTimetable();
  }
}

export function saveTimetable(timetable: TimetableMap): void {
  try {
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(timetable));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function updateClassEntry(
  timetable: TimetableMap,
  day: DayOfWeek,
  slotId: SlotId,
  patch: Partial<
    Pick<
      ClassEntry,
      'courseName' | 'courseCode' | 'room' | 'teacher' | 'notes' | 'startTime' | 'endTime'
    >
  >,
): TimetableMap {
  const nextDayEntries = (timetable[day] ?? []).map((entry) =>
    entry.slotId === slotId ? { ...entry, ...patch } : entry,
  );
  const updated: TimetableMap = {
    ...timetable,
    [day]: nextDayEntries,
  };
  saveTimetable(updated);
  return updated;
}

export function resetToPreloadedTimetable(): TimetableMap {
  const fresh = createPreloadedTimetable();
  saveTimetable(fresh);
  return fresh;
}

export function createBackupJson(timetable: TimetableMap, settings: AppSettings): string {
  const payload: TimetableBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    timetable,
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJson(
  jsonText: string,
  fallbackSettings: AppSettings,
): { ok: true; data: TimetableBackupPayload } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonText);
    return validateBackupPayload(parsed, fallbackSettings);
  } catch {
    return { ok: false, error: 'The selected file is not valid JSON.' };
  }
}
