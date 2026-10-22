import { useState } from 'react';

export default function SessionControls({ options, onChange, catalog, name, onNameChange }) {
  const [query, setQuery] = useState('');
  const update = (key, value) => onChange({ ...options, [key]: value });
  const tracks = (catalog || []).filter((track, index, all) =>
    all.findIndex(item => item.id === track.id) === index &&
    (track.title + ' ' + track.artist).toLowerCase().includes(query.toLowerCase()));
  const excludedCount = options.excluded_track_ids.length;
  return (
    <details className="group border-b border-rule">
      <summary className="flex items-center justify-between gap-4 py-3.5 cursor-pointer list-none">
        <span className="font-medium">Session preferences and exclusions</span>
        <span className="text-xs text-muted">
          {excludedCount > 0 && <span className="mr-3 font-mono">{excludedCount} excluded</span>}
          <span className="group-open:hidden">Adjust</span><span className="hidden group-open:inline">Close</span>
        </span>
      </summary>
      <div className="pb-6 space-y-6">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
          <label className="field">Session name
            <input value={name} maxLength={120} onChange={event => onNameChange(event.target.value)}
              placeholder="My focus session" className="field-input" />
          </label>
          <label className="field">Minimum BPM
            <input type="number" min="20" max="300" value={options.min_bpm}
              onChange={event => update('min_bpm', Number(event.target.value))} className="field-input font-mono" />
          </label>
          <label className="field">Maximum BPM
            <input type="number" min="20" max="300" value={options.max_bpm}
              onChange={event => update('max_bpm', Number(event.target.value))} className="field-input font-mono" />
          </label>
          <label className="field">
            <span>Planned crossfade <span className="font-mono font-normal">{options.crossfade_seconds}s</span></span>
            <input type="range" min="0" max="30" step="1" value={options.crossfade_seconds}
              onChange={event => update('crossfade_seconds', Number(event.target.value))} className="mt-2 w-full" />
            <span className="font-normal text-muted">Adjusts timing only; no mixed audio is rendered.</span>
          </label>
          <label className="field">
            <span>Genre variety <span className="font-mono font-normal">{Math.round(options.diversity_strength * 100)}%</span></span>
            <input type="range" min="0" max="1" step=".05" value={options.diversity_strength}
              onChange={event => update('diversity_strength', Number(event.target.value))} className="mt-2 w-full" />
          </label>
          <label className="flex items-start gap-2 text-sm self-center">
            <input type="checkbox" className="mt-1" checked={options.allow_repeats}
              onChange={event => update('allow_repeats', event.target.checked)} />
            Allow repeats when the catalog runs out
          </label>
        </div>

        {catalog?.length > 0 && <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="field flex-1 min-w-[220px]">Exclude tracks from the next generation
              <input value={query} onChange={event => setQuery(event.target.value)}
                placeholder="Search title or artist" className="field-input" />
            </label>
            {excludedCount > 0 && <button type="button" className="text-link text-sm"
              onClick={() => update('excluded_track_ids', [])}>Clear {excludedCount} exclusions</button>}
          </div>
          <div className="max-h-48 overflow-auto grid sm:grid-cols-2 gap-x-8 border-y border-rule py-2"
            aria-label="Catalog tracks to exclude">
            {tracks.map(track => <label key={track.id} className="flex gap-2 items-baseline py-1 text-sm">
              <input type="checkbox" checked={options.excluded_track_ids.includes(track.id)}
                onChange={event => update('excluded_track_ids', event.target.checked
                  ? [...options.excluded_track_ids, track.id]
                  : options.excluded_track_ids.filter(id => id !== track.id))} />
              <span className="min-w-0 truncate">{track.title} <span className="text-muted">— {track.artist}</span></span>
            </label>)}
          </div>
        </div>}
      </div>
    </details>
  );
}
