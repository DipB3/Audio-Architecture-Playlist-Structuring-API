/**
 * Web Audio API Polyphonic Synthesizer.
 * Provides interactive real-time audio previews for generated tracks
 * and continuous playlist playback matching track BPM, key, and energy.
 */

// Note frequency map (Hz)
const NOTE_FREQS = {
  "C2": 65.41, "D2": 73.42, "E2": 82.41, "F2": 87.31, "G2": 98.00, "A2": 110.00, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00,
  "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99,
  "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99,
  "G5": 783.99, "A5": 880.00, "B5": 987.77
};

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.activeNodes = [];
    this.currentTrackId = null;
    this.timerId = null;
    this.onTrackChangeCallback = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // already stopped
      }
    });
    this.activeNodes = [];
    this.currentTrackId = null;
  }

  playNote(freq, startTime, duration, energy = 0.5, genre = "") {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Adjust timbre based on genre and energy
    if (genre.includes("Classical")) {
      osc.type = "sine";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800 + energy * 1200, startTime);
    } else if (genre.includes("Synthwave") || genre.includes("Deep House")) {
      osc.type = "sawtooth";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400 + energy * 2500, startTime);
      filter.Q.setValueAtTime(3.0, startTime);
    } else if (genre.includes("Hip-Hop")) {
      osc.type = "triangle";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600 + energy * 1400, startTime);
    } else {
      osc.type = "sine";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, startTime);
    }

    osc.frequency.setValueAtTime(freq, startTime);

    // ADSR Envelope
    const attack = 0.05;
    const decay = 0.15;
    const peakVolume = 0.15 * Math.max(0.2, energy);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(peakVolume * 0.7, startTime + attack + decay);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);

    this.activeNodes.push(osc);
  }

  playTrackPreview(track, onEnd = null) {
    this.init();
    this.stop();
    this.isPlaying = true;
    this.currentTrackId = track.id;

    const notes = (track.notes && track.notes.length > 0)
      ? track.notes
      : ["C4", "E4", "G4", "B4", "C5"];

    const bpm = track.bpm || 80;
    const beatSec = 60 / bpm;
    const noteDuration = beatSec * 0.8;
    const now = this.ctx.currentTime + 0.05;

    // Play an 8-beat repeating musical motif
    const repeats = 2;
    let noteIndex = 0;

    for (let r = 0; r < repeats; r++) {
      for (let i = 0; i < 8; i++) {
        const noteName = notes[noteIndex % notes.length];
        const freq = NOTE_FREQS[noteName] || 261.63;
        const noteTime = now + (r * 8 + i) * beatSec;
        this.playNote(freq, noteTime, noteDuration, track.energy, track.genre);
        noteIndex++;
      }
    }

    const totalTimeMs = (repeats * 8 * beatSec) * 1000;
    this.timerId = setTimeout(() => {
      this.isPlaying = false;
      this.currentTrackId = null;
      if (onEnd) onEnd();
    }, totalTimeMs);
  }

  playSequence(tracks, startIndex = 0, onTrackChange = null) {
    if (!tracks || tracks.length === 0) return;
    this.onTrackChangeCallback = onTrackChange;
    
    let currentIndex = startIndex;

    const playNext = () => {
      if (!this.isPlaying || currentIndex >= tracks.length) {
        this.stop();
        return;
      }
      const track = tracks[currentIndex];
      if (this.onTrackChangeCallback) {
        this.onTrackChangeCallback(track, currentIndex);
      }
      this.playTrackPreview(track, () => {
        currentIndex++;
        if (currentIndex < tracks.length) {
          playNext();
        } else {
          this.stop();
        }
      });
    };

    this.isPlaying = true;
    playNext();
  }
}

export const audioSynth = new AudioSynthesizer();
