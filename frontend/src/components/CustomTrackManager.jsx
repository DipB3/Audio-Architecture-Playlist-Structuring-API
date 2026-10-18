import React, { useState } from 'react';
import { Music2, Plus, Trash2 } from 'lucide-react';
import { addCustomTrack, removeCustomTrack } from '../services/api';

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

  return <section id="custom-tracks" aria-labelledby="custom-tracks-title" className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5 space-y-4">
    <div className="flex items-start gap-3">
      <span className="p-2 rounded-xl bg-cyan-950 text-cyan-300"><Music2 aria-hidden="true" size={19} /></span>
      <div>
        <h2 id="custom-tracks-title" className="font-bold text-white">Bring your own track metadata</h2>
        <p className="text-sm text-slate-300">Add song metadata to the optimizer. No audio file is uploaded; previews are synthesized motifs.</p>
      </div>
    </div>
    <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="field-label">Title<input required maxLength="80" value={form.title} onChange={e => update('title', e.target.value)} /></label>
      <label className="field-label">Artist<input required maxLength="80" value={form.artist} onChange={e => update('artist', e.target.value)} /></label>
      <label className="field-label">Genre<input required maxLength="80" list="catalog-genres" value={form.genre} onChange={e => update('genre', e.target.value)} /><datalist id="catalog-genres">{genres.map(genre => <option key={genre.name} value={genre.name} />)}</datalist></label>
      <label className="field-label">Duration (seconds)<input required type="number" min="30" max="900" step="1" value={form.duration_seconds} onChange={e => update('duration_seconds', e.target.value)} /></label>
      <label className="field-label">Tempo (BPM)<input required type="number" min="40" max="220" step="0.1" value={form.bpm} onChange={e => update('bpm', e.target.value)} /></label>
      <label className="field-label">Energy (0–1)<input required type="number" min="0" max="1" step="0.01" value={form.energy} onChange={e => update('energy', e.target.value)} /></label>
      <label className="field-label">Camelot key<select value={form.camelot_code} onChange={e => update('camelot_code', e.target.value)}>{['A', 'B'].flatMap(mode => Array.from({ length: 12 }, (_, i) => `${i + 1}${mode}`)).map(code => <option key={code}>{code}</option>)}</select></label>
      <label className="field-label">Musical key<input required maxLength="40" value={form.musical_key} onChange={e => update('musical_key', e.target.value)} /></label>
      <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-4 py-2 disabled:opacity-50"><Plus size={16} aria-hidden="true" />Add track</button>
        <span className="text-xs text-slate-400">{tracks.length} custom tracks · stored locally or in DynamoDB when deployed</span>
      </div>
    </form>
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {tracks.length > 0 && <div className="space-y-2 max-h-56 overflow-auto" aria-label="Custom track catalog">{tracks.map(track =>
      <div key={track.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-2 text-sm">
        <span><strong className="text-white">{track.title}</strong> · {track.artist} · {track.genre} · {track.bpm} BPM</span>
        <button type="button" disabled={busy} onClick={() => remove(track)} aria-label={`Remove ${track.title}`} className="p-2 rounded-lg text-rose-300 hover:bg-rose-950 disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /></button>
      </div>)}</div>}
  </section>;
}
