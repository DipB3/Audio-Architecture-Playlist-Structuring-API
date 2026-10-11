import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

export default function ParameterControls({ weights, onChangeWeights }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Advanced Mathematical Weights & Optimizer Hyperparameters</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span>{isOpen ? 'Collapse' : 'Configure Weights'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Energy Fidelity (w_e)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.energy_weight}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.energy_weight}
              onChange={(e) => onChangeWeights({ ...weights, energy_weight: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Tempo Smoothness (w_t)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.tempo_weight}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.tempo_weight}
              onChange={(e) => onChangeWeights({ ...weights, tempo_weight: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Harmonic Compatibility (w_h)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.harmonic_weight}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.harmonic_weight}
              onChange={(e) => onChangeWeights({ ...weights, harmonic_weight: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Genre Bridging (w_g)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.genre_weight}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.genre_weight}
              onChange={(e) => onChangeWeights({ ...weights, genre_weight: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
