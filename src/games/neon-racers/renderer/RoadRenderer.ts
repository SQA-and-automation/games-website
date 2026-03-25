import { ROAD, SCREEN, type ZONES } from "../config";
import type { Road } from "../engine/Road";

// Shared projection constants — MUST be used by item drawing too
export const HORIZON_Y = Math.floor(SCREEN.HEIGHT * 0.4); // 288
export const Z_SCALE = 450; // z = Z_SCALE / (y - HORIZON_Y)
export const ROAD_BASE_W = 220; // road half-width at z=1

/**
 * Convert segment offset (distance ahead) to screen Y.
 */
export function segToScreenY(offset: number): number {
	if (offset <= 0) return SCREEN.HEIGHT + 100;
	const perspective = Z_SCALE / offset;
	return HORIZON_Y + perspective;
}

/**
 * Get road half-width at a given z (segment offset distance).
 */
export function roadWidthAtZ(z: number): number {
	if (z <= 0) return ROAD_BASE_W;
	return ROAD_BASE_W / z;
}

export class RoadRenderer {
	private ctx: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	drawSky(zone: (typeof ZONES)[number]) {
		const gradient = this.ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
		gradient.addColorStop(0, zone.skyColor1);
		gradient.addColorStop(1, zone.skyColor2);
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, SCREEN.WIDTH, HORIZON_Y + 1);
	}

	drawRoad(road: Road, position: number, playerX: number) {
		const ctx = this.ctx;
		const baseSegment = Math.floor(position);
		const segFrac = position - baseSegment;

		let curveDx = 0;

		// Draw scanlines from bottom to horizon
		for (let y = SCREEN.HEIGHT; y > HORIZON_Y; y--) {
			const perspective = y - HORIZON_Y;
			if (perspective <= 0) break;

			// z = distance in "segment units" from camera
			const z = Z_SCALE / perspective;

			// Which road segment?
			const segOffset = z + segFrac;
			const segIndex = baseSegment + Math.floor(segOffset);
			const { zone } = road.getZone(segIndex);

			// Road width
			const halfW = ROAD_BASE_W / z;

			// Curve accumulation
			const curve = road.getCurve(segIndex);
			curveDx += (curve / perspective) * 30;

			// Road center
			const cx = SCREEN.WIDTH / 2 + curveDx - playerX * halfW * 0.6;

			const isRumble = Math.floor(segIndex / ROAD.RUMBLE_LENGTH) % 2 === 0;

			// Grass
			ctx.fillStyle = zone.grassColor;
			ctx.fillRect(0, y, SCREEN.WIDTH, 1);

			// Road
			ctx.fillStyle = zone.roadColor;
			ctx.fillRect(cx - halfW, y, halfW * 2, 1);

			// Rumble strips
			if (isRumble) {
				const rw = Math.max(1, halfW * 0.08);
				ctx.fillStyle = zone.rumbleColor;
				ctx.fillRect(cx - halfW - rw, y, rw, 1);
				ctx.fillRect(cx + halfW, y, rw, 1);
			}

			// Lane markings
			if (!isRumble && halfW > 8) {
				ctx.fillStyle = zone.laneColor;
				const lw = Math.max(1, halfW * 0.015);
				for (let lane = 1; lane < ROAD.LANES; lane++) {
					const lx = cx - halfW + (halfW * 2 * lane) / ROAD.LANES;
					ctx.fillRect(lx - lw / 2, y, lw, 1);
				}
			}
		}
	}

	drawHorizonGlow(zone: (typeof ZONES)[number], time: number) {
		const pulse = 0.3 + Math.sin(time * 0.003) * 0.15;
		const gradient = this.ctx.createLinearGradient(0, HORIZON_Y - 5, 0, HORIZON_Y + 3);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(
			0.5,
			`${zone.rumbleColor}${Math.floor(pulse * 25)
				.toString(16)
				.padStart(2, "0")}`,
		);
		gradient.addColorStop(1, "transparent");
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, HORIZON_Y - 5, SCREEN.WIDTH, 8);
	}

	drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number, maxSpeed: number) {
		const intensity = Math.max(0, (speed / maxSpeed - 0.5) * 2);
		if (intensity <= 0) return;
		ctx.globalAlpha = intensity * 0.1;
		ctx.strokeStyle = "#FFFFFF";
		ctx.lineWidth = 1;
		for (let i = 0; i < 6; i++) {
			const x = Math.random() * SCREEN.WIDTH;
			const y = HORIZON_Y + Math.random() * (SCREEN.HEIGHT - HORIZON_Y) * 0.5;
			const len = 15 + intensity * 30;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + (x - SCREEN.WIDTH / 2) * 0.03, y + len);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}
}
