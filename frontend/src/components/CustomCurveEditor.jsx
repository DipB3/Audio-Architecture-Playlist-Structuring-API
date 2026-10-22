import React, { useState } from 'react';

const DEFAULT_POINTS = [
  { time_fraction: 0.0, target_energy: 0.25 },
  { time_fraction: 0.35, target_energy: 0.85 },
  { time_fraction: 0.75, target_energy: 0.70 },
  { time_fraction: 1.0, target_energy: 0.30 }
];

export default function CustomCurveEditor({ customPoints, onChangePoints }) {
  const [points, setPoints] = useState(
    customPoints && customPoints.length >= 2 ? customPoints : DEFAULT_POINTS
  );

  const commit = (updated) => { setPoints(updated); onChangePoints(updated); };

  const handleEnergyChange = (index, newEnergy) => {
    const updated = [...points];
    updated[index] = { ...updated[index], target_energy: Math.round(parseFloat(newEnergy) * 100) / 100 };
    commit(updated);
  };

  const handleAddPoint = () => {
    if (points.length >= 8) return;
    const newFraction = Math.round(((points[points.length - 2].time_fraction + points[points.length - 1].time_fraction) / 2) * 100) / 100;
    commit([...points, { time_fraction: newFraction, target_energy: 0.5 }].sort((a, b) => a.time_fraction - b.time_fraction));
  };

  // Live preview of the shape the sliders describe.
  const path = points.map((pt, i) => `${i ? 'L' : 'M'} ${pt.time_fraction * 300} ${(1 - pt.target_energy) * 60}`).join(' ');

  return (
    <div className="mt-6 pl-4 border-l-[3px] border-accent space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Custom curve · {points.length} control points</p>
        <div className="flex gap-2">
          <button type="button" onClick={handleAddPoint} disabled={points.length >= 8} className="btn btn-line btn-small">Add point</button>
          <button type="button" onClick={() => commit(DEFAULT_POINTS)} className="btn btn-line btn-small">Reset</button>
        </div>
      </div>
      <svg aria-hidden="true" viewBox="-4 -4 308 68" className="w-full h-16">
        <line x1="0" y1="60" x2="300" y2="60" stroke="#d3c9b6" />
        <path d={path} fill="none" stroke="#c23d17" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((pt, i) => <circle key={i} cx={pt.time_fraction * 300} cy={(1 - pt.target_energy) * 60} r="3.5" fill="#1b1a17" />)}
      </svg>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        {points.map((pt, i) => (
          <label key={i} className="block text-xs">
            <span className="flex justify-between font-mono">
              <span className="text-muted">at {Math.round(pt.time_fraction * 100)}%</span>
              <span>{Math.round(pt.target_energy * 100)}%</span>
            </span>
            <input type="range" min="0.10" max="0.95" step="0.05" value={pt.target_energy}
              aria-label={`Energy at ${Math.round(pt.time_fraction * 100)}% of the session`}
              onChange={(e) => handleEnergyChange(i, e.target.value)} className="mt-1.5 w-full cursor-pointer" />
          </label>
        ))}
      </div>
    </div>
  );
}
