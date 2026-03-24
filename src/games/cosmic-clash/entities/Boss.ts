import { BOSS, CANVAS, COLORS } from "../config";
import type { Rect } from "../types";

type BossPhase = 1 | 2 | 3;

export class Boss {
	x: number;
	y: number;
	width = BOSS.WIDTH;
	height = BOSS.HEIGHT;
	hp: number;
	maxHp: number;
	speed = BOSS.SPEED;
	alive = true;
	score: number;
	entering = true;
	phase: BossPhase = 1;
	waveNumber: number;

	// Movement
	private moveDir = 1;
	age = 0;

	// Combat
	private fireTimer = 0;
	private minionSpawned = false;
	readyToFire = false;
	readyToSpawnMinions = false;

	// Visual
	private flashTimer = 0;
	private pulsePhase = 0;

	constructor(waveNumber: number) {
		this.waveNumber = waveNumber;
		this.maxHp = BOSS.BASE_HP + Math.floor(waveNumber / 5) * BOSS.HP_PER_WAVE;
		this.hp = this.maxHp;
		this.score = BOSS.SCORE_BASE + Math.floor(waveNumber / 5) * BOSS.SCORE_PER_WAVE;
		this.x = CANVAS.WIDTH / 2 - this.width / 2;
		this.y = -this.height - 20;
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

	get hpRatio() {
		return this.hp / this.maxHp;
	}

	update(dt: number, slowFactor: number) {
		if (!this.alive) return;

		this.age += dt * slowFactor;
		this.pulsePhase += 0.05 * dt;
		this.flashTimer = Math.max(0, this.flashTimer - dt);

		// Enter animation
		if (this.entering) {
			this.y += 1.5 * dt;
			if (this.y >= 40) {
				this.y = 40;
				this.entering = false;
			}
			return;
		}

		// Determine phase
		if (this.hpRatio <= BOSS.PHASE_3_ENRAGE_THRESHOLD) {
			this.phase = 3;
		} else if (this.hpRatio <= 0.6) {
			this.phase = 2;
		} else {
			this.phase = 1;
		}

		// Movement — side to side
		const moveSpeed = this.speed * (this.phase === 3 ? 1.8 : 1) * slowFactor;
		this.x += this.moveDir * moveSpeed * dt;
		if (this.x <= 10 || this.x >= CANVAS.WIDTH - this.width - 10) {
			this.moveDir *= -1;
		}

		// Firing
		const fireRate = this.phase === 3 ? BOSS.PHASE_1_FIRE_RATE * 0.5 : BOSS.PHASE_1_FIRE_RATE;
		this.fireTimer += dt * slowFactor * 16.67;
		this.readyToFire = false;
		if (this.fireTimer >= fireRate) {
			this.readyToFire = true;
			this.fireTimer = 0;
		}

		// Phase 2: spawn minions once
		this.readyToSpawnMinions = false;
		if (this.phase >= 2 && !this.minionSpawned) {
			this.readyToSpawnMinions = true;
			this.minionSpawned = true;
		}
	}

	takeDamage(amount: number) {
		this.hp -= amount;
		this.flashTimer = 4;
		if (this.hp <= 0) {
			this.hp = 0;
			this.alive = false;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;

		const cx = this.centerX;
		const cy = this.centerY;

		if (this.flashTimer > 0) {
			ctx.globalAlpha = 0.6;
		}

		// Glow
		const glowIntensity = this.phase === 3 ? 20 : 10;
		ctx.shadowColor = COLORS.BOSS;
		ctx.shadowBlur = glowIntensity + Math.sin(this.pulsePhase) * 5;

		// Main body — angular menacing shape
		ctx.beginPath();
		ctx.moveTo(cx, this.y); // top center
		ctx.lineTo(this.x + this.width, this.y + this.height * 0.3); // right upper
		ctx.lineTo(this.x + this.width - 8, this.y + this.height * 0.7); // right lower indent
		ctx.lineTo(this.x + this.width, this.y + this.height); // right bottom wing
		ctx.lineTo(cx + 10, this.y + this.height * 0.8); // center right
		ctx.lineTo(cx, this.y + this.height); // center bottom
		ctx.lineTo(cx - 10, this.y + this.height * 0.8); // center left
		ctx.lineTo(this.x, this.y + this.height); // left bottom wing
		ctx.lineTo(this.x + 8, this.y + this.height * 0.7); // left lower indent
		ctx.lineTo(this.x, this.y + this.height * 0.3); // left upper
		ctx.closePath();

		const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
		gradient.addColorStop(0, COLORS.BOSS);
		gradient.addColorStop(1, "#660066");
		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.shadowBlur = 0;

		// Eye/core
		const eyeSize = 6 + Math.sin(this.pulsePhase * 2) * 2;
		ctx.beginPath();
		ctx.arc(cx, cy - 4, eyeSize, 0, Math.PI * 2);
		ctx.fillStyle = this.phase === 3 ? "#FF3131" : "#FFFFFF";
		ctx.fill();

		// Phase 3: enrage visual
		if (this.phase === 3) {
			ctx.strokeStyle = "rgba(255, 49, 49, 0.5)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(cx, cy, this.width * 0.6 + Math.sin(this.pulsePhase * 3) * 5, 0, Math.PI * 2);
			ctx.stroke();
		}

		ctx.globalAlpha = 1;
	}
}
