import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, RotateCcw, X } from 'lucide-react';
import { parseTimeToMinutes } from '../data/preloadedTimetable';
import type { SlotId, SlotTimeOverrides, SlotTimeRange, TimeSlotDef } from '../types/timetable';
import { sheetBackdropVariants, sheetPanelVariants } from '../utils/fluidMotion';
import {
  computeDurationMinutes,
  computeEndTimeFromDuration,
  formatTimeRange,
  getEffectiveSlotTimes,
  isValidTimeRange,
} from '../utils/timetableLogic';

interface SlotTimeSheetProps {
  slot: TimeSlotDef | null;
  slotOverrides?: SlotTimeOverrides;
  onClose: () => void;
  onSave: (slotId: SlotId, range: SlotTimeRange | null) => void;
}

const BREAK_DURATION_PRESETS = [5, 10, 15, 20, 30];
const CLASS_DURATION_PRESETS = [45, 60, 75, 90, 120];

export const SlotTimeSheet: React.FC<SlotTimeSheetProps> = ({
  slot,
  slotOverrides,
  onClose,
  onSave,
}) => {
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slot) return;
    const effective = getEffectiveSlotTimes(slot, null, slotOverrides);
    setStartTime(effective.startTime);
    setEndTime(effective.endTime);
    setDurationMinutes(
      Math.max(5, computeDurationMinutes(effective.startTime, effective.endTime)),
    );
    setError(null);
  }, [slot, slotOverrides]);

  useEffect(() => {
    if (!slot) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slot, onClose]);

  const defaultDuration = slot ? Math.max(5, slot.endMinutes - slot.startMinutes) : 90;
  const presets = slot?.isBreak ? BREAK_DURATION_PRESETS : CLASS_DURATION_PRESETS;
  const isModifiedFromDefault = slot
    ? startTime !== slot.startTime || endTime !== slot.endTime
    : false;

  const handleStartTimeChange = (nextStart: string) => {
    setStartTime(nextStart);
    if (nextStart) {
      const safeDur = Math.max(5, durationMinutes || defaultDuration);
      const nextEnd = computeEndTimeFromDuration(nextStart, safeDur);
      setEndTime(nextEnd);
      if (parseTimeToMinutes(nextEnd) > parseTimeToMinutes(nextStart)) {
        setError(null);
      }
    }
  };

  const handleDurationChange = (nextDuration: number) => {
    const clamped = Math.max(5, Math.min(360, Math.round(nextDuration)));
    setDurationMinutes(clamped);
    if (startTime) {
      const nextEnd = computeEndTimeFromDuration(startTime, clamped);
      setEndTime(nextEnd);
      if (parseTimeToMinutes(nextEnd) > parseTimeToMinutes(startTime)) {
        setError(null);
      } else {
        setError('End time exceeds 23:59. Pick an earlier start time or shorter duration.');
      }
    }
  };

  const handleEndTimeChange = (nextEnd: string) => {
    setEndTime(nextEnd);
    if (startTime && nextEnd) {
      if (isValidTimeRange(startTime, nextEnd)) {
        setDurationMinutes(computeDurationMinutes(startTime, nextEnd));
        setError(null);
      } else {
        setError('End time must be after start time.');
      }
    }
  };

  const handleResetDefault = () => {
    if (!slot) return;
    onSave(slot.id, null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    if (!isValidTimeRange(startTime, endTime)) {
      setError('End time must be after start time.');
      return;
    }
    if (startTime === slot.startTime && endTime === slot.endTime) {
      onSave(slot.id, null);
    } else {
      onSave(slot.id, { startTime, endTime });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {slot ? (
        <motion.div
          key="slot-time-backdrop"
          variants={sheetBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/35 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-time-sheet-title"
          onClick={onClose}
        >
          <motion.div
            key={slot.id}
            variants={sheetPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl liquid-glass-strong max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-slate-400/40 dark:bg-white/25" />
            </div>

            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-[var(--glass-border-subtle)] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--accent-text)]">
                  Weekly schedule slot
                </p>
                <h2
                  id="slot-time-sheet-title"
                  className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  {slot.label} timing
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Default: {formatTimeRange(slot.startTime, slot.endTime)} ({defaultDuration} min)
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close slot timing"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Updates {slot.label} across Monday–Saturday unless an individual lecture has its own custom time.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="slot-start-time"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Start time
                  </label>
                  <input
                    id="slot-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="slot-end-time"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    End time
                  </label>
                  <input
                    id="slot-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="slot-duration-min"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Duration (minutes)
                  </label>
                  <input
                    id="slot-duration-min"
                    type="number"
                    min={5}
                    max={360}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) handleDurationChange(val);
                    }}
                    className="w-24 min-h-[38px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3 py-1 text-right text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Duration presets">
                  {presets.map((mins) => {
                    const active = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        data-haptic="selection"
                        aria-pressed={active}
                        onClick={() => handleDurationChange(mins)}
                        className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold font-mono tabular-nums border cursor-pointer ${
                          active
                            ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-fg)] border-transparent'
                            : 'bg-white/50 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-[var(--glass-border-subtle)] hover:border-[var(--glass-tint-border)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-border-subtle)]">
                {isModifiedFromDefault ? (
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Reset to default
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-haptic="success"
                    className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-solid)] text-[var(--accent-solid-fg)] hover:bg-[var(--accent-solid-hover)] cursor-pointer"
                  >
                    Save slot time
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
