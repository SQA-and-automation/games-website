import { CANVAS, COLORS } from "../config";
import type { Rect } from "../types";

export class Bullet {
	x: number;
	y: number;
	vx: number;
	vy: number;
	width: number;
	height: number;
	damage: number;
	isPlayerBullet: boolean;
	alive = true;
	isLaser: boolean;

	constructor(
		x: number,
		y: number,
		vx: number,
		vy: number,
		damage: number,
		isPlayerBullet: boolean,
		isLaser = false,
	) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.damage = damage;
		this.isPlayerBullet = isPlayerBullet;
		this.isLaser = isLaser;
		this.width = isLaser ? 8 : isPlayerBullet ? 4 : 5;
		this.height = isLaser ? CANVAS.HEIGHT : isPlayerBullet ? 10 : 8;
	}

	get rect(): Rect {
		if (this.isLaser) {
			return { x: this.x - this.width / 2, y: 0, width: this.width, height: this.y };
		}
		return {
			x: this.x - this.width / 2,
			y: this.y - this.height / 2,
			width: this.width,
			height: this.height,
		};
	}

	update(dt: number, slowFactor: number) {
		if (this.isLaser) return; // laser follows player
		this.x += this.vx * dt * slowFactor;
		this.y += this.vy * dt * slowFactor;

		// Off screen
		if (this.y < -20 || this.y > CANVAS.HEIGHT + 20 || this.x < -20 || this.x > CANVAS.WIDTH + 20) {
			this.alive = false;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;

		if (this.isLaser) {
			// Laser beam from player to top
			const gradient = ctx.createLinearGradient(this.x, 0, this.x, this.y);
			gradient.addColorStop(0, "rgba(255, 0, 229, 0.1)");
			gradient.addColorStop(1, "rgba(255, 0, 229, 0.8)");
			ctx.fillStyle = gradient;
			ctx.fillRect(this.x - this.width / 2, 0, this.width, this.y);

			// Core
			ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
			ctx.fillRect(this.x - 1, 0, 2, this.y);
			return;
		}

		if (this.isPlayerBullet) {
			// Player bullet — glowing cyan line
			ctx.beginPath();
			ctx.moveTo(this.x, this.y - this.height / 2);
			ctx.lineTo(this.x, this.y + this.height / 2);
			ctx.strokeStyle = COLORS.PLAYER_BULLET;
			ctx.lineWidth = this.width;
			ctx.lineCap = "round";
			ctx.stroke();

			// Glow
			ctx.shadowColor = COLORS.PLAYER_BULLET;
			ctx.shadowBlur = 6;
			ctx.stroke();
			ctx.shadowBlur = 0;
		} else {
			// Enemy bullet — red dot
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
			ctx.fillStyle = COLORS.ENEMY_BULLET;
			ctx.fill();
			ctx.shadowColor = COLORS.ENEMY_BULLET;
			ctx.shadowBlur = 4;
			ctx.fill();
			ctx.shadowBlur = 0;
		}
	}
}
