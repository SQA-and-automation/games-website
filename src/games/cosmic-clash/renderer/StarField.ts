import { CANVAS, STAR_FIELD } from "../config";

interface Star {
	x: number;
	y: number;
	speed: number;
	size: number;
	opacity: number;
}

export class StarFieldRenderer {
	private stars: Star[] = [];

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
	}

	update(dt: number) {
		for (const star of this.stars) {
			star.y += star.speed * dt;
			if (star.y > CANVAS.HEIGHT) {
				star.y = -2;
				star.x = Math.random() * CANVAS.WIDTH;
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		for (const star of this.stars) {
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
			ctx.fill();
		}
	}
}
