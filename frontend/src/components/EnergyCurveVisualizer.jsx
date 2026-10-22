import React, { useState } from 'react';
import { GENRE_COLORS, genreColor } from './genreColors';

const INK = '#1b1a17';
const RULE = '#d3c9b6';
const MUTED = '#6a6458';
const ACCENT = '#c23d17';

export default function EnergyCurveVisualizer({ playlist, activeTrackId, onTrackSelect }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!playlist || !playlist.energy_trajectory || playlist.energy_trajectory.length === 0) {
    return null;
  }

  const trajectory = playlist.energy_trajectory;
  const metrics = playlist.metrics || {};

  const svgWidth = 800;
  const svgHeight = 240;
  const paddingLeft = 44;
  const paddingRight = 12;
  const paddingY = 18;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingY * 2 - 14;

  const mapX = (tFraction) => paddingLeft + tFraction * plotWidth;
  const mapY = (energy) => paddingY + (1.0 - energy) * plotHeight;

  // Smooth target path from trajectory points, replaced by the dense samples when present.
  let targetPath = "";
  trajectory.forEach((pt, idx) => {
    const x = mapX(pt.normalized_time);
    const y = mapY(pt.target_energy);
    if (idx === 0) {
      targetPath += `M ${x} ${y}`;
    } else {
      const prevX = mapX(trajectory[idx - 1].normalized_time);
      const prevY = mapY(trajectory[idx - 1].target_energy);
      const cX = prevX + (x - prevX) / 2;
      targetPath += ` C ${cX} ${prevY}, ${cX} ${y}, ${x} ${y}`;
    }
  });
  if (playlist.diagnostics?.target_samples?.length) {
    targetPath = playlist.diagnostics.target_samples.map((point, index) =>
      `${index ? 'L' : 'M'} ${mapX(point.time_fraction)} ${mapY(point.energy)}`).join(' ');
  }
  const areaPath = `${targetPath} L ${mapX(1)} ${mapY(0)} L ${mapX(0)} ${mapY(0)} Z`;

  const actualPath = trajectory.map((pt, idx) =>
    `${idx ? 'L' : 'M'} ${mapX(pt.normalized_time)} ${mapY(pt.actual_energy)}`).join(' ');

  const stats = [
    ['Overall fit', Math.round(metrics.overall_fit_score * 100)],
    ['Harmonic match', Math.round(metrics.harmonic_compatibility_rate)],
    ['Tempo smoothness', Math.round(metrics.tempo_smoothness_score * 100)],
    ['Duration accuracy', Math.round(metrics.duration_accuracy_percent)],
  ];
  const usedGenres = Object.keys(GENRE_COLORS).filter(name => playlist.genres_used.includes(name))
    .concat(playlist.genres_used.filter(name => !GENRE_COLORS[name]));

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 md:grid-cols-4 border-y-[1.5px] border-ink divide-rule md:divide-x">
        {stats.map(([label, value], index) => (
          <div key={label} className={`py-4 md:px-6 md:first:pl-0 ${index < 2 ? 'border-b md:border-b-0 border-rule' : ''}`}>
            <dt className="eyebrow">{label}</dt>
            <dd className="mt-1 font-display text-4xl font-semibold tracking-tight">
              {value}<span className="text-xl text-muted font-normal">%</span>
            </dd>
          </div>
        ))}
      </dl>

      <figure>
        <figcaption className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
          <span className="font-display text-2xl font-semibold tracking-tight">Energy over time</span>
          <span className="text-xs text-muted">Hover or focus a point to inspect it; click to preview.</span>
        </figcaption>

        {/* Keeps the chart legible on phones by scrolling it sideways instead of shrinking it. */}
        <div className="relative overflow-x-auto">
          {hoveredPoint && (
            <div className="absolute top-2 right-2 z-20 w-60 bg-paper border-[1.5px] border-ink p-3 text-xs space-y-1 pointer-events-none"
              style={{ boxShadow: `4px 4px 0 ${INK}` }}>
              <p className="flex justify-between font-mono text-muted">
                <span>Track {hoveredPoint.index}</span><span>{hoveredPoint.time_formatted}</span>
              </p>
              <p className="font-semibold text-sm truncate">{hoveredPoint.track_title}</p>
              <p className="text-ink-soft truncate">{hoveredPoint.artist}</p>
              <p className="pt-1.5 mt-1 border-t border-rule grid grid-cols-2 gap-1 font-mono">
                <span>{hoveredPoint.bpm} BPM</span><span>Key {hoveredPoint.camelot_code}</span>
                <span>Actual {hoveredPoint.actual_energy}</span><span>Target {hoveredPoint.target_energy}</span>
              </p>
              <p className="font-mono">
                Δ <span className={Math.abs(hoveredPoint.energy_delta) <= 0.1 ? 'text-olive font-semibold' : 'text-accent-ink font-semibold'}>
                  {hoveredPoint.energy_delta > 0 ? `+${hoveredPoint.energy_delta}` : hoveredPoint.energy_delta}
                </span>
              </p>
            </div>
          )}

          <svg role="img" aria-label={`Energy chart showing ${trajectory.length} track points, target versus actual energy. Detailed values are in the track table below.`}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[600px] h-auto overflow-visible select-none">
            {[0, 0.25, 0.5, 0.75, 1].map((level) => (
              <g key={level}>
                <line x1={paddingLeft} y1={mapY(level)} x2={svgWidth - paddingRight} y2={mapY(level)}
                  stroke={level === 0 ? INK : RULE} strokeWidth={level === 0 ? 1.5 : 1} />
                <text x={paddingLeft - 10} y={mapY(level) + 3} fill={MUTED} fontSize="10" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                  {Math.round(level * 100)}
                </text>
              </g>
            ))}

            <path d={areaPath} fill={ACCENT} fillOpacity="0.06" />
            <path d={targetPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={actualPath} fill="none" stroke={INK} strokeWidth="1.25" strokeDasharray="3 4" />

            {trajectory.map((pt, idx) => {
              const cx = mapX(pt.normalized_time);
              const cy = mapY(pt.actual_energy);
              const isActive = activeTrackId === pt.track_id;
              const show = () => setHoveredPoint(pt);
              const hide = () => setHoveredPoint(null);
              return (
                <g key={idx} className="cursor-pointer" tabIndex={0} role="button"
                  aria-label={`Preview track ${pt.index}, ${pt.track_title}`}
                  onClick={() => onTrackSelect && onTrackSelect(pt.track_id)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onTrackSelect?.(pt.track_id); } }}
                  onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
                  <line x1={cx} y1={mapY(pt.target_energy)} x2={cx} y2={cy} stroke={INK} strokeOpacity=".25" />
                  {isActive && <circle cx={cx} cy={cy} r="11" fill="none" stroke={ACCENT} strokeWidth="2" />}
                  <circle cx={cx} cy={cy} r={isActive ? 7 : 5.5} fill={genreColor(pt.genre)} stroke="#f3eee4" strokeWidth="2" />
                </g>
              );
            })}

            <text x={paddingLeft} y={svgHeight - 4} fill={MUTED} fontSize="10" fontFamily="JetBrains Mono, monospace">0:00</text>
            <text x={paddingLeft + plotWidth / 2} y={svgHeight - 4} fill={MUTED} fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">midpoint</text>
            <text x={svgWidth - paddingRight} y={svgHeight - 4} fill={MUTED} fontSize="10" textAnchor="end" fontFamily="JetBrains Mono, monospace">{playlist.actual_duration_formatted}</text>
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
          <span className="flex items-center gap-2"><span className="w-6 h-[2.5px] bg-accent inline-block" />Target curve</span>
          <span className="flex items-center gap-2"><span className="w-6 border-t-[1.5px] border-dashed border-ink inline-block" />Tracklist energy</span>
          <span className="w-px h-4 bg-rule hidden sm:inline-block" />
          {usedGenres.map(name => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: genreColor(name) }} />{name}
            </span>
          ))}
        </div>
      </figure>
    </div>
  );
}
