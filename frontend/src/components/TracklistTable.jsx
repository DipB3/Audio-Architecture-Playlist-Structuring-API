import React from 'react';
import { Play, Square } from 'lucide-react';
import { genreColor } from './genreColors';

const formatLength = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

export default function TracklistTable({ playlist, activeTrackId, onPlayTrack, onStopAudio }) {
  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
    return null;
  }

  const tracks = playlist.tracks;
  const transitions = playlist.transitions || [];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <h3 className="font-display text-2xl font-semibold tracking-tight">Tracklist</h3>
        <p className="text-xs text-muted">Transition columns describe the move into the next track.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-y-[1.5px] border-ink eyebrow">
              <th scope="col" className="py-2.5 pr-3 font-normal w-10">No.</th>
              <th scope="col" className="py-2.5 pr-3 font-normal w-10"><span className="sr-only">Preview</span></th>
              <th scope="col" className="py-2.5 pr-4 font-normal">Title</th>
              <th scope="col" className="py-2.5 pr-4 font-normal">Genre</th>
              <th scope="col" className="py-2.5 pr-4 font-normal text-right">Time</th>
              <th scope="col" className="py-2.5 pr-4 font-normal text-right">BPM</th>
              <th scope="col" className="py-2.5 pr-4 font-normal">Key</th>
              <th scope="col" className="py-2.5 pr-4 font-normal">Energy</th>
              <th scope="col" className="py-2.5 font-normal">Into next</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, idx) => {
              const isPlaying = activeTrackId === track.id;
              const transition = transitions[idx] || null;
              const energy = Math.round(track.energy * 100);
              return (
                <tr key={`${track.id}-${idx}`} className={`border-b border-rule ${isPlaying ? 'bg-paper-deep' : 'hover:bg-paper-deep/60'}`}>
                  <td className="py-3 pr-3 font-mono text-xs text-muted">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="py-3 pr-3">
                    <button type="button"
                      onClick={() => (isPlaying ? onStopAudio() : onPlayTrack(track))}
                      aria-label={`${isPlaying ? 'Stop preview of' : 'Play synthesized preview of'} ${track.title} by ${track.artist}`}
                      title={isPlaying ? 'Stop preview' : 'Play synthesized preview'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-[1.5px] transition-colors ${
                        isPlaying ? 'bg-accent border-accent text-paper' : 'border-ink hover:bg-ink hover:text-paper'
                      }`}>
                      {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                  </td>
                  <td className="py-3 pr-4 min-w-[200px]">
                    <div className="font-semibold leading-tight">{track.title}</div>
                    <div className="text-xs text-muted mt-0.5">{track.artist}</div>
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ backgroundColor: genreColor(track.genre) }} />
                      {track.genre}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-right">{formatLength(track.duration_seconds)}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-right">{track.bpm}</td>
                  <td className="py-3 pr-4 text-xs whitespace-nowrap">
                    <span className="font-mono font-semibold">{track.camelot_code}</span>
                    <span className="text-muted"> · {track.musical_key}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2" aria-label={`Energy ${energy}%`}>
                      <span aria-hidden="true" className="relative w-16 h-1 bg-rule">
                        <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${energy}%` }} />
                      </span>
                      <span className="font-mono text-xs w-7 text-right">{energy}</span>
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs whitespace-nowrap">
                    {transition ? (
                      <span className="flex items-center gap-3">
                        <span className={transition.camelot_compatible ? 'text-olive font-semibold' : 'text-accent-ink font-semibold'}>
                          {transition.camelot_compatible ? 'in key' : `${transition.camelot_distance}h apart`}
                        </span>
                        <span className="text-muted">Δ{transition.bpm_delta} bpm</span>
                        <span>{Math.round(transition.transition_score * 100)}%</span>
                      </span>
                    ) : (
                      <span className="text-muted italic font-sans">final track</span>
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
