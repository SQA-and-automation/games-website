import { COLORS } from "../config";

export class Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	color: string;
	alive = true;

	constructor(
		x: number,
		y: number,
		vx: number,
		vy: number,
		life: number,
		size: number,
		color: string,
	) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.life = life;
		this.maxLife = life;
		this.size = size;
		this.color = color;
	}

	update(dt: number) {
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		this.vx *= 0.98;
		this.vy *= 0.98;
		this.life -= dt * 16.67;
		if (this.life <= 0) this.alive = false;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;
		const alpha = Math.max(0, this.life / this.maxLife);
		const currentSize = this.size * alpha;

		ctx.beginPath();
		ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
		ctx.fillStyle = this.color;
		ctx.globalAlpha = alpha;
		ctx.fill();
		ctx.globalAlpha = 1;
	}
}

export function createExplosion(
	x: number,
	y: number,
	count: number,
	speed: number,
	life: number,
	size: number,
): Particle[] {
	const particles: Particle[] = [];
	for (let i = 0; i < count; i++) {
		const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
		const s = speed * (0.5 + Math.random() * 0.5);
		const color = COLORS.EXPLOSION[Math.floor(Math.random() * COLORS.EXPLOSION.length)];
		particles.push(
			new Particle(
				x,
				y,
				Math.cos(angle) * s,
				Math.sin(angle) * s,
				life,
				size * (0.5 + Math.random() * 0.5),
				color,
			),
		);
	}
	return particles;
}

export function createBulletTrail(x: number, y: number, color: string): Particle {
	return new Particle(
		x + (Math.random() - 0.5) * 3,
		y + 4,
		(Math.random() - 0.5) * 0.3,
		Math.random() * 0.5,
		200,
		2,
		color,
	);
}
