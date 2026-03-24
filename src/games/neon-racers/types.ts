import type { PowerUpId, VehicleId } from "./config";

export type GameState = "menu" | "playing" | "game-over";

export interface RoadSegment {
	index: number;
	p1: ScreenPoint; // near edge
	p2: ScreenPoint; // far edge
	curve: number;
	y: number; // world y for hills (unused for now, flat road)
	clip: number;
	// Items on this segment
	trafficCar?: TrafficCar;
	coin?: boolean;
	powerUp?: PowerUpId;
}

export interface ScreenPoint {
	x: number;
	y: number;
	w: number; // projected road width
}

export interface TrafficCar {
	offset: number; // -1 to 1 (lane position)
	type: string;
	speed: number; // relative to base speed
	passed: boolean; // has player overtaken
}

export interface ActivePowerUp {
	type: PowerUpId;
	remaining: number;
	duration: number;
}

export interface GameStats {
	distance: number;
	speed: number;
	score: number;
	coins: number;
	overtakes: number;
	nearMisses: number;
	combo: number;
	crashesLeft: number;
	zone: string;
	activePowerUp: ActivePowerUp | null;
}

export interface SavedData {
	totalCoins: number;
	bestDistance: number;
	bestZone: string;
	unlockedVehicles: VehicleId[];
	selectedVehicle: VehicleId;
	totalRuns: number;
}

export interface GameCallbacks {
	onStateChange: (state: GameState) => void;
	onStatsUpdate: (stats: GameStats) => void;
	onCrash: () => void;
	onGameOver: (stats: GameStats, isNewRecord: boolean) => void;
	onZoneChange: (zone: string) => void;
	onNearMiss: () => void;
}
