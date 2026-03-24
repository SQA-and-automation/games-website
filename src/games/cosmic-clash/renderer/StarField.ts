import { CANVAS, JUICE, STAR_FIELD } from "../config";

interface Star {
	x: number;
	y: number;
	speed: number;
	size: number;
	opacity: number;
}

interface Nebula {
	x: number;
	y: number;
	radius: number;
	color: string;
	speed: number;
	phase: number;
}

interface ShootingStar {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
}

const NEBULA_COLORS = [
	"rgba(123, 97, 255, 0.04)", // purple
	"rgba(0, 240, 255, 0.03)", // cyan
	"rgba(255, 0, 229, 0.03)", // magenta
	"rgba(57, 255, 20, 0.02)", // green
];

export class StarFieldRenderer {
	private stars: Star[] = [];
	private nebulae: Nebula[] = [];
	private shootingStars: ShootingStar[] = [];
	private waveColorShift = 0;

	constructor() {
		for (const layer of STAR_FIELD.LAYERS) {
			for (let i = 0; i < layer.count; i++) {
				this.stars.push({
					x: Math.random() * CANVAS.WIDTH,
					y: Math.random() * CANVAS.HEIGHT,
					speed: layer.speed,
					size: layer.size,
					opacity: layer.opacity,
				});
			}
		}

		// Create nebulae
		for (let i = 0; i < JUICE.NEBULA_COUNT; i++) {
			this.nebulae.push({
				x: Math.random() * CANVAS.WIDTH,
				y: Math.random() * CANVAS.HEIGHT * 2 - CANVAS.HEIGHT * 0.5,
				radius: 80 + Math.random() * 120,
				color: NEBULA_COLORS[i % NEBULA_COLORS.length],
				speed: 0.15 + Math.random() * 0.1,
				phase: Math.random() * Math.PI * 2,
			});
		}
	}

	setWaveProgress(wave: number) {
		this.waveColorShift = Math.min(1, wave / 30);
	}

	update(dt: number) {
		for (const star of this.stars) {
			star.y += star.speed * dt;
			if (star.y > CANVAS.HEIGHT) {
				star.y = -2;
				star.x = Math.random() * CANVAS.WIDTH;
			}
		}

		// Nebulae drift
		for (const neb of this.nebulae) {
			neb.y += neb.speed * dt;
			neb.phase += 0.005 * dt;
			if (neb.y - neb.radius > CANVAS.HEIGHT) {
				neb.y = -neb.radius;
				neb.x = Math.random() * CANVAS.WIDTH;
			}
		}

		// Shooting stars
		if (Math.random() < JUICE.SHOOTING_STAR_CHANCE) {
			this.shootingStars.push({
				x: Math.random() * CANVAS.WIDTH,
				y: -5,
				vx: (Math.random() - 0.5) * 3,
				vy: 4 + Math.random() * 3,
				life: 400 + Math.random() * 300,
				maxLife: 400 + Math.random() * 300,
			});
		}

		for (const ss of this.shootingStars) {
			ss.x += ss.vx * dt;
			ss.y += ss.vy * dt;
			ss.life -= dt * 16.67;
		}
		this.shootingStars = this.shootingStars.filter((ss) => ss.life > 0);
	}

	draw(ctx: CanvasRenderingContext2D) {
		// Nebulae (behind stars)
		for (const neb of this.nebulae) {
			const pulse = 1 + Math.sin(neb.phase) * 0.2;
			const gradient = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius * pulse);
			gradient.addColorStop(0, neb.color);
			gradient.addColorStop(1, "transparent");
			ctx.fillStyle = gradient;
			ctx.fillRect(
				neb.x - neb.radius * pulse,
				neb.y - neb.radius * pulse,
				neb.radius * 2 * pulse,
				neb.radius * 2 * pulse,
			);
		}

		// Stars
		for (const star of this.stars) {
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

			// Color shift with wave progression
			if (this.waveColorShift > 0.3) {
				const r = 255;
				const g = Math.floor(255 - this.waveColorShift * 80);
				const b = Math.floor(255 - this.waveColorShift * 40);
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.opacity})`;
			} else {
				ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
			}
			ctx.fill();
		}

		// Shooting stars
		for (const ss of this.shootingStars) {
			const alpha = ss.life / ss.maxLife;
			const tailLen = 15;
			const gradient = ctx.createLinearGradient(
				ss.x - ss.vx * tailLen,
				ss.y - ss.vy * tailLen,
				ss.x,
				ss.y,
			);
			gradient.addColorStop(0, "transparent");
			gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

			ctx.beginPath();
			ctx.moveTo(ss.x - ss.vx * tailLen, ss.y - ss.vy * tailLen);
			ctx.lineTo(ss.x, ss.y);
			ctx.strokeStyle = gradient;
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}
	}
}
