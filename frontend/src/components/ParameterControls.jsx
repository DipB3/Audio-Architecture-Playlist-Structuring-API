import React from 'react';

const WEIGHTS = [
  ['energy_weight', 'Energy fit', 'w_e'],
  ['tempo_weight', 'Tempo smoothness', 'w_t'],
  ['harmonic_weight', 'Harmonic match', 'w_h'],
  ['genre_weight', 'Genre bridging', 'w_g'],
];

export default function ParameterControls({ weights, onChangeWeights }) {
  const total = WEIGHTS.reduce((sum, [key]) => sum + weights[key], 0);
  return (
    <details className="group border-b border-rule">
      <summary className="flex items-center justify-between gap-4 py-3.5 cursor-pointer list-none">
        <span className="font-medium">Optimizer weights</span>
        <span className="text-xs text-muted">
          <span className="group-open:hidden">Adjust</span><span className="hidden group-open:inline">Close</span>
        </span>
      </summary>
      <div className="pb-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {WEIGHTS.map(([key, label, symbol]) => (
          <label key={key} className="block text-sm">
            <span className="flex items-baseline justify-between">
              <span>{label} <span className="font-mono text-xs text-muted">{symbol}</span></span>
              <span className="font-mono text-xs">
                {weights[key].toFixed(2)} <span className="text-muted">({Math.round(weights[key] / total * 100)}%)</span>
              </span>
            </span>
            <input type="range" min="0.1" max="1.0" step="0.05" value={weights[key]}
              onChange={(e) => onChangeWeights({ ...weights, [key]: parseFloat(e.target.value) })}
              className="mt-2 w-full cursor-pointer" />
          </label>
        ))}
        <p className="sm:col-span-2 text-xs text-muted">Weights are normalized, so only their proportions matter.</p>
      </div>
    </details>
  );
}
