import React, { useEffect, useState } from 'react';
import { X, History, ArrowRight } from 'lucide-react';
import { fetchHistory } from '../services/api';

export default function HistoryModal({ isOpen, onClose, onSelectHistoryPlaylist }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>Saved Generation History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reload the exact tracklist from your earlier sessions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading saved sessions...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No saved sessions yet. Generate a playlist to save your first session.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.playlist_id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                      {item.curve_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{item.track_count} tracks</span>
                    <span>&bull;</span>
                    <span>{item.actual_duration_formatted}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400">Fit: {Math.round(item.overall_fit_score * 100)}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectHistoryPlaylist(item.playlist_id);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all shrink-0"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
