import type { PowerUpId, VehicleId } from "./config";

export type GameState = "menu" | "playing" | "game-over";

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
