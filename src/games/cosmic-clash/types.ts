export type GameState = "menu" | "playing" | "paused" | "game-over";

export type PowerUpType =
	| "SPEED_BOOST"
	| "DOUBLE_SHOT"
	| "SHIELD"
	| "TRIPLE_SHOT"
	| "MAGNET"
	| "BOMB"
	| "DRONE_COMPANION"
	| "LASER_BEAM"
	| "SLOW_MOTION";

export type Rarity = "COMMON" | "RARE" | "EPIC";

export type EnemyType = "DRONE" | "ZIGZAG" | "TANK" | "KAMIKAZE" | "TELEPORTER";

export interface Vec2 {
	x: number;
	y: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ActivePowerUp {
	type: PowerUpType;
	rarity: Rarity;
	remaining: number;
	duration: number;
}

export interface GameStats {
	score: number;
	wave: number;
	enemiesKilled: number;
	timePlayed: number;
	powerUpsCollected: number;
	combo: number;
}

export interface SavedData {
	highScore: number;
	highWave: number;
	totalGames: number;
	recentScores: number[];
}

export interface GameCallbacks {
	onStateChange: (state: GameState) => void;
	onStatsUpdate: (stats: GameStats) => void;
	onPowerUpsChange: (powerUps: ActivePowerUp[]) => void;
	onLivesChange: (lives: number, hp: number) => void;
	onBossHPChange: (hp: number, maxHp: number) => void;
	onNewHighScore: () => void;
	onShowOnboarding: (isMobile: boolean) => void;
}
