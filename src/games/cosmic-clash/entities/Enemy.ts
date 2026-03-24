import { CANVAS, ENEMIES } from "../config";
import { SpriteManager } from "../sprites/SpriteManager";
import type { EnemyType, Rect } from "../types";

const ENEMY_CONFIGS = ENEMIES;

export class Enemy {
	x: number;
	y: number;
	width: number;
	height: number;
	hp: number;
	maxHp: number;
	speed: number;
	type: EnemyType;
	score: number;
	alive = true;

	// Movement
	private spawnX: number;
	private age = 0;
	private fireTimer: number;
	private fireRate: number;
	readyToFire = false;

	// Teleporter
	private teleportTimer = 0;
	private teleportInterval: number;
	private isTeleporting = false;
	private teleportAlpha = 1;

	// Kamikaze
	private targetX = 0;
	private targetY = 0;
	private trackingStrength: number;

	// Visual
	private flashTimer = 0;

	constructor(type: EnemyType, x: number, y: number) {
		const cfg = ENEMY_CONFIGS[type];
		this.type = type;
		this.x = x;
		this.y = y;
		this.spawnX = x;
		this.width = cfg.width;
		this.height = cfg.height;
		this.hp = cfg.hp;
		this.maxHp = cfg.hp;
		this.speed = cfg.speed;
		this.score = cfg.score;
		this.fireRate = "fireRate" in cfg ? cfg.fireRate : 99999;
		this.fireTimer = this.fireRate * Math.random(); // stagger initial fire
		this.teleportInterval = type === "TELEPORTER" ? ENEMY_CONFIGS.TELEPORTER.teleportInterval : 0;
		this.trackingStrength = type === "KAMIKAZE" ? ENEMY_CONFIGS.KAMIKAZE.trackingStrength : 0;
	}

	get centerX() {
		return this.x + this.width / 2;
	}

	get centerY() {
		return this.y + this.height / 2;
	}

	get rect(): Rect {
		return { x: this.x, y: this.y, width: this.width, height: this.height };
	}

	setTarget(x: number, y: number) {
		this.targetX = x;
		this.targetY = y;
	}

	update(dt: number, slowFactor: number) {
		if (!this.alive) return;

		this.age += dt * slowFactor;
		this.fireTimer += dt * slowFactor * 16.67; // convert to ms-ish
		this.flashTimer = Math.max(0, this.flashTimer - dt);

		const effectiveSpeed = this.speed * slowFactor;

		switch (this.type) {
			case "DRONE":
				this.y += effectiveSpeed * dt;
				break;

			case "ZIGZAG": {
				this.y += effectiveSpeed * dt;
				const cfg = ENEMY_CONFIGS.ZIGZAG;
				this.x = this.spawnX + Math.sin(this.age * cfg.frequency * 60) * cfg.amplitude;
				break;
			}

			case "TANK":
				this.y += effectiveSpeed * dt;
				break;

			case "KAMIKAZE": {
				const dx = this.targetX - this.centerX;
				const dy = this.targetY - this.centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist > 1) {
					this.x +=
						(dx / dist) * this.trackingStrength * 60 * dt +
						effectiveSpeed * 0.3 * dt * (dx > 0 ? 1 : -1);
				}
				this.y += effectiveSpeed * dt;
				break;
			}

			case "TELEPORTER": {
				this.y += effectiveSpeed * 0.5 * dt;
				this.teleportTimer += dt * slowFactor * 16.67;
				if (this.teleportTimer >= this.teleportInterval) {
					this.teleportTimer = 0;
					this.x = Math.random() * (CANVAS.WIDTH - this.width);
					this.isTeleporting = true;
					this.teleportAlpha = 0;
				}
				if (this.isTeleporting) {
					this.teleportAlpha = Math.min(1, this.teleportAlpha + 0.05 * dt);
					if (this.teleportAlpha >= 1) this.isTeleporting = false;
				}
				break;
			}
		}

		// Check fire readiness
		this.readyToFire = false;
		if (this.type !== "KAMIKAZE" && this.fireTimer >= this.fireRate) {
			this.readyToFire = true;
			this.fireTimer = 0;
		}

		// Off screen (below)
		if (this.y > CANVAS.HEIGHT + 50) {
			this.alive = false;
		}
	}

	takeDamage(amount: number) {
		this.hp -= amount;
		this.flashTimer = 4; // flash frames
		if (this.hp <= 0) {
			this.alive = false;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;

		const cx = this.centerX;
		const cy = this.centerY;

		// Teleporter fade
		if (this.type === "TELEPORTER") {
			ctx.globalAlpha = this.teleportAlpha;
		}

		// Hit flash
		if (this.flashTimer > 0) {
			ctx.globalAlpha = 0.6;
		}

		// Draw sprite
		const sprite = SpriteManager.getEnemy(this.type);
		ctx.drawImage(sprite, cx - sprite.width / 2, cy - sprite.height / 2);

		// Kamikaze glow
		if (this.type === "KAMIKAZE") {
			ctx.shadowColor = "#FF6B35";
			ctx.shadowBlur = 10;
			ctx.drawImage(sprite, cx - sprite.width / 2, cy - sprite.height / 2);
			ctx.shadowBlur = 0;
		}

		// Tank HP bar
		if (this.type === "TANK" && this.hp < this.maxHp) {
			const w = this.width / 2;
			const ratio = this.hp / this.maxHp;
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(cx - w, cy - this.height / 2 - 6, this.width, 4);
			ctx.fillStyle = "#FF3131";
			ctx.fillRect(cx - w, cy - this.height / 2 - 6, this.width * ratio, 4);
		}

		ctx.globalAlpha = 1;
	}

	getColor(): string {
		switch (this.type) {
			case "DRONE":
				return "#FF5555";
			case "ZIGZAG":
				return "#FFAA33";
			case "TANK":
				return "#FF3131";
			case "KAMIKAZE":
				return "#FF6B35";
			case "TELEPORTER":
				return "#AA55FF";
		}
	}
}
