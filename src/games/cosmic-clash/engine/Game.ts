import { AudioEngine } from "../audio/AudioEngine";
import { BOSS as BOSS_CFG, CANVAS, ENEMIES, PARTICLES, PLAYER, POWERUPS } from "../config";
import { Boss } from "../entities/Boss";
import { Bullet } from "../entities/Bullet";
import { Enemy } from "../entities/Enemy";
import { createExplosion, type Particle } from "../entities/Particle";
import { Player } from "../entities/Player";
import { PowerUpItem, rollEpicPowerUp, rollPowerUpType } from "../entities/PowerUp";
import { ScreenEffects } from "../renderer/Effects";
import { StarFieldRenderer } from "../renderer/StarField";
import { PowerUpSystem } from "../systems/PowerUpSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { WaveSystem } from "../systems/WaveSystem";
import type { GameCallbacks, GameState } from "../types";
import { rectsOverlap } from "./Collision";
import { Input } from "./Input";

export class Game {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private input: Input;
	private audio: AudioEngine;
	private starField: StarFieldRenderer;
	private effects: ScreenEffects;
	private waveSystem: WaveSystem;
	private powerUpSystem: PowerUpSystem;
	private scoreSystem: ScoreSystem;
	private callbacks: GameCallbacks;

	private player: Player;
	private enemies: Enemy[] = [];
	private boss: Boss | null = null;
	private bullets: Bullet[] = [];
	private powerUpItems: PowerUpItem[] = [];
	private particles: Particle[] = [];

	// Drone companions
	private droneAngle = 0;
	private laserStopFn: (() => void) | null = null;

	private state: GameState = "menu";
	private animFrameId = 0;
	private lastTime = 0;
	private waveTextTimer = 0;
	private waveTextContent = "";

	constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
		this.canvas = canvas;
		this.canvas.width = CANVAS.WIDTH;
		this.canvas.height = CANVAS.HEIGHT;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas 2D context not available");
		this.ctx = ctx;
		this.callbacks = callbacks;

		this.input = new Input(canvas);
		this.audio = new AudioEngine();
		this.starField = new StarFieldRenderer();
		this.effects = new ScreenEffects();
		this.waveSystem = new WaveSystem();
		this.powerUpSystem = new PowerUpSystem();
		this.scoreSystem = new ScoreSystem();
		this.player = new Player();

		this.loop = this.loop.bind(this);
	}

	start() {
		this.audio.init();
		this.state = "playing";
		this.callbacks.onStateChange("playing");
		this.reset();
		this.audio.startMusic();
		this.lastTime = performance.now();
		this.animFrameId = requestAnimationFrame(this.loop);
	}

	private reset() {
		this.player.reset();
		this.enemies = [];
		this.boss = null;
		this.bullets = [];
		this.powerUpItems = [];
		this.particles = [];
		this.waveSystem.reset();
		this.powerUpSystem.reset();
		this.scoreSystem.reset();
		this.droneAngle = 0;
		this.laserStopFn = null;

		this.waveSystem.startNextWave();
		this.showWaveText(`Wave ${this.waveSystem.wave}`);

		this.callbacks.onLivesChange(this.player.lives, this.player.hp);
		this.callbacks.onStatsUpdate(this.scoreSystem.getStats(this.waveSystem.wave));
		this.callbacks.onPowerUpsChange([]);
	}

	pause() {
		if (this.state !== "playing") return;
		this.state = "paused";
		this.callbacks.onStateChange("paused");
		this.audio.stopMusic();
	}

	resume() {
		if (this.state !== "paused") return;
		this.state = "playing";
		this.callbacks.onStateChange("playing");
		this.audio.startMusic();
		this.lastTime = performance.now();
		this.animFrameId = requestAnimationFrame(this.loop);
	}

	restart() {
		this.audio.stopMusic();
		this.start();
	}

	toggleMute() {
		this.audio.toggleMute();
		return this.audio.muted;
	}

	getHighScore(): number {
		return this.scoreSystem.load().highScore;
	}

	destroy() {
		cancelAnimationFrame(this.animFrameId);
		this.input.destroy();
		this.audio.destroy();
	}

	// === GAME LOOP ===

	private loop(timestamp: number) {
		if (this.state !== "playing") return;

		const rawDt = Math.min((timestamp - this.lastTime) / 16.67, 3); // cap at ~3 frames
		this.lastTime = timestamp;
		const slowFactor = this.powerUpSystem.slowFactor;

		this.update(rawDt, slowFactor);
		this.draw();

		this.animFrameId = requestAnimationFrame(this.loop);
	}

	private update(dt: number, slowFactor: number) {
		const now = Date.now();

		// Star field always moves
		this.starField.update(dt);
		this.effects.update(dt);

		// Wave text timer
		if (this.waveTextTimer > 0) {
			this.waveTextTimer -= dt * 16.67;
		}

		// Particles always update
		for (const p of this.particles) p.update(dt);
		this.particles = this.particles.filter((p) => p.alive);

		// Player
		this.player.speedMultiplier = this.powerUpSystem.hasSpeedBoost
			? POWERUPS.TYPES.SPEED_BOOST.multiplier
			: 1;
		this.player.shieldHits = this.powerUpSystem.hasShield ? POWERUPS.TYPES.SHIELD.hits : 0;
		this.player.update(this.input, dt);

		// Auto-fire
		if (this.player.alive && this.player.canFire(now)) {
			this.firePlayerBullets(now);
		}

		// Drone companions
		if (this.powerUpSystem.hasDrones) {
			this.droneAngle += 0.04 * dt;
			// Drones also fire
			if (this.player.canFire(now - PLAYER.FIRE_RATE * 0.3)) {
				this.fireDroneBullets();
			}
		}

		// Laser beam
		if (this.powerUpSystem.hasLaser) {
			this.updateLaser();
		} else if (this.laserStopFn) {
			this.laserStopFn();
			this.laserStopFn = null;
		}

		// Power-up system
		this.powerUpSystem.update(dt);
		this.callbacks.onPowerUpsChange([...this.powerUpSystem.active]);

		// Music intensity based on wave
		this.audio.setIntensity(Math.min(1, 0.3 + this.waveSystem.wave * 0.05));

		// Wave spawning
		const newEnemy = this.waveSystem.update(dt);
		if (newEnemy) this.enemies.push(newEnemy);

		// Boss wave
		if (this.waveSystem.isBossWave && !this.waveSystem.bossSpawned && !this.boss) {
			this.effects.startBossWarning();
			setTimeout(() => {
				this.boss = new Boss(this.waveSystem.wave);
				this.waveSystem.bossSpawned = true;
				this.callbacks.onBossHPChange(this.boss.hp, this.boss.maxHp);
			}, 2000);
			this.waveSystem.bossSpawned = true; // prevent re-trigger
		}

		// Update enemies
		for (const e of this.enemies) {
			if (e.type === "KAMIKAZE") {
				e.setTarget(this.player.centerX, this.player.centerY);
			}
			e.update(dt, slowFactor);

			if (e.readyToFire && e.y > 0) {
				this.fireEnemyBullet(e);
			}
		}
		this.enemies = this.enemies.filter((e) => e.alive);

		// Update boss
		if (this.boss) {
			this.boss.update(dt, slowFactor);
			if (this.boss.readyToFire && !this.boss.entering) {
				this.fireBossBullets();
			}
			if (this.boss.readyToSpawnMinions) {
				this.spawnBossMinions();
			}
			if (!this.boss.alive) {
				this.onBossKilled();
			} else {
				this.callbacks.onBossHPChange(this.boss.hp, this.boss.maxHp);
			}
		}

		// Check if wave is clear
		if (
			this.waveSystem.waveDone &&
			!this.boss &&
			this.enemies.length === 0 &&
			!this.waveSystem.betweenWaves &&
			!this.waveSystem.isBossWave
		) {
			this.audio.playWaveComplete();
			this.waveSystem.startBetweenWaves();

			const nextWave = this.waveSystem.wave + 1;
			if (nextWave % 5 === 0) {
				this.showWaveText(`Boss Wave ${nextWave}`);
			} else {
				this.showWaveText(`Wave ${nextWave}`);
			}
		}

		// Update bullets
		for (const b of this.bullets) {
			b.update(dt, b.isPlayerBullet ? 1 : slowFactor);
		}
		this.bullets = this.bullets.filter((b) => b.alive);

		// Update power-up items
		const hasMagnet = this.powerUpSystem.hasMagnet;
		for (const p of this.powerUpItems) {
			p.update(
				dt,
				hasMagnet ? this.player.centerX : undefined,
				hasMagnet ? this.player.centerY : undefined,
				hasMagnet ? POWERUPS.TYPES.MAGNET.range : undefined,
			);
		}
		this.powerUpItems = this.powerUpItems.filter((p) => p.alive);

		// === COLLISIONS ===
		this.checkCollisions(now);

		// Stats
		this.callbacks.onStatsUpdate(this.scoreSystem.getStats(this.waveSystem.wave));
	}

	private checkCollisions(now: number) {
		const playerHitbox = this.player.hitbox;

		// Player bullets vs enemies
		for (const bullet of this.bullets) {
			if (!bullet.isPlayerBullet || !bullet.alive) continue;

			for (const enemy of this.enemies) {
				if (!enemy.alive) continue;
				if (rectsOverlap(bullet.rect, enemy.rect)) {
					enemy.takeDamage(bullet.damage);
					if (!bullet.isLaser) bullet.alive = false;

					if (!enemy.alive) {
						this.onEnemyKilled(enemy);
					}
					break;
				}
			}

			// Player bullets vs boss
			if (this.boss?.alive && rectsOverlap(bullet.rect, this.boss.rect)) {
				this.boss.takeDamage(bullet.damage);
				if (!bullet.isLaser) bullet.alive = false;
				this.effects.shake(2);
			}
		}

		// Enemy bullets vs player
		if (this.player.alive) {
			for (const bullet of this.bullets) {
				if (bullet.isPlayerBullet || !bullet.alive) continue;
				if (rectsOverlap(bullet.rect, playerHitbox)) {
					bullet.alive = false;
					this.onPlayerHit(now);
				}
			}

			// Enemy body vs player (kamikaze etc.)
			for (const enemy of this.enemies) {
				if (!enemy.alive) continue;
				if (rectsOverlap(enemy.rect, playerHitbox)) {
					enemy.alive = false;
					this.onPlayerHit(now);
					this.particles.push(
						...createExplosion(enemy.centerX, enemy.centerY, 8, 2, PARTICLES.EXPLOSION_LIFE, 3),
					);
				}
			}

			// Boss body vs player
			if (this.boss?.alive && !this.boss.entering && rectsOverlap(this.boss.rect, playerHitbox)) {
				this.onPlayerHit(now);
			}
		}

		// Player vs power-up items
		for (const item of this.powerUpItems) {
			if (!item.alive) continue;
			if (rectsOverlap(item.rect, playerHitbox)) {
				item.alive = false;
				this.onPowerUpCollected(item);
			}
		}
	}

	// === FIRING ===

	private firePlayerBullets(now: number) {
		this.player.fire(now);
		const cx = this.player.centerX;
		const top = this.player.y;

		if (this.powerUpSystem.hasTripleShot) {
			this.bullets.push(new Bullet(cx, top, 0, -PLAYER.BULLET_SPEED, PLAYER.BULLET_DAMAGE, true));
			this.bullets.push(
				new Bullet(
					cx,
					top,
					-PLAYER.BULLET_SPEED * 0.3,
					-PLAYER.BULLET_SPEED,
					PLAYER.BULLET_DAMAGE,
					true,
				),
			);
			this.bullets.push(
				new Bullet(
					cx,
					top,
					PLAYER.BULLET_SPEED * 0.3,
					-PLAYER.BULLET_SPEED,
					PLAYER.BULLET_DAMAGE,
					true,
				),
			);
		} else if (this.powerUpSystem.hasDoubleShot) {
			this.bullets.push(
				new Bullet(cx - 6, top, 0, -PLAYER.BULLET_SPEED, PLAYER.BULLET_DAMAGE, true),
			);
			this.bullets.push(
				new Bullet(cx + 6, top, 0, -PLAYER.BULLET_SPEED, PLAYER.BULLET_DAMAGE, true),
			);
		} else {
			this.bullets.push(new Bullet(cx, top, 0, -PLAYER.BULLET_SPEED, PLAYER.BULLET_DAMAGE, true));
		}

		this.audio.playShoot();
	}

	private fireDroneBullets() {
		const offsets = [
			{ x: Math.cos(this.droneAngle) * 30, y: Math.sin(this.droneAngle) * 15 - 20 },
			{
				x: Math.cos(this.droneAngle + Math.PI) * 30,
				y: Math.sin(this.droneAngle + Math.PI) * 15 - 20,
			},
		];
		for (const off of offsets) {
			const x = this.player.centerX + off.x;
			const y = this.player.centerY + off.y;
			this.bullets.push(new Bullet(x, y, 0, -PLAYER.BULLET_SPEED * 0.8, 1, true));
		}
	}

	private updateLaser() {
		// Laser is a continuous beam — we check collision differently
		const laserX = this.player.centerX;
		const laserTop = 0;
		const laserBottom = this.player.y;
		const laserWidth = POWERUPS.TYPES.LASER_BEAM.width;
		const laserRect = {
			x: laserX - laserWidth / 2,
			y: laserTop,
			width: laserWidth,
			height: laserBottom,
		};
		const dmg = POWERUPS.TYPES.LASER_BEAM.damage;

		for (const enemy of this.enemies) {
			if (!enemy.alive) continue;
			if (rectsOverlap(laserRect, enemy.rect)) {
				enemy.takeDamage(dmg);
				if (!enemy.alive) this.onEnemyKilled(enemy);
			}
		}

		if (this.boss?.alive && rectsOverlap(laserRect, this.boss.rect)) {
			this.boss.takeDamage(dmg);
		}
	}

	private fireEnemyBullet(enemy: Enemy) {
		const speed = 3;

		if (enemy.type === "TANK") {
			const spread = ENEMIES.TANK.spreadAngle;
			for (const angle of [-spread, 0, spread]) {
				this.bullets.push(
					new Bullet(
						enemy.centerX,
						enemy.y + enemy.height,
						Math.sin(angle) * speed,
						Math.cos(angle) * speed,
						1,
						false,
					),
				);
			}
		} else {
			this.bullets.push(new Bullet(enemy.centerX, enemy.y + enemy.height, 0, speed, 1, false));
		}

		this.audio.playEnemyShoot();
	}

	private fireBossBullets() {
		if (!this.boss) return;

		const cx = this.boss.centerX;
		const bottom = this.boss.y + this.boss.height;
		const speed = 4;

		if (this.boss.phase === 3) {
			// Enrage: spiral pattern
			for (let i = 0; i < 8; i++) {
				const angle = (Math.PI * 2 * i) / 8 + this.boss.age * 0.1;
				this.bullets.push(
					new Bullet(cx, bottom, Math.sin(angle) * speed, Math.cos(angle) * speed * 0.7, 1, false),
				);
			}
		} else if (this.boss.phase === 2) {
			// Aimed spread
			const dx = this.player.centerX - cx;
			const dy = this.player.centerY - bottom;
			const _dist = Math.sqrt(dx * dx + dy * dy);
			const baseAngle = Math.atan2(dy, dx);
			for (const offset of [-0.2, -0.1, 0, 0.1, 0.2]) {
				const angle = baseAngle + offset;
				this.bullets.push(
					new Bullet(cx, bottom, Math.cos(angle) * speed, Math.sin(angle) * speed, 1, false),
				);
			}
		} else {
			// Phase 1: simple spread
			for (const vx of [-2, -1, 0, 1, 2]) {
				this.bullets.push(new Bullet(cx, bottom, vx, speed, 1, false));
			}
		}

		this.audio.playEnemyShoot();
	}

	private spawnBossMinions() {
		for (let i = 0; i < BOSS_CFG.PHASE_2_MINION_COUNT; i++) {
			const x = Math.random() * (CANVAS.WIDTH - 30);
			this.enemies.push(new Enemy("DRONE", x, -30 - i * 40));
		}
	}

	// === EVENTS ===

	private onEnemyKilled(enemy: Enemy) {
		this.scoreSystem.addScore(enemy.score);
		this.scoreSystem.addKill();

		this.particles.push(
			...createExplosion(
				enemy.centerX,
				enemy.centerY,
				PARTICLES.EXPLOSION_COUNT,
				PARTICLES.EXPLOSION_SPEED,
				PARTICLES.EXPLOSION_LIFE,
				3,
			),
		);

		this.audio.playExplosion();
		this.effects.shake(3);

		// Power-up drop
		if (Math.random() < POWERUPS.DROP_CHANCE) {
			const { type, rarity } = rollPowerUpType();
			this.powerUpItems.push(new PowerUpItem(enemy.centerX, enemy.centerY, type, rarity));
		}
	}

	private onBossKilled() {
		if (!this.boss) return;

		this.scoreSystem.addScore(this.boss.score);
		this.scoreSystem.addKill();

		this.particles.push(...createExplosion(this.boss.centerX, this.boss.centerY, 30, 5, 800, 5));

		this.audio.playExplosion(true);
		this.effects.shake(10);
		this.effects.flash("#FFFFFF", 0.5);

		// Guaranteed Epic drop
		const { type, rarity } = rollEpicPowerUp();
		this.powerUpItems.push(new PowerUpItem(this.boss.centerX, this.boss.centerY, type, rarity));

		this.boss = null;
		this.callbacks.onBossHPChange(0, 0);

		// Continue to next wave
		this.waveSystem.startBetweenWaves();
		this.showWaveText(`Wave ${this.waveSystem.wave + 1}`);
	}

	private onPlayerHit(now: number) {
		if (this.player.shieldHits > 0) {
			this.audio.playShieldHit();
			this.player.shieldHits--;
			return;
		}

		const hit = this.player.takeDamage(now);
		if (!hit) return;

		this.audio.playDamage();
		this.effects.flash("#FF3131", 0.3);
		this.effects.shake(5);

		this.callbacks.onLivesChange(this.player.lives, this.player.hp);

		if (!this.player.alive) {
			this.onGameOver();
		}
	}

	private onPowerUpCollected(item: PowerUpItem) {
		this.powerUpSystem.activate(item.type, item.rarity);
		this.scoreSystem.addPowerUp();
		this.audio.playPowerUp();

		// Bomb: clear screen
		if (item.type === "BOMB") {
			for (const enemy of this.enemies) {
				this.particles.push(...createExplosion(enemy.centerX, enemy.centerY, 6, 2, 400, 2));
				this.scoreSystem.addScore(enemy.score);
				this.scoreSystem.addKill();
			}
			this.enemies = [];
			this.bullets = this.bullets.filter((b) => b.isPlayerBullet);

			if (this.boss?.alive) {
				this.boss.takeDamage(10);
			}

			this.audio.playBomb();
			this.effects.flash("#FFFFFF", 0.7);
			this.effects.shake(8);
		}

		// Shield
		if (item.type === "SHIELD") {
			this.player.shieldHits = POWERUPS.TYPES.SHIELD.hits;
		}

		// Laser sound
		if (item.type === "LASER_BEAM") {
			this.laserStopFn = this.audio.playLaser() ?? null;
		}
	}

	private onGameOver() {
		this.state = "game-over";
		this.callbacks.onStateChange("game-over");
		this.audio.stopMusic();
		this.audio.playGameOver();

		const isNewHigh = this.scoreSystem.saveGame(this.waveSystem.wave);
		if (isNewHigh) {
			this.callbacks.onNewHighScore();
		}

		this.callbacks.onStatsUpdate(this.scoreSystem.getStats(this.waveSystem.wave));
	}

	private showWaveText(text: string) {
		this.waveTextContent = text;
		this.waveTextTimer = 2000;
	}

	// === DRAW ===

	private draw() {
		const ctx = this.ctx;

		ctx.save();
		ctx.translate(this.effects.shakeOffsetX, this.effects.shakeOffsetY);

		// Clear
		ctx.fillStyle = CANVAS.BG_COLOR;
		ctx.fillRect(-10, -10, CANVAS.WIDTH + 20, CANVAS.HEIGHT + 20);

		// Star field
		this.starField.draw(ctx);

		// Laser beam (behind entities)
		if (this.powerUpSystem.hasLaser && this.player.alive) {
			const laserBullet = new Bullet(this.player.centerX, this.player.y, 0, 0, 0, true, true);
			laserBullet.draw(ctx);
		}

		// Power-up items
		for (const p of this.powerUpItems) p.draw(ctx);

		// Enemies
		for (const e of this.enemies) e.draw(ctx);

		// Boss
		this.boss?.draw(ctx);

		// Player
		this.player.draw(ctx);

		// Drone companions
		if (this.powerUpSystem.hasDrones && this.player.alive) {
			this.drawDrones(ctx);
		}

		// Bullets
		for (const b of this.bullets) {
			if (!b.isLaser) b.draw(ctx);
		}

		// Particles
		for (const p of this.particles) p.draw(ctx);

		// Screen effects (flash, warning)
		this.effects.draw(ctx);

		// Wave text
		if (this.waveTextTimer > 0) {
			const alpha = Math.min(1, this.waveTextTimer / 500);
			ctx.globalAlpha = alpha;
			ctx.font = "bold 24px Orbitron, monospace";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#00F0FF";
			ctx.shadowColor = "#00F0FF";
			ctx.shadowBlur = 15;
			ctx.fillText(this.waveTextContent, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
			ctx.shadowBlur = 0;
			ctx.globalAlpha = 1;
		}

		ctx.restore();
	}

	private drawDrones(ctx: CanvasRenderingContext2D) {
		const offsets = [
			{ x: Math.cos(this.droneAngle) * 30, y: Math.sin(this.droneAngle) * 15 - 20 },
			{
				x: Math.cos(this.droneAngle + Math.PI) * 30,
				y: Math.sin(this.droneAngle + Math.PI) * 15 - 20,
			},
		];

		for (const off of offsets) {
			const dx = this.player.centerX + off.x;
			const dy = this.player.centerY + off.y;

			ctx.beginPath();
			ctx.moveTo(dx, dy - 5);
			ctx.lineTo(dx + 5, dy + 3);
			ctx.lineTo(dx - 5, dy + 3);
			ctx.closePath();
			ctx.fillStyle = "#39FF14";
			ctx.fill();

			ctx.shadowColor = "#39FF14";
			ctx.shadowBlur = 6;
			ctx.fill();
			ctx.shadowBlur = 0;
		}
	}
}
