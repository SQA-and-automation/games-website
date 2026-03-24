// All game balance constants in one place

export const CANVAS = {
	WIDTH: 480,
	HEIGHT: 720,
	BG_COLOR: "#0A0A0F",
} as const;

export const PLAYER = {
	WIDTH: 32,
	HEIGHT: 36,
	HITBOX_RATIO: 0.5, // hitbox is 50% of visual size
	SPEED: 5,
	FIRE_RATE: 150, // ms between shots
	LIVES: 3,
	HP_PER_LIFE: 3,
	INVINCIBLE_DURATION: 2000, // ms
	BULLET_SPEED: 8,
	BULLET_DAMAGE: 1,
} as const;

export const ENEMIES = {
	DRONE: {
		width: 28,
		height: 28,
		hp: 1,
		speed: 1.5,
		fireRate: 2000,
		score: 100,
		firstWave: 1,
	},
	ZIGZAG: {
		width: 26,
		height: 26,
		hp: 1,
		speed: 2.5,
		amplitude: 60,
		frequency: 0.03,
		fireRate: 1800,
		score: 150,
		firstWave: 3,
	},
	TANK: {
		width: 36,
		height: 36,
		hp: 4,
		speed: 1,
		fireRate: 1500,
		spreadAngle: 0.3,
		score: 300,
		firstWave: 5,
	},
	KAMIKAZE: {
		width: 22,
		height: 22,
		hp: 1,
		speed: 3.5,
		trackingStrength: 0.03,
		score: 200,
		firstWave: 8,
	},
	TELEPORTER: {
		width: 30,
		height: 30,
		hp: 2,
		speed: 1,
		teleportInterval: 3000,
		fireRate: 2000,
		score: 250,
		firstWave: 12,
	},
} as const;

export const BOSS = {
	WIDTH: 80,
	HEIGHT: 64,
	BASE_HP: 30,
	HP_PER_WAVE: 10, // additional HP per boss wave
	SPEED: 1.5,
	PHASE_1_FIRE_RATE: 400,
	PHASE_2_MINION_COUNT: 4,
	PHASE_3_ENRAGE_THRESHOLD: 0.3, // 30% HP
	SCORE_BASE: 2000,
	SCORE_PER_WAVE: 500,
} as const;

export const POWERUPS = {
	DROP_CHANCE: 0.2,
	FALL_SPEED: 1.5,
	SIZE: 24,
	MAX_ACTIVE: 2,
	RARITY: {
		COMMON: { chance: 0.6, duration: 8000, color: "#FFFFFF" },
		RARE: { chance: 0.25, duration: 12000, color: "#4488FF" },
		EPIC: { chance: 0.15, duration: 15000, color: "#FFD700" },
	},
	TYPES: {
		SPEED_BOOST: { rarity: "COMMON" as const, multiplier: 1.5 },
		DOUBLE_SHOT: { rarity: "COMMON" as const },
		SHIELD: { rarity: "COMMON" as const, hits: 3 },
		TRIPLE_SHOT: { rarity: "RARE" as const },
		MAGNET: { rarity: "RARE" as const, range: 200 },
		BOMB: { rarity: "RARE" as const },
		DRONE_COMPANION: { rarity: "EPIC" as const },
		LASER_BEAM: { rarity: "EPIC" as const, width: 8, damage: 0.5 },
		SLOW_MOTION: { rarity: "EPIC" as const, factor: 0.5 },
	},
} as const;

export const WAVES = {
	BASE_DURATION: 18000, // ms per wave
	ENEMIES_BASE: 5,
	ENEMIES_PER_WAVE: 2, // additional enemies each wave
	SPAWN_INTERVAL: 1200, // ms between spawns
	BOSS_EVERY: 5,
	SPEED_SCALE_PER_10_WAVES: 0.05, // 5% speed increase
} as const;

export const PARTICLES = {
	EXPLOSION_COUNT: 12,
	EXPLOSION_SPEED: 3,
	EXPLOSION_LIFE: 500,
	TRAIL_LIFE: 200,
	TRAIL_SIZE: 2,
} as const;

export const STAR_FIELD = {
	LAYERS: [
		{ count: 40, speed: 0.3, size: 1, opacity: 0.3 },
		{ count: 25, speed: 0.7, size: 1.5, opacity: 0.5 },
		{ count: 15, speed: 1.2, size: 2, opacity: 0.8 },
	],
} as const;

export const COLORS = {
	PLAYER: "#00F0FF",
	PLAYER_BULLET: "#00F0FF",
	ENEMY_BULLET: "#FF3131",
	BOSS: "#FF00E5",
	EXPLOSION: ["#FF3131", "#FF6B35", "#FFD700", "#FF00E5", "#00F0FF"],
	SHIELD: "rgba(0, 240, 255, 0.3)",
	LASER: "#FF00E5",
} as const;
