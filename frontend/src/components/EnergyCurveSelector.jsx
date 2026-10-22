import React from 'react';

// Hand-drawn sparkline shapes for each preset.
const CURVE_PATHS = {
  pomodoro_peak: "M 2 34 C 15 34, 20 10, 50 8 C 80 10, 85 34, 98 34",
  linear_ascent: "M 2 34 L 98 6",
  linear_descent: "M 2 6 L 98 34",
  wave_interval: "M 2 20 Q 26 0, 50 20 T 98 20",
  steady_flow: "M 2 20 Q 26 16, 50 20 T 98 20",
  sunset_chill: "M 2 8 C 40 8, 45 32, 98 34",
  custom: "M 2 30 L 30 12 L 70 25 L 98 8",
};

export default function EnergyCurveSelector({ presets, selectedCurve, onSelectCurve }) {
  return (
    <div role="group" aria-labelledby="curve-title" className="grid sm:grid-cols-2 border-t border-rule">
      {presets.map((preset) => {
        const isSelected = selectedCurve === preset.id;
        return (
          <button type="button" aria-pressed={isSelected} key={preset.id}
            onClick={() => onSelectCurve(preset.id)}
            className={`group text-left flex items-center gap-4 py-3.5 pr-3 border-b border-rule transition-colors sm:odd:pr-6 sm:even:pl-6 sm:even:border-l ${
              isSelected ? 'text-ink' : 'text-ink-soft hover:text-ink'
            }`}>
            <svg aria-hidden="true" viewBox="0 0 100 40" className="w-16 h-7 shrink-0 overflow-visible">
              <path d={CURVE_PATHS[preset.id] || "M 2 20 L 98 20"} fill="none"
                stroke={isSelected ? '#c23d17' : '#1b1a17'} strokeOpacity={isSelected ? 1 : .45}
                strokeWidth={isSelected ? 3.5 : 2} strokeLinecap="round" />
            </svg>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={`font-display text-[1.05rem] ${isSelected ? 'font-semibold' : 'font-medium'}`}>{preset.name}</span>
                {isSelected && <span className="eyebrow !text-accent-ink">Selected</span>}
              </span>
              <span className="text-xs text-muted line-clamp-2 mt-0.5">{preset.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
