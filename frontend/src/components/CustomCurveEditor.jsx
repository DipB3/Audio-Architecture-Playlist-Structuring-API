import React, { useState } from 'react';
import { Sliders, Plus, RotateCcw, Info } from 'lucide-react';

export default function CustomCurveEditor({ customPoints, onChangePoints }) {
  const [points, setPoints] = useState(
    customPoints && customPoints.length >= 2
      ? customPoints
      : [
          { time_fraction: 0.0, target_energy: 0.25 },
          { time_fraction: 0.35, target_energy: 0.85 },
          { time_fraction: 0.75, target_energy: 0.70 },
          { time_fraction: 1.0, target_energy: 0.30 }
        ]
  );

  const handleEnergyChange = (index, newEnergy) => {
    const updated = [...points];
    updated[index].target_energy = Math.round(parseFloat(newEnergy) * 100) / 100;
    setPoints(updated);
    onChangePoints(updated);
  };

  const handleAddPoint = () => {
    if (points.length >= 8) return;
    const newFraction = Math.round(((points[points.length - 2].time_fraction + points[points.length - 1].time_fraction) / 2) * 100) / 100;
    const newPoint = { time_fraction: newFraction, target_energy: 0.5 };
    const updated = [...points, newPoint].sort((a, b) => a.time_fraction - b.time_fraction);
    setPoints(updated);
    onChangePoints(updated);
  };

  const handleReset = () => {
    const defaultPts = [
      { time_fraction: 0.0, target_energy: 0.25 },
      { time_fraction: 0.35, target_energy: 0.85 },
      { time_fraction: 0.75, target_energy: 0.70 },
      { time_fraction: 1.0, target_energy: 0.30 }
    ];
    setPoints(defaultPts);
    onChangePoints(defaultPts);
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-800/60 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Custom Curve Control Points</h4>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddPoint}
            disabled={points.length >= 8}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition-all disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
            <span>Add Point</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {points.map((pt, i) => (
          <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>t = {Math.round(pt.time_fraction * 100)}%</span>
              <span className="text-cyan-400 font-bold">{Math.round(pt.target_energy * 100)}% E</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={pt.target_energy}
              onChange={(e) => handleEnergyChange(i, e.target.value)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
