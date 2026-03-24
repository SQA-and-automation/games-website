import { ROAD, SCREEN, type ZONES } from "../config";
import type { Road } from "../engine/Road";

const HORIZON_Y = Math.floor(SCREEN.HEIGHT * 0.4);
const CAM_HEIGHT = 150;
const CAM_DEPTH = 120;
const ROAD_HALF_W = 0.45; // fraction of screen width at z=1

/**
 * Scanline-based pseudo-3D road renderer.
 * Draws the road line by line from bottom of screen to horizon.
 */
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

		// Accumulate curve offset
		let curveDx = 0;

		// Draw scanlines from bottom to horizon
		for (let y = SCREEN.HEIGHT; y > HORIZON_Y; y--) {
			// How far into the distance is this screen row?
			const perspective = y - HORIZON_Y;
			if (perspective <= 0) break;

			const z = (CAM_HEIGHT * CAM_DEPTH) / perspective;

			// Which road segment does this z correspond to?
			const segOffset = z + segFrac;
			const segIndex = baseSegment + Math.floor(segOffset);

			// Get zone colors
			const { zone } = road.getZone(segIndex);

			// Road width at this distance (wider near, narrower far)
			const roadW = (ROAD_HALF_W * SCREEN.WIDTH) / (z * 0.08);

			// Accumulate curve
			const curve = road.getCurve(segIndex);
			curveDx += curve * (1 / perspective) * 40;

			// Road center X
			const centerX = SCREEN.WIDTH / 2 + curveDx - playerX * roadW * 0.5;

			// Rumble pattern (alternating colors)
			const isRumble = Math.floor(segIndex / ROAD.RUMBLE_LENGTH) % 2 === 0;

			// Draw grass
			ctx.fillStyle = zone.grassColor;
			ctx.fillRect(0, y, SCREEN.WIDTH, 1);

			// Draw road surface
			const roadLeft = centerX - roadW;
			const roadRight = centerX + roadW;
			ctx.fillStyle = zone.roadColor;
			ctx.fillRect(roadLeft, y, roadRight - roadLeft, 1);

			// Rumble strips (road edges)
			if (isRumble) {
				const rumbleW = Math.max(1, roadW * 0.06);
				ctx.fillStyle = zone.rumbleColor;
				ctx.fillRect(roadLeft - rumbleW, y, rumbleW, 1);
				ctx.fillRect(roadRight, y, rumbleW, 1);
			}

			// Lane markings
			if (!isRumble && roadW > 15) {
				ctx.fillStyle = zone.laneColor;
				const laneW = Math.max(1, roadW * 0.01);
				for (let lane = 1; lane < ROAD.LANES; lane++) {
					const lx = roadLeft + (roadRight - roadLeft) * (lane / ROAD.LANES);
					ctx.fillRect(lx - laneW / 2, y, laneW, 1);
				}
			}
		}
	}

	/**
	 * Get the road center X and half-width for a given screen Y.
	 * Used by Game to position items and check collisions.
	 */
	getRoadAtY(
		y: number,
		position: number,
		playerX: number,
		road: Road,
	): { centerX: number; halfWidth: number; segIndex: number } | null {
		if (y <= HORIZON_Y) return null;
		const perspective = y - HORIZON_Y;
		const z = (CAM_HEIGHT * CAM_DEPTH) / perspective;
		const baseSegment = Math.floor(position);
		const segFrac = position - baseSegment;
		const segIndex = baseSegment + Math.floor(z + segFrac);
		const roadW = (ROAD_HALF_W * SCREEN.WIDTH) / (z * 0.08);

		// Approximate curve offset at this Y (simplified)
		let curveDx = 0;
		for (let sy = SCREEN.HEIGHT; sy > y; sy -= 4) {
			const p = sy - HORIZON_Y;
			if (p <= 0) break;
			const sz = (CAM_HEIGHT * CAM_DEPTH) / p;
			const si = baseSegment + Math.floor(sz + segFrac);
			curveDx += road.getCurve(si) * (1 / p) * 40;
		}

		const centerX = SCREEN.WIDTH / 2 + curveDx - playerX * roadW * 0.5;
		return { centerX, halfWidth: roadW, segIndex };
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
			const y1 = HORIZON_Y + Math.random() * (SCREEN.HEIGHT - HORIZON_Y) * 0.5;
			const len = 15 + intensity * 30;
			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x + (x - SCREEN.WIDTH / 2) * 0.03, y1 + len);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}
}

export { HORIZON_Y };
