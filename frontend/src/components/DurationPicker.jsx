import React from 'react';

const DURATION_PRESETS = [20, 30, 45, 60, 90, 120];

export default function DurationPicker({ duration, onDurationChange }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-10">
      <p className="shrink-0 leading-none" aria-live="polite">
        <span className="font-display text-6xl font-semibold tracking-tight">{duration}</span>
        <span className="ml-2 text-sm text-muted">minutes</span>
      </p>
      <div className="flex-1 space-y-4">
        <input aria-label="Session duration in minutes" type="range" min="15" max="180" step="5"
          value={duration} onChange={(e) => onDurationChange(parseInt(e.target.value, 10))}
          className="w-full cursor-pointer" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Duration presets">
          {DURATION_PRESETS.map((mins) => (
            <button key={mins} type="button" aria-pressed={duration === mins}
              onClick={() => onDurationChange(mins)} className="chip !py-1 !px-3 font-mono !text-xs">
              {mins}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
