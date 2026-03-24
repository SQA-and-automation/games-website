export const SCREEN = {
	WIDTH: 480,
	HEIGHT: 720,
} as const;

export const ROAD = {
	LANES: 3,
	WIDTH: 2200, // road width in world units
	SEGMENT_LENGTH: 200,
	VISIBLE_SEGMENTS: 150,
	RUMBLE_LENGTH: 3, // segments per rumble strip
	DRAW_DISTANCE: 300,
	CURVE_EASE: 0.5,
} as const;

export const PLAYER_CFG = {
	START_SPEED: 180, // base segments per second
	MAX_SPEED: 380,
	ACCEL: 120,
	BRAKE: 200,
	OFF_ROAD_DECEL: 160,
	STEER_SPEED: 3.2,
	CENTRIFUGAL: 0.28,
	CRASH_SPEED_LOSS: 0.6, // lose 60% speed on crash
	CRASH_INVINCIBLE: 1500, // ms
} as const;

export const VEHICLES = {
	sportcar: {
		name: "Sportcar",
		speedMult: 1.0,
		handling: 1.0,
		maxCrashes: 3,
		cost: 0,
		color: "#00F0FF",
	},
	moto: {
		name: "Moto",
		speedMult: 1.3,
		handling: 1.2,
		maxCrashes: 1,
		cost: 2000,
		color: "#39FF14",
	},
	truck: {
		name: "Truck",
		speedMult: 0.75,
		handling: 0.7,
		maxCrashes: 5,
		cost: 5000,
		color: "#FF3131",
	},
	hovercraft: {
		name: "Hovercraft",
		speedMult: 1.1,
		handling: 1.0,
		maxCrashes: 2,
		cost: 15000,
		color: "#7B61FF",
	},
	police: {
		name: "Police Car",
		speedMult: 1.1,
		handling: 1.0,
		maxCrashes: 4,
		cost: 30000,
		color: "#FF00E5",
	},
} as const;

export type VehicleId = keyof typeof VEHICLES;

export const SCORING = {
	DISTANCE_MULT: 1, // points per segment
	OVERTAKE: 50,
	NEAR_MISS: 150,
	NEAR_MISS_THRESHOLD: 0.15, // road-width fraction
	COMBO_TIMEOUT: 2000,
	COMBO_THRESHOLDS: [0, 3, 6, 10, 15],
} as const;

export const POWERUPS_CFG = {
	SPAWN_CHANCE: 0.008, // per segment per frame
	TYPES: {
		NITRO: { duration: 3000, speedBoost: 0.8, color: "#00F0FF" },
		SHIELD: { duration: 0, color: "#39FF14" }, // single use
		GHOST: { duration: 4000, color: "#7B61FF" },
		SLOW_MO: { duration: 5000, factor: 0.5, color: "#FF00E5" },
		MAGNET: { duration: 6000, range: 1.5, color: "#FFD700" },
	},
} as const;

export type PowerUpId = keyof typeof POWERUPS_CFG.TYPES;

export const ZONES = [
	{
		name: "Neon City",
		length: 1000,
		skyColor1: "#0A0A1A",
		skyColor2: "#1A0A2E",
		roadColor: "#1A1A2E",
		rumbleColor: "#00F0FF",
		laneColor: "#00F0FF40",
		grassColor: "#0A0A12",
		fogColor: "#0A0A1A",
		trafficTypes: ["taxi", "sedan", "cyclist"],
	},
	{
		name: "Highway",
		length: 1000,
		skyColor1: "#0A1020",
		skyColor2: "#1A1830",
		roadColor: "#222233",
		rumbleColor: "#FF6B35",
		laneColor: "#FF6B3540",
		grassColor: "#0A0F0A",
		fogColor: "#0A1020",
		trafficTypes: ["truck", "sedan", "moto_npc"],
	},
	{
		name: "Desert",
		length: 1000,
		skyColor1: "#1A0A20",
		skyColor2: "#2E0A2E",
		roadColor: "#2E1A1A",
		rumbleColor: "#39FF14",
		laneColor: "#39FF1440",
		grassColor: "#1A0F0A",
		fogColor: "#1A0A20",
		trafficTypes: ["sedan", "truck", "rock"],
	},
	{
		name: "Neon Tunnel",
		length: 1000,
		skyColor1: "#0A0000",
		skyColor2: "#1A0505",
		roadColor: "#1A0A0A",
		rumbleColor: "#FFD700",
		laneColor: "#FFD70040",
		grassColor: "#0A0505",
		fogColor: "#0A0000",
		trafficTypes: ["sedan", "moto_npc", "barrier"],
	},
] as const;

export const COINS = {
	BASE_VALUE: 10,
	SPAWN_CHANCE: 0.015,
	MAGNET_SPEED: 5,
} as const;

export const COLORS = {
	NEON_CYAN: "#00F0FF",
	NEON_MAGENTA: "#FF00E5",
	NEON_RED: "#FF3131",
	NEON_GREEN: "#39FF14",
	NEON_GOLD: "#FFD700",
	NEON_PURPLE: "#7B61FF",
	BG_DARK: "#0A0A0F",
} as const;
