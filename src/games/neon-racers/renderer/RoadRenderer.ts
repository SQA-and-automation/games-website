import { ROAD, SCREEN, type ZONES } from "../config";
import type { Road } from "../engine/Road";

/**
 * Draws the pseudo-3D road, sky, and terrain.
 */
export class RoadRenderer {
	private ctx: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	drawSky(zone: (typeof ZONES)[number]) {
		const gradient = this.ctx.createLinearGradient(0, 0, 0, SCREEN.HEIGHT / 2);
		gradient.addColorStop(0, zone.skyColor1);
		gradient.addColorStop(1, zone.skyColor2);
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT / 2);
	}

	drawRoad(road: Road, position: number, playerX: number) {
		const baseIndex = Math.floor(position);
		let maxY: number = SCREEN.HEIGHT;

		// Draw segments back to front
		for (let n = ROAD.VISIBLE_SEGMENTS - 1; n > 0; n--) {
			const segIndex = (baseIndex + n) % road.length;
			const seg = road.getSegment(segIndex);
			const { zone } = road.getZone(segIndex);

			if (seg.p2.y >= maxY) continue;
			if (seg.p1.y <= seg.p2.y) continue;

			const isRumble = Math.floor(segIndex / ROAD.RUMBLE_LENGTH) % 2 === 0;

			// Ground/grass
			this.drawQuad(zone.grassColor, 0, seg.p1.y, SCREEN.WIDTH, 0, seg.p2.y, SCREEN.WIDTH);

			// Road surface
			this.drawQuad(
				zone.roadColor,
				seg.p1.x - seg.p1.w / 2,
				seg.p1.y,
				seg.p1.w,
				seg.p2.x - seg.p2.w / 2,
				seg.p2.y,
				seg.p2.w,
			);

			// Rumble strips (road edges)
			if (isRumble) {
				const rumbleW1 = seg.p1.w * 1.08;
				const rumbleW2 = seg.p2.w * 1.08;
				// Left rumble
				this.drawQuad(
					zone.rumbleColor,
					seg.p1.x - rumbleW1 / 2,
					seg.p1.y,
					(rumbleW1 - seg.p1.w) / 2,
					seg.p2.x - rumbleW2 / 2,
					seg.p2.y,
					(rumbleW2 - seg.p2.w) / 2,
				);
				// Right rumble
				this.drawQuad(
					zone.rumbleColor,
					seg.p1.x + seg.p1.w / 2,
					seg.p1.y,
					(rumbleW1 - seg.p1.w) / 2,
					seg.p2.x + seg.p2.w / 2,
					seg.p2.y,
					(rumbleW2 - seg.p2.w) / 2,
				);
			}

			// Lane markings
			if (!isRumble) {
				const laneW1 = seg.p1.w * 0.005;
				const laneW2 = seg.p2.w * 0.005;
				for (let lane = 1; lane < ROAD.LANES; lane++) {
					const laneOffset = (lane / ROAD.LANES - 0.5) * 2;
					const x1 = seg.p1.x + (seg.p1.w / 2) * laneOffset;
					const x2 = seg.p2.x + (seg.p2.w / 2) * laneOffset;
					this.drawQuad(
						zone.laneColor,
						x1 - laneW1,
						seg.p1.y,
						laneW1 * 2,
						x2 - laneW2,
						seg.p2.y,
						laneW2 * 2,
					);
				}
			}

			// Road edge glow
			this.ctx.shadowColor = zone.rumbleColor;
			this.ctx.shadowBlur = 4;
			this.ctx.beginPath();
			this.ctx.moveTo(seg.p1.x - seg.p1.w / 2, seg.p1.y);
			this.ctx.lineTo(seg.p2.x - seg.p2.w / 2, seg.p2.y);
			this.ctx.strokeStyle = `${zone.rumbleColor}30`;
			this.ctx.lineWidth = 1;
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.moveTo(seg.p1.x + seg.p1.w / 2, seg.p1.y);
			this.ctx.lineTo(seg.p2.x + seg.p2.w / 2, seg.p2.y);
			this.ctx.stroke();
			this.ctx.shadowBlur = 0;

			if (seg.p2.y < maxY) maxY = seg.p2.y;
		}
	}

	/**
	 * Draw a filled trapezoid (two horizontal lines at different Y).
	 */
	private drawQuad(
		color: string,
		x1: number,
		y1: number,
		w1: number,
		x2: number,
		y2: number,
		w2: number,
	) {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x1 + w1, y1);
		this.ctx.lineTo(x2 + w2, y2);
		this.ctx.lineTo(x2, y2);
		this.ctx.closePath();
		this.ctx.fill();
	}

	drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number, maxSpeed: number) {
		const intensity = Math.max(0, (speed / maxSpeed - 0.5) * 2);
		if (intensity <= 0) return;

		ctx.globalAlpha = intensity * 0.15;
		ctx.strokeStyle = "#FFFFFF";
		ctx.lineWidth = 1;

		for (let i = 0; i < 12; i++) {
			const x = Math.random() * SCREEN.WIDTH;
			const y1 = SCREEN.HEIGHT * 0.3 + Math.random() * SCREEN.HEIGHT * 0.5;
			const len = 30 + intensity * 50;
			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x + (x - SCREEN.WIDTH / 2) * 0.1, y1 + len);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	drawHorizonGlow(zone: (typeof ZONES)[number], time: number) {
		const horizonY = SCREEN.HEIGHT / 2;
		const pulse = 0.5 + Math.sin(time * 0.003) * 0.3;

		const gradient = this.ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 5);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(
			0.5,
			`${zone.rumbleColor}${Math.floor(pulse * 40)
				.toString(16)
				.padStart(2, "0")}`,
		);
		gradient.addColorStop(1, "transparent");
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, horizonY - 20, SCREEN.WIDTH, 25);
	}
}
