import React from 'react';
import { Check } from 'lucide-react';

const GENRE_COLORS = {
  "Contemporary Classical Piano": "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-600/40",
  "Indie Pop": "from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-600/40",
  "Hip-Hop": "from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-600/40",
  "Ambient": "from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-600/40",
  "Deep House": "from-blue-500/20 to-sky-500/20 text-blue-300 border-blue-600/40",
  "Synthwave": "from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-600/40",
  "Neo-Soul": "from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-600/40"
};

export default function GenreSelector({ genres, selectedGenres, onToggleGenre, onSelectAll }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
          <span>2. Multi-Genre Curation</span>
          <span className="text-xs font-normal text-slate-400">(Acoustic Bridging)</span>
        </label>
        <button
          onClick={onSelectAll}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          {selectedGenres.length === genres.length ? 'Clear Selection' : 'Select All Genres'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {genres.map((g) => {
          const isSelected = selectedGenres.includes(g.name);
          const colorClass = GENRE_COLORS[g.name] || "from-slate-700/20 to-slate-800/20 text-slate-300 border-slate-700";

          return (
            <div
              key={g.name}
              onClick={() => onToggleGenre(g.name)}
              className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? `bg-gradient-to-br ${colorClass} ring-1 ring-cyan-500 shadow-md`
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold leading-snug">
                  {g.name}
                </span>
                <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700'}`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{g.avg_bpm} BPM</span>
                <span>{Math.round(g.avg_energy * 100)}% E</span>
                <span>{g.track_count} trks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
