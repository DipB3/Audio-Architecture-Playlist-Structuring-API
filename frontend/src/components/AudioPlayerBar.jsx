import React from 'react';
import { Square } from 'lucide-react';

export default function AudioPlayerBar({ activeTrack, onStop }) {
  if (!activeTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-ink text-paper" role="region" aria-label="Now playing">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div aria-hidden="true" className="flex items-end gap-[3px] h-6 shrink-0">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="eq-bar w-[3px] h-full bg-accent" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{activeTrack.title}</p>
            <p className="text-xs opacity-70 truncate font-mono">
              {activeTrack.artist} · {activeTrack.bpm} BPM · {activeTrack.camelot_code} · synthesized preview
            </p>
          </div>
        </div>
        <button type="button" onClick={onStop}
          className="shrink-0 inline-flex items-center gap-2 rounded-full border-[1.5px] border-paper px-4 py-1.5 text-sm font-semibold hover:bg-paper hover:text-ink transition-colors">
          <Square className="w-3 h-3 fill-current" aria-hidden="true" />
          Stop
        </button>
      </div>
    </div>
  );
}
