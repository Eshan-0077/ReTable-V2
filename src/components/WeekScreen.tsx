import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, SlidersHorizontal } from 'lucide-react';
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  TIME_SLOTS,
  WEEKDAYS_MON_SAT,
} from '../data/preloadedTimetable';
import type {
  ClassEntry,
  DayOfWeek,
  SlotTimeOverrides,
  TimeSlotDef,
  TimetableMap,
} from '../types/timetable';
import { DROPLET_SPRING } from '../utils/fluidMotion';
import { triggerHaptic } from '../utils/haptics';
import {
  getEffectiveSlotTimes,
  getEntryDisplayTitle,
  isEntryUnnamed,
} from '../utils/timetableLogic';

interface WeekScreenProps {
  timetable: TimetableMap;
  slotOverrides?: SlotTimeOverrides;
  realToday: DayOfWeek;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onJumpToDay: (day: DayOfWeek) => void;
  onEditClass: (entry: ClassEntry, slot: TimeSlotDef) => void;
  onEditSlotTime: (slot: TimeSlotDef) => void;
}

type GridTapMode = 'open' | 'edit';

export const WeekScreen: React.FC<WeekScreenProps> = ({
  timetable,
  slotOverrides,
  realToday,
  selectedDay,
  onSelectDay,
  onJumpToDay,
  onEditClass,
  onEditSlotTime,
}) => {
  const [tapMode, setTapMode] = useState<GridTapMode>('open');
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 56) return;

    const currentIdx = Math.max(0, WEEKDAYS_MON_SAT.indexOf(selectedDay));
    if (delta < 0 && currentIdx < WEEKDAYS_MON_SAT.length - 1) {
      triggerHaptic('selection');
      onSelectDay(WEEKDAYS_MON_SAT[currentIdx + 1]);
    } else if (delta > 0 && currentIdx > 0) {
      triggerHaptic('selection');
      onSelectDay(WEEKDAYS_MON_SAT[currentIdx - 1]);
    }
  };

  return (
    <div
      className="space-y-5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Monday – Saturday · Theory Slots 1–7
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Weekly Timetable
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grid interaction mode */}
          <div
            role="group"
            aria-label="Week grid tap action"
            className="inline-flex items-center gap-1 p-1 rounded-2xl liquid-track"
          >
            <button
              type="button"
              data-haptic="selection"
              aria-pressed={tapMode === 'open'}
              onClick={() => setTapMode('open')}
              className={`relative min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                tapMode === 'open'
                  ? 'text-slate-900 dark:text-slate-50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tapMode === 'open' && (
                <motion.span
                  layoutId="week-mode-pill"
                  transition={DROPLET_SPRING}
                  className="absolute inset-0 rounded-xl liquid-glass-strong"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">Open day</span>
            </button>
            <button
              type="button"
              data-haptic="selection"
              aria-pressed={tapMode === 'edit'}
              onClick={() => setTapMode('edit')}
              className={`relative inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                tapMode === 'edit'
                  ? 'text-[var(--accent-text)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tapMode === 'edit' && (
                <motion.span
                  layoutId="week-mode-pill"
                  transition={DROPLET_SPRING}
                  className="absolute inset-0 rounded-xl liquid-glass-strong"
                  aria-hidden="true"
                />
              )}
              <SlidersHorizontal className="relative z-10 w-3.5 h-3.5" aria-hidden="true" />
              <span className="relative z-10">Edit times &amp; classes</span>
            </button>
          </div>

          {/* Day selector */}
          <div
            role="group"
            aria-label="Jump to day"
            className="flex items-center gap-1 p-1 rounded-2xl liquid-track overflow-x-auto max-w-full"
          >
            {WEEKDAYS_MON_SAT.map((day) => {
              const isHighlighted = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  data-haptic="selection"
                  onClick={() => onJumpToDay(day)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    isHighlighted
                      ? 'liquid-glass-strong text-[var(--accent-text)]'
                      : day === realToday
                      ? 'text-[var(--accent-text)] hover:bg-white/40 dark:hover:bg-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {DAY_SHORT_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        {tapMode === 'edit'
          ? 'Tap any class cell to edit its course details, start time, or duration. Tap any row time to adjust that slot week-wide.'
          : 'Tap any row time on the left to adjust slot start & duration, or switch to Edit times & classes to customize individual lectures.'}
      </p>

      {/* Compact Liquid Glass grid table */}
      <div className="rounded-3xl liquid-glass overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--glass-border-subtle)] bg-white/35 dark:bg-white/[0.03]">
              <th className="py-3 px-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-32">
                Time (tap to edit)
              </th>
              {WEEKDAYS_MON_SAT.map((day) => {
                const isToday = day === realToday;
                const isSelected = day === selectedDay;
                return (
                  <th key={day} className="py-2 px-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onJumpToDay(day)}
                      className={`w-full min-h-[44px] px-2 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        isToday || isSelected
                          ? 'liquid-glass-tint text-[var(--accent-text)]'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      {DAY_SHORT_LABELS[day]}
                      {isToday ? ' (Today)' : ''}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--glass-border-subtle)]">
            {TIME_SLOTS.map((slot) => {
              const slotEffective = getEffectiveSlotTimes(slot, null, slotOverrides);

              if (slot.isBreak) {
                return (
                  <tr
                    key={slot.id}
                    className="bg-amber-200/25 dark:bg-amber-950/20"
                  >
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditSlotTime(slot)}
                        aria-label={`Edit ${slot.label} timing (${slotEffective.startTime} to ${slotEffective.endTime})`}
                        className="w-full min-h-[44px] px-2 py-1.5 rounded-xl text-left hover:bg-white/45 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-mono text-amber-800 dark:text-amber-300 tabular-nums">
                          {slotEffective.startTime}–{slotEffective.endTime}
                        </span>
                        <Clock className="w-3.5 h-3.5 text-amber-700/70 dark:text-amber-300/70 shrink-0" aria-hidden="true" />
                      </button>
                    </td>
                    <td
                      colSpan={6}
                      className="py-2 px-3 text-center text-xs font-medium text-amber-900 dark:text-amber-200"
                    >
                      Lunch break ({slotEffective.endMinutes - slotEffective.startMinutes} min)
                      {slotEffective.isCustomTime ? ' · Custom' : ''}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={slot.id} className="align-top">
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEditSlotTime(slot)}
                      aria-label={`Edit ${slot.label} timing (${slotEffective.startTime} to ${slotEffective.endTime})`}
                      className="w-full min-h-[54px] px-2 py-1.5 rounded-xl text-left hover:bg-white/45 dark:hover:bg-white/[0.07] cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {slot.label}
                        </span>
                        <Clock
                          className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--accent-text)] shrink-0"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {slotEffective.startTime}–{slotEffective.endTime}
                      </div>
                      {slotEffective.isCustomTime && (
                        <div className="text-[10px] font-medium text-[var(--accent-text)]">
                          Custom slot
                        </div>
                      )}
                    </button>
                  </td>

                  {WEEKDAYS_MON_SAT.map((day) => {
                    const entry = (timetable[day] ?? []).find(
                      (e) => e.slotId === slot.id,
                    );
                    const title = entry ? getEntryDisplayTitle(entry) : '';
                    const unnamed = entry ? isEntryUnnamed(entry) : true;
                    const cellTimes = getEffectiveSlotTimes(
                      slot,
                      entry ?? null,
                      slotOverrides,
                    );
                    const hasPerLectureCustom =
                      Boolean(entry?.startTime && entry?.endTime) &&
                      (entry?.startTime !== slotEffective.startTime ||
                        entry?.endTime !== slotEffective.endTime);

                    return (
                      <td key={`${day}-${slot.id}`} className="p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!entry) return;
                            if (tapMode === 'edit' || unnamed) {
                              onEditClass(entry, slot);
                            } else {
                              onJumpToDay(day);
                            }
                          }}
                          aria-label={
                            tapMode === 'edit'
                              ? `Edit ${DAY_LABELS[day]} ${slot.label}: ${title}`
                              : unnamed
                              ? `Assign ${DAY_LABELS[day]} ${slot.label}: ${title}`
                              : `Open ${DAY_LABELS[day]} ${slot.label}: ${title}`
                          }
                          className={`w-full min-h-[58px] rounded-2xl px-2.5 py-2 text-left cursor-pointer ${
                            unnamed
                              ? 'liquid-glass-muted text-slate-500 dark:text-slate-400 hover:border-[var(--glass-tint-border)]'
                              : 'liquid-glass-tint text-slate-900 dark:text-slate-100 hover:opacity-95'
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">
                            {title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {entry?.room ? entry.room : entry?.slotCode}
                          </div>
                          {hasPerLectureCustom && (
                            <div className="mt-0.5 text-[10px] font-mono text-[var(--accent-text)] tabular-nums truncate">
                              {cellTimes.startTime}–{cellTimes.endTime}
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
