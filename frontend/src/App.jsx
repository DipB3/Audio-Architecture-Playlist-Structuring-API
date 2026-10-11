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

import { fetchGenres, fetchPresets, generatePlaylist } from './services/api';
import { audioSynth } from './services/audioSynthesizer';
import { Sparkles, Play, Download, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function App() {
  const [genres, setGenres] = useState([]);
  const [presets, setPresets] = useState([]);
  
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

  // Audio Playback State
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    Promise.all([fetchGenres(), fetchPresets()]).then(([gList, pList]) => {
      setGenres(gList);
      setPresets(pList);
    });

    // Auto-generate initial architecture for instant preview
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    audioSynth.stop();
    setActiveTrack(null);
    setIsPlayingSequence(false);

    try {
      const result = await generatePlaylist({
        target_duration_minutes: duration,
        selected_genres: selectedGenres,
        curve_type: selectedCurve,
        custom_points: selectedCurve === 'custom' ? customPoints : [],
        ...weights
      });
      setPlaylist(result);
    } catch (err) {
      console.error("Failed to generate playlist:", err);
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
    setIsPlayingSequence(true);
    audioSynth.playSequence(playlist.tracks, 0, (currentTrack) => {
      setActiveTrack(currentTrack);
    });
  };

  const handleStopAudio = () => {
    audioSynth.stop();
    setActiveTrack(null);
    setIsPlayingSequence(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
        
        {/* Module 1: User Interface Module (Input Controls) */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
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
        isPlaying={!!activeTrack}
        onStop={handleStopAudio}
        onPlayContinuous={handlePlayContinuous}
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
          // fetch and display playlist
          generatePlaylist({
            target_duration_minutes: duration,
            selected_genres: selectedGenres,
            curve_type: selectedCurve
          }).then(res => setPlaylist(res));
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
