import { useState } from 'react';

export default function SessionControls({ options, onChange, catalog, name, onNameChange }) {
  const [query, setQuery] = useState('');
  const update = (key, value) => onChange({ ...options, [key]: value });
  const tracks = (catalog || []).filter((track, index, all) =>
    all.findIndex(item => item.id === track.id) === index &&
    (track.title + ' ' + track.artist).toLowerCase().includes(query.toLowerCase()));
  return (
    <details className="rounded-xl border border-slate-800 p-4 text-xs">
      <summary className="cursor-pointer font-semibold text-cyan-300">Session preferences and track exclusions</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label>Session name
          <input value={name} maxLength={120} onChange={event => onNameChange(event.target.value)}
            placeholder="My focus session" className="mt-2 w-full rounded bg-slate-800 p-2" />
        </label>
        <label>Minimum BPM
          <input type="number" min="20" max="300" value={options.min_bpm}
            onChange={event => update('min_bpm', Number(event.target.value))}
            className="mt-2 w-full rounded bg-slate-800 p-2" />
        </label>
        <label>Maximum BPM
          <input type="number" min="20" max="300" value={options.max_bpm}
            onChange={event => update('max_bpm', Number(event.target.value))}
            className="mt-2 w-full rounded bg-slate-800 p-2" />
        </label>
        <label>Planned crossfade: {options.crossfade_seconds}s
          <input type="range" min="0" max="30" step="1" value={options.crossfade_seconds}
            onChange={event => update('crossfade_seconds', Number(event.target.value))}
            className="mt-3 w-full accent-cyan-400" />
          <span className="block mt-1 text-slate-400">Adjusts session timing. Exports do not render a mixed audio file.</span>
        </label>
        <label>Genre variety: {Math.round(options.diversity_strength * 100)}%
          <input type="range" min="0" max="1" step=".05" value={options.diversity_strength}
            onChange={event => update('diversity_strength', Number(event.target.value))}
            className="mt-3 w-full accent-cyan-400" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={options.allow_repeats}
            onChange={event => update('allow_repeats', event.target.checked)} />
          Allow repeats when the catalog runs out
        </label>
      </div>
      {catalog?.length > 0 && <div className="mt-4">
        <label>Exclude tracks from the next generation
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title or artist"
            className="mt-2 w-full rounded bg-slate-800 p-2" />
        </label>
        <div className="mt-2 max-h-40 overflow-auto grid gap-2 sm:grid-cols-2" aria-label="Catalog tracks to exclude">
          {tracks.map(track => <label key={track.id} className="flex gap-2 items-center">
            <input type="checkbox" checked={options.excluded_track_ids.includes(track.id)}
              onChange={event => update('excluded_track_ids', event.target.checked
                ? [...options.excluded_track_ids, track.id]
                : options.excluded_track_ids.filter(id => id !== track.id))} />
            {track.title} <span className="text-slate-400">{track.artist}</span>
          </label>)}
        </div>
        <button className="mt-2 text-cyan-300" onClick={() => update('excluded_track_ids', [])}>Clear exclusions</button>
      </div>}
    </details>
  );
}
