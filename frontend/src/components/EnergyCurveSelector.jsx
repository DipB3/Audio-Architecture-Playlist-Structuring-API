import React from 'react';
import { Mountain, TrendingUp, TrendingDown, Activity, Minus, Sun, Sliders } from 'lucide-react';

const PRESET_ICONS = {
  pomodoro_peak: Mountain,
  linear_ascent: TrendingUp,
  linear_descent: TrendingDown,
  wave_interval: Activity,
  steady_flow: Minus,
  sunset_chill: Sun,
  custom: Sliders,
};

// Mini SVG sparklines for the curves
const CURVE_PATHS = {
  pomodoro_peak: "M 0 35 C 15 35, 20 10, 50 8 C 80 10, 85 35, 100 35",
  linear_ascent: "M 0 35 L 100 5",
  linear_descent: "M 0 5 L 100 35",
  wave_interval: "M 0 20 Q 25 2, 50 20 T 100 20",
  steady_flow: "M 0 20 Q 25 18, 50 20 T 100 20",
  sunset_chill: "M 0 8 C 40 8, 45 32, 100 34",
  custom: "M 0 30 L 30 12 L 70 25 L 100 8",
};

export default function EnergyCurveSelector({ presets, selectedCurve, onSelectCurve }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 id="curve-title" className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
          <span>1. Energy Profile Architecture</span>
          <span className="text-xs font-normal text-slate-400">(Mathematical Flow Curve)</span>
        </h3>
      </div>

      <div role="group" aria-labelledby="curve-title" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {presets.map((preset) => {
          const isSelected = selectedCurve === preset.id;
          const Icon = PRESET_ICONS[preset.id] || Activity;
          const path = CURVE_PATHS[preset.id] || "M 0 20 L 100 20";

          return (
            <button type="button" aria-pressed={isSelected}
              key={preset.id}
              onClick={() => onSelectCurve(preset.id)}
              className={`relative text-left cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {preset.name}
                    </h3>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {preset.description}
                </p>
              </div>

              {/* Sparkline curve preview */}
              <div className="h-10 w-full bg-slate-950/60 rounded-lg p-1.5 flex items-center justify-center border border-slate-800/60">
                <svg aria-hidden="true" viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={`grad-${preset.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? `url(#grad-${preset.id})` : "#64748b"}
                    strokeWidth={isSelected ? "2.5" : "1.75"}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
