import React from 'react';
import { Play, Square, Music } from 'lucide-react';

export default function TracklistTable({ playlist, activeTrackId, onPlayTrack, onStopAudio }) {
  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
    return null;
  }

  const tracks = playlist.tracks;
  const transitions = playlist.transitions || [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span>Structured Track Sequence ({tracks.length} Tracks)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Duration: <span className="font-mono text-cyan-300 font-semibold">{playlist.actual_duration_formatted}</span> &bull; Genres: <span className="text-slate-300">{playlist.genres_used.join(', ')}</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-12 text-center">Preview</th>
              <th className="py-3 px-4">Track Title & Artist</th>
              <th className="py-3 px-3">Genre</th>
              <th className="py-3 px-3 text-center">Duration</th>
              <th className="py-3 px-3 text-center">BPM</th>
              <th className="py-3 px-3 text-center">Key (Camelot)</th>
              <th className="py-3 px-4">Energy Level</th>
              <th className="py-3 px-4">Transition to Next</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {tracks.map((track, idx) => {
              const isPlaying = activeTrackId === track.id;
              const transition = transitions[idx] || null;
              const mins = Math.floor(track.duration_seconds / 60);
              const secs = track.duration_seconds % 60;
              const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

              return (
                <tr
                  key={track.id}
                  className={`transition-colors ${
                    isPlaying
                      ? 'bg-cyan-950/40 text-white'
                      : 'hover:bg-slate-850/60 text-slate-300'
                  }`}
                >
                  {/* Position */}
                  <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500 font-semibold">
                    {idx + 1}
                  </td>

                  {/* Audio Preview Button */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => (isPlaying ? onStopAudio() : onPlayTrack(track))}
                      aria-label={`${isPlaying ? 'Stop preview of' : 'Play synthesized preview of'} ${track.title} by ${track.artist}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:bg-cyan-500 hover:text-slate-950'
                      }`}
                      title={isPlaying ? "Stop audio preview" : "Synthesize 8-beat audio preview"}
                    >
                      {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                  </td>

                  {/* Title & Artist */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white leading-tight">{track.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{track.artist}</div>
                  </td>

                  {/* Genre badge */}
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {track.genre}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-400">
                    {formattedDuration}
                  </td>

                  {/* BPM */}
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-200">
                    {track.bpm}
                  </td>

                  {/* Key & Camelot */}
                  <td className="py-3.5 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-[11px]">
                      {track.camelot_code}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                      {track.musical_key}
                    </span>
                  </td>

                  {/* Energy Meter */}
                  <td className="py-3.5 px-4 min-w-[130px]">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 rounded-full"
                          style={{ width: `${Math.round(track.energy * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-300 w-8 text-right">
                        {Math.round(track.energy * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Transition to next track */}
                  <td className="py-3.5 px-4">
                    {transition ? (
                      <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          transition.camelot_compatible
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {transition.camelot_compatible ? 'Harmonic ✓' : `Δ ${transition.camelot_distance}h`}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">Δ{transition.bpm_delta} BPM</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-cyan-400 font-bold">{Math.round(transition.transition_score * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono italic">Finale Track</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
