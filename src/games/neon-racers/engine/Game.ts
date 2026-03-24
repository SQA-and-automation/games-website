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
	ZONES,
} from "../config";
import { RoadRenderer } from "../renderer/RoadRenderer";
import type {
	ActivePowerUp,
	GameCallbacks,
	GameState,
	GameStats,
	SavedData,
	TrafficCar,
} from "../types";
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

	// State
	private state: GameState = "menu";
	private animFrameId = 0;
	private lastTime = 0;
	private time = 0;

	// Player
	private vehicleId: VehicleId = "sportcar";
	private position = 0; // segment position (float)
	private playerX = 0; // -1 to 1
	private speed = 0;
	private maxSpeed: number = PLAYER_CFG.MAX_SPEED;
	private crashesLeft: number = 3;
	private invincibleUntil = 0;

	// Input
	private steerInput = 0; // -1 to 1
	private targetSteerX: number | null = null; // touch target
	private keys = new Set<string>();

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

	// Traffic & items
	private trafficSpawnTimer = 0;
	private lastZoneName = "";

	// Audio placeholder
	private audioCtx: AudioContext | null = null;
	private engineOsc: OscillatorNode | null = null;
	private engineGain: GainNode | null = null;
	private masterGain: GainNode | null = null;
	private _muted = false;

	// Music layers
	private bassOsc: OscillatorNode | null = null;
	private bassGain: GainNode | null = null;
	private drumInterval: ReturnType<typeof setInterval> | null = null;
	private arpInterval: ReturnType<typeof setInterval> | null = null;

	constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
		this.canvas = canvas;
		canvas.width = SCREEN.WIDTH;
		canvas.height = SCREEN.HEIGHT;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas 2D context not available");
		this.ctx = ctx;
		this.callbacks = callbacks;
		this.road = new Road();
		this.roadRenderer = new RoadRenderer(ctx);

		// Input
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
		this.vehicleId = vehicleId;
		const v = VEHICLES[vehicleId];
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
		this.trafficSpawnTimer = 0;
		this.lastZoneName = "";
		this.time = 0;

		// Clear traffic & items from road
		for (const seg of this.road.segments) {
			seg.trafficCar = undefined;
			seg.coin = undefined;
			seg.powerUp = undefined;
		}

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
		} catch {
			/* unavailable */
		}
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

	// === INPUT ===

	private onKeyDown = (e: KeyboardEvent) => {
		this.keys.add(e.key);
	};
	private onKeyUp = (e: KeyboardEvent) => {
		this.keys.delete(e.key);
	};

	private screenToPlayerX(clientX: number): number {
		const rect = this.canvas.getBoundingClientRect();
		const ratio = (clientX - rect.left) / rect.width;
		return (ratio - 0.5) * 2; // -1 to 1
	}

	private onTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		this.targetSteerX = this.screenToPlayerX(e.touches[0].clientX);
	};
	private onTouchMove = (e: TouchEvent) => {
		e.preventDefault();
		this.targetSteerX = this.screenToPlayerX(e.touches[0].clientX);
	};
	private onTouchEnd = () => {
		this.targetSteerX = null;
	};
	private mouseDown = false;
	private onMouseDown = (e: MouseEvent) => {
		this.mouseDown = true;
		this.targetSteerX = this.screenToPlayerX(e.clientX);
	};
	private onMouseMove = (e: MouseEvent) => {
		if (!this.mouseDown) return;
		this.targetSteerX = this.screenToPlayerX(e.clientX);
	};
	private onMouseUp = () => {
		this.mouseDown = false;
		this.targetSteerX = null;
	};

	// === GAME LOOP ===

	private loop(timestamp: number) {
		if (this.state !== "playing") return;

		const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
		this.lastTime = timestamp;
		this.time = timestamp;

		const slowFactor =
			this.activePowerUp?.type === "SLOW_MO" ? POWERUPS_CFG.TYPES.SLOW_MO.factor : 1;

		this.update(rawDt, slowFactor);
		this.draw();

		this.animFrameId = requestAnimationFrame(this.loop);
	}

	private update(dt: number, slowFactor: number) {
		const vehicle = VEHICLES[this.vehicleId];

		// Steering input
		this.steerInput = 0;
		if (this.keys.has("ArrowLeft") || this.keys.has("a")) this.steerInput = -1;
		if (this.keys.has("ArrowRight") || this.keys.has("d")) this.steerInput = 1;

		if (this.targetSteerX !== null) {
			const diff = this.targetSteerX - this.playerX;
			this.steerInput = Math.max(-1, Math.min(1, diff * 3));
		}

		// Speed
		this.speed = Math.min(this.maxSpeed, this.speed + PLAYER_CFG.ACCEL * dt);

		// Nitro boost
		if (this.activePowerUp?.type === "NITRO") {
			this.speed = Math.min(this.maxSpeed * 1.8, this.speed + PLAYER_CFG.ACCEL * 3 * dt);
		}

		// Steering
		const steerAmount =
			this.steerInput *
			PLAYER_CFG.STEER_SPEED *
			vehicle.handling *
			dt *
			(this.speed / this.maxSpeed);
		this.playerX += steerAmount;

		// Centrifugal force from curves
		const currentSeg = this.road.getSegment(Math.floor(this.position));
		if (currentSeg) {
			this.playerX += currentSeg.curve * PLAYER_CFG.CENTRIFUGAL * (this.speed / this.maxSpeed) * dt;
		}

		// Clamp player position
		this.playerX = Math.max(-1.2, Math.min(1.2, this.playerX));

		// Off-road deceleration
		if (Math.abs(this.playerX) > 0.9) {
			this.speed = Math.max(
				PLAYER_CFG.START_SPEED * 0.5,
				this.speed - PLAYER_CFG.OFF_ROAD_DECEL * dt,
			);
		}

		// Move forward
		const effectiveSpeed = this.speed * slowFactor;
		this.position += (effectiveSpeed * dt) / ROAD.SEGMENT_LENGTH;
		this.distance = Math.floor(this.position);

		// Score from distance
		this.score = Math.floor(this.distance * SCORING.DISTANCE_MULT);

		// Combo timer
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
			if (this.activePowerUp.remaining <= 0) {
				this.activePowerUp = null;
			}
		}

		// Zone change
		const { zone, cycleNum } = this.road.getZone(Math.floor(this.position));
		if (zone.name !== this.lastZoneName) {
			this.lastZoneName = zone.name;
			this.callbacks.onZoneChange(zone.name);
		}

		// Spawn traffic, coins, power-ups ahead
		this.spawnItems(cycleNum);

		// Check collisions with traffic
		this.checkTrafficCollisions();

		// Check coin/powerup collection
		this.checkItemCollection();

		// Update engine audio
		this.updateEngineSound();

		// Update music layers
		this.updateMusicLayers();

		// Callbacks
		this.callbacks.onStatsUpdate(this.getStats(zone.name));
	}

	private spawnItems(cycleNum: number) {
		const ahead = Math.floor(this.position) + ROAD.VISIBLE_SEGMENTS;
		const spawnStart = Math.max(Math.floor(this.position) + 20, ahead - 30);

		for (let i = spawnStart; i < ahead; i++) {
			const seg = this.road.getSegment(i);
			if (!seg) continue;

			// Don't re-spawn on segments that already have stuff
			if (seg.trafficCar || seg.coin || seg.powerUp) continue;

			const difficultyMult = 1 + cycleNum * 0.3;

			// Traffic
			if (Math.random() < 0.03 * difficultyMult) {
				const { zone } = this.road.getZone(i);
				const types = zone.trafficTypes;
				seg.trafficCar = {
					offset: (Math.random() - 0.5) * 1.4,
					type: types[Math.floor(Math.random() * types.length)],
					speed: 0.3 + Math.random() * 0.4,
					passed: false,
				};
			}

			// Coins
			if (Math.random() < COINS.SPAWN_CHANCE) {
				seg.coin = true;
			}

			// Power-ups
			if (Math.random() < POWERUPS_CFG.SPAWN_CHANCE) {
				const types = Object.keys(POWERUPS_CFG.TYPES) as PowerUpId[];
				seg.powerUp = types[Math.floor(Math.random() * types.length)];
			}
		}
	}

	private checkTrafficCollisions() {
		const playerSeg = Math.floor(this.position);
		const isGhost = this.activePowerUp?.type === "GHOST";
		const isInvincible = Date.now() < this.invincibleUntil;
		const isPolice = this.vehicleId === "police";

		for (let i = -2; i <= 2; i++) {
			const idx = playerSeg + i;
			if (idx < 0) continue;
			const seg = this.road.getSegment(idx);
			if (!seg?.trafficCar) continue;

			const car = seg.trafficCar;

			// Check overtake
			if (!car.passed && i < 0) {
				car.passed = true;
				this.overtakes++;
				this.comboKills++;
				this.comboTimer = SCORING.COMBO_TIMEOUT;
				this.updateCombo();

				const points = SCORING.OVERTAKE * this.comboMultiplier;
				this.score += points;

				// Near miss check
				const lateralDist = Math.abs(this.playerX - car.offset);
				if (lateralDist < SCORING.NEAR_MISS_THRESHOLD * 2 && lateralDist > 0.05) {
					this.nearMisses++;
					this.score += SCORING.NEAR_MISS * this.comboMultiplier;
					this.callbacks.onNearMiss();
				}

				this.playOvertakeSFX();
				continue;
			}

			// Collision check (only on same segment ±1)
			if (Math.abs(i) > 1) continue;
			const lateralDist = Math.abs(this.playerX - car.offset);
			if (lateralDist < 0.25) {
				if (isGhost) continue;

				// Police pushes traffic
				if (isPolice) {
					car.offset += car.offset < this.playerX ? -0.5 : 0.5;
					continue;
				}

				if (isInvincible) continue;

				// CRASH
				this.onCrash();
				seg.trafficCar = undefined;
				break;
			}
		}
	}

	private checkItemCollection() {
		const playerSeg = Math.floor(this.position);
		const hasMagnet = this.activePowerUp?.type === "MAGNET";
		const magnetRange = hasMagnet ? POWERUPS_CFG.TYPES.MAGNET.range : 0.3;

		for (let i = -1; i <= 1; i++) {
			const idx = playerSeg + i;
			if (idx < 0) continue;
			const seg = this.road.getSegment(idx);
			if (!seg) continue;

			// Coins
			if (seg.coin) {
				// Magnet widens collection range
				if (Math.abs(this.playerX) < magnetRange || hasMagnet) {
					seg.coin = undefined;
					this.coinsCollected += COINS.BASE_VALUE;
					this.score += COINS.BASE_VALUE;
					this.playCoinSFX();
				}
			}

			// Power-ups
			if (seg.powerUp && i === 0) {
				if (Math.abs(this.playerX) < 0.4) {
					const type = seg.powerUp;
					seg.powerUp = undefined;
					this.activatePowerUp(type);
				}
			}
		}
	}

	private activatePowerUp(type: PowerUpId) {
		const cfg = POWERUPS_CFG.TYPES[type];
		if (type === "SHIELD") {
			// Shield is instant — adds 1 crash tolerance
			this.crashesLeft++;
			this.playPowerUpSFX();
			return;
		}
		this.activePowerUp = {
			type,
			remaining: cfg.duration,
			duration: cfg.duration,
		};
		this.playPowerUpSFX();
	}

	private onCrash() {
		this.speed *= PLAYER_CFG.CRASH_SPEED_LOSS;
		this.crashesLeft--;
		this.comboKills = 0;
		this.comboMultiplier = 1;
		this.comboTimer = 0;
		this.invincibleUntil = Date.now() + PLAYER_CFG.CRASH_INVINCIBLE;
		this.callbacks.onCrash();
		this.playCrashSFX();

		if (this.crashesLeft <= 0) {
			this.onGameOver();
		}
	}

	private onGameOver() {
		this.state = "game-over";
		this.stopAudio();

		// Save
		const data = this.getSavedData();
		const isNewRecord = this.distance > data.bestDistance;
		data.totalCoins += this.coinsCollected;
		if (isNewRecord) {
			data.bestDistance = this.distance;
			data.bestZone = this.lastZoneName;
		}
		data.totalRuns++;
		this.saveData(data);

		const stats = this.getStats(this.lastZoneName);
		this.callbacks.onGameOver(stats, isNewRecord);
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

	private getStats(zoneName: string): GameStats {
		return {
			distance: this.distance,
			speed: Math.floor(this.speed),
			score: this.score,
			coins: this.coinsCollected,
			overtakes: this.overtakes,
			nearMisses: this.nearMisses,
			combo: this.comboMultiplier,
			crashesLeft: this.crashesLeft,
			zone: zoneName,
			activePowerUp: this.activePowerUp ? { ...this.activePowerUp } : null,
		};
	}

	// === DRAW ===

	private draw() {
		const ctx = this.ctx;
		const segIndex = Math.floor(this.position);
		const { zone } = this.road.getZone(segIndex);

		// Project road
		this.road.project(this.position, this.playerX, 1000, 1 / Math.tan((80 * Math.PI) / 360));

		// Sky
		this.roadRenderer.drawSky(zone);
		this.roadRenderer.drawHorizonGlow(zone, this.time);

		// Road
		this.roadRenderer.drawRoad(this.road, this.position, this.playerX);

		// Traffic, coins, power-ups (drawn on road segments)
		this.drawItems(segIndex);

		// Player vehicle
		this.drawPlayer();

		// Speed lines
		this.roadRenderer.drawSpeedLines(ctx, this.speed, this.maxSpeed);

		// Nitro trails
		if (this.activePowerUp?.type === "NITRO") {
			this.drawNitroTrails();
		}

		// Ghost overlay
		if (this.activePowerUp?.type === "GHOST") {
			ctx.globalAlpha = 0.3;
			ctx.fillStyle = "#7B61FF";
			ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
			ctx.globalAlpha = 1;
		}

		// Vignette
		this.drawVignette();
	}

	private drawItems(baseIndex: number) {
		const ctx = this.ctx;

		for (let n = ROAD.VISIBLE_SEGMENTS - 1; n > 0; n--) {
			const segIndex = (baseIndex + n) % this.road.length;
			const seg = this.road.getSegment(segIndex);
			if (!seg) continue;

			if (seg.p2.y >= SCREEN.HEIGHT || seg.p2.w < 2) continue;

			const scale = seg.p2.w / ROAD.WIDTH;

			// Traffic car
			if (seg.trafficCar) {
				const car = seg.trafficCar;
				const carX = seg.p2.x + car.offset * (seg.p2.w / 2);
				const carW = Math.max(4, 24 * scale * 40);
				const carH = carW * 1.2;

				ctx.fillStyle = this.getTrafficColor(car.type);
				ctx.fillRect(carX - carW / 2, seg.p2.y - carH, carW, carH);

				// Tail lights
				ctx.fillStyle = "#FF3131";
				ctx.fillRect(carX - carW / 2 + 2, seg.p2.y - 3, 3, 2);
				ctx.fillRect(carX + carW / 2 - 5, seg.p2.y - 3, 3, 2);
			}

			// Coin
			if (seg.coin) {
				const coinX = seg.p2.x;
				const coinSize = Math.max(2, 6 * scale * 40);
				const pulse = 1 + Math.sin(this.time * 0.005 + segIndex) * 0.2;

				ctx.beginPath();
				ctx.arc(coinX, seg.p2.y - coinSize, coinSize * pulse, 0, Math.PI * 2);
				ctx.fillStyle = "#FFD700";
				ctx.fill();
				ctx.shadowColor = "#FFD700";
				ctx.shadowBlur = 4;
				ctx.fill();
				ctx.shadowBlur = 0;
			}

			// Power-up
			if (seg.powerUp) {
				const puX = seg.p2.x;
				const puSize = Math.max(3, 8 * scale * 40);
				const color = POWERUPS_CFG.TYPES[seg.powerUp].color;
				const pulse = 1 + Math.sin(this.time * 0.006 + segIndex) * 0.25;

				ctx.beginPath();
				ctx.arc(puX, seg.p2.y - puSize * 1.5, puSize * pulse, 0, Math.PI * 2);
				ctx.fillStyle = `${color}60`;
				ctx.fill();
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.shadowColor = color;
				ctx.shadowBlur = 8;
				ctx.stroke();
				ctx.shadowBlur = 0;
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
		const vehicle = VEHICLES[this.vehicleId];
		const cx = SCREEN.WIDTH / 2 + this.steerInput * 15;
		const cy = SCREEN.HEIGHT - 80;
		const w = 28;
		const h = 36;

		// Invincibility flash
		if (Date.now() < this.invincibleUntil && Math.floor(Date.now() / 100) % 2 === 0) {
			ctx.globalAlpha = 0.4;
		}

		// Ghost transparency
		if (this.activePowerUp?.type === "GHOST") {
			ctx.globalAlpha = 0.5;
		}

		// Vehicle body
		const color = vehicle.color;
		ctx.beginPath();
		ctx.moveTo(cx, cy - h / 2); // nose
		ctx.lineTo(cx + w / 2, cy + h * 0.2); // right
		ctx.lineTo(cx + w / 2 - 3, cy + h / 2); // right rear
		ctx.lineTo(cx - w / 2 + 3, cy + h / 2); // left rear
		ctx.lineTo(cx - w / 2, cy + h * 0.2); // left
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();

		// Windshield
		ctx.beginPath();
		ctx.moveTo(cx - 6, cy - h * 0.15);
		ctx.lineTo(cx + 6, cy - h * 0.15);
		ctx.lineTo(cx + 5, cy + 2);
		ctx.lineTo(cx - 5, cy + 2);
		ctx.closePath();
		ctx.fillStyle = "#FFFFFF40";
		ctx.fill();

		// Tail lights
		ctx.fillStyle = "#FF3131";
		ctx.fillRect(cx - w / 2 + 2, cy + h / 2 - 4, 4, 3);
		ctx.fillRect(cx + w / 2 - 6, cy + h / 2 - 4, 4, 3);

		// Engine glow
		ctx.shadowColor = color;
		ctx.shadowBlur = 8;
		ctx.fillStyle = color;
		ctx.fillRect(cx - 3, cy + h / 2, 6, 4);
		ctx.shadowBlur = 0;

		ctx.globalAlpha = 1;
	}

	private drawNitroTrails() {
		const ctx = this.ctx;
		const cx = SCREEN.WIDTH / 2 + this.steerInput * 15;
		const cy = SCREEN.HEIGHT - 60;

		for (let i = 0; i < 2; i++) {
			const offsetX = i === 0 ? -8 : 8;
			const trailLen = 30 + Math.random() * 20;

			const gradient = ctx.createLinearGradient(cx + offsetX, cy, cx + offsetX, cy + trailLen);
			gradient.addColorStop(0, "#00F0FF80");
			gradient.addColorStop(0.5, "#00F0FF40");
			gradient.addColorStop(1, "transparent");

			ctx.fillStyle = gradient;
			ctx.fillRect(cx + offsetX - 2, cy, 4, trailLen);
		}
	}

	private vignetteCanvas: HTMLCanvasElement | null = null;
	private drawVignette() {
		if (!this.vignetteCanvas) {
			this.vignetteCanvas = document.createElement("canvas");
			this.vignetteCanvas.width = SCREEN.WIDTH;
			this.vignetteCanvas.height = SCREEN.HEIGHT;
			const vCtx = this.vignetteCanvas.getContext("2d")!;
			const gradient = vCtx.createRadialGradient(
				SCREEN.WIDTH / 2,
				SCREEN.HEIGHT / 2,
				SCREEN.WIDTH * 0.3,
				SCREEN.WIDTH / 2,
				SCREEN.HEIGHT / 2,
				SCREEN.WIDTH * 0.8,
			);
			gradient.addColorStop(0, "transparent");
			gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
			vCtx.fillStyle = gradient;
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

			// Engine drone
			this.engineOsc = this.audioCtx.createOscillator();
			this.engineGain = this.audioCtx.createGain();
			this.engineOsc.type = "sawtooth";
			this.engineOsc.frequency.value = 80;
			this.engineGain.gain.value = 0.04;
			const engineFilter = this.audioCtx.createBiquadFilter();
			engineFilter.type = "lowpass";
			engineFilter.frequency.value = 300;
			this.engineOsc.connect(engineFilter);
			engineFilter.connect(this.engineGain);
			this.engineGain.connect(this.masterGain);
			this.engineOsc.start();

			// Bass layer (always on)
			this.bassOsc = this.audioCtx.createOscillator();
			this.bassGain = this.audioCtx.createGain();
			this.bassOsc.type = "sawtooth";
			this.bassOsc.frequency.value = 55;
			this.bassGain.gain.value = 0.06;
			const bassFilter = this.audioCtx.createBiquadFilter();
			bassFilter.type = "lowpass";
			bassFilter.frequency.value = 150;
			this.bassOsc.connect(bassFilter);
			bassFilter.connect(this.bassGain);
			this.bassGain.connect(this.masterGain);
			this.bassOsc.start();
		} catch {
			/* Web Audio unavailable */
		}
	}

	private updateEngineSound() {
		if (!this.engineOsc || !this.audioCtx) return;
		const ratio = this.speed / this.maxSpeed;
		this.engineOsc.frequency.setTargetAtTime(60 + ratio * 200, this.audioCtx.currentTime, 0.1);
		if (this.engineGain) {
			this.engineGain.gain.setTargetAtTime(0.02 + ratio * 0.05, this.audioCtx.currentTime, 0.1);
		}
	}

	private updateMusicLayers() {
		if (!this.audioCtx || !this.masterGain) return;
		const ratio = this.speed / this.maxSpeed;

		// Drums layer at medium speed
		if (ratio > 0.4 && !this.drumInterval) {
			this.drumInterval = setInterval(() => {
				if (!this.audioCtx || !this.masterGain) return;
				const osc = this.audioCtx.createOscillator();
				const gain = this.audioCtx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
				osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.08);
				gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
				osc.connect(gain);
				gain.connect(this.masterGain);
				osc.start();
				osc.stop(this.audioCtx.currentTime + 0.1);
			}, 250);
		} else if (ratio <= 0.4 && this.drumInterval) {
			clearInterval(this.drumInterval);
			this.drumInterval = null;
		}

		// Arp layer at high speed
		if (ratio > 0.7 && !this.arpInterval) {
			const notes = [220, 277, 330, 440, 330, 277];
			let idx = 0;
			this.arpInterval = setInterval(() => {
				if (!this.audioCtx || !this.masterGain) return;
				const osc = this.audioCtx.createOscillator();
				const gain = this.audioCtx.createGain();
				osc.type = "triangle";
				osc.frequency.value = notes[idx % notes.length];
				idx++;
				gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
				osc.connect(gain);
				gain.connect(this.masterGain);
				osc.start();
				osc.stop(this.audioCtx.currentTime + 0.12);
			}, 120);
		} else if (ratio <= 0.7 && this.arpInterval) {
			clearInterval(this.arpInterval);
			this.arpInterval = null;
		}
	}

	private stopAudio() {
		try {
			this.engineOsc?.stop();
		} catch {
			/* */
		}
		try {
			this.bassOsc?.stop();
		} catch {
			/* */
		}
		if (this.drumInterval) clearInterval(this.drumInterval);
		if (this.arpInterval) clearInterval(this.arpInterval);
		this.drumInterval = null;
		this.arpInterval = null;
	}

	private playSFX(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
		if (!this.audioCtx || !this.masterGain) return;
		const osc = this.audioCtx.createOscillator();
		const gain = this.audioCtx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioCtx.currentTime + duration);
		gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
		osc.connect(gain);
		gain.connect(this.masterGain);
		osc.start();
		osc.stop(this.audioCtx.currentTime + duration);
	}

	private playOvertakeSFX() {
		this.playSFX(600 + this.comboMultiplier * 100, "sine", 0.08, 0.08);
	}
	private playCoinSFX() {
		this.playSFX(880, "sine", 0.06, 0.06);
	}
	private playPowerUpSFX() {
		this.playSFX(523, "sine", 0.15, 0.1);
	}
	private playCrashSFX() {
		if (!this.audioCtx || !this.masterGain) return;
		const bufSize = this.audioCtx.sampleRate * 0.3;
		const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
		const d = buf.getChannelData(0);
		for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
		const noise = this.audioCtx.createBufferSource();
		noise.buffer = buf;
		const gain = this.audioCtx.createGain();
		gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
		noise.connect(gain);
		gain.connect(this.masterGain);
		noise.start();
		noise.stop(this.audioCtx.currentTime + 0.3);
	}
}
