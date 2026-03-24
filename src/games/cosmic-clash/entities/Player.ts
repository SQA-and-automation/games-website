import { CANVAS, COLORS, PLAYER } from "../config";
import type { Input } from "../engine/Input";
import type { Rect } from "../types";

export class Player {
	x: number;
	y: number;
	width = PLAYER.WIDTH;
	height = PLAYER.HEIGHT;
	lives = PLAYER.LIVES;
	hp = PLAYER.HP_PER_LIFE;
	speed = PLAYER.SPEED;
	invincibleUntil = 0;
	lastFireTime = 0;
	shieldHits = 0;
	speedMultiplier = 1;
	alive = true;

	// Visual
	private thrusterPhase = 0;

	constructor() {
		this.x = CANVAS.WIDTH / 2 - this.width / 2;
		this.y = CANVAS.HEIGHT - 100;
	}

	reset() {
		this.x = CANVAS.WIDTH / 2 - this.width / 2;
		this.y = CANVAS.HEIGHT - 100;
		this.lives = PLAYER.LIVES;
		this.hp = PLAYER.HP_PER_LIFE;
		this.invincibleUntil = 0;
		this.lastFireTime = 0;
		this.shieldHits = 0;
		this.speedMultiplier = 1;
		this.alive = true;
	}

	get centerX() {
		return this.x + this.width / 2;
	}

	get centerY() {
		return this.y + this.height / 2;
	}

	get hitbox(): Rect {
		const hw = this.width * PLAYER.HITBOX_RATIO;
		const hh = this.height * PLAYER.HITBOX_RATIO;
		return {
			x: this.centerX - hw / 2,
			y: this.centerY - hh / 2,
			width: hw,
			height: hh,
		};
	}

	get isInvincible() {
		return Date.now() < this.invincibleUntil;
	}

	update(input: Input, dt: number) {
		if (!this.alive) return;

		const effectiveSpeed = this.speed * this.speedMultiplier;

		// Touch/mouse drag
		if (input.isDragging && input.targetPos) {
			const target = input.targetPos;
			const dx = target.x - this.centerX;
			const dy = target.y - this.centerY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist > 2) {
				const moveSpeed = Math.min(effectiveSpeed * 1.5, dist * 0.15);
				this.x += (dx / dist) * moveSpeed * dt;
				this.y += (dy / dist) * moveSpeed * dt;
			}
		}

		// Keyboard
		const move = input.getMovement();
		if (move.x !== 0 || move.y !== 0) {
			this.x += move.x * effectiveSpeed * dt;
			this.y += move.y * effectiveSpeed * dt;
		}

		// Clamp to canvas
		this.x = Math.max(0, Math.min(CANVAS.WIDTH - this.width, this.x));
		this.y = Math.max(0, Math.min(CANVAS.HEIGHT - this.height, this.y));

		this.thrusterPhase += 0.15 * dt;
	}

	takeDamage(now: number): boolean {
		if (this.isInvincible) return false;

		// Shield absorbs hit
		if (this.shieldHits > 0) {
			this.shieldHits--;
			return true; // hit absorbed
		}

		this.hp--;
		if (this.hp <= 0) {
			this.lives--;
			if (this.lives <= 0) {
				this.alive = false;
				return true;
			}
			this.hp = PLAYER.HP_PER_LIFE;
			this.invincibleUntil = now + PLAYER.INVINCIBLE_DURATION;
		}
		return true;
	}

	canFire(now: number): boolean {
		return now - this.lastFireTime >= PLAYER.FIRE_RATE;
	}

	fire(now: number) {
		this.lastFireTime = now;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;

		const cx = this.centerX;
		const cy = this.centerY;
		const w = this.width;
		const h = this.height;

		// Invincibility flash
		if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
			ctx.globalAlpha = 0.4;
		}

		// Thruster flame
		const flameLen = 8 + Math.sin(this.thrusterPhase) * 4;
		ctx.beginPath();
		ctx.moveTo(cx - 6, this.y + h);
		ctx.lineTo(cx, this.y + h + flameLen);
		ctx.lineTo(cx + 6, this.y + h);
		ctx.fillStyle = "#FF6B35";
		ctx.fill();

		// Ship body
		ctx.beginPath();
		ctx.moveTo(cx, this.y); // nose
		ctx.lineTo(this.x + w, this.y + h * 0.8); // right wing
		ctx.lineTo(cx + 4, this.y + h); // right body
		ctx.lineTo(cx - 4, this.y + h); // left body
		ctx.lineTo(this.x, this.y + h * 0.8); // left wing
		ctx.closePath();
		ctx.fillStyle = COLORS.PLAYER;
		ctx.fill();

		// Cockpit
		ctx.beginPath();
		ctx.arc(cx, this.y + h * 0.4, 4, 0, Math.PI * 2);
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();

		// Shield bubble
		if (this.shieldHits > 0) {
			ctx.beginPath();
			ctx.arc(cx, cy, w * 0.8, 0, Math.PI * 2);
			ctx.strokeStyle = COLORS.SHIELD;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.fillStyle = `rgba(0, 240, 255, ${0.05 * this.shieldHits})`;
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}
}
