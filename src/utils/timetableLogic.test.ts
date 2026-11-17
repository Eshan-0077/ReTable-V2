import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPreloadedTimetable,
  DEFAULT_SETTINGS,
  parseTimeToMinutes,
  TIME_SLOTS,
} from '../data/preloadedTimetable';
import {
  buildNotificationPlan,
  buildTimelineForDay,
  formatMorningSummaryBody,
  getNowNextState,
  validateBackupPayload,
} from './timetableLogic';

test('preloaded timetable matches exact college schedule structure', () => {
  const tt = createPreloadedTimetable();
  assert.equal(TIME_SLOTS.length, 8);
  assert.equal(TIME_SLOTS[3].id, 'lunch');
  assert.equal(TIME_SLOTS[3].isBreak, true);
  assert.equal(TIME_SLOTS[3].startTime, '13:10');
  assert.equal(TIME_SLOTS[3].endTime, '13:15');

  assert.equal(tt.MONDAY.length, 7);
  assert.equal(tt.MONDAY[2].slotCode, 'C11');
  assert.equal(tt.MONDAY[2].courseCode, 'ASE2009-LP');
  assert.equal(tt.MONDAY[2].room, 'AR-103');

  assert.equal(tt.THURSDAY[2].courseCode, 'CSE0001-LT');
  assert.equal(tt.THURSDAY[2].room, 'CR-010');

  assert.equal(tt.FRIDAY[4].slotCode, 'C14');
  assert.equal(tt.FRIDAY[4].courseCode, 'MAT2002-LT');
  assert.equal(tt.FRIDAY[4].room, 'AB-302');

  assert.equal(tt.SATURDAY.length, 7);
  assert.equal(tt.SUNDAY.length, 0);
});

test('Now/Next before first class shows Slot 1 countdown', () => {
  const tt = createPreloadedTimetable();
  const state = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('08:05'), true);
  assert.equal(state.mode, 'upcoming');
  assert.equal(state.currentItem, null);
  assert.equal(state.nextItem?.slot.id, 'slot-1');
  assert.equal(state.minutesUntilNext, 25);
});

test('Now/Next during running class shows remaining minutes and next class', () => {
  const tt = createPreloadedTimetable();
  const state = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('12:00'), true);
  assert.equal(state.mode, 'running');
  assert.equal(state.currentItem?.slot.id, 'slot-3');
  assert.equal(state.currentItem?.displayTitle, 'ASE2009-LP');
  assert.equal(state.minutesRemaining, 70);
  assert.equal(state.nextItem?.slot.id, 'slot-4');
  assert.equal(state.minutesUntilNext, 75);
});

test('Now/Next across Lunch break (13:10-13:15) shows Lunch and Slot 4 upcoming', () => {
  const tt = createPreloadedTimetable();
  const state = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('13:12'), true);
  assert.equal(state.mode, 'lunch');
  assert.equal(state.currentItem?.slot.isBreak, true);
  assert.equal(state.currentItem?.slot.label, 'Lunch');
  assert.equal(state.minutesRemaining, 3);
  assert.equal(state.nextItem?.slot.id, 'slot-4');
  assert.equal(state.nextItem?.displayTitle, 'EEE1001-LTP');
  assert.equal(state.minutesUntilNext, 3);
});

test('Now/Next at exact start of Slot 4 transitions out of Lunch', () => {
  const tt = createPreloadedTimetable();
  const state = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('13:15'), true);
  assert.equal(state.mode, 'running');
  assert.equal(state.currentItem?.slot.id, 'slot-4');
  assert.equal(state.minutesRemaining, 90);
});

test('Now/Next at end of day after 19:30 shows finished and next day label', () => {
  const tt = createPreloadedTimetable();
  const fridayEnd = getNowNextState(tt, 'FRIDAY', parseTimeToMinutes('19:45'), true);
  assert.equal(fridayEnd.mode, 'finished');
  assert.equal(fridayEnd.nextDayLabel, 'Tomorrow');

  const satEnd = getNowNextState(tt, 'SATURDAY', parseTimeToMinutes('20:00'), true);
  assert.equal(satEnd.mode, 'finished');
  assert.equal(satEnd.nextDayLabel, 'Monday');
});

test('Sunday shows no-classes state and finds Monday next', () => {
  const tt = createPreloadedTimetable();
  const sun = getNowNextState(tt, 'SUNDAY', parseTimeToMinutes('10:00'), true);
  assert.equal(sun.mode, 'no-classes');
  assert.equal(sun.nextDayLabel, 'Tomorrow');
  assert.equal(buildTimelineForDay(tt, 'SUNDAY', 600, true).length, 0);
});

test('buildNotificationPlan skips Lunch and unnamed slots by default, includes renamed slots', () => {
  const tt = createPreloadedTimetable();
  // Rename Monday Slot 1 (A11) to give it a custom name
  tt.MONDAY[0].courseName = 'Linear Algebra';

  // Monday morning at 07:00
  const mondayMorning = new Date(2026, 10, 16, 7, 0, 0); // 2026-11-16 is Monday
  const plan = buildNotificationPlan(tt, DEFAULT_SETTINGS, mondayMorning);

  const mondayClassReminders = plan.filter(
    (r) => r.day === 'MONDAY' && r.kind === 'class',
  );
  // Monday has 3 named courses (C11, A21, B21) + 1 renamed (A11) = 4 class reminders
  assert.equal(mondayClassReminders.length, 4);
  assert.equal(mondayClassReminders[0].title, 'Linear Algebra');
  assert.equal(mondayClassReminders[0].triggerTimeLabel, '08:20');
  assert.equal(mondayClassReminders.some((r) => r.slotId === 'lunch'), false);

  // Morning summary exists at 07:30
  const mondaySummary = plan.find(
    (r) => r.day === 'MONDAY' && r.kind === 'morning-summary',
  );
  assert.ok(mondaySummary);
  assert.equal(mondaySummary?.triggerTimeLabel, '07:30');
  assert.ok(mondaySummary?.body.includes('Linear Algebra'));
  assert.ok(mondaySummary?.body.includes('ASE2009-LP (AR-103)'));
});

test('buildNotificationPlan includes unnamed slots when notifyEmptySlots is enabled', () => {
  const tt = createPreloadedTimetable();
  const mondayMorning = new Date(2026, 10, 16, 7, 0, 0);
  const plan = buildNotificationPlan(
    tt,
    { ...DEFAULT_SETTINGS, notifyEmptySlots: true },
    mondayMorning,
  );
  const mondayClassReminders = plan.filter(
    (r) => r.day === 'MONDAY' && r.kind === 'class',
  );
  assert.equal(mondayClassReminders.length, 7);
});

test('formatMorningSummaryBody handles Saturday with only unnamed slots gracefully', () => {
  const tt = createPreloadedTimetable();
  const summary = formatMorningSummaryBody(tt, 'SATURDAY', DEFAULT_SETTINGS);
  assert.match(summary, /open slot codes/i);
});

test('validateBackupPayload accepts valid backup and rejects malformed JSON', () => {
  const tt = createPreloadedTimetable();
  const valid = validateBackupPayload(
    {
      version: 1,
      timetable: tt,
      settings: {
        leadTimeMinutes: 15,
        accentPalette: 'lavender',
        glassProMax: true,
        hapticsEnabled: false,
      },
    },
    DEFAULT_SETTINGS,
  );
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.settings.leadTimeMinutes, 15);
    assert.equal(valid.data.settings.accentPalette, 'lavender');
    assert.equal(valid.data.settings.glassProMax, true);
    assert.equal(valid.data.settings.hapticsEnabled, false);
  }

  const defaultsTest = validateBackupPayload(
    { version: 1, timetable: tt, settings: { leadTimeMinutes: 10 } },
    DEFAULT_SETTINGS,
  );
  assert.equal(defaultsTest.ok, true);
  if (defaultsTest.ok) {
    assert.equal(defaultsTest.data.settings.glassProMax, false);
    assert.equal(defaultsTest.data.settings.hapticsEnabled, true);
  }

  const invalid = validateBackupPayload({ foo: 'bar' }, DEFAULT_SETTINGS);
  assert.equal(invalid.ok, false);
});

test('Today timeline excludes empty slots while keeping assigned classes and Lunch', () => {
  const tt = createPreloadedTimetable();
  const mondayItems = buildTimelineForDay(tt, 'MONDAY', 500, true, {
    excludeEmptySlots: true,
  });
  // Monday has 3 assigned classes (C11, A21, B21) + Lunch break = 4 items
  assert.equal(mondayItems.length, 4);
  assert.deepEqual(
    mondayItems.map((i) => i.slot.id),
    ['slot-3', 'lunch', 'slot-4', 'slot-6'],
  );

  // Saturday has only bare slot codes, so Today timeline is empty
  const saturdayItems = buildTimelineForDay(tt, 'SATURDAY', 500, true, {
    excludeEmptySlots: true,
  });
  assert.equal(saturdayItems.length, 0);

  // Now/Next on Monday at 08:30 skips empty A11/B11 and points to C11 ASE2009-LP
  const nowNext = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('08:30'), true, {
    excludeEmptySlots: true,
  });
  assert.equal(nowNext.mode, 'upcoming');
  assert.equal(nowNext.nextItem?.displayTitle, 'ASE2009-LP');
  assert.equal(nowNext.minutesUntilNext, 190);

  // Friday evening skips empty Saturday and points to Monday
  const friEnd = getNowNextState(tt, 'FRIDAY', parseTimeToMinutes('20:00'), true, {
    excludeEmptySlots: true,
  });
  assert.equal(friEnd.mode, 'finished');
  assert.equal(friEnd.nextDayLabel, 'Monday');
});

test('custom lecture startTime and duration override timeline order, Now/Next, and notifications', () => {
  const tt = createPreloadedTimetable();
  // Move Monday Slot 6 (PHY1001-LTP, default 16:25-17:55) to 09:00 for 75 min -> 10:15
  tt.MONDAY[5].startTime = '09:00';
  tt.MONDAY[5].endTime = '10:15';

  const timeline = buildTimelineForDay(tt, 'MONDAY', parseTimeToMinutes('09:30'), true, {
    excludeEmptySlots: true,
  });
  // PHY1001-LTP should now be sorted first at 09:00 before C11 (11:40)
  assert.equal(timeline[0].entry?.courseCode, 'PHY1001-LTP');
  assert.equal(timeline[0].effectiveStartTime, '09:00');
  assert.equal(timeline[0].effectiveEndTime, '10:15');
  assert.equal(timeline[0].status, 'current');
  assert.equal(timeline[0].isCustomTime, true);

  const nowNext = getNowNextState(tt, 'MONDAY', parseTimeToMinutes('09:30'), true, {
    excludeEmptySlots: true,
  });
  assert.equal(nowNext.mode, 'running');
  assert.equal(nowNext.currentItem?.displayTitle, 'PHY1001-LTP');
  assert.equal(nowNext.minutesRemaining, 45);

  // Notification plan schedules PHY1001-LTP at 08:50 (10 min lead time)
  const mondayMorning = new Date(2026, 10, 16, 7, 0, 0);
  const plan = buildNotificationPlan(tt, DEFAULT_SETTINGS, mondayMorning);
  const phyReminder = plan.find(
    (r) => r.day === 'MONDAY' && r.title === 'PHY1001-LTP',
  );
  assert.ok(phyReminder);
  assert.equal(phyReminder?.triggerTimeLabel, '08:50');
  assert.ok(phyReminder?.body.includes('09:00–10:15'));
});

test('week-wide slotOverrides update slot times unless overridden per lecture', () => {
  const tt = createPreloadedTimetable();
  const overrides = {
    'slot-3': { startTime: '11:30', endTime: '12:45' },
  };
  const timeline = buildTimelineForDay(tt, 'MONDAY', parseTimeToMinutes('12:00'), true, {
    excludeEmptySlots: true,
    slotOverrides: overrides,
  });
  const c11 = timeline.find((i) => i.slot.id === 'slot-3');
  assert.equal(c11?.effectiveStartTime, '11:30');
  assert.equal(c11?.effectiveEndTime, '12:45');
  assert.equal(c11?.isCustomTime, true);
});
