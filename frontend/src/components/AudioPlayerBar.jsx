import React from 'react';
import { Square, Volume2 } from 'lucide-react';

export default function AudioPlayerBar({ activeTrack, onStop }) {
  if (!activeTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-cyan-500/40 backdrop-blur-md shadow-2xl py-3 px-4 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Track Metadata */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30">
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white truncate">{activeTrack.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                {activeTrack.bpm} BPM
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 font-mono">
                {activeTrack.camelot_code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{activeTrack.artist} &bull; {activeTrack.genre}</p>
          </div>
        </div>

        {/* Animated Equalizer Wave */}
        <div className="hidden sm:flex items-center space-x-1 h-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full animate-bounce"
              style={{
                height: `${25 + ((i * 17) % 75)}%`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: '0.6s'
              }}
            ></div>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onStop}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-semibold transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Audio</span>
          </button>
        </div>

      </div>
    </div>
  );
}
