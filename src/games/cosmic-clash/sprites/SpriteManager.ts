import type { EnemyType, PowerUpType } from "../types";
import { BOSS_ENRAGED, BOSS_SHIP } from "./boss";
import { DRONE, KAMIKAZE, TANK, TELEPORTER, ZIGZAG } from "./enemies";
import {
	POWERUP_BOMB,
	POWERUP_DOUBLE,
	POWERUP_DRONE,
	POWERUP_LASER,
	POWERUP_MAGNET,
	POWERUP_SHIELD,
	POWERUP_SLOW,
	POWERUP_SPEED,
	POWERUP_TRIPLE,
} from "./items";
import { renderPixelArt } from "./PixelRenderer";
import { NEON_PALETTE } from "./palette";
import { PLAYER_FLAME_1, PLAYER_FLAME_2, PLAYER_SHIP } from "./player";

const P = NEON_PALETTE;

class SpriteManagerClass {
	private initialized = false;

	// Player
	playerShip!: HTMLCanvasElement;
	playerFlame1!: HTMLCanvasElement;
	playerFlame2!: HTMLCanvasElement;

	// Enemies
	private enemySprites = new Map<EnemyType, HTMLCanvasElement>();

	// Boss
	bossNormal!: HTMLCanvasElement;
	bossEnraged!: HTMLCanvasElement;

	// Power-ups
	private powerUpSprites = new Map<PowerUpType, HTMLCanvasElement>();

	init() {
		if (this.initialized) return;

		this.playerShip = renderPixelArt(PLAYER_SHIP, P, 2, "player");
		this.playerFlame1 = renderPixelArt(PLAYER_FLAME_1, P, 2, "flame1");
		this.playerFlame2 = renderPixelArt(PLAYER_FLAME_2, P, 2, "flame2");

		this.enemySprites.set("DRONE", renderPixelArt(DRONE, P, 2, "drone"));
		this.enemySprites.set("ZIGZAG", renderPixelArt(ZIGZAG, P, 2, "zigzag"));
		this.enemySprites.set("TANK", renderPixelArt(TANK, P, 2, "tank"));
		this.enemySprites.set("KAMIKAZE", renderPixelArt(KAMIKAZE, P, 2, "kamikaze"));
		this.enemySprites.set("TELEPORTER", renderPixelArt(TELEPORTER, P, 2, "teleporter"));

		this.bossNormal = renderPixelArt(BOSS_SHIP, P, 2, "boss");
		this.bossEnraged = renderPixelArt(BOSS_ENRAGED, P, 2, "boss_enraged");

		this.powerUpSprites.set("SPEED_BOOST", renderPixelArt(POWERUP_SPEED, P, 2, "pu_speed"));
		this.powerUpSprites.set("DOUBLE_SHOT", renderPixelArt(POWERUP_DOUBLE, P, 2, "pu_double"));
		this.powerUpSprites.set("SHIELD", renderPixelArt(POWERUP_SHIELD, P, 2, "pu_shield"));
		this.powerUpSprites.set("TRIPLE_SHOT", renderPixelArt(POWERUP_TRIPLE, P, 2, "pu_triple"));
		this.powerUpSprites.set("MAGNET", renderPixelArt(POWERUP_MAGNET, P, 2, "pu_magnet"));
		this.powerUpSprites.set("BOMB", renderPixelArt(POWERUP_BOMB, P, 2, "pu_bomb"));
		this.powerUpSprites.set("DRONE_COMPANION", renderPixelArt(POWERUP_DRONE, P, 2, "pu_drone"));
		this.powerUpSprites.set("LASER_BEAM", renderPixelArt(POWERUP_LASER, P, 2, "pu_laser"));
		this.powerUpSprites.set("SLOW_MOTION", renderPixelArt(POWERUP_SLOW, P, 2, "pu_slow"));

		this.initialized = true;
	}

	getEnemy(type: EnemyType): HTMLCanvasElement {
		return this.enemySprites.get(type)!;
	}

	getPowerUp(type: PowerUpType): HTMLCanvasElement {
		return this.powerUpSprites.get(type)!;
	}
}

// Singleton
export const SpriteManager = new SpriteManagerClass();
