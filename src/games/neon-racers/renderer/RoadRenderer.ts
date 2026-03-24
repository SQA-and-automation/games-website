import { ROAD, SCREEN, type ZONES } from "../config";
import type { Road } from "../engine/Road";

export class RoadRenderer {
	private ctx: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	drawSky(zone: (typeof ZONES)[number]) {
		const gradient = this.ctx.createLinearGradient(0, 0, 0, SCREEN.HEIGHT * 0.6);
		gradient.addColorStop(0, zone.skyColor1);
		gradient.addColorStop(1, zone.skyColor2);
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT * 0.6);
	}

	drawRoad(road: Road, position: number) {
		const baseIndex = Math.max(0, Math.floor(position));

		// Draw back to front
		for (let n = ROAD.VISIBLE_SEGMENTS; n > 0; n--) {
			const segIndex = (baseIndex + n) % road.length;
			const seg = road.getSegment(segIndex);
			if (!seg) continue;

			const { zone } = road.getZone(segIndex);

			// Skip if segment is off screen or behind clip
			if (seg.p2.y >= seg.clip || seg.p1.y <= seg.p2.y) continue;
			if (seg.p2.y > SCREEN.HEIGHT || seg.p1.y < 0) continue;

			const isRumble = Math.floor(segIndex / ROAD.RUMBLE_LENGTH) % 2 === 0;

			// Ground fill
			this.ctx.fillStyle = zone.grassColor;
			this.ctx.fillRect(0, seg.p2.y, SCREEN.WIDTH, seg.p1.y - seg.p2.y);

			// Road surface
			this.drawTrapezoid(
				seg.p1.x,
				seg.p1.y,
				seg.p1.w,
				seg.p2.x,
				seg.p2.y,
				seg.p2.w,
				zone.roadColor,
			);

			// Rumble strips
			if (isRumble) {
				const r1 = seg.p1.w * 0.06;
				const r2 = seg.p2.w * 0.06;

				// Left rumble
				this.drawTrapezoid(
					seg.p1.x - seg.p1.w / 2 - r1,
					seg.p1.y,
					r1,
					seg.p2.x - seg.p2.w / 2 - r2,
					seg.p2.y,
					r2,
					zone.rumbleColor,
				);
				// Right rumble
				this.drawTrapezoid(
					seg.p1.x + seg.p1.w / 2,
					seg.p1.y,
					r1,
					seg.p2.x + seg.p2.w / 2,
					seg.p2.y,
					r2,
					zone.rumbleColor,
				);
			}

			// Lane markings (dashed)
			if (!isRumble && seg.p2.w > 10) {
				for (let lane = 1; lane < ROAD.LANES; lane++) {
					const laneRatio = lane / ROAD.LANES - 0.5;
					const lw1 = Math.max(1, seg.p1.w * 0.004);
					const lw2 = Math.max(1, seg.p2.w * 0.004);
					const lx1 = seg.p1.x + seg.p1.w * laneRatio;
					const lx2 = seg.p2.x + seg.p2.w * laneRatio;

					this.drawTrapezoid(
						lx1 - lw1,
						seg.p1.y,
						lw1 * 2,
						lx2 - lw2,
						seg.p2.y,
						lw2 * 2,
						zone.laneColor,
					);
				}
			}
		}
	}

	/**
	 * Draw a filled trapezoid between two horizontal lines.
	 * x is center, w is full width.
	 */
	private drawTrapezoid(
		x1: number,
		y1: number,
		w1: number,
		x2: number,
		y2: number,
		w2: number,
		color: string,
	) {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.moveTo(x1 - w1 / 2, y1);
		this.ctx.lineTo(x1 + w1 / 2, y1);
		this.ctx.lineTo(x2 + w2 / 2, y2);
		this.ctx.lineTo(x2 - w2 / 2, y2);
		this.ctx.closePath();
		this.ctx.fill();
	}

	drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number, maxSpeed: number) {
		const intensity = Math.max(0, (speed / maxSpeed - 0.5) * 2);
		if (intensity <= 0) return;

		ctx.globalAlpha = intensity * 0.12;
		ctx.strokeStyle = "#FFFFFF";
		ctx.lineWidth = 1;

		for (let i = 0; i < 8; i++) {
			const x = Math.random() * SCREEN.WIDTH;
			const y1 = SCREEN.HEIGHT * 0.3 + Math.random() * SCREEN.HEIGHT * 0.4;
			const len = 20 + intensity * 40;
			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x + (x - SCREEN.WIDTH / 2) * 0.05, y1 + len);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	drawHorizonGlow(zone: (typeof ZONES)[number], time: number) {
		const horizonY = SCREEN.HEIGHT * 0.6;
		const pulse = 0.3 + Math.sin(time * 0.003) * 0.15;

		const gradient = this.ctx.createLinearGradient(0, horizonY - 8, 0, horizonY + 3);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(
			0.5,
			`${zone.rumbleColor}${Math.floor(pulse * 30)
				.toString(16)
				.padStart(2, "0")}`,
		);
		gradient.addColorStop(1, "transparent");
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, horizonY - 8, SCREEN.WIDTH, 11);
	}
}
