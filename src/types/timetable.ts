export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type SlotId =
  | 'slot-1'
  | 'slot-2'
  | 'slot-3'
  | 'lunch'
  | 'slot-4'
  | 'slot-5'
  | 'slot-6'
  | 'slot-7';

export interface TimeSlotDef {
  id: SlotId;
  label: string;
  shortLabel: string;
  startTime: string; // HH:mm 24h
  endTime: string; // HH:mm 24h
  startMinutes: number;
  endMinutes: number;
  isBreak: boolean;
}

export interface SlotTimeRange {
  startTime: string;
  endTime: string;
}

export type SlotTimeOverrides = Partial<Record<SlotId, SlotTimeRange>>;

export interface ClassEntry {
  id: string; // e.g., "MONDAY:slot-3"
  day: DayOfWeek;
  slotId: SlotId;
  slotCode: string; // e.g., "C11"
  courseCode: string; // e.g., "ASE2009-LP" or ""
  courseName: string; // custom user-defined name or ""
  room: string; // e.g., "AR-103" or ""
  teacher: string;
  notes: string;
  startTime?: string; // Optional per-lecture HH:mm override
  endTime?: string; // Optional per-lecture HH:mm override
}

export type TimetableMap = Record<DayOfWeek, ClassEntry[]>;

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentPalette = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose';

export type LeadTimeOption = 5 | 10 | 15 | 30;

export interface AppSettings {
  leadTimeMinutes: LeadTimeOption;
  morningSummaryEnabled: boolean;
  morningSummaryTime: string; // HH:mm, default "07:30"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notifyEmptySlots: boolean;
  notifyLunch: boolean;
  themeMode: ThemeMode;
  accentPalette: AccentPalette;
  glassProMax: boolean;
  hapticsEnabled: boolean;
  slotOverrides?: SlotTimeOverrides;
}

export type SlotStatus = 'past' | 'current' | 'upcoming';

export interface TimelineItem {
  slot: TimeSlotDef;
  entry: ClassEntry | null;
  status: SlotStatus;
  displayTitle: string;
  isUnnamedSlot: boolean;
  effectiveStartTime: string;
  effectiveEndTime: string;
  effectiveStartMinutes: number;
  effectiveEndMinutes: number;
  isCustomTime: boolean;
}

export interface NowNextState {
  mode: 'running' | 'upcoming' | 'lunch' | 'finished' | 'no-classes';
  currentItem: TimelineItem | null;
  nextItem: TimelineItem | null;
  minutesRemaining: number | null;
  minutesUntilNext: number | null;
  progressPercent: number;
  nextDayLabel: string | null;
}

export interface ScheduledReminder {
  id: number;
  kind: 'class' | 'morning-summary';
  day: DayOfWeek;
  slotId?: SlotId;
  title: string;
  body: string;
  triggerAtMs: number;
  triggerTimeLabel: string;
}

export interface TimetableBackupPayload {
  version: 1;
  exportedAt: string;
  timetable: TimetableMap;
  settings: AppSettings;
}
