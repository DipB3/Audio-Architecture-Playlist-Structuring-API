import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import EnergyCurveSelector from './components/EnergyCurveSelector';
import CustomCurveEditor from './components/CustomCurveEditor';
import GenreSelector from './components/GenreSelector';
import DurationPicker from './components/DurationPicker';
import ParameterControls from './components/ParameterControls';
import EnergyCurveVisualizer from './components/EnergyCurveVisualizer';
import TracklistTable from './components/TracklistTable';
import ExportModal from './components/ExportModal';
import HistoryModal from './components/HistoryModal';
import HealthModal from './components/HealthModal';
import DocsModal from './components/DocsModal';
import AudioPlayerBar from './components/AudioPlayerBar';
import SessionControls from './components/SessionControls';
import CustomTrackManager from './components/CustomTrackManager';

import { fetchGenres, fetchPresets, fetchPlaylist, fetchCustomTracks, fetchTracks, generatePlaylist } from './services/api';
import { audioSynth } from './services/audioSynthesizer';
import { ArrowRight, ArrowDown } from 'lucide-react';

const DEMO_SESSIONS = [
  { name: 'Deep work', description: 'A focused rise, steady peak, and gentle finish.', duration: 45, curve: 'pomodoro_peak', genres: ['Contemporary Classical Piano', 'Ambient', 'Neo-Soul'] },
  { name: 'Movement', description: 'Interval energy with dance-ready transitions.', duration: 60, curve: 'wave_interval', genres: ['Deep House', 'Synthwave', 'Indie Pop'] },
  { name: 'Evening reset', description: 'Ease down from a busy day.', duration: 30, curve: 'linear_descent', genres: ['Ambient', 'Contemporary Classical Piano', 'Neo-Soul'] },
  { name: 'Open-format mix', description: 'Bridge beats, soul, and pop with a custom feel.', duration: 45, curve: 'steady_flow', genres: ['Hip-Hop', 'Neo-Soul', 'Indie Pop'] }
];

export default function App() {
  const [genres, setGenres] = useState([]);
  const [presets, setPresets] = useState([]);
  const [customTracks, setCustomTracks] = useState([]);
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [catalogCount, setCatalogCount] = useState(0);
  
  // User Selection State
  const [duration, setDuration] = useState(45);
  // Default to Contemporary Classical Piano, Indie Pop, and Hip-Hop as specifically highlighted in synopsis
  const [selectedGenres, setSelectedGenres] = useState([
    "Contemporary Classical Piano",
    "Indie Pop",
    "Hip-Hop"
  ]);
  const [selectedCurve, setSelectedCurve] = useState("pomodoro_peak");
  const [customPoints, setCustomPoints] = useState([
    { time_fraction: 0.0, target_energy: 0.25 },
    { time_fraction: 0.35, target_energy: 0.85 },
    { time_fraction: 0.75, target_energy: 0.70 },
    { time_fraction: 1.0, target_energy: 0.30 }
  ]);
  const [weights, setWeights] = useState({
    energy_weight: 0.40,
    tempo_weight: 0.25,
    harmonic_weight: 0.20,
    genre_weight: 0.15
  });

  // Generated Playlist State
  const [playlist, setPlaylist] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [options, setOptions] = useState({
    min_bpm: 40, max_bpm: 220, allow_repeats: true,
    crossfade_seconds: 0, diversity_strength: .25, excluded_track_ids: []
  });

  // Audio Playback State
  const [activeTrack, setActiveTrack] = useState(null);
  const resultsRef = useRef(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    let active = true;
    Promise.all([fetchGenres(), fetchPresets(), fetchCustomTracks(), fetchTracks()]).then(([gList, pList, custom, tracks]) => {
      if (!active) return;
      setGenres(gList);
      setPresets(pList);
      setCustomTracks(custom);
      setCatalogTracks(tracks);
      setCatalogCount(tracks.length);
    }).catch(err => {
      console.error("Initial application load failed:", err);
      if (active) setErrorMessage(err.message || "The application could not be initialized.");
    })
    return () => { active = false; };
  }, []);

  // Bring freshly generated or reloaded results into view.
  useEffect(() => {
    if (!playlist || !resultsRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [playlist]);

  const refreshCatalog = async () => {
    const [gList, custom, tracks] = await Promise.all([fetchGenres(), fetchCustomTracks(), fetchTracks()]);
    setGenres(gList); setCustomTracks(custom); setCatalogTracks(tracks); setCatalogCount(tracks.length);
    const known = new Set(tracks.map(track => track.id));
    setOptions(current => ({ ...current, excluded_track_ids: current.excluded_track_ids.filter(id => known.has(id)) }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    audioSynth.stop();
    setActiveTrack(null);

    try {
      const result = await generatePlaylist({
        target_duration_minutes: duration,
        selected_genres: selectedGenres,
        curve_type: selectedCurve,
        custom_points: selectedCurve === 'custom' ? customPoints : [],
        ...weights,
        ...options,
        ...(sessionName.trim() ? { name: sessionName.trim() } : {})
      });
      setPlaylist(result);
    } catch (err) {
      console.error("Failed to generate playlist:", err);
      setErrorMessage(err.message || "Playlist generation failed. Check the selected parameters and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length === 1) return; // Keep at least one
      setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleSelectAllGenres = () => {
    if (selectedGenres.length === genres.length) {
      setSelectedGenres(["Contemporary Classical Piano", "Indie Pop", "Hip-Hop"]);
    } else {
      setSelectedGenres(genres.map((g) => g.name));
    }
  };

  const handlePlayTrack = (track) => {
    setActiveTrack(track);
    audioSynth.playTrackPreview(track, () => {
      setActiveTrack(null);
    });
  };

  const handlePlayContinuous = () => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
    audioSynth.playSequence(playlist.tracks, 0, (currentTrack) => {
      setActiveTrack(currentTrack);
    });
  };

  const handleStopAudio = () => {
    audioSynth.stop();
    setActiveTrack(null);
  };

  const curveName = presets.find(preset => preset.id === selectedCurve)?.name || selectedCurve.replace(/_/g, ' ');

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32 space-y-16">
        {/* Introduction and scenario starters */}
        <section aria-labelledby="intro-title" className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-x-14 gap-y-10">
          <div>
            <p className="eyebrow">Plan the flow · hear the shape</p>
            <h2 id="intro-title" className="mt-4 font-display text-[2.6rem] sm:text-6xl leading-[1.02] font-semibold tracking-tight">
              Playlists shaped like the <em className="font-normal text-accent">session</em> you want.
            </h2>
            <p className="mt-6 max-w-xl text-base text-ink-soft leading-relaxed">
              Pick a length, blend genres and draw an energy curve. The optimizer orders tracks by tempo,
              harmonic key and energy fit, then shows you exactly how close it got.
            </p>
            <p className="mt-6 font-mono text-xs text-muted">
              {catalogCount || '…'} tracks / 7 energy curves / M3U · JSON · CSV / metadata-only demo
            </p>
          </div>

          <div aria-labelledby="demos-title">
            <h2 id="demos-title" className="eyebrow">Start from a scenario</h2>
            <ol className="mt-3 border-t-[1.5px] border-ink">
              {DEMO_SESSIONS.map((demo, index) => (
                <li key={demo.name} className="border-b border-rule">
                  <button type="button"
                    onClick={() => { setDuration(demo.duration); setSelectedCurve(demo.curve); setSelectedGenres(demo.genres); setSessionName(demo.name); }}
                    className="group w-full text-left flex items-baseline gap-4 py-4 hover:text-accent-ink transition-colors">
                    <span className="font-mono text-xs text-muted w-6 shrink-0">0{index + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-display text-xl font-medium">{demo.name}</span>
                      <span className="block text-sm text-muted mt-0.5">{demo.description}</span>
                    </span>
                    <span className="font-mono text-xs text-muted shrink-0">{demo.duration}m</span>
                    <ArrowRight aria-hidden="true" className="w-4 h-4 shrink-0 self-center opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">A scenario fills in the builder below; you can still change anything.</p>
          </div>
        </section>

        {/* Session builder with a sticky summary */}
        <section id="session-builder" aria-labelledby="builder-title" className="border-t-[1.5px] border-ink pt-8">
          <h2 id="builder-title" className="sr-only">Session builder</h2>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-x-14 gap-y-10">
            <div className="space-y-14">
              <div>
                <StepHeading letter="A" id="curve-title" title="Energy shape" hint="How intensity should rise and fall across the session." />
                <EnergyCurveSelector presets={presets} selectedCurve={selectedCurve} onSelectCurve={(id) => setSelectedCurve(id)} />
                {selectedCurve === 'custom' && (
                  <CustomCurveEditor customPoints={customPoints} onChangePoints={(pts) => setCustomPoints(pts)} />
                )}
              </div>

              <div>
                <StepHeading letter="B" id="genre-title" title="Genres" hint="The optimizer bridges between them using tempo and key." />
                <GenreSelector genres={genres} selectedGenres={selectedGenres}
                  onToggleGenre={handleToggleGenre} onSelectAll={handleSelectAllGenres} />
              </div>

              <div>
                <StepHeading letter="C" id="duration-title" title="Length" hint="Between 15 minutes and 3 hours." />
                <DurationPicker duration={duration} onDurationChange={(d) => setDuration(d)} />
              </div>

              <div>
                <StepHeading letter="D" id="tuning-title" title="Fine tuning" hint="Optional. The defaults work well." />
                <div className="border-t border-rule">
                  <ParameterControls weights={weights} onChangeWeights={(w) => setWeights(w)} />
                  <SessionControls options={options} onChange={setOptions} catalog={catalogTracks}
                    name={sessionName} onNameChange={setSessionName} />
                </div>
              </div>
            </div>

            <aside aria-label="Session summary" className="lg:sticky lg:top-6 self-start border-t-4 border-ink pt-4">
              <p className="eyebrow">Cue sheet</p>
              <dl className="mt-3 text-sm">
                <SummaryRow label="Name" value={sessionName.trim() || 'Untitled session'} />
                <SummaryRow label="Shape" value={curveName} />
                <SummaryRow label="Length" value={`${duration} min`} mono />
                <SummaryRow label="Genres" value={selectedGenres.join(', ')} />
                {options.excluded_track_ids.length > 0 &&
                  <SummaryRow label="Excluded" value={`${options.excluded_track_ids.length} tracks`} mono />}
              </dl>
              <button type="button" onClick={handleGenerate} disabled={isGenerating} className="btn btn-ink w-full mt-6 !py-3.5 !text-base">
                {isGenerating ? 'Arranging tracks…' : 'Generate playlist'}
                {!isGenerating && <ArrowDown aria-hidden="true" className="w-4 h-4" />}
              </button>
              {errorMessage && (
                <p role="alert" className="mt-4 border-l-[3px] border-accent pl-3 text-sm text-accent-ink">{errorMessage}</p>
              )}
              <p className="mt-4 text-xs text-muted leading-relaxed">Generated sessions are saved to History and can be exported.</p>
            </aside>
          </div>
        </section>

        {/* Results */}
        {playlist && (
          <section ref={resultsRef} aria-labelledby="result-title" className="border-t-[1.5px] border-ink pt-8 space-y-10 scroll-mt-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="min-w-0">
                <p className="eyebrow">
                  {playlist.diagnostics?.engine === 'browser-greedy' ? 'Offline browser generation' : 'Generated by the API'}
                  {playlist.diagnostics?.execution_ms != null && ` · ${playlist.diagnostics.execution_ms} ms · ${playlist.diagnostics.eligible_track_count} eligible tracks`}
                </p>
                <h2 id="result-title" className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight break-words">{playlist.name}</h2>
                <p className="mt-3 font-mono text-sm text-ink-soft">
                  {playlist.track_count} tracks / {playlist.actual_duration_formatted} / {playlist.genres_used.length} genres
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button type="button" onClick={handlePlayContinuous} className="btn btn-ink" title="Play synthesized previews of every track in order">
                  Play walkthrough
                </button>
                <button type="button" onClick={() => setIsExportOpen(true)} className="btn btn-line">Export</button>
              </div>
            </div>

            <div className="space-y-1 text-sm" role="status">
              <p className="text-muted">Previews are synthesized motifs. Exports reference audio files you supply.</p>
              {(playlist.diagnostics?.warnings || []).map(warning =>
                <p key={warning} className="border-l-[3px] border-mustard pl-3 text-ink">{warning}</p>)}
            </div>

            <EnergyCurveVisualizer
              playlist={playlist}
              activeTrackId={activeTrack ? activeTrack.id : null}
              onTrackSelect={(trackId) => {
                const trk = playlist.tracks.find(t => t.id === trackId);
                if (trk) handlePlayTrack(trk);
              }}
            />

            <TracklistTable
              playlist={playlist}
              activeTrackId={activeTrack ? activeTrack.id : null}
              onPlayTrack={handlePlayTrack}
              onStopAudio={handleStopAudio}
            />
          </section>
        )}

        <CustomTrackManager genres={genres} tracks={customTracks} onChanged={refreshCatalog} />

        <section id="project-overview" aria-labelledby="project-title" className="border-t-[1.5px] border-ink pt-8">
          <h2 id="project-title" className="eyebrow">What this project demonstrates</h2>
          <div className="mt-6 grid md:grid-cols-3 md:divide-x divide-rule">
            {[
              ['Structure', 'Seven target energy profiles, duration-aware beam search, transition scores and tunable weights.'],
              ['Experience', 'Interactive trajectory, track previews, session history, custom metadata and portable exports.'],
              ['Delivery', 'Runs locally today. Terraform and CI/CD are prepared for AWS once account setup is complete.'],
            ].map(([title, text], index) => (
              <article key={title} className="py-4 md:py-0 md:px-8 first:md:pl-0 border-b md:border-b-0 border-rule last:border-b-0">
                <p className="font-mono text-xs text-accent-ink">0{index + 1}</p>
                <h3 className="mt-2 font-display text-2xl font-medium">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t-[1.5px] border-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-muted">
          <p>Dipankar Banerjee (240905618) · Pratham Shah (240905614) · Vaibhav Bhatia (240905504)</p>
          <p>Team 6 · Batch B2 · Supervisor: Dr. Soumya Nandan Mishra</p>
        </div>
      </footer>

      {/* Persistent Audio Synthesizer Player Bar */}
      <AudioPlayerBar
        activeTrack={activeTrack}
        onStop={handleStopAudio}
      />

      {/* Export Modal */}
      {isExportOpen && playlist && (
        <ExportModal
          playlist={playlist}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* DynamoDB History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryPlaylist={(plId) => {
          setErrorMessage('');
          fetchPlaylist(plId)
            .then(res => setPlaylist(res))
            .catch(err => {
              console.error("Failed to load saved playlist:", err);
              setErrorMessage(err.message || "The saved playlist could not be loaded.");
            });
        }}
      />

      {/* AWS Cloud Health & Managed Services Modal */}
      <HealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      {/* Documentation Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

    </div>
  );
}

function StepHeading({ letter, id, title, hint }) {
  return (
    <div className="mb-5 flex items-baseline gap-4">
      <span aria-hidden="true" className="font-display italic text-3xl text-accent leading-none w-6">{letter}</span>
      <div>
        <h3 id={id} className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <div className="flex gap-4 py-2 border-b border-rule">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 break-words ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
