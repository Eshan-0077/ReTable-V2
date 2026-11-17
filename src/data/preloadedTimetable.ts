import type { AppSettings, ClassEntry, DayOfWeek, SlotId, TimeSlotDef, TimetableMap } from '../types/timetable';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const WEEKDAYS_MON_SAT: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const TIME_SLOTS: TimeSlotDef[] = [
  {
    id: 'slot-1',
    label: 'Slot 1',
    shortLabel: 'S1',
    startTime: '08:30',
    endTime: '10:00',
    startMinutes: parseTimeToMinutes('08:30'),
    endMinutes: parseTimeToMinutes('10:00'),
    isBreak: false,
  },
  {
    id: 'slot-2',
    label: 'Slot 2',
    shortLabel: 'S2',
    startTime: '10:05',
    endTime: '11:35',
    startMinutes: parseTimeToMinutes('10:05'),
    endMinutes: parseTimeToMinutes('11:35'),
    isBreak: false,
  },
  {
    id: 'slot-3',
    label: 'Slot 3',
    shortLabel: 'S3',
    startTime: '11:40',
    endTime: '13:10',
    startMinutes: parseTimeToMinutes('11:40'),
    endMinutes: parseTimeToMinutes('13:10'),
    isBreak: false,
  },
  {
    id: 'lunch',
    label: 'Lunch',
    shortLabel: 'Lunch',
    startTime: '13:10',
    endTime: '13:15',
    startMinutes: parseTimeToMinutes('13:10'),
    endMinutes: parseTimeToMinutes('13:15'),
    isBreak: true,
  },
  {
    id: 'slot-4',
    label: 'Slot 4',
    shortLabel: 'S4',
    startTime: '13:15',
    endTime: '14:45',
    startMinutes: parseTimeToMinutes('13:15'),
    endMinutes: parseTimeToMinutes('14:45'),
    isBreak: false,
  },
  {
    id: 'slot-5',
    label: 'Slot 5',
    shortLabel: 'S5',
    startTime: '14:50',
    endTime: '16:20',
    startMinutes: parseTimeToMinutes('14:50'),
    endMinutes: parseTimeToMinutes('16:20'),
    isBreak: false,
  },
  {
    id: 'slot-6',
    label: 'Slot 6',
    shortLabel: 'S6',
    startTime: '16:25',
    endTime: '17:55',
    startMinutes: parseTimeToMinutes('16:25'),
    endMinutes: parseTimeToMinutes('17:55'),
    isBreak: false,
  },
  {
    id: 'slot-7',
    label: 'Slot 7',
    shortLabel: 'S7',
    startTime: '18:00',
    endTime: '19:30',
    startMinutes: parseTimeToMinutes('18:00'),
    endMinutes: parseTimeToMinutes('19:30'),
    isBreak: false,
  },
];

function entry(
  day: DayOfWeek,
  slotId: SlotId,
  slotCode: string,
  courseCode = '',
  room = '',
): ClassEntry {
  return {
    id: `${day}:${slotId}`,
    day,
    slotId,
    slotCode,
    courseCode,
    courseName: '',
    room,
    teacher: '',
    notes: '',
  };
}

export function createPreloadedTimetable(): TimetableMap {
  return {
    MONDAY: [
      entry('MONDAY', 'slot-1', 'A11'),
      entry('MONDAY', 'slot-2', 'B11'),
      entry('MONDAY', 'slot-3', 'C11', 'ASE2009-LP', 'AR-103'),
      entry('MONDAY', 'slot-4', 'A21', 'EEE1001-LTP', 'AB-402'),
      entry('MONDAY', 'slot-5', 'A14'),
      entry('MONDAY', 'slot-6', 'B21', 'PHY1001-LTP', 'AB-102'),
      entry('MONDAY', 'slot-7', 'C21'),
    ],
    TUESDAY: [
      entry('TUESDAY', 'slot-1', 'D11'),
      entry('TUESDAY', 'slot-2', 'E11', 'MAT2002-LT', 'AB-302'),
      entry('TUESDAY', 'slot-3', 'F11'),
      entry('TUESDAY', 'slot-4', 'D21', 'CHY1001-LTP', 'AB-128'),
      entry('TUESDAY', 'slot-5', 'E14', 'PHY1001-LTP', 'AB-102'),
      entry('TUESDAY', 'slot-6', 'E21', 'CSE0002-LT', 'CR-014'),
      entry('TUESDAY', 'slot-7', 'F21'),
    ],
    WEDNESDAY: [
      entry('WEDNESDAY', 'slot-1', 'A12'),
      entry('WEDNESDAY', 'slot-2', 'B12'),
      entry('WEDNESDAY', 'slot-3', 'C12', 'MEE1002-LTP', 'AR-002'),
      entry('WEDNESDAY', 'slot-4', 'A22', 'EEE1001-LTP', 'AB-402'),
      entry('WEDNESDAY', 'slot-5', 'B14', 'CHY1001-LTP', 'AB-128'),
      entry('WEDNESDAY', 'slot-6', 'B22'),
      entry('WEDNESDAY', 'slot-7', 'A24'),
    ],
    THURSDAY: [
      entry('THURSDAY', 'slot-1', 'D12'),
      entry('THURSDAY', 'slot-2', 'E12', 'MAT2002-LT', 'AB-302'),
      entry('THURSDAY', 'slot-3', 'F12', 'CSE0001-LT', 'CR-010'),
      entry('THURSDAY', 'slot-4', 'D22'),
      entry('THURSDAY', 'slot-5', 'F14', 'ASE2009-LP', 'AR-103'),
      entry('THURSDAY', 'slot-6', 'E22', 'PHY1001-LTP', 'AB-102'),
      entry('THURSDAY', 'slot-7', 'F22'),
    ],
    FRIDAY: [
      entry('FRIDAY', 'slot-1', 'A13'),
      entry('FRIDAY', 'slot-2', 'B13'),
      entry('FRIDAY', 'slot-3', 'C13', 'MEE1002-LTP', 'AR-002'),
      entry('FRIDAY', 'slot-4', 'A23', 'EEE1001-LTP', 'AB-402'),
      entry('FRIDAY', 'slot-5', 'C14', 'MAT2002-LT', 'AB-302'),
      entry('FRIDAY', 'slot-6', 'B23', 'CHY1001-LTP', 'AB-128'),
      entry('FRIDAY', 'slot-7', 'B24'),
    ],
    SATURDAY: [
      entry('SATURDAY', 'slot-1', 'D13'),
      entry('SATURDAY', 'slot-2', 'E13'),
      entry('SATURDAY', 'slot-3', 'F13'),
      entry('SATURDAY', 'slot-4', 'D23'),
      entry('SATURDAY', 'slot-5', 'D14'),
      entry('SATURDAY', 'slot-6', 'D24'),
      entry('SATURDAY', 'slot-7', 'E23'),
    ],
    SUNDAY: [],
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  leadTimeMinutes: 10,
  morningSummaryEnabled: true,
  morningSummaryTime: '07:30',
  soundEnabled: true,
  vibrationEnabled: true,
  notifyEmptySlots: false,
  notifyLunch: false,
  themeMode: 'system',
  accentPalette: 'sage',
  glassProMax: false,
  hapticsEnabled: true,
  slotOverrides: {},
};
