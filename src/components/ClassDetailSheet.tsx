import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Clock, MapPin, RotateCcw } from 'lucide-react';
import { DAY_LABELS, parseTimeToMinutes } from '../data/preloadedTimetable';
import type { ClassEntry, SlotTimeOverrides, TimeSlotDef } from '../types/timetable';
import { sheetBackdropVariants, sheetPanelVariants } from '../utils/fluidMotion';
import {
  computeDurationMinutes,
  computeEndTimeFromDuration,
  formatTimeRange,
  getEffectiveSlotTimes,
  isValidTimeRange,
} from '../utils/timetableLogic';

interface ClassDetailSheetProps {
  entry: ClassEntry | null;
  slot: TimeSlotDef | null;
  slotOverrides?: SlotTimeOverrides;
  onClose: () => void;
  onSave: (patch: {
    courseName: string;
    courseCode: string;
    room: string;
    teacher: string;
    notes: string;
    startTime?: string;
    endTime?: string;
  }) => void;
}

const DURATION_PRESETS = [45, 60, 75, 90, 120];

export const ClassDetailSheet: React.FC<ClassDetailSheetProps> = ({
  entry,
  slot,
  slotOverrides,
  onClose,
  onSave,
}) => {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (entry && slot) {
      setCourseName(entry.courseName);
      setCourseCode(entry.courseCode);
      setRoom(entry.room);
      setTeacher(entry.teacher);
      setNotes(entry.notes);

      const effective = getEffectiveSlotTimes(slot, entry, slotOverrides);
      setStartTime(effective.startTime);
      setEndTime(effective.endTime);
      setDurationMinutes(
        Math.max(5, computeDurationMinutes(effective.startTime, effective.endTime)),
      );
      setTimeError(null);
    }
  }, [entry, slot, slotOverrides]);

  useEffect(() => {
    if (!entry) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [entry, onClose]);

  const slotBaseline =
    slot ? getEffectiveSlotTimes(slot, null, slotOverrides) : null;
  const isCustomLectureTime = slotBaseline
    ? startTime !== slotBaseline.startTime || endTime !== slotBaseline.endTime
    : false;

  const handleStartTimeChange = (nextStart: string) => {
    setStartTime(nextStart);
    if (nextStart) {
      const safeDur = Math.max(5, durationMinutes || 90);
      const nextEnd = computeEndTimeFromDuration(nextStart, safeDur);
      setEndTime(nextEnd);
      if (parseTimeToMinutes(nextEnd) > parseTimeToMinutes(nextStart)) {
        setTimeError(null);
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
        setTimeError(null);
      } else {
        setTimeError('End time exceeds 23:59. Use an earlier start time or shorter duration.');
      }
    }
  };

  const handleEndTimeChange = (nextEnd: string) => {
    setEndTime(nextEnd);
    if (startTime && nextEnd) {
      if (isValidTimeRange(startTime, nextEnd)) {
        setDurationMinutes(computeDurationMinutes(startTime, nextEnd));
        setTimeError(null);
      } else {
        setTimeError('End time must be after start time.');
      }
    }
  };

  const handleResetLectureTime = () => {
    if (!slotBaseline) return;
    setStartTime(slotBaseline.startTime);
    setEndTime(slotBaseline.endTime);
    setDurationMinutes(
      Math.max(5, computeDurationMinutes(slotBaseline.startTime, slotBaseline.endTime)),
    );
    setTimeError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotBaseline) return;
    if (!isValidTimeRange(startTime, endTime)) {
      setTimeError('End time must be after start time.');
      return;
    }

    const matchesBaseline =
      startTime === slotBaseline.startTime && endTime === slotBaseline.endTime;

    onSave({
      courseName: courseName.trim(),
      courseCode: courseCode.trim(),
      room: room.trim(),
      teacher: teacher.trim(),
      notes: notes.trim(),
      startTime: matchesBaseline ? undefined : startTime,
      endTime: matchesBaseline ? undefined : endTime,
    });
  };

  return (
    <AnimatePresence>
      {entry && slot && slotBaseline ? (
        <motion.div
          key="class-detail-backdrop"
          variants={sheetBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/35 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-sheet-title"
          onClick={onClose}
        >
          <motion.div
            key={entry.id}
            variants={sheetPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl liquid-glass-strong max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-slate-400/40 dark:bg-white/25" />
            </div>

            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-[var(--glass-border-subtle)] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--accent-text)]">
                  {DAY_LABELS[entry.day]} · {slot.label} · Slot {entry.slotCode}
                </p>
                <h2
                  id="class-sheet-title"
                  className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 truncate"
                >
                  {courseName.trim() || courseCode.trim() || `Slot ${entry.slotCode}`}
                </h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatTimeRange(startTime, endTime)} ({durationMinutes}m)
                  </span>
                  {room.trim() && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {room.trim()}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close class details"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label
                  htmlFor="input-course-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Course name
                </label>
                <input
                  id="input-course-name"
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder={
                    entry.courseCode
                      ? `Optional display name for ${entry.courseCode}`
                      : `Rename slot ${entry.slotCode} (e.g. Linear Algebra)`
                  }
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="input-course-code"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Course code
                  </label>
                  <input
                    id="input-course-code"
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. ASE2009-LP"
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-room"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Room
                  </label>
                  <input
                    id="input-room"
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. AR-103"
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                  />
                </div>
              </div>

              {/* Exact Lecture Time & Duration */}
              <div className="rounded-2xl liquid-glass-muted p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Time &amp; duration
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Slot default: {formatTimeRange(slotBaseline.startTime, slotBaseline.endTime)}
                    </p>
                  </div>
                  {isCustomLectureTime && (
                    <button
                      type="button"
                      onClick={handleResetLectureTime}
                      className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--accent-text)] hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      Reset to slot default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="input-start-time"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Start
                    </label>
                    <input
                      id="input-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/65 dark:bg-white/[0.07] px-2.5 py-2 text-xs sm:text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-duration"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Duration (min)
                    </label>
                    <input
                      id="input-duration"
                      type="number"
                      min={5}
                      max={360}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val)) handleDurationChange(val);
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/65 dark:bg-white/[0.07] px-2.5 py-2 text-xs sm:text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-end-time"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      End
                    </label>
                    <input
                      id="input-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/65 dark:bg-white/[0.07] px-2.5 py-2 text-xs sm:text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick duration presets">
                  {DURATION_PRESETS.map((mins) => {
                    const active = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        data-haptic="selection"
                        aria-pressed={active}
                        onClick={() => handleDurationChange(mins)}
                        className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold font-mono tabular-nums border cursor-pointer ${
                          active
                            ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-fg)] border-transparent'
                            : 'bg-white/55 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-[var(--glass-border-subtle)] hover:border-[var(--glass-tint-border)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>

                {timeError && (
                  <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {timeError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="input-teacher"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Teacher / Instructor
                </label>
                <input
                  id="input-teacher"
                  type="text"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="e.g. Dr. Nair"
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="input-notes"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Notes
                </label>
                <textarea
                  id="input-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bring lab manual, quiz topics, syllabus notes..."
                  className="mt-1.5 w-full rounded-xl border border-[var(--glass-border-subtle)] bg-white/60 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-solid)]/40 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
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
                  Save changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
