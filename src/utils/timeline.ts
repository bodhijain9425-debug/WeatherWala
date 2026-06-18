import { NOW_STEP, STEPS_PER_DAY, TOTAL_STEPS } from '../constants/layers';
import type { TimelineStep } from '../types/weather';

/**
 * Builds the full list of timeline steps, anchored so that `NOW_STEP`
 * corresponds to the current time.
 */
export function buildTimelineSteps(referenceDate: Date = new Date()): TimelineStep[] {
  const hoursPerStep = 24 / STEPS_PER_DAY;
  const steps: TimelineStep[] = [];

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const offsetHours = (i - NOW_STEP) * hoursPerStep;
    const date = new Date(referenceDate.getTime() + offsetHours * 60 * 60 * 1000);
    steps.push({
      index: i,
      date,
      isForecast: i > NOW_STEP,
      isNow: i === NOW_STEP,
    });
  }

  return steps;
}

export function formatStepLabel(step: TimelineStep): string {
  const dayLabel = step.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeLabel = step.date.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
  return `${dayLabel}, ${timeLabel}`;
}

export function formatDayLabel(step: TimelineStep): string {
  if (step.isNow) return 'Now';
  return step.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}
