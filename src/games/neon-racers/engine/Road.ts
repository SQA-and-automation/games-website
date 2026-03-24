import { ROAD, ZONES } from "../config";

export interface RoadInfo {
	curve: number;
	zone: (typeof ZONES)[number];
	cycleNum: number;
	segmentIndex: number;
	hasTraffic: boolean;
	trafficOffset: number;
	trafficType: string;
	trafficPassed: boolean;
	hasCoin: boolean;
	hasPowerUp: boolean;
	powerUpType: string;
}

export class Road {
	// Curve data per segment
	private curves: number[] = [];
	private totalSegments: number;

	// Traffic & items
	private traffic: Map<number, { offset: number; type: string; speed: number; passed: boolean }> =
		new Map();
	private coins: Set<number> = new Set();
	private powerUps: Map<number, string> = new Map();

	constructor() {
		const totalZoneLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		this.totalSegments = totalZoneLength * 3;

		for (let i = 0; i < this.totalSegments; i++) {
			const t = i * 0.008;
			this.curves.push(
				Math.sin(t * 1.3) * 0.4 + Math.sin(t * 0.7) * 0.25 + Math.sin(t * 3.1) * 0.1,
			);
		}
	}

	get length() {
		return this.totalSegments;
	}

	getCurve(segIndex: number): number {
		return (
			this.curves[((segIndex % this.totalSegments) + this.totalSegments) % this.totalSegments] ?? 0
		);
	}

	getZone(segIndex: number) {
		const cycleLength = ZONES.reduce((sum, z) => sum + z.length, 0);
		const posInCycle = ((segIndex % cycleLength) + cycleLength) % cycleLength;
		const cycleNum = Math.floor(Math.max(0, segIndex) / cycleLength);

		let accumulated = 0;
		for (const zone of ZONES) {
			if (posInCycle < accumulated + zone.length) {
				return { zone, cycleNum };
			}
			accumulated += zone.length;
		}
		return { zone: ZONES[0], cycleNum };
	}

	// Traffic management
	setTraffic(seg: number, offset: number, type: string, speed: number) {
		this.traffic.set(seg, { offset, type, speed, passed: false });
	}

	getTraffic(seg: number) {
		return this.traffic.get(seg);
	}

	removeTraffic(seg: number) {
		this.traffic.delete(seg);
	}

	markPassed(seg: number) {
		const t = this.traffic.get(seg);
		if (t) t.passed = true;
	}

	// Coins
	setCoin(seg: number) {
		this.coins.add(seg);
	}

	hasCoin(seg: number) {
		return this.coins.has(seg);
	}

	removeCoin(seg: number) {
		this.coins.delete(seg);
	}

	// Power-ups
	setPowerUp(seg: number, type: string) {
		this.powerUps.set(seg, type);
	}

	getPowerUp(seg: number) {
		return this.powerUps.get(seg);
	}

	removePowerUp(seg: number) {
		this.powerUps.delete(seg);
	}

	clearItems() {
		this.traffic.clear();
		this.coins.clear();
		this.powerUps.clear();
	}
}
