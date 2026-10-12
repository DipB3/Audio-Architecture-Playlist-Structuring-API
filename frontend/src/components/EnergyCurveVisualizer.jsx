import React, { useState } from 'react';
import { Activity } from 'lucide-react';

const GENRE_DOT_COLORS = {
  "Contemporary Classical Piano": "#f59e0b",
  "Indie Pop": "#ec4899",
  "Hip-Hop": "#8b5cf6",
  "Ambient": "#14b8a6",
  "Deep House": "#3b82f6",
  "Synthwave": "#d946ef",
  "Neo-Soul": "#10b981"
};

export default function EnergyCurveVisualizer({ playlist, activeTrackId, onTrackSelect }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!playlist || !playlist.energy_trajectory || playlist.energy_trajectory.length === 0) {
    return null;
  }

  const trajectory = playlist.energy_trajectory;
  const metrics = playlist.metrics || {};

  // Build SVG path for Target Curve
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Coordinate mapping functions
  const mapX = (tFraction) => paddingX + tFraction * plotWidth;
  const mapY = (energy) => paddingY + (1.0 - energy) * plotHeight;

  // Build continuous target path
  let targetPath = "";
  trajectory.forEach((pt, idx) => {
    const x = mapX(pt.normalized_time);
    const y = mapY(pt.target_energy);
    if (idx === 0) {
      targetPath += `M ${x} ${y}`;
    } else {
      const prevX = mapX(trajectory[idx - 1].normalized_time);
      const prevY = mapY(trajectory[idx - 1].target_energy);
      const cX1 = prevX + (x - prevX) / 2;
      const cX2 = prevX + (x - prevX) / 2;
      targetPath += ` C ${cX1} ${prevY}, ${cX2} ${y}, ${x} ${y}`;
    }
  });

  if (playlist.diagnostics?.target_samples?.length) {
    targetPath = playlist.diagnostics.target_samples.map((point, index) =>
      `${index ? 'L' : 'M'} ${mapX(point.time_fraction)} ${mapY(point.energy)}`).join(' ');
  }

  // Build actual playlist stepped path
  let actualPath = "";
  trajectory.forEach((pt, idx) => {
    const x = mapX(pt.normalized_time);
    const y = mapY(pt.actual_energy);
    if (idx === 0) {
      actualPath += `M ${x} ${y}`;
    } else {
      actualPath += ` L ${x} ${y}`;
    }
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Title & Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Acoustic Energy Trajectory: Target Curve vs Structured Tracklist
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verification of continuous energy flow, tempo alignment, and harmonic transitions.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs">
            <span className="text-[10px] uppercase text-cyan-500 font-sans block">Overall Fit</span>
            <span className="font-bold text-sm">{Math.round(metrics.overall_fit_score * 100)}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs">
            <span className="text-[10px] uppercase text-emerald-500 font-sans block">Harmonic Match</span>
            <span className="font-bold text-sm">{Math.round(metrics.harmonic_compatibility_rate)}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs">
            <span className="text-[10px] uppercase text-indigo-500 font-sans block">Tempo Smoothness</span>
            <span className="font-bold text-sm">{Math.round(metrics.tempo_smoothness_score * 100)}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/80 text-purple-300 text-xs">
            <span className="text-[10px] uppercase text-purple-500 font-sans block">Duration Precision</span>
            <span className="font-bold text-sm">{Math.round(metrics.duration_accuracy_percent)}%</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative bg-slate-950 rounded-xl p-2 border border-slate-800/80 overflow-hidden">
        {/* Hover card */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 border border-cyan-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-64 pointer-events-none transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-cyan-400 font-bold">Track #{hoveredPoint.index}</span>
              <span className="text-[10px] text-slate-400 font-mono">{hoveredPoint.time_formatted}</span>
            </div>
            <p className="font-bold text-white text-xs truncate">{hoveredPoint.track_title}</p>
            <p className="text-[11px] text-slate-300 truncate">{hoveredPoint.artist}</p>
            <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-400">
              <div>BPM: <span className="text-slate-200 font-bold">{hoveredPoint.bpm}</span></div>
              <div>Key: <span className="text-slate-200 font-bold">{hoveredPoint.camelot_code}</span></div>
              <div>Actual E: <span className="text-emerald-400 font-bold">{hoveredPoint.actual_energy}</span></div>
              <div>Target E: <span className="text-cyan-400 font-bold">{hoveredPoint.target_energy}</span></div>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Energy Error Delta: <span className={Math.abs(hoveredPoint.energy_delta) <= 0.1 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {hoveredPoint.energy_delta > 0 ? `+${hoveredPoint.energy_delta}` : hoveredPoint.energy_delta}
              </span>
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="targetGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.50, 0.75].map((level) => (
            <line
              key={level}
              x1={paddingX}
              y1={mapY(level)}
              x2={svgWidth - paddingX}
              y2={mapY(level)}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}

          {/* Energy Y-axis Labels */}
          <text x={paddingX - 8} y={mapY(0.85)} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">HIGH (0.85)</text>
          <text x={paddingX - 8} y={mapY(0.50)} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">MID (0.50)</text>
          <text x={paddingX - 8} y={mapY(0.20)} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">LOW (0.20)</text>

          {/* Target Energy Curve Path (Smooth Gradient) */}
          <path
            d={targetPath}
            fill="none"
            stroke="url(#targetGlow)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Actual Playlist Step Line */}
          <path
            d={actualPath}
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Actual Track Points */}
          {trajectory.map((pt, idx) => {
            const cx = mapX(pt.normalized_time);
            const cy = mapY(pt.actual_energy);
            const targetY = mapY(pt.target_energy);
            const dotColor = GENRE_DOT_COLORS[pt.genre] || "#38bdf8";
            const isActive = activeTrackId === pt.track_id;

            return (
              <g key={idx} className="cursor-pointer" onClick={() => onTrackSelect && onTrackSelect(pt.track_id)}>
                {/* Error connector line */}
                <line
                  x1={cx}
                  y1={targetY}
                  x2={cx}
                  y2={cy}
                  stroke="#334155"
                  strokeWidth="1"
                />

                {/* Outer halo when active or hovered */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    className="animate-ping"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? "7" : "5"}
                  fill={dotColor}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Time X-axis labels */}
          <text x={paddingX} y={svgHeight - 6} fill="#64748b" fontSize="9" textAnchor="start" fontFamily="monospace">00:00 (Start)</text>
          <text x={svgWidth / 2} y={svgHeight - 6} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">50% Session Mark</text>
          <text x={svgWidth - paddingX} y={svgHeight - 6} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{playlist.actual_duration_formatted} (End)</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1 rounded bg-gradient-to-r from-cyan-400 to-pink-500 inline-block"></span>
            <span className="text-slate-300 font-medium">Target Energy Curve E(t)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span>Structured Track Points (Hover to inspect)</span>
          </div>
        </div>

        {/* Genre Color Code Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(GENRE_DOT_COLORS).map(([gName, color]) => (
            <div key={gName} className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }}></span>
              <span className="text-[10px] text-slate-400">{gName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
