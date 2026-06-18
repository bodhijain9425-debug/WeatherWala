import { useEffect, useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { NOW_STEP, TOTAL_STEPS } from '../../constants/layers';
import { buildTimelineSteps, formatDayLabel, formatStepLabel } from '../../utils/timeline';

const TRACE_WIDTH = 100;
const TRACE_HEIGHT = 28;
const NOW_PERCENT = (NOW_STEP / (TOTAL_STEPS - 1)) * 100;

/** A point on the decorative "data trace" — purely illustrative, deterministic per index. */
function tracePoint(i: number): string {
  const x = (i / (TOTAL_STEPS - 1)) * TRACE_WIDTH;
  const y = TRACE_HEIGHT / 2 + Math.sin(i * 0.7) * 6 + Math.sin(i * 0.23) * 4;
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

export function TimelineBar() {
  const timelineIndex = useAppStore((s) => s.timelineIndex);
  const setTimelineIndex = useAppStore((s) => s.setTimelineIndex);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const togglePlaying = useAppStore((s) => s.togglePlaying);

  const steps = useMemo(() => buildTimelineSteps(), []);
  const currentStep = steps[timelineIndex];

  // Recorded (solid) and forecast (dashed) halves of the trace, meeting at "now".
  const pastPoints = useMemo(
    () => Array.from({ length: NOW_STEP + 1 }, (_, i) => tracePoint(i)).join(' '),
    [],
  );
  const futurePoints = useMemo(
    () => Array.from({ length: TOTAL_STEPS - NOW_STEP }, (_, i) => tracePoint(i + NOW_STEP)).join(' '),
    [],
  );

  // Auto-advance playback through the timeline.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const { timelineIndex: current, setTimelineIndex: set } = useAppStore.getState();
      set((current + 1) % TOTAL_STEPS);
    }, 600);
    return () => clearInterval(id);
  }, [isPlaying]);

  return (
    <div className="glass-panel pointer-events-auto px-4 py-3 sm:px-5 sm:py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="data-readout text-xs text-ink sm:text-sm">{formatStepLabel(currentStep)}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            currentStep.isNow
              ? 'bg-marigold/15 text-marigold'
              : currentStep.isForecast
                ? 'bg-panel-border text-mist'
                : 'bg-monsoon/15 text-monsoon'
          }`}
        >
          {currentStep.isNow ? 'Now' : currentStep.isForecast ? 'Forecast' : 'Recorded'}
        </span>
      </div>

      <div className="relative mb-1.5 h-7 w-full">
        <svg
          viewBox={`0 0 ${TRACE_WIDTH} ${TRACE_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <polyline
            points={pastPoints}
            fill="none"
            stroke="#4FD1C5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={futurePoints}
            fill="none"
            stroke="#3A4560"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-trace-flow"
          />
        </svg>

        {/* "Now" marker on the trace — fixed reference point, independent of the scrubber */}
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-pulse-dot rounded-full bg-marigold/50"
          style={{ left: `${NOW_PERCENT}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-marigold"
          style={{ left: `${NOW_PERCENT}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlaying}
          aria-label={isPlaying ? 'Pause timeline playback' : 'Play timeline'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-border text-ink transition-colors hover:bg-monsoon/20 hover:text-monsoon"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <input
          type="range"
          min={0}
          max={TOTAL_STEPS - 1}
          step={1}
          value={timelineIndex}
          onChange={(e) => setTimelineIndex(Number(e.target.value))}
          className="timeline-range"
          aria-label="Timeline position"
          aria-valuetext={formatStepLabel(currentStep)}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-mist">
        <span>{formatDayLabel(steps[0])}</span>
        <span className="text-marigold">Now</span>
        <span>{formatDayLabel(steps[TOTAL_STEPS - 1])}</span>
      </div>
    </div>
  );
}
