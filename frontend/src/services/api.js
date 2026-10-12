/**
 * API Service for Audio Architecture & Playlist Structuring API.
 * Communicates with AWS API Gateway / Local Python server, with
 * built-in client-side engine fallback for offline demo resilience.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, '');

// Client-side fallback catalog
import catalogFallback from "../../../backend/app/data/track_catalog.json";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend /health unreachable, using local mock status:", err.message);
  }
  return {
    status: "healthy (client-fallback)",
    service: "Audio Architecture & Playlist Structuring API",
    version: "1.0.0",
    aws_region: "us-east-1",
    dynamodb_connected: false,
    s3_connected: false,
    catalog_track_count: catalogFallback.length,
    managed_services: [
      "AWS Lambda (Serverless Compute)",
      "Amazon API Gateway (REST API)",
      "Amazon DynamoDB (NoSQL Data & History)",
      "Amazon S3 (Catalog & Export Bundles)",
      "Amazon CloudWatch & AWS Budgets (DevOps & Alerts)"
    ]
  };
}

export async function fetchGenres() {
  try {
    const res = await fetch(`${API_BASE_URL}/genres`);
    if (res.ok) {
      const data = await res.json();
      return data.genres;
    }
  } catch {
    console.warn("Backend /genres unreachable, computing from local catalog");
  }

  // Fallback calculation from local JSON
  const map = {};
  catalogFallback.forEach(t => {
    if (!map[t.genre]) {
      map[t.genre] = { name: t.genre, track_count: 0, min_bpm: 999, max_bpm: 0, _bpm: 0, _e: 0 };
    }
    const g = map[t.genre];
    g.track_count++;
    g.min_bpm = Math.min(g.min_bpm, t.bpm);
    g.max_bpm = Math.max(g.max_bpm, t.bpm);
    g._bpm += t.bpm;
    g._e += t.energy;
  });

  return Object.values(map).map(g => ({
    name: g.name,
    track_count: g.track_count,
    min_bpm: g.min_bpm,
    max_bpm: g.max_bpm,
    avg_bpm: Math.round((g._bpm / g.track_count) * 10) / 10,
    avg_energy: Math.round((g._e / g.track_count) * 100) / 100
  }));
}

export async function fetchPresets() {
  try {
    const res = await fetch(`${API_BASE_URL}/presets`);
    if (res.ok) {
      const data = await res.json();
      return data.presets;
    }
  } catch {
    console.warn("Backend /presets unreachable, using default presets");
  }

  return [
    {
      id: "pomodoro_peak",
      name: "Pomodoro Focus Peak",
      description: "Gradual warm-up (0-20%), sustained high-intensity flow peak (20-80%), and calming resolution cool-down (80-100%). Ideal for deep work sprints.",
      icon: "mountain",
      default_duration_minutes: 50
    },
    {
      id: "linear_ascent",
      name: "Continuous Ascent",
      description: "Monotonically increasing energy curve from tranquil ambient into pulsating high-drive tracks.",
      icon: "trending-up",
      default_duration_minutes: 45
    },
    {
      id: "linear_descent",
      name: "Decompression Glide",
      description: "High-energy starting pace smoothly transitioning down to tranquil, low-tempo serenity.",
      icon: "trending-down",
      default_duration_minutes: 40
    },
    {
      id: "wave_interval",
      name: "Interval Wave",
      description: "Oscillating peaks and troughs simulating high-intensity interval training or periodic sprints.",
      icon: "activity",
      default_duration_minutes: 60
    },
    {
      id: "steady_flow",
      name: "Steady-State Flow",
      description: "Even, undisturbed medium-energy baseline with subtle organic variations.",
      icon: "minus",
      default_duration_minutes: 90
    },
    {
      id: "sunset_chill",
      name: "Sunset Transition",
      description: "Warm afternoon momentum holding steady before gliding down into nocturnal tranquility.",
      icon: "sun",
      default_duration_minutes: 60
    },
    {
      id: "custom",
      name: "Custom Energy Architecture",
      description: "User-designed energy profile with interactive control points.",
      icon: "sliders",
      default_duration_minutes: 45
    }
  ];
}

export async function generatePlaylist(params) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/playlists/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (response.ok) {
      const data = await response.json();
      return data.playlist;
    }
  } catch (err) {
    console.warn("Backend /playlists/generate unreachable, executing client-side optimization algorithm fallback:", err.message);
    return runClientSideOptimizer(params);
  }
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || `Playlist generation failed (${response.status}).`);
}

export async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/playlists/history`);
    if (res.ok) {
      const data = await res.json();
      return data.history;
    }
  } catch {
    console.warn("Backend /playlists/history unreachable");
  }

  // Load from local storage
  const saved = localStorage.getItem("audio_arch_playlists");
  const playlists = saved ? JSON.parse(saved) : [];
  return playlists.map(toHistorySummary);
}

export async function fetchPlaylist(playlistId) {
  try {
    const res = await fetch(`${API_BASE_URL}/playlists/${encodeURIComponent(playlistId)}`);
    if (res.ok) {
      const data = await res.json();
      return data.playlist;
    }
  } catch (err) {
    console.warn("Backend playlist retrieval unreachable, checking browser storage:", err.message);
  }

  const saved = JSON.parse(localStorage.getItem("audio_arch_playlists") || "[]");
  const playlist = saved.find(item => item.playlist_id === playlistId);
  if (!playlist) throw new Error(`Playlist '${playlistId}' was not found.`);
  return playlist;
}

export async function exportPlaylist(params) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/playlists/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    console.warn("Backend export unreachable, building export locally");
    return buildLocalExport(params);
  }

  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || `Playlist export failed (${response.status}).`);
}

function buildLocalExport(params) {
  const { playlist, format } = params;
  if (format === "m3u") {
    let lines = ["#EXTM3U", `#PLAYLIST:${playlist.name}`, ""];
    playlist.tracks.forEach(t => {
      lines.push(`#EXTINF:${t.duration_seconds},${t.artist} - ${t.title}`);
      lines.push(`#EXT-X-BPM:${t.bpm}`);
      lines.push(`#EXT-X-KEY:${t.camelot_code}`);
      lines.push(`#EXT-X-ENERGY:${t.energy}`);
      lines.push(`tracks/${t.id}.mp3\n`);
    });
    return {
      format: "m3u",
      filename: `${playlist.name.replace(/ /g, "_")}.m3u`,
      content: lines.join("\n"),
      s3_url: "local://client-export"
    };
  } else if (format === "csv") {
    let rows = [["Position", "Title", "Artist", "Genre", "Duration", "BPM", "Camelot", "Energy"]];
    playlist.tracks.forEach((t, i) => {
      rows.push([i + 1, `"${t.title}"`, `"${t.artist}"`, `"${t.genre}"`, t.duration_seconds, t.bpm, t.camelot_code, t.energy]);
    });
    return {
      format: "csv",
      filename: `${playlist.name.replace(/ /g, "_")}.csv`,
      content: rows.map(r => r.join(",")).join("\n"),
      s3_url: "local://client-export"
    };
  } else {
    return {
      format: "json",
      filename: `${playlist.name.replace(/ /g, "_")}.json`,
      content: JSON.stringify(playlist, null, 2),
      s3_url: "local://client-export"
    };
  }
}

function toHistorySummary(playlist) {
  return {
    playlist_id: playlist.playlist_id,
    name: playlist.name,
    created_at: playlist.created_at,
    curve_type: playlist.curve_type,
    track_count: playlist.track_count,
    actual_duration_formatted: playlist.actual_duration_formatted,
    overall_fit_score: playlist.metrics?.overall_fit_score || 0,
    genres_used: playlist.genres_used || []
  };
}

// Client-side mathematical curve calculation
function computeClientEnergy(curveType, t, customPoints) {
  t = Math.max(0, Math.min(1, t));
  if (curveType === "linear_ascent") return 0.20 + 0.68 * t;
  if (curveType === "linear_descent") return 0.88 - 0.68 * t;
  if (curveType === "pomodoro_peak") {
    if (t < 0.20) return 0.25 + 0.47 * Math.pow(t / 0.20, 1.3);
    if (t <= 0.80) return 0.72 + 0.12 * Math.sin(((t - 0.20) / 0.60) * Math.PI);
    return 0.72 - 0.50 * Math.pow((t - 0.80) / 0.20, 0.9);
  }
  if (curveType === "wave_interval") return 0.52 + 0.33 * Math.sin(4 * Math.PI * t - Math.PI / 2);
  if (curveType === "steady_flow") return 0.48 + 0.04 * Math.sin(4 * Math.PI * t);
  if (curveType === "sunset_chill") return 0.22 + 0.62 / (1 + Math.exp(9 * (t - 0.45)));
  if (curveType === "custom" && customPoints && customPoints.length > 0) {
    const sorted = [...customPoints].sort((a, b) => a.time_fraction - b.time_fraction);
    if (t <= sorted[0].time_fraction) return sorted[0].target_energy;
    if (t >= sorted[sorted.length - 1].time_fraction) return sorted[sorted.length - 1].target_energy;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].time_fraction <= t && t <= sorted[i + 1].time_fraction) {
        const seg = sorted[i + 1].time_fraction - sorted[i].time_fraction;
        const alpha = (t - sorted[i].time_fraction) / seg;
        return sorted[i].target_energy + alpha * (sorted[i + 1].target_energy - sorted[i].target_energy);
      }
    }
  }
  return 0.5;
}

function tempoAffinity(firstBpm, secondBpm) {
  const delta = Math.min(
    Math.abs(firstBpm - secondBpm),
    Math.abs(firstBpm * 2 - secondBpm),
    Math.abs(firstBpm - secondBpm * 2)
  );
  return Math.exp(-(delta ** 2) / (2 * 12 ** 2));
}

function harmonicTransition(firstCode, secondCode) {
  const parse = code => {
    const match = /^(\d{1,2})([AB])$/.exec(code || "");
    return match ? { hour: Number(match[1]), mode: match[2] } : null;
  };
  const first = parse(firstCode);
  const second = parse(secondCode);
  if (!first || !second) return { distance: 6, compatible: false, score: 0.1 };
  const rawDistance = Math.abs(first.hour - second.hour);
  const distance = Math.min(rawDistance, 12 - rawDistance);
  const sameMode = first.mode === second.mode;
  let score;
  if (distance === 0 && sameMode) score = 1;
  else if (distance === 0) score = 0.92;
  else if (distance === 1 && sameMode) score = 0.85;
  else if (distance === 1) score = 0.75;
  else if (distance === 2 && sameMode) score = 0.65;
  else score = Math.max(0.1, 0.5 - 0.08 * distance);
  return { distance, compatible: distance <= 1 || (distance === 2 && sameMode), score };
}

function genreAffinity(firstGenre, secondGenre) {
  if (firstGenre === secondGenre) return 1;
  const pair = [firstGenre, secondGenre].sort().join("|");
  const affinities = {
    "Ambient|Contemporary Classical Piano": 0.95,
    "Hip-Hop|Neo-Soul": 0.94,
    "Deep House|Synthwave": 0.92,
    "Contemporary Classical Piano|Neo-Soul": 0.88,
    "Indie Pop|Neo-Soul": 0.86,
    "Indie Pop|Synthwave": 0.84,
    "Hip-Hop|Indie Pop": 0.82,
    "Ambient|Hip-Hop": 0.82,
    "Ambient|Deep House": 0.8,
    "Deep House|Indie Pop": 0.76,
    "Contemporary Classical Piano|Indie Pop": 0.72,
    "Contemporary Classical Piano|Hip-Hop": 0.65
  };
  return affinities[pair] || 0.6;
}

function runClientSideOptimizer(params) {
  const {
    target_duration_minutes = 45,
    selected_genres = [],
    curve_type = "pomodoro_peak",
    custom_points = [],
    name,
    energy_weight = 0.4,
    tempo_weight = 0.25,
    harmonic_weight = 0.2,
    genre_weight = 0.15,
    min_bpm = 40, max_bpm = 220, excluded_track_ids = [],
    allow_repeats = true, crossfade_seconds = 0, diversity_strength = .25
  } = params;
  const targetSeconds = target_duration_minutes * 60;
  const weightTotal = energy_weight + tempo_weight + harmonic_weight + genre_weight || 1;
  const weights = {
    energy: energy_weight / weightTotal,
    tempo: tempo_weight / weightTotal,
    harmonic: harmonic_weight / weightTotal,
    genre: genre_weight / weightTotal
  };

  if (!Number.isFinite(target_duration_minutes) || target_duration_minutes < 15 || target_duration_minutes > 180)
    throw new Error("Duration must be between 15 and 180 minutes.");
  if (min_bpm > max_bpm) throw new Error("Minimum BPM cannot exceed maximum BPM.");
  let pool = catalogFallback.filter(track => track.bpm >= min_bpm && track.bpm <= max_bpm &&
    !excluded_track_ids.includes(track.id));
  if (selected_genres.length > 0) {
    const filtered = pool.filter(t => selected_genres.includes(t.genre));
    pool = filtered;
  }
  if (!pool.length) throw new Error("No tracks match your session preferences.");

  const selectedTracks = [];
  const usedIds = new Set();
  let elapsed = 0;
  let prevTrack = null;

  const shortestTrack = Math.min(...pool.map(track => track.duration_seconds - crossfade_seconds));
  const maxTracks = Math.ceil(targetSeconds / shortestTrack) + 2;
  while (elapsed < targetSeconds - 90 && selectedTracks.length < maxTracks) {
    const normT = Math.min(1, Math.max(0, (elapsed + 120) / targetSeconds));
    const targetE = computeClientEnergy(curve_type, normT, custom_points);

    // Score candidates
    let candidates = pool.filter(t => !usedIds.has(t.id));
    if (candidates.length === 0) {
      if (!allow_repeats) break;
      usedIds.clear();
      candidates = pool.length > 1 ? pool.filter(track => track.id !== prevTrack?.id) : pool;
    }
    const scored = candidates
      .map(t => {
        const eScore = 1.0 - Math.abs(t.energy - targetE);
        let bpmScore = 1.0;
        let camelotScore = 1.0;
        let genreScore = 1.0;
        if (prevTrack) {
          bpmScore = tempoAffinity(prevTrack.bpm, t.bpm);
          camelotScore = harmonicTransition(prevTrack.camelot_code, t.camelot_code).score;
          const count = selectedTracks.filter(track => track.genre === t.genre).length;
          genreScore = (1 - diversity_strength) * genreAffinity(prevTrack.genre, t.genre) +
            diversity_strength / (1 + count);
        }
        const total = eScore * weights.energy + bpmScore * weights.tempo +
          camelotScore * weights.harmonic + genreScore * weights.genre;
        return { track: t, score: total };
      });

    scored.sort((a, b) => b.score - a.score);
    const chosen = scored.length > 0 ? scored[0].track : pool[0];

    selectedTracks.push(chosen);
    usedIds.add(chosen.id);
    elapsed += chosen.duration_seconds - (selectedTracks.length > 1 ? crossfade_seconds : 0);
    prevTrack = chosen;
  }

  // Trajectory, transitions, and measured quality metrics
  const trajectory = [];
  const transitions = [];
  let accumSec = 0;
  let energyError = 0;
  let tempoScoreTotal = 0;
  let harmonicCompatible = 0;
  selectedTracks.forEach((t, i) => {
    if (i > 0) accumSec -= crossfade_seconds;
    const normT = Math.min(1, (accumSec + t.duration_seconds / 2) / elapsed);
    const targetE = computeClientEnergy(curve_type, normT, custom_points);
    energyError += Math.abs(t.energy - targetE);
    trajectory.push({
      index: i + 1,
      time_seconds: accumSec,
      time_formatted: `${Math.floor(accumSec / 60)}m ${accumSec % 60}s`,
      normalized_time: Math.round(normT * 100) / 100,
      target_energy: Math.round(targetE * 100) / 100,
      actual_energy: Math.round(t.energy * 100) / 100,
      energy_delta: Math.round((t.energy - targetE) * 100) / 100,
      track_id: t.id,
      track_title: t.title,
      artist: t.artist,
      genre: t.genre,
      bpm: t.bpm,
      camelot_code: t.camelot_code
    });
    if (i > 0) {
      const previous = selectedTracks[i - 1];
      const harmonic = harmonicTransition(previous.camelot_code, t.camelot_code);
      const tempoScore = tempoAffinity(previous.bpm, t.bpm);
      const genreScore = genreAffinity(previous.genre, t.genre);
      tempoScoreTotal += tempoScore;
      if (harmonic.compatible) harmonicCompatible += 1;
      transitions.push({
        from_track_id: previous.id,
        to_track_id: t.id,
        bpm_delta: Math.round(Math.abs(previous.bpm - t.bpm) * 10) / 10,
        camelot_distance: harmonic.distance,
        camelot_compatible: harmonic.compatible,
        genre_transition: `${previous.genre} -> ${t.genre}`,
        transition_score: Math.round((tempoScore * 0.4 + harmonic.score * 0.35 + genreScore * 0.25) * 1000) / 1000
      });
    }
    accumSec += t.duration_seconds;
  });

  const transitionCount = Math.max(1, transitions.length);
  const averageEnergyError = energyError / Math.max(1, selectedTracks.length);
  const tempoSmoothness = tempoScoreTotal / transitionCount;
  const harmonicRate = harmonicCompatible / transitionCount * 100;
  const durationAccuracy = Math.max(0, 100 - Math.abs(elapsed - targetSeconds) / targetSeconds * 100);
  const overallFit = (1 - Math.min(1, averageEnergyError * 2)) * 0.4 +
    tempoSmoothness * 0.25 + harmonicRate / 100 * 0.2 + durationAccuracy / 100 * 0.15;

  const playlistId = `pl_client_${Date.now().toString(36)}`;
  const playlist = {
    playlist_id: playlistId,
    name: name || `Audio Architecture - ${curve_type.replace(/_/g, " ").toUpperCase()} (${target_duration_minutes}m)`,
    created_at: new Date().toISOString(),
    target_duration_minutes,
    actual_duration_seconds: elapsed,
    actual_duration_formatted: `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`,
    track_count: selectedTracks.length,
    genres_used: [...new Set(selectedTracks.map(t => t.genre))],
    curve_type,
    tracks: selectedTracks,
    transitions,
    energy_trajectory: trajectory,
    metrics: {
      overall_fit_score: Math.round(overallFit * 1000) / 1000,
      avg_energy_error: Math.round(averageEnergyError * 1000) / 1000,
      tempo_smoothness_score: Math.round(tempoSmoothness * 1000) / 1000,
      harmonic_compatibility_rate: Math.round(harmonicRate * 10) / 10,
      genre_diversity_count: new Set(selectedTracks.map(t => t.genre)).size,
      duration_accuracy_percent: Math.round(durationAccuracy * 100) / 100
    },
    user_id: "guest_user",
    diagnostics: {
      engine: "browser-greedy", crossfade_seconds,
      custom_points,
      target_samples: Array.from({ length: 101 }, (_, index) => ({
        time_fraction: index / 100,
        energy: computeClientEnergy(curve_type, index / 100, custom_points)
      })),
      warnings: [
        "Offline mode uses a simpler greedy optimizer and browser storage.",
        ...(Math.abs(elapsed - targetSeconds) > 90 ? ["Whole tracks could not match the requested duration."] : [])
      ]
    }
  };

  // Save to localStorage history
  try {
    const history = JSON.parse(localStorage.getItem("audio_arch_playlists") || "[]");
    history.unshift(playlist);
    localStorage.setItem("audio_arch_playlists", JSON.stringify(history.slice(0, 15)));
  } catch {
    // Ignore storage errors
  }

  return playlist;
}
