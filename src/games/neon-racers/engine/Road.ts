import { ROAD, SCREEN, ZONES } from "../config";
import type { RoadSegment } from "../types";

/**
 * Pseudo-3D road using classic scanline projection (OutRun style).
 * Each segment represents a horizontal strip of road at a certain Z distance.
 */
export class Road {
	segments: RoadSegment[] = [];

	constructor() {
		this.generate();
	}

	private generate() {
		const totalZoneLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		const totalSegments = totalZoneLength * 3;

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
	}

	private generateCurve(index: number): number {
		const t = index * 0.008;
		return Math.sin(t * 1.3) * 3 + Math.sin(t * 0.7) * 2 + Math.sin(t * 3.1) * 1;
	}

	getZone(segmentIndex: number) {
		const cycleLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		const posInCycle = ((segmentIndex % cycleLength) + cycleLength) % cycleLength;
		const cycleNum = Math.floor(segmentIndex / cycleLength);

		let accumulated = 0;
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
	 * Project road segments to screen coordinates.
	 * Classic pseudo-3D: each segment gets a screen Y, X, and width based on perspective.
	 */
	project(position: number, playerX: number) {
		const baseIndex = Math.max(0, Math.floor(position));
		const camHeight = 1500;
		const fov = 100;
		const cameraDepth = 1 / Math.tan(((fov / 2) * Math.PI) / 180);

		let curveAccum = 0;
		let prevScreenY: number = SCREEN.HEIGHT;

		for (let n = 1; n <= ROAD.VISIBLE_SEGMENTS; n++) {
			const segIndex = (baseIndex + n) % this.segments.length;
			const seg = this.segments[segIndex];
			if (!seg) continue;

			// Z distance from camera (in segment units)
			const z = (n - (position - baseIndex)) * ROAD.SEGMENT_LENGTH;
			if (z <= 0) continue;

			// Perspective projection
			const scale = cameraDepth / z;

			// Screen Y: above center = further away
			const screenY = SCREEN.HEIGHT * 0.6 - scale * camHeight * SCREEN.HEIGHT;

			// Road width at this distance
			const screenW = scale * ROAD.WIDTH * SCREEN.WIDTH * 0.5;

			// Horizontal offset from curves
			curveAccum += seg.curve * scale * 2;
			const screenX = SCREEN.WIDTH / 2 - playerX * screenW * 0.5 + curveAccum;

			seg.p2 = { x: screenX, y: screenY, w: screenW };

			// p1 = previous segment's p2 (or screen bottom for first segment)
			if (n === 1) {
				seg.p1 = { x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT, w: screenW * 2.5 };
			}

			// Set p1 of next iteration
			const nextSegIndex = (baseIndex + n + 1) % this.segments.length;
			const nextSeg = this.segments[nextSegIndex];
			if (nextSeg) {
				nextSeg.p1 = { x: screenX, y: screenY, w: screenW };
			}

			seg.clip = prevScreenY;
			prevScreenY = Math.min(prevScreenY, screenY);
		}
	}
}
