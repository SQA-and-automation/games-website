import { CANVAS, ENEMIES, WAVES } from "../config";
import { Enemy } from "../entities/Enemy";
import type { EnemyType } from "../types";

const AVAILABLE_TYPES: { type: EnemyType; firstWave: number }[] = [
	{ type: "DRONE", firstWave: ENEMIES.DRONE.firstWave },
	{ type: "ZIGZAG", firstWave: ENEMIES.ZIGZAG.firstWave },
	{ type: "TANK", firstWave: ENEMIES.TANK.firstWave },
	{ type: "KAMIKAZE", firstWave: ENEMIES.KAMIKAZE.firstWave },
	{ type: "TELEPORTER", firstWave: ENEMIES.TELEPORTER.firstWave },
];

export class WaveSystem {
	wave = 0;
	private spawnTimer = 0;
	private enemiesToSpawn = 0;
	waveDone = false;
	isBossWave = false;
	bossSpawned = false;
	betweenWaves = false;
	private betweenTimer = 0;

	reset() {
		this.wave = 0;
		this.spawnTimer = 0;
		this.enemiesToSpawn = 0;
		this.waveDone = false;
		this.isBossWave = false;
		this.bossSpawned = false;
		this.betweenWaves = false;
		this.betweenTimer = 0;
	}

	startNextWave() {
		this.wave++;
		this.isBossWave = this.wave % WAVES.BOSS_EVERY === 0;
		this.bossSpawned = false;
		this.waveDone = false;
		this.spawnTimer = 0;

		if (this.isBossWave) {
			this.enemiesToSpawn = 0; // boss wave = just the boss
		} else {
			this.enemiesToSpawn = WAVES.ENEMIES_BASE + (this.wave - 1) * WAVES.ENEMIES_PER_WAVE;
		}

		this.betweenWaves = false;
	}

	startBetweenWaves() {
		this.betweenWaves = true;
		this.betweenTimer = 0;
	}

	update(dt: number): Enemy | null {
		if (this.betweenWaves) {
			this.betweenTimer += dt * 16.67;
			if (this.betweenTimer >= 1500) {
				this.startNextWave();
			}
			return null;
		}

		if (this.waveDone) return null;

		if (this.isBossWave) {
			this.waveDone = true; // boss is spawned separately
			return null;
		}

		this.spawnTimer += dt * 16.67;
		const spawnInterval = Math.max(400, WAVES.SPAWN_INTERVAL - this.wave * 20);

		if (this.spawnTimer >= spawnInterval && this.enemiesToSpawn > 0) {
			this.spawnTimer = 0;
			this.enemiesToSpawn--;

			if (this.enemiesToSpawn <= 0) {
				this.waveDone = true;
			}

			return this.spawnEnemy();
		}

		return null;
	}

	private spawnEnemy(): Enemy {
		// Pick a random available type for this wave
		const available = AVAILABLE_TYPES.filter((t) => t.firstWave <= this.wave);
		const { type } = available[Math.floor(Math.random() * available.length)];

		const cfg = ENEMIES[type];
		const x = Math.random() * (CANVAS.WIDTH - cfg.width);
		const y = -cfg.height - Math.random() * 40;

		return new Enemy(type, x, y);
	}

	getSpeedScale(): number {
		return 1 + Math.floor(this.wave / 10) * WAVES.SPEED_SCALE_PER_10_WAVES;
	}
}
