import React from 'react';
import { Clock } from 'lucide-react';

const DURATION_PRESETS = [20, 30, 45, 60, 90, 120];

export default function DurationPicker({ duration, onDurationChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
          <span>3. Session Duration</span>
          <span className="text-xs font-normal text-slate-400">(Listening Target)</span>
        </label>
        <div className="flex items-center space-x-1 font-mono text-cyan-400 text-sm font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>{duration} Minutes</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((mins) => (
          <button
            key={mins}
            onClick={() => onDurationChange(mins)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              duration === mins
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            {mins}m
          </button>
        ))}

        <div className="flex-1 min-w-[140px] flex items-center px-2">
          <input
            type="range"
            min="15"
            max="180"
            step="5"
            value={duration}
            onChange={(e) => onDurationChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
}
