import React from 'react';
import { genreColor } from './genreColors';

export default function GenreSelector({ genres, selectedGenres, onToggleGenre, onSelectAll }) {
  return (
    <div className="space-y-4">
      <div role="group" aria-labelledby="genre-title" className="flex flex-wrap gap-2">
        {genres.map((g) => {
          const isSelected = selectedGenres.includes(g.name);
          return (
            <button type="button" aria-pressed={isSelected} key={g.name} onClick={() => onToggleGenre(g.name)}
              className="chip" title={`${g.track_count} tracks · avg ${g.avg_bpm} BPM · energy ${Math.round(g.avg_energy * 100)}%`}>
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: genreColor(g.name), boxShadow: isSelected ? '0 0 0 1.5px #f3eee4' : 'none' }} />
              <span>{g.name}</span>
              <span className={`font-mono text-[11px] ${isSelected ? 'opacity-70' : 'text-muted'}`}>{g.track_count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{selectedGenres.length} of {genres.length} selected · at least one is required</span>
        <button type="button" onClick={onSelectAll} className="text-link text-ink">
          {selectedGenres.length === genres.length ? 'Reset to three' : 'Select all'}
        </button>
      </div>
    </div>
  );
}
