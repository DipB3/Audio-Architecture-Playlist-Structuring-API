import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { fetchHistory } from '../services/api';
import useDialogFocus from './useDialogFocus';

export default function HistoryModal({ isOpen, onClose, onSelectHistoryPlaylist }) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
        .then((data) => setHistory(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="history-title" className="dialog-sheet max-w-2xl">
        <div className="dialog-head">
          <div>
            <p className="eyebrow">History</p>
            <h2 id="history-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">Saved sessions</h2>
            <p className="text-sm text-muted mt-1">Reload the exact tracklist from an earlier session.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close history dialog" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto px-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted" role="status">Loading saved sessions…</p>
          ) : history.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No saved sessions yet. Generate a playlist to save your first one.</p>
          ) : (
            <ul>
              {history.map((item) => (
                <li key={item.playlist_id} className="border-b border-rule last:border-b-0">
                  <button type="button"
                    onClick={() => { onSelectHistoryPlaylist(item.playlist_id); onClose(); }}
                    className="group w-full text-left flex items-center gap-4 py-4 hover:text-accent-ink">
                    <span className="flex-1 min-w-0">
                      <span className="block font-display text-lg font-medium truncate">{item.name}</span>
                      <span className="block font-mono text-xs text-muted mt-0.5">
                        {item.curve_type.replace(/_/g, ' ')} / {item.track_count} tracks / {item.actual_duration_formatted} / fit {Math.round(item.overall_fit_score * 100)}%
                      </span>
                    </span>
                    <span className="text-sm font-semibold shrink-0 flex items-center gap-1">Load <ArrowRight aria-hidden="true" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
