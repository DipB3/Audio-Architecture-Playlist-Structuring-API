import React, { useState, useEffect } from 'react';
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
import { Sparkles, Play, Download, RefreshCw } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Top Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Workspace */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
        <section aria-labelledby="intro-title" className="overview-panel rounded-2xl border border-cyan-900/60 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[.22em] font-bold text-cyan-300">Plan the flow, hear the shape</p>
          <h2 id="intro-title" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">Build a playlist around how you want to feel.</h2>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-200">Set a session length, blend genres, and choose an energy journey. The optimizer plans track order using tempo, harmonic compatibility, and energy fit.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="overview-stat">{catalogCount || '…'} demo + custom tracks</span><span className="overview-stat">7 energy curves</span><span className="overview-stat">M3U · JSON · CSV exports</span><span className="overview-stat">Metadata-only demo</span></div>
          <nav aria-label="Project sections" className="mt-5 flex flex-wrap gap-4 text-sm font-semibold"><a href="#session-builder" className="text-cyan-200 hover:text-white">Build a session</a><a href="#custom-tracks" className="text-cyan-200 hover:text-white">Add your songs</a><a href="#project-overview" className="text-cyan-200 hover:text-white">How it works</a></nav>
        </section>

        <section aria-labelledby="demos-title" className="space-y-3">
          <div><h2 id="demos-title" className="text-lg font-bold text-white">Try a listening scenario</h2><p className="text-sm text-slate-300">Choose a starting point, adjust anything below, then generate your playlist.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{DEMO_SESSIONS.map(demo => <button key={demo.name} type="button" onClick={() => { setDuration(demo.duration); setSelectedCurve(demo.curve); setSelectedGenres(demo.genres); setSessionName(demo.name); }} className="text-left rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-4 transition-colors"><strong className="block text-white text-sm">{demo.name}</strong><span className="block mt-1 text-xs text-slate-300">{demo.description}</span><span className="block mt-3 text-xs text-cyan-300">{demo.duration} min · {demo.genres.length} genres</span></button>)}</div>
        </section>
        
        {/* Module 1: User Interface Module (Input Controls) */}
        <section id="session-builder" aria-labelledby="builder-title" className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 id="builder-title" className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Audio Architecture Session Parameters</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure energy flow curves, multi-genre selection, and duration target.
              </p>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Architecture...' : 'Generate Audio Architecture'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-700/60 bg-red-950/50 px-4 py-3 text-xs text-red-200" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 1. Energy Curves */}
          <EnergyCurveSelector
            presets={presets}
            selectedCurve={selectedCurve}
            onSelectCurve={(id) => setSelectedCurve(id)}
          />

          {/* Custom Curve Editor if custom curve chosen */}
          {selectedCurve === 'custom' && (
            <CustomCurveEditor
              customPoints={customPoints}
              onChangePoints={(pts) => setCustomPoints(pts)}
            />
          )}

          {/* 2. Multi-Genre Curation */}
          <GenreSelector
            genres={genres}
            selectedGenres={selectedGenres}
            onToggleGenre={handleToggleGenre}
            onSelectAll={handleSelectAllGenres}
          />

          {/* 3. Duration Target */}
          <DurationPicker
            duration={duration}
            onDurationChange={(d) => setDuration(d)}
          />

          {/* Advanced Optimizer Weights */}
          <ParameterControls
            weights={weights}
            onChangeWeights={(w) => setWeights(w)}
          />
          <SessionControls options={options} onChange={setOptions} catalog={catalogTracks}
            name={sessionName} onNameChange={setSessionName} />
        </section>

        <CustomTrackManager genres={genres} tracks={customTracks} onChanged={refreshCatalog} />

        <section id="project-overview" aria-labelledby="project-title" className="grid gap-3 md:grid-cols-3">
          <h2 id="project-title" className="md:col-span-3 text-lg font-bold text-white">What this project demonstrates</h2>
          <article className="overview-card"><h3>01 / Structure</h3><p>Seven target energy profiles, duration-aware beam search, transition scores, and tunable weights.</p></article>
          <article className="overview-card"><h3>02 / Experience</h3><p>Interactive trajectory, track previews, session history, custom metadata, and portable exports.</p></article>
          <article className="overview-card"><h3>03 / Delivery</h3><p>Local demo today; Terraform and CI/CD prepared for an AWS deployment once account setup is complete.</p></article>
        </section>

        {/* Action Bar for Generated Output */}
        {playlist && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-cyan-800/40 rounded-xl p-4 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{playlist.name}</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {playlist.track_count} Tracks &bull; {playlist.actual_duration_formatted} &bull; {playlist.genres_used.length} Genres Integrated
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayContinuous}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                title="Play full continuous synthesized sequence"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Continuous Walkthrough</span>
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
                title="Export playlist to M3U, JSON, or CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Playlist</span>
              </button>
            </div>
          </div>
        )}

        {/* Module 2: Visualization of Audio Architecture Trajectory */}
        {playlist && <div className="text-xs text-slate-300 space-y-2" role="status">
          <p>{playlist.diagnostics?.engine === 'browser-greedy' ? 'Offline browser generation' : 'API playlist generation'}
            {playlist.diagnostics?.execution_ms != null && ` · ${playlist.diagnostics.execution_ms} ms · ${playlist.diagnostics.eligible_track_count} eligible tracks`}
          </p>
          <p className="text-slate-400">Audio previews are synthesized motifs. Playlist exports refer to audio files you supply.</p>
          {(playlist.diagnostics?.warnings || []).map(warning =>
            <p key={warning} className="text-amber-300">{warning}</p>)}
        </div>}
        {playlist && (
          <EnergyCurveVisualizer
            playlist={playlist}
            activeTrackId={activeTrack ? activeTrack.id : null}
            onTrackSelect={(trackId) => {
              const trk = playlist.tracks.find(t => t.id === trackId);
              if (trk) handlePlayTrack(trk);
            }}
          />
        )}

        {/* Module 3 & 4: Structured Tracklist & Transitions */}
        {playlist && (
          <TracklistTable
            playlist={playlist}
            activeTrackId={activeTrack ? activeTrack.id : null}
            onPlayTrack={handlePlayTrack}
            onStopAudio={handleStopAudio}
          />
        )}

      </main>

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
