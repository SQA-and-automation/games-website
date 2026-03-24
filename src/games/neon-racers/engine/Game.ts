import {
	COINS,
	PLAYER_CFG,
	POWERUPS_CFG,
	type PowerUpId,
	ROAD,
	SCORING,
	SCREEN,
	VEHICLES,
	type VehicleId,
} from "../config";
import { HORIZON_Y, RoadRenderer } from "../renderer/RoadRenderer";
import type { ActivePowerUp, GameCallbacks, GameState, GameStats, SavedData } from "../types";
import { Road } from "./Road";

const DEFAULT_SAVE: SavedData = {
	totalCoins: 0,
	bestDistance: 0,
	bestZone: "",
	unlockedVehicles: ["sportcar"],
	selectedVehicle: "sportcar",
	totalRuns: 0,
};

export class Game {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private road: Road;
	private roadRenderer: RoadRenderer;
	private callbacks: GameCallbacks;

	private state: GameState = "menu";
	private animFrameId = 0;
	private lastTime = 0;
	private time = 0;

	// Player
	private vehicleId: VehicleId = "sportcar";
	private position = 0;
	private playerX = 0; // -1 to 1
	private speed: number = 0;
	private maxSpeed: number = PLAYER_CFG.MAX_SPEED;
	private crashesLeft: number = 3;
	private invincibleUntil = 0;

	// Input
	private steerInput = 0;
	private targetSteerX: number | null = null;
	private keys = new Set<string>();
	private mouseDown = false;

	// Scoring
	private score = 0;
	private distance = 0;
	private coinsCollected = 0;
	private overtakes = 0;
	private nearMisses = 0;
	private comboKills = 0;
	private comboTimer = 0;
	private comboMultiplier = 1;

	// Power-ups
	private activePowerUp: ActivePowerUp | null = null;

	// Zone tracking
	private lastZoneName = "";

	// Audio
	private audioCtx: AudioContext | null = null;
	private engineOsc: OscillatorNode | null = null;
	private engineGain: GainNode | null = null;
	private masterGain: GainNode | null = null;
	private _muted = false;
	private bassOsc: OscillatorNode | null = null;
	private bassGain: GainNode | null = null;
	private drumInterval: ReturnType<typeof setInterval> | null = null;
	private arpInterval: ReturnType<typeof setInterval> | null = null;

	constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
		this.canvas = canvas;
		canvas.width = SCREEN.WIDTH;
		canvas.height = SCREEN.HEIGHT;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context");
		this.ctx = ctx;
		this.callbacks = callbacks;
		this.road = new Road();
		this.roadRenderer = new RoadRenderer(ctx);

		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
		window.addEventListener("touchmove", this.onTouchMove, { passive: false });
		window.addEventListener("touchend", this.onTouchEnd);
		canvas.addEventListener("mousedown", this.onMouseDown);
		window.addEventListener("mousemove", this.onMouseMove);
		window.addEventListener("mouseup", this.onMouseUp);

		this.loop = this.loop.bind(this);
	}

	start(vehicleId: VehicleId) {
		const v = VEHICLES[vehicleId];
		this.vehicleId = vehicleId;
		this.maxSpeed = PLAYER_CFG.MAX_SPEED * v.speedMult;
		this.crashesLeft = v.maxCrashes;
		this.position = 0;
		this.playerX = 0;
		this.speed = PLAYER_CFG.START_SPEED * v.speedMult;
		this.invincibleUntil = 0;
		this.score = 0;
		this.distance = 0;
		this.coinsCollected = 0;
		this.overtakes = 0;
		this.nearMisses = 0;
		this.comboKills = 0;
		this.comboTimer = 0;
		this.comboMultiplier = 1;
		this.activePowerUp = null;
		this.lastZoneName = "";
		this.time = 0;
		this.road.clearItems();
		this.initAudio();
		this.state = "playing";
		this.callbacks.onStateChange("playing");
		this.lastTime = performance.now();
		this.animFrameId = requestAnimationFrame(this.loop);
	}

	toggleMute() {
		this._muted = !this._muted;
		if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : 0.4;
		return this._muted;
	}

	get muted() {
		return this._muted;
	}

	getSavedData(): SavedData {
		try {
			const raw = localStorage.getItem("neonRacers");
			if (!raw) return { ...DEFAULT_SAVE };
			return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
		} catch {
			return { ...DEFAULT_SAVE };
		}
	}

	private saveData(data: SavedData) {
		try {
			localStorage.setItem("neonRacers", JSON.stringify(data));
		} catch {}
	}

	destroy() {
		cancelAnimationFrame(this.animFrameId);
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		this.canvas.removeEventListener("touchstart", this.onTouchStart);
		window.removeEventListener("touchmove", this.onTouchMove);
		window.removeEventListener("touchend", this.onTouchEnd);
		this.canvas.removeEventListener("mousedown", this.onMouseDown);
		window.removeEventListener("mousemove", this.onMouseMove);
		window.removeEventListener("mouseup", this.onMouseUp);
		this.stopAudio();
		this.audioCtx?.close();
	}

	// Input handlers
	private onKeyDown = (e: KeyboardEvent) => {
		this.keys.add(e.key);
	};
	private onKeyUp = (e: KeyboardEvent) => {
		this.keys.delete(e.key);
	};
	private screenToX(clientX: number): number {
		const rect = this.canvas.getBoundingClientRect();
		return ((clientX - rect.left) / rect.width - 0.5) * 2;
	}
	private onTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		this.targetSteerX = this.screenToX(e.touches[0].clientX);
	};
	private onTouchMove = (e: TouchEvent) => {
		e.preventDefault();
		this.targetSteerX = this.screenToX(e.touches[0].clientX);
	};
	private onTouchEnd = () => {
		this.targetSteerX = null;
	};
	private onMouseDown = (e: MouseEvent) => {
		this.mouseDown = true;
		this.targetSteerX = this.screenToX(e.clientX);
	};
	private onMouseMove = (e: MouseEvent) => {
		if (this.mouseDown) this.targetSteerX = this.screenToX(e.clientX);
	};
	private onMouseUp = () => {
		this.mouseDown = false;
		this.targetSteerX = null;
	};

	// Game loop
	private loop(timestamp: number) {
		if (this.state !== "playing") return;
		const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
		this.lastTime = timestamp;
		this.time = timestamp;
		const slow = this.activePowerUp?.type === "SLOW_MO" ? POWERUPS_CFG.TYPES.SLOW_MO.factor : 1;
		this.update(dt, slow);
		this.draw();
		this.animFrameId = requestAnimationFrame(this.loop);
	}

	private update(dt: number, slow: number) {
		const v = VEHICLES[this.vehicleId];

		// Steering
		this.steerInput = 0;
		if (this.keys.has("ArrowLeft") || this.keys.has("a")) this.steerInput = -1;
		if (this.keys.has("ArrowRight") || this.keys.has("d")) this.steerInput = 1;
		if (this.targetSteerX !== null) {
			this.steerInput = Math.max(-1, Math.min(1, (this.targetSteerX - this.playerX) * 3));
		}

		// Speed
		this.speed = Math.min(this.maxSpeed, this.speed + PLAYER_CFG.ACCEL * dt);
		if (this.activePowerUp?.type === "NITRO") {
			this.speed = Math.min(this.maxSpeed * 1.8, this.speed + PLAYER_CFG.ACCEL * 3 * dt);
		}

		// Steer
		const steer =
			this.steerInput * PLAYER_CFG.STEER_SPEED * v.handling * dt * (this.speed / this.maxSpeed);
		this.playerX += steer;

		// Centrifugal from curves
		const curve = this.road.getCurve(Math.floor(this.position));
		this.playerX += curve * PLAYER_CFG.CENTRIFUGAL * (this.speed / this.maxSpeed) * dt;
		this.playerX = Math.max(-1.2, Math.min(1.2, this.playerX));

		// Off-road slow
		if (Math.abs(this.playerX) > 0.85) {
			this.speed = Math.max(
				PLAYER_CFG.START_SPEED * 0.5,
				this.speed - PLAYER_CFG.OFF_ROAD_DECEL * dt,
			);
		}

		// Move
		this.position += (this.speed * slow * dt) / ROAD.SEGMENT_LENGTH;
		this.distance = Math.floor(this.position);
		this.score = Math.floor(this.distance * SCORING.DISTANCE_MULT);

		// Combo decay
		if (this.comboTimer > 0) {
			this.comboTimer -= dt * 1000;
			if (this.comboTimer <= 0) {
				this.comboKills = 0;
				this.comboMultiplier = 1;
			}
		}

		// Power-up timer
		if (this.activePowerUp && this.activePowerUp.duration > 0) {
			this.activePowerUp.remaining -= dt * 1000;
			if (this.activePowerUp.remaining <= 0) this.activePowerUp = null;
		}

		// Zone
		const { zone, cycleNum } = this.road.getZone(this.distance);
		if (zone.name !== this.lastZoneName) {
			this.lastZoneName = zone.name;
			this.callbacks.onZoneChange(zone.name);
		}

		// Spawn items ahead
		this.spawnItems(cycleNum);

		// Collisions
		this.checkCollisions();

		// Audio
		this.updateEngineSound();
		this.updateMusicLayers();

		this.callbacks.onStatsUpdate({
			distance: this.distance,
			speed: Math.floor(this.speed),
			score: this.score,
			coins: this.coinsCollected,
			overtakes: this.overtakes,
			nearMisses: this.nearMisses,
			combo: this.comboMultiplier,
			crashesLeft: this.crashesLeft,
			zone: zone.name,
			activePowerUp: this.activePowerUp ? { ...this.activePowerUp } : null,
		});
	}

	private spawnItems(cycleNum: number) {
		const ahead = this.distance + 80;
		const start = this.distance + 15;
		const diffMult = 1 + cycleNum * 0.3;

		for (let i = start; i < ahead; i++) {
			if (!this.road.getTraffic(i) && !this.road.hasCoin(i) && !this.road.getPowerUp(i)) {
				if (Math.random() < 0.025 * diffMult) {
					const { zone } = this.road.getZone(i);
					const types = zone.trafficTypes;
					this.road.setTraffic(
						i,
						(Math.random() - 0.5) * 1.4,
						types[Math.floor(Math.random() * types.length)],
						0.3 + Math.random() * 0.4,
					);
				}
				if (Math.random() < COINS.SPAWN_CHANCE) this.road.setCoin(i);
				if (Math.random() < POWERUPS_CFG.SPAWN_CHANCE) {
					const types = Object.keys(POWERUPS_CFG.TYPES) as PowerUpId[];
					this.road.setPowerUp(i, types[Math.floor(Math.random() * types.length)]);
				}
			}
		}
	}

	private checkCollisions() {
		const seg = this.distance;
		const isGhost = this.activePowerUp?.type === "GHOST";
		const isInvincible = Date.now() < this.invincibleUntil;
		const isPolice = this.vehicleId === "police";

		for (let i = -2; i <= 2; i++) {
			const s = seg + i;
			const t = this.road.getTraffic(s);
			if (!t) continue;

			// Overtake check
			if (!t.passed && i < 0) {
				this.road.markPassed(s);
				this.overtakes++;
				this.comboKills++;
				this.comboTimer = SCORING.COMBO_TIMEOUT;
				this.updateCombo();
				this.score += SCORING.OVERTAKE * this.comboMultiplier;

				const lateralDist = Math.abs(this.playerX - t.offset);
				if (lateralDist < SCORING.NEAR_MISS_THRESHOLD * 2 && lateralDist > 0.05) {
					this.nearMisses++;
					this.score += SCORING.NEAR_MISS * this.comboMultiplier;
					this.callbacks.onNearMiss();
				}
				this.playSFX(600 + this.comboMultiplier * 100, "sine", 0.08, 0.08);
				continue;
			}

			if (Math.abs(i) > 1) continue;
			if (Math.abs(this.playerX - t.offset) < 0.25) {
				if (isGhost) continue;
				if (isPolice) {
					t.offset += t.offset < this.playerX ? -0.5 : 0.5;
					continue;
				}
				if (isInvincible) continue;
				this.onCrash();
				this.road.removeTraffic(s);
				break;
			}
		}

		// Coins & power-ups
		const hasMagnet = this.activePowerUp?.type === "MAGNET";
		for (let i = -1; i <= 1; i++) {
			const s = seg + i;
			if (this.road.hasCoin(s) && (Math.abs(this.playerX) < 0.4 || hasMagnet)) {
				this.road.removeCoin(s);
				this.coinsCollected += COINS.BASE_VALUE;
				this.score += COINS.BASE_VALUE;
				this.playSFX(880, "sine", 0.06, 0.06);
			}
			const pu = this.road.getPowerUp(s);
			if (pu && i === 0 && Math.abs(this.playerX) < 0.4) {
				this.road.removePowerUp(s);
				this.activatePowerUp(pu as PowerUpId);
			}
		}
	}

	private activatePowerUp(type: PowerUpId) {
		const cfg = POWERUPS_CFG.TYPES[type];
		if (type === "SHIELD") {
			this.crashesLeft++;
		} else {
			this.activePowerUp = { type, remaining: cfg.duration, duration: cfg.duration };
		}
		this.playSFX(523, "sine", 0.15, 0.1);
	}

	private onCrash() {
		this.speed *= PLAYER_CFG.CRASH_SPEED_LOSS;
		this.crashesLeft--;
		this.comboKills = 0;
		this.comboMultiplier = 1;
		this.invincibleUntil = Date.now() + PLAYER_CFG.CRASH_INVINCIBLE;
		this.callbacks.onCrash();
		this.playCrashSFX();
		if (this.crashesLeft <= 0) this.onGameOver();
	}

	private onGameOver() {
		this.state = "game-over";
		this.stopAudio();
		const data = this.getSavedData();
		const isNew = this.distance > data.bestDistance;
		data.totalCoins += this.coinsCollected;
		if (isNew) {
			data.bestDistance = this.distance;
			data.bestZone = this.lastZoneName;
		}
		data.totalRuns++;
		this.saveData(data);
		this.callbacks.onGameOver(
			{
				distance: this.distance,
				speed: 0,
				score: this.score,
				coins: this.coinsCollected,
				overtakes: this.overtakes,
				nearMisses: this.nearMisses,
				combo: 1,
				crashesLeft: 0,
				zone: this.lastZoneName,
				activePowerUp: null,
			},
			isNew,
		);
		this.callbacks.onStateChange("game-over");
	}

	private updateCombo() {
		this.comboMultiplier = 1;
		for (let i = SCORING.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
			if (this.comboKills >= SCORING.COMBO_THRESHOLDS[i]) {
				this.comboMultiplier = i + 1;
				break;
			}
		}
	}

	// === DRAW ===

	private draw() {
		const ctx = this.ctx;
		const { zone } = this.road.getZone(this.distance);

		// Sky
		this.roadRenderer.drawSky(zone);
		this.roadRenderer.drawHorizonGlow(zone, this.time);

		// Road
		this.roadRenderer.drawRoad(this.road, this.position, this.playerX);

		// Draw items on road
		this.drawItems();

		// Player
		this.drawPlayer();

		// Speed lines
		this.roadRenderer.drawSpeedLines(ctx, this.speed, this.maxSpeed);

		// Nitro trails
		if (this.activePowerUp?.type === "NITRO") this.drawNitroTrails();

		// Ghost tint
		if (this.activePowerUp?.type === "GHOST") {
			ctx.globalAlpha = 0.15;
			ctx.fillStyle = "#7B61FF";
			ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
			ctx.globalAlpha = 1;
		}

		// Vignette
		this.drawVignette();
	}

	private drawItems() {
		const ctx = this.ctx;
		// Draw items for nearby segments — position them at the screen Y based on their distance
		for (let offset = 60; offset >= -2; offset--) {
			const segIdx = this.distance + offset;
			if (offset < 0) continue;

			// Calculate screen Y for this segment distance
			const zDist = offset + (this.position - Math.floor(this.position));
			if (zDist <= 0) continue;
			const perspective = (150 * 120) / (zDist * ROAD.SEGMENT_LENGTH);
			const screenY = HORIZON_Y + perspective;
			if (screenY > SCREEN.HEIGHT || screenY < HORIZON_Y) continue;

			// Road width at this Y
			const roadW = (0.45 * SCREEN.WIDTH) / ((zDist * ROAD.SEGMENT_LENGTH * 0.08) / 120);
			const scale = roadW / (SCREEN.WIDTH * 0.45);

			// Road center at this Y (simplified — no curve accumulation for items)
			const centerX = SCREEN.WIDTH / 2 - this.playerX * roadW * 0.5;

			// Traffic
			const traffic = this.road.getTraffic(segIdx);
			if (traffic) {
				const carX = centerX + traffic.offset * roadW;
				const carW = Math.max(3, 18 * scale);
				const carH = Math.max(4, 24 * scale);
				const color = this.getTrafficColor(traffic.type);
				ctx.fillStyle = color;
				ctx.fillRect(carX - carW / 2, screenY - carH, carW, carH);
				// Tail lights
				ctx.fillStyle = "#FF3131";
				const tlS = Math.max(1, 2 * scale);
				ctx.fillRect(carX - carW / 2 + 1, screenY - tlS - 1, tlS, tlS);
				ctx.fillRect(carX + carW / 2 - tlS - 1, screenY - tlS - 1, tlS, tlS);
			}

			// Coins
			if (this.road.hasCoin(segIdx)) {
				const coinR = Math.max(2, 4 * scale);
				const pulse = 1 + Math.sin(this.time * 0.005 + segIdx) * 0.2;
				ctx.beginPath();
				ctx.arc(centerX, screenY - coinR * 2, coinR * pulse, 0, Math.PI * 2);
				ctx.fillStyle = "#FFD700";
				ctx.fill();
			}

			// Power-ups
			const pu = this.road.getPowerUp(segIdx);
			if (pu) {
				const puR = Math.max(3, 5 * scale);
				const color = POWERUPS_CFG.TYPES[pu as PowerUpId]?.color ?? "#FFFFFF";
				ctx.beginPath();
				ctx.arc(centerX, screenY - puR * 2, puR, 0, Math.PI * 2);
				ctx.fillStyle = `${color}80`;
				ctx.fill();
				ctx.strokeStyle = color;
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}
	}

	private getTrafficColor(type: string): string {
		switch (type) {
			case "taxi":
				return "#FFD700";
			case "sedan":
				return "#6688AA";
			case "truck":
				return "#AA4444";
			case "moto_npc":
				return "#44CC44";
			case "cyclist":
				return "#88CCFF";
			case "rock":
				return "#666666";
			case "barrier":
				return "#FF3131";
			default:
				return "#888888";
		}
	}

	private drawPlayer() {
		const ctx = this.ctx;
		const v = VEHICLES[this.vehicleId];
		const cx = SCREEN.WIDTH / 2 + this.steerInput * 12;
		const cy = SCREEN.HEIGHT - 70;

		if (Date.now() < this.invincibleUntil && Math.floor(Date.now() / 100) % 2 === 0)
			ctx.globalAlpha = 0.4;
		if (this.activePowerUp?.type === "GHOST") ctx.globalAlpha = 0.5;

		// Car body
		ctx.beginPath();
		ctx.moveTo(cx, cy - 18);
		ctx.lineTo(cx + 14, cy + 4);
		ctx.lineTo(cx + 11, cy + 18);
		ctx.lineTo(cx - 11, cy + 18);
		ctx.lineTo(cx - 14, cy + 4);
		ctx.closePath();
		ctx.fillStyle = v.color;
		ctx.fill();

		// Windshield
		ctx.fillStyle = "#FFFFFF30";
		ctx.fillRect(cx - 5, cy - 8, 10, 8);

		// Tail lights
		ctx.fillStyle = "#FF3131";
		ctx.fillRect(cx - 11, cy + 14, 4, 3);
		ctx.fillRect(cx + 7, cy + 14, 4, 3);

		// Engine glow
		ctx.shadowColor = v.color;
		ctx.shadowBlur = 6;
		ctx.fillStyle = v.color;
		ctx.fillRect(cx - 3, cy + 18, 6, 3);
		ctx.shadowBlur = 0;
		ctx.globalAlpha = 1;
	}

	private drawNitroTrails() {
		const ctx = this.ctx;
		const cx = SCREEN.WIDTH / 2 + this.steerInput * 12;
		const cy = SCREEN.HEIGHT - 49;
		for (const ox of [-7, 7]) {
			const len = 20 + Math.random() * 15;
			const grad = ctx.createLinearGradient(cx + ox, cy, cx + ox, cy + len);
			grad.addColorStop(0, "#00F0FF60");
			grad.addColorStop(1, "transparent");
			ctx.fillStyle = grad;
			ctx.fillRect(cx + ox - 2, cy, 4, len);
		}
	}

	private vignetteCanvas: HTMLCanvasElement | null = null;
	private drawVignette() {
		if (!this.vignetteCanvas) {
			this.vignetteCanvas = document.createElement("canvas");
			this.vignetteCanvas.width = SCREEN.WIDTH;
			this.vignetteCanvas.height = SCREEN.HEIGHT;
			const vCtx = this.vignetteCanvas.getContext("2d")!;
			const g = vCtx.createRadialGradient(
				SCREEN.WIDTH / 2,
				SCREEN.HEIGHT / 2,
				SCREEN.WIDTH * 0.3,
				SCREEN.WIDTH / 2,
				SCREEN.HEIGHT / 2,
				SCREEN.WIDTH * 0.8,
			);
			g.addColorStop(0, "transparent");
			g.addColorStop(1, "rgba(0,0,0,0.4)");
			vCtx.fillStyle = g;
			vCtx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
		}
		this.ctx.drawImage(this.vignetteCanvas, 0, 0);
	}

	// === AUDIO ===
	private initAudio() {
		try {
			this.audioCtx = new AudioContext();
			this.masterGain = this.audioCtx.createGain();
			this.masterGain.gain.value = this._muted ? 0 : 0.4;
			this.masterGain.connect(this.audioCtx.destination);
			// Engine
			this.engineOsc = this.audioCtx.createOscillator();
			this.engineGain = this.audioCtx.createGain();
			this.engineOsc.type = "sawtooth";
			this.engineOsc.frequency.value = 80;
			this.engineGain.gain.value = 0.03;
			const ef = this.audioCtx.createBiquadFilter();
			ef.type = "lowpass";
			ef.frequency.value = 300;
			this.engineOsc.connect(ef);
			ef.connect(this.engineGain);
			this.engineGain.connect(this.masterGain);
			this.engineOsc.start();
			// Bass
			this.bassOsc = this.audioCtx.createOscillator();
			this.bassGain = this.audioCtx.createGain();
			this.bassOsc.type = "sawtooth";
			this.bassOsc.frequency.value = 55;
			this.bassGain.gain.value = 0.05;
			const bf = this.audioCtx.createBiquadFilter();
			bf.type = "lowpass";
			bf.frequency.value = 150;
			this.bassOsc.connect(bf);
			bf.connect(this.bassGain);
			this.bassGain.connect(this.masterGain);
			this.bassOsc.start();
		} catch {}
	}

	private updateEngineSound() {
		if (!this.engineOsc || !this.audioCtx) return;
		const r = this.speed / this.maxSpeed;
		this.engineOsc.frequency.setTargetAtTime(60 + r * 200, this.audioCtx.currentTime, 0.1);
		if (this.engineGain)
			this.engineGain.gain.setTargetAtTime(0.02 + r * 0.04, this.audioCtx.currentTime, 0.1);
	}

	private updateMusicLayers() {
		if (!this.audioCtx || !this.masterGain) return;
		const r = this.speed / this.maxSpeed;
		if (r > 0.4 && !this.drumInterval) {
			this.drumInterval = setInterval(() => {
				if (!this.audioCtx || !this.masterGain) return;
				const o = this.audioCtx.createOscillator();
				const g = this.audioCtx.createGain();
				o.type = "sine";
				o.frequency.setValueAtTime(120, this.audioCtx.currentTime);
				o.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.08);
				g.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
				g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
				o.connect(g);
				g.connect(this.masterGain);
				o.start();
				o.stop(this.audioCtx.currentTime + 0.1);
			}, 250);
		} else if (r <= 0.4 && this.drumInterval) {
			clearInterval(this.drumInterval);
			this.drumInterval = null;
		}

		if (r > 0.7 && !this.arpInterval) {
			const notes = [220, 277, 330, 440, 330, 277];
			let idx = 0;
			this.arpInterval = setInterval(() => {
				if (!this.audioCtx || !this.masterGain) return;
				const o = this.audioCtx.createOscillator();
				const g = this.audioCtx.createGain();
				o.type = "triangle";
				o.frequency.value = notes[idx % notes.length];
				idx++;
				g.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
				g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
				o.connect(g);
				g.connect(this.masterGain);
				o.start();
				o.stop(this.audioCtx.currentTime + 0.12);
			}, 120);
		} else if (r <= 0.7 && this.arpInterval) {
			clearInterval(this.arpInterval);
			this.arpInterval = null;
		}
	}

	private stopAudio() {
		try {
			this.engineOsc?.stop();
		} catch {}
		try {
			this.bassOsc?.stop();
		} catch {}
		if (this.drumInterval) clearInterval(this.drumInterval);
		if (this.arpInterval) clearInterval(this.arpInterval);
		this.drumInterval = null;
		this.arpInterval = null;
	}

	private playSFX(freq: number, type: OscillatorType, dur: number, vol = 0.1) {
		if (!this.audioCtx || !this.masterGain) return;
		const o = this.audioCtx.createOscillator();
		const g = this.audioCtx.createGain();
		o.type = type;
		o.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
		o.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioCtx.currentTime + dur);
		g.gain.setValueAtTime(vol, this.audioCtx.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
		o.connect(g);
		g.connect(this.masterGain);
		o.start();
		o.stop(this.audioCtx.currentTime + dur);
	}

	private playCrashSFX() {
		if (!this.audioCtx || !this.masterGain) return;
		const bs = this.audioCtx.sampleRate * 0.3;
		const buf = this.audioCtx.createBuffer(1, bs, this.audioCtx.sampleRate);
		const d = buf.getChannelData(0);
		for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
		const n = this.audioCtx.createBufferSource();
		n.buffer = buf;
		const g = this.audioCtx.createGain();
		g.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
		n.connect(g);
		g.connect(this.masterGain);
		n.start();
		n.stop(this.audioCtx.currentTime + 0.3);
	}
}
