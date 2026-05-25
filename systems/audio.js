// --- AUDIO SYSTEM ---
const Audio = {
    ctx: null, muted: false,
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },
    playTone(freq, type, duration, vol=0.1) {
        if(!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    hit() { this.playTone(150, 'square', 0.2, 0.2); setTimeout(()=>this.playTone(100, 'sawtooth', 0.3, 0.2), 50); },
    heavyHit() { this.playTone(100, 'square', 0.4, 0.3); setTimeout(()=>this.playTone(50, 'sawtooth', 0.5, 0.4), 100); },
    block() { this.playTone(400, 'triangle', 0.1, 0.1); },
    dodge() { this.playTone(600, 'sine', 0.2, 0.1); },
    special() { this.playTone(800, 'square', 0.1); setTimeout(()=>this.playTone(1200, 'square', 0.2), 100); setTimeout(()=>this.playTone(600, 'sawtooth', 0.4), 200); },
    win() { [523, 659, 783, 1046].forEach((f,i) => setTimeout(()=>this.playTone(f, 'square', 0.3, 0.1), i*150)); },
    lose() { [300, 250, 200, 150].forEach((f,i) => setTimeout(()=>this.playTone(f, 'sawtooth', 0.4, 0.2), i*200)); },
    combo() { [400, 500, 600, 800, 1200].forEach((f,i) => setTimeout(()=>this.playTone(f, 'square', 0.2, 0.2), i*100)); }
};

// --- CANVAS PARTICLES ---
