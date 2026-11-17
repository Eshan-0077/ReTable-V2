import React from 'react';
import { Clock, Coffee, MapPin, ArrowRight, CheckCircle2, CalendarOff } from 'lucide-react';
import type { NowNextState, TimelineItem } from '../types/timetable';
import { formatDurationMinutes, formatTimeRange } from '../utils/timetableLogic';

interface NowNextCardProps {
  nowNext: NowNextState;
  isViewingRealToday: boolean;
  dayLabel: string;
  onSelectClass?: (item: TimelineItem) => void;
  onJumpToMonday?: () => void;
}

export const NowNextCard: React.FC<NowNextCardProps> = ({
  nowNext,
  isViewingRealToday,
  dayLabel,
  onSelectClass,
  onJumpToMonday,
}) => {
  if (!isViewingRealToday) {
    const first = nowNext.nextItem;
    return (
      <section
        aria-label="Selected day summary"
        className="rounded-3xl liquid-glass p-5 sm:p-6"
      >
        <p className="text-xs font-semibold text-[var(--accent-text)]">
          Previewing {dayLabel}
        </p>
        {first ? (
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              First class: {first.displayTitle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                {formatTimeRange(first.effectiveStartTime, first.effectiveEndTime)}
              </span>
              {first.entry?.room && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  {first.entry.room}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              No classes scheduled
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enjoy your day off.
            </p>
          </div>
        )}
      </section>
    );
  }

  if (nowNext.mode === 'no-classes') {
    return (
      <section
        aria-label="Today status"
        data-testid="now-next-card"
        className="rounded-3xl liquid-glass p-5 sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl liquid-glass-muted flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
            <CalendarOff className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Today&apos;s Status
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-50">
              No classes today
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {nowNext.nextDayLabel
                ? `Classes resume ${nowNext.nextDayLabel}.`
                : 'No upcoming classes found.'}
            </p>
            {onJumpToMonday && (
              <button
                type="button"
                onClick={onJumpToMonday}
                className="mt-4 inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent-solid)] text-[var(--accent-solid-fg)] hover:bg-[var(--accent-solid-hover)] cursor-pointer"
              >
                Preview Monday
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (nowNext.mode === 'finished') {
    return (
      <section
        aria-label="Today status"
        data-testid="now-next-card"
        className="rounded-3xl liquid-glass p-5 sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl liquid-glass-tint flex items-center justify-center shrink-0 text-[var(--accent-text)]">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--accent-text)]">
              End of day
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-50">
              All classes finished
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {nowNext.nextDayLabel
                ? `Next classes resume ${nowNext.nextDayLabel}.`
                : 'Have a restful evening.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (nowNext.mode === 'lunch' && nowNext.currentItem) {
    return (
      <section
        aria-label="Now and Next"
        data-testid="now-next-card"
        className="rounded-3xl bg-amber-100/65 dark:bg-amber-950/35 backdrop-blur-xl border border-amber-300/60 dark:border-amber-700/50 p-5 sm:p-6 shadow-[var(--glass-shadow)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Coffee className="w-4 h-4" aria-hidden="true" />
              <span>Now · Break</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDurationMinutes(nowNext.minutesRemaining ?? 0)} left
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Lunch Break
            </h2>
            <p className="mt-1 text-sm font-mono text-slate-600 dark:text-slate-300 tabular-nums">
              {formatTimeRange(
                nowNext.currentItem.effectiveStartTime,
                nowNext.currentItem.effectiveEndTime,
              )}
            </p>
          </div>
        </div>

        {nowNext.nextItem && (
          <div className="mt-4 pt-3.5 border-t border-amber-300/50 dark:border-amber-800/45 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Up next in {formatDurationMinutes(nowNext.minutesUntilNext ?? 0)}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {nowNext.nextItem.displayTitle}
                {nowNext.nextItem.entry?.room ? ` · ${nowNext.nextItem.entry.room}` : ''}
              </p>
            </div>
            {onSelectClass && (
              <button
                type="button"
                onClick={() => onSelectClass(nowNext.nextItem!)}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-[var(--accent-text)] hover:bg-amber-200/45 dark:hover:bg-amber-900/35 shrink-0 cursor-pointer"
              >
                Details
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  if (nowNext.mode === 'running' && nowNext.currentItem) {
    const cur = nowNext.currentItem;
    return (
      <section
        aria-label="Now and Next"
        data-testid="now-next-card"
        className="rounded-3xl liquid-glass-tint p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
              <span>Now in session</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDurationMinutes(nowNext.minutesRemaining ?? 0)} remaining
              </span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {cur.displayTitle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-slate-700 dark:text-slate-300 tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
                {formatTimeRange(cur.effectiveStartTime, cur.effectiveEndTime)}
              </span>
              {cur.entry?.room && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
                  {cur.entry.room}
                </span>
              )}
              {cur.entry?.slotCode && (
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  Slot {cur.entry.slotCode}
                </span>
              )}
            </div>
          </div>
          {onSelectClass && (
            <button
              type="button"
              onClick={() => onSelectClass(cur)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold liquid-glass-strong text-[var(--accent-text)] hover:opacity-90 shrink-0 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)] transition-[width] duration-300"
              style={{ width: `${nowNext.progressPercent}%` }}
            />
          </div>
        </div>

        {nowNext.nextItem && (
          <div className="mt-4 pt-3.5 border-t border-[var(--glass-tint-border)] flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0 text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Next: </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {nowNext.nextItem.displayTitle}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {' '}
                · {nowNext.nextItem.effectiveStartTime}
                {nowNext.nextItem.entry?.room ? ` · ${nowNext.nextItem.entry.room}` : ''}
              </span>
            </div>
          </div>
        )}
      </section>
    );
  }

  // Upcoming mode
  const next = nowNext.nextItem;
  return (
    <section
      aria-label="Now and Next"
      data-testid="now-next-card"
      className="rounded-3xl liquid-glass p-5 sm:p-6"
    >
      {next ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--accent-text)] tabular-nums">
              Next up · starts in {formatDurationMinutes(nowNext.minutesUntilNext ?? 0)}
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {next.displayTitle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                {formatTimeRange(next.effectiveStartTime, next.effectiveEndTime)}
              </span>
              {next.entry?.room && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  {next.entry.room}
                </span>
              )}
              {next.entry?.slotCode && (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Slot {next.entry.slotCode}
                </span>
              )}
            </div>
          </div>
          {onSelectClass && (
            <button
              type="button"
              onClick={() => onSelectClass(next)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium liquid-glass-muted text-slate-800 dark:text-slate-100 hover:border-[var(--glass-tint-border)] shrink-0 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
};
