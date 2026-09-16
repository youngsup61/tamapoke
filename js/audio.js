// audio.js - Web Audio Game Boy-style tone generator for TamaPoke

const SFX_TAP = 0;
const SFX_EAT = 1;
const SFX_PLAY = 2;
const SFX_HEART = 3;
const SFX_HATCH = 4;
const SFX_EVOLVE = 5;
const SFX_MEDAL = 6;
const SFX_DENY = 7;
const SFX_BYE = 8;
const SFX_LEVEL = 9;

const SFX_DEFS = {
  [SFX_TAP]: [{ f: 880, ms: 35 }],
  [SFX_EAT]: [{ f: 660, ms: 45 }, { f: 0, ms: 12 }, { f: 660, ms: 45 }],
  [SFX_PLAY]: [{ f: 784, ms: 45 }, { f: 988, ms: 60 }],
  [SFX_HEART]: [{ f: 1047, ms: 55 }, { f: 1319, ms: 90 }],
  [SFX_HATCH]: [{ f: 523, ms: 80 }, { f: 659, ms: 80 }, { f: 784, ms: 110 }, { f: 1047, ms: 170 }],
  [SFX_EVOLVE]: [{ f: 523, ms: 80 }, { f: 659, ms: 80 }, { f: 784, ms: 80 }, { f: 1047, ms: 90 }, { f: 1319, ms: 230 }],
  [SFX_MEDAL]: [{ f: 784, ms: 70 }, { f: 0, ms: 25 }, { f: 784, ms: 70 }, { f: 0, ms: 25 }, { f: 1047, ms: 200 }],
  [SFX_DENY]: [{ f: 300, ms: 110 }, { f: 200, ms: 170 }],
  [SFX_BYE]: [{ f: 784, ms: 150 }, { f: 659, ms: 150 }, { f: 523, ms: 280 }],
  [SFX_LEVEL]: [{ f: 784, ms: 70 }, { f: 1047, ms: 130 }]
};

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.sleeping = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(id) {
    if (!this.enabled || this.sleeping) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = SFX_DEFS[id];
    if (!notes) return;

    let startTime = this.ctx.currentTime;
    for (const note of notes) {
      if (note.f > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square'; // Game Boy square wave
        osc.frequency.setValueAtTime(note.f, startTime);

        // Anti-click envelope
        const dur = note.ms / 1000;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.005);
        gain.gain.setValueAtTime(0.08, startTime + dur - 0.005);
        gain.gain.linearRampToValueAtTime(0, startTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      }
      startTime += note.ms / 1000;
    }
  }
}

const soundManager = new SoundManager();
function sfxPlay(id) {
  soundManager.play(id);
}
