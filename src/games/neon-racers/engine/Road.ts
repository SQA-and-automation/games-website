import { ROAD, SCREEN, ZONES } from "../config";
import type { RoadSegment, ScreenPoint } from "../types";

/**
 * Pseudo-3D road: array of segments, each projected to screen coordinates.
 * Curves are encoded as cumulative horizontal offsets.
 */
export class Road {
	segments: RoadSegment[] = [];
	private totalLength = 0;

	constructor() {
		this.generate();
	}

	private generate() {
		// Generate enough segments for all zones + repeats
		const totalZoneLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		const totalSegments = totalZoneLength * 3; // enough for multiple cycles

		for (let i = 0; i < totalSegments; i++) {
			this.segments.push({
				index: i,
				p1: { x: 0, y: 0, w: 0 },
				p2: { x: 0, y: 0, w: 0 },
				curve: this.generateCurve(i),
				y: 0,
				clip: 0,
			});
		}

		this.totalLength = this.segments.length * ROAD.SEGMENT_LENGTH;
	}

	private generateCurve(index: number): number {
		// Procedural curves: sine waves of varying frequency
		const t = index * 0.01;
		return Math.sin(t * 1.3) * 2.5 + Math.sin(t * 0.7) * 1.5 + Math.sin(t * 3.1) * 0.8;
	}

	getZone(segmentIndex: number) {
		let accumulated = 0;
		const cycleLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		const posInCycle = segmentIndex % cycleLength;
		const cycleNum = Math.floor(segmentIndex / cycleLength);

		for (const zone of ZONES) {
			if (posInCycle < accumulated + zone.length) {
				return { zone, cycleNum };
			}
			accumulated += zone.length;
		}
		return { zone: ZONES[0], cycleNum };
	}

	getSegment(index: number): RoadSegment | undefined {
		if (index < 0) return undefined;
		return this.segments[index % this.segments.length];
	}

	get length() {
		return this.segments.length;
	}

	/**
	 * Project segments to screen coordinates for rendering.
	 */
	project(
		position: number, // player position in segments (float)
		playerX: number, // player X offset (-1 to 1)
		cameraHeight: number,
		cameraDepth: number,
	) {
		const baseIndex = Math.max(0, Math.floor(position));
		const cameraY = cameraHeight;
		let x = 0;
		let dx = 0;
		let maxY: number = SCREEN.HEIGHT;

		for (let n = 0; n < ROAD.VISIBLE_SEGMENTS; n++) {
			const segIndex = (baseIndex + n) % this.segments.length;
			const seg = this.segments[segIndex];

			// Projection
			const camZ = (n - (position % 1)) * ROAD.SEGMENT_LENGTH;
			if (camZ <= 0) continue;

			const scale = cameraDepth / camZ;
			const projX =
				SCREEN.WIDTH / 2 + scale * (x - (playerX * ROAD.WIDTH) / 2) * (SCREEN.WIDTH / 2);
			const projY = SCREEN.HEIGHT / 2 - scale * cameraY * (SCREEN.HEIGHT / 2);
			const projW = scale * ROAD.WIDTH * (SCREEN.WIDTH / 2);

			seg.p2 = { x: projX, y: projY, w: projW };
			seg.clip = maxY;

			if (n > 0) {
				const prevSeg = this.segments[(baseIndex + n - 1) % this.segments.length];
				seg.p1 = { ...prevSeg.p2 };
			} else {
				seg.p1 = { x: projX, y: SCREEN.HEIGHT, w: projW * 1.2 };
			}

			// Accumulate curve
			dx += seg.curve * ROAD.CURVE_EASE;
			x += dx;

			// Update clip (only draw above previous segment)
			if (projY < maxY) {
				maxY = projY;
			}
		}
	}
}
