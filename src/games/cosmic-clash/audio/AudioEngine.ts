export class AudioEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private musicGain: GainNode | null = null;
	private sfxGain: GainNode | null = null;
	private _muted = false;
	private initialized = false;

	// Music state
	private musicPlaying = false;
	private bassOsc: OscillatorNode | null = null;
	private bassGain: GainNode | null = null;
	private arpInterval: ReturnType<typeof setInterval> | null = null;
	private beatInterval: ReturnType<typeof setInterval> | null = null;
	private intensity = 0.5;

	get muted() {
		return this._muted;
	}

	init() {
		if (this.initialized) return;
		try {
			this.ctx = new AudioContext();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.5;
			this.masterGain.connect(this.ctx.destination);

			this.musicGain = this.ctx.createGain();
			this.musicGain.gain.value = 0.25;
			this.musicGain.connect(this.masterGain);

			this.sfxGain = this.ctx.createGain();
			this.sfxGain.gain.value = 0.6;
			this.sfxGain.connect(this.masterGain);

			this.initialized = true;
		} catch {
			// Web Audio not available
		}
	}

	toggleMute() {
		this._muted = !this._muted;
		if (this.masterGain) {
			this.masterGain.gain.value = this._muted ? 0 : 0.5;
		}
	}

	// === SFX ===

	playShoot() {
		if (!this.ctx || !this.sfxGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(880, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.08);
		gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.08);
	}

	playEnemyShoot() {
		if (!this.ctx || !this.sfxGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "square";
		osc.frequency.setValueAtTime(200, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);
		gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.1);
	}

	playExplosion(big = false) {
		if (!this.ctx || !this.sfxGain) return;
		const duration = big ? 0.5 : 0.25;
		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
		}

		const noise = this.ctx.createBufferSource();
		noise.buffer = buffer;

		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(big ? 0.3 : 0.15, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(big ? 800 : 1200, this.ctx.currentTime);
		filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(this.sfxGain);
		noise.start();
		noise.stop(this.ctx.currentTime + duration);
	}

	playPowerUp() {
		if (!this.ctx || !this.sfxGain) return;
		const notes = [523, 659, 784]; // C5, E5, G5
		for (let i = 0; i < notes.length; i++) {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = "sine";
			osc.frequency.value = notes[i];
			const start = this.ctx.currentTime + i * 0.06;
			gain.gain.setValueAtTime(0.12, start);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(start);
			osc.stop(start + 0.15);
		}
	}

	playShieldHit() {
		if (!this.ctx || !this.sfxGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
		// Detune for metallic feel
		osc.detune.value = 50;
		gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.15);
	}

	playDamage() {
		if (!this.ctx || !this.sfxGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(300, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);
		gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.2);
	}

	playGameOver() {
		if (!this.ctx || !this.sfxGain) return;
		const notes = [392, 349, 311, 262]; // G4, F4, Eb4, C4 — descending minor
		for (let i = 0; i < notes.length; i++) {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = "sine";
			osc.frequency.value = notes[i];
			const start = this.ctx.currentTime + i * 0.25;
			gain.gain.setValueAtTime(0.15, start);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(start);
			osc.stop(start + 0.5);
		}
	}

	playWaveComplete() {
		if (!this.ctx || !this.sfxGain) return;
		const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
		for (let i = 0; i < notes.length; i++) {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = "triangle";
			osc.frequency.value = notes[i];
			const start = this.ctx.currentTime + i * 0.08;
			gain.gain.setValueAtTime(0.12, start);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(start);
			osc.stop(start + 0.2);
		}
	}

	playBomb() {
		if (!this.ctx || !this.sfxGain) return;
		// Big white noise burst
		const duration = 0.6;
		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
		}
		const noise = this.ctx.createBufferSource();
		noise.buffer = buffer;
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
		noise.connect(gain);
		gain.connect(this.sfxGain);
		noise.start();
		noise.stop(this.ctx.currentTime + duration);
	}

	playLaser() {
		if (!this.ctx || !this.sfxGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(150, this.ctx.currentTime);
		const lfo = this.ctx.createOscillator();
		const lfoGain = this.ctx.createGain();
		lfo.frequency.value = 20;
		lfoGain.gain.value = 30;
		lfo.connect(lfoGain);
		lfoGain.connect(osc.frequency);
		lfo.start();
		gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start();
		// Returns stop function
		return () => {
			gain.gain.exponentialRampToValueAtTime(0.001, (this.ctx?.currentTime ?? 0) + 0.1);
			setTimeout(() => {
				try {
					osc.stop();
					lfo.stop();
				} catch {
					/* already stopped */
				}
			}, 150);
		};
	}

	// === MUSIC ===

	setIntensity(level: number) {
		this.intensity = Math.max(0, Math.min(1, level));
	}

	startMusic() {
		if (!this.ctx || !this.musicGain || this.musicPlaying) return;
		this.musicPlaying = true;

		// Bass pulse
		this.bassOsc = this.ctx.createOscillator();
		this.bassGain = this.ctx.createGain();
		this.bassOsc.type = "sawtooth";
		this.bassOsc.frequency.value = 55; // A1
		this.bassGain.gain.value = 0.15;

		const bassFilter = this.ctx.createBiquadFilter();
		bassFilter.type = "lowpass";
		bassFilter.frequency.value = 200;

		this.bassOsc.connect(bassFilter);
		bassFilter.connect(this.bassGain);
		this.bassGain.connect(this.musicGain);
		this.bassOsc.start();

		// Arpeggiator
		const minorScale = [0, 3, 7, 10, 12, 15, 19]; // A minor pentatonic intervals
		const baseFreq = 220; // A3
		let arpIndex = 0;

		this.arpInterval = setInterval(
			() => {
				if (!this.ctx || !this.musicGain) return;
				const note = minorScale[arpIndex % minorScale.length];
				const freq = baseFreq * 2 ** (note / 12);
				arpIndex++;

				const osc = this.ctx.createOscillator();
				const gain = this.ctx.createGain();
				osc.type = "triangle";
				osc.frequency.value = freq;
				const vol = 0.06 * this.intensity;
				gain.gain.setValueAtTime(vol, this.ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
				osc.connect(gain);
				gain.connect(this.musicGain);
				osc.start();
				osc.stop(this.ctx.currentTime + 0.15);
			},
			Math.max(100, 200 - this.intensity * 80),
		);

		// Beat (kick-like)
		let beatCount = 0;
		this.beatInterval = setInterval(
			() => {
				if (!this.ctx || !this.musicGain) return;
				beatCount++;
				const osc = this.ctx.createOscillator();
				const gain = this.ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(150, this.ctx.currentTime);
				osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
				const vol = 0.1 * this.intensity;
				gain.gain.setValueAtTime(vol, this.ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
				osc.connect(gain);
				gain.connect(this.musicGain);
				osc.start();
				osc.stop(this.ctx.currentTime + 0.15);

				// Hi-hat on off-beats
				if (beatCount % 2 === 0 && this.intensity > 0.5) {
					const bufSize = this.ctx.sampleRate * 0.05;
					const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
					const d = buf.getChannelData(0);
					for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
					const noise = this.ctx.createBufferSource();
					noise.buffer = buf;
					const hg = this.ctx.createGain();
					const hf = this.ctx.createBiquadFilter();
					hf.type = "highpass";
					hf.frequency.value = 8000;
					hg.gain.value = 0.04 * this.intensity;
					noise.connect(hf);
					hf.connect(hg);
					hg.connect(this.musicGain);
					noise.start();
					noise.stop(this.ctx.currentTime + 0.05);
				}
			},
			Math.max(150, 300 - this.intensity * 100),
		);
	}

	stopMusic() {
		this.musicPlaying = false;
		try {
			this.bassOsc?.stop();
		} catch {
			/* already stopped */
		}
		this.bassOsc = null;
		this.bassGain = null;

		if (this.arpInterval) clearInterval(this.arpInterval);
		if (this.beatInterval) clearInterval(this.beatInterval);
		this.arpInterval = null;
		this.beatInterval = null;
	}

	destroy() {
		this.stopMusic();
		this.ctx?.close();
		this.ctx = null;
		this.initialized = false;
	}
}
