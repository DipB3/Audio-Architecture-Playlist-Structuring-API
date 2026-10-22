import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addCustomTrack, removeCustomTrack } from '../services/api';
import { genreColor } from './genreColors';

const initial = { title: '', artist: '', genre: 'Indie Pop', duration_seconds: 210,
  bpm: 110, energy: .55, camelot_code: '8B', musical_key: 'C Major' };

export default function CustomTrackManager({ genres, tracks, onChanged }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const add = async event => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const track = await addCustomTrack({ ...form,
        duration_seconds: Number(form.duration_seconds), bpm: Number(form.bpm), energy: Number(form.energy) });
      setMessage(`${track.title} added. Select its genre and generate a new playlist to include it.`);
      setForm(initial);
      await onChanged();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const remove = async track => {
    if (!window.confirm(`Remove ${track.title} from the custom catalog? Saved playlists will remain unchanged.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await removeCustomTrack(track.id);
      setMessage(`${track.title} removed from the catalog.`);
      await onChanged();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <section id="custom-tracks" aria-labelledby="custom-tracks-title"
    className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-12 gap-y-6 border-t-[1.5px] border-ink pt-8">
    <div>
      <p className="eyebrow">Your catalog</p>
      <h2 id="custom-tracks-title" className="mt-2 font-display text-3xl font-semibold tracking-tight">Bring your own tracks</h2>
      <p className="mt-3 text-sm text-ink-soft max-w-sm">Add a song's metadata and the optimizer can place it. Nothing is uploaded; previews are synthesized from the tempo and key.</p>
      <p className="mt-4 font-mono text-xs text-muted">{tracks.length} custom {tracks.length === 1 ? 'track' : 'tracks'} · stored locally, or in DynamoDB when deployed</p>
    </div>

    <div className="space-y-6">
      <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
        <label className="field col-span-2">Title<input className="field-input" required maxLength="80" value={form.title} onChange={e => update('title', e.target.value)} /></label>
        <label className="field col-span-2">Artist<input className="field-input" required maxLength="80" value={form.artist} onChange={e => update('artist', e.target.value)} /></label>
        <label className="field col-span-2">Genre<input className="field-input" required maxLength="80" list="catalog-genres" value={form.genre} onChange={e => update('genre', e.target.value)} /><datalist id="catalog-genres">{genres.map(genre => <option key={genre.name} value={genre.name} />)}</datalist></label>
        <label className="field col-span-2">Musical key<input className="field-input" required maxLength="40" value={form.musical_key} onChange={e => update('musical_key', e.target.value)} /></label>
        <label className="field">Length (s)<input className="field-input font-mono" required type="number" min="30" max="900" step="1" value={form.duration_seconds} onChange={e => update('duration_seconds', e.target.value)} /></label>
        <label className="field">Tempo (BPM)<input className="field-input font-mono" required type="number" min="40" max="220" step="0.1" value={form.bpm} onChange={e => update('bpm', e.target.value)} /></label>
        <label className="field">Energy (0–1)<input className="field-input font-mono" required type="number" min="0" max="1" step="0.01" value={form.energy} onChange={e => update('energy', e.target.value)} /></label>
        <label className="field">Camelot key<select className="field-input font-mono" value={form.camelot_code} onChange={e => update('camelot_code', e.target.value)}>{['A', 'B'].flatMap(mode => Array.from({ length: 12 }, (_, i) => `${i + 1}${mode}`)).map(code => <option key={code}>{code}</option>)}</select></label>
        <div className="col-span-2 sm:col-span-4">
          <button type="submit" disabled={busy} className="btn btn-ink"><Plus size={16} aria-hidden="true" />Add track</button>
        </div>
      </form>
      {message && <p role="status" className="text-sm text-olive">{message}</p>}
      {error && <p role="alert" className="text-sm text-accent-ink">{error}</p>}
      {tracks.length > 0 && <ul className="max-h-60 overflow-auto border-t border-rule" aria-label="Custom track catalog">{tracks.map(track =>
        <li key={track.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-rule text-sm">
          <span className="flex items-center gap-3 min-w-0">
            <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: genreColor(track.genre) }} />
            <span className="truncate"><strong className="font-semibold">{track.title}</strong> <span className="text-muted">— {track.artist}</span></span>
          </span>
          <span className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:inline font-mono text-xs text-muted">{track.genre} · {track.bpm} BPM</span>
            <button type="button" disabled={busy} onClick={() => remove(track)} aria-label={`Remove ${track.title}`} className="icon-btn disabled:opacity-50"><X size={16} aria-hidden="true" /></button>
          </span>
        </li>)}</ul>}
    </div>
  </section>;
}
