import type { GameStats, SavedData } from "../types";

const STORAGE_KEY = "cosmicClash";

const DEFAULT_DATA: SavedData = {
	highScore: 0,
	highWave: 0,
	totalGames: 0,
	recentScores: [],
};

export class ScoreSystem {
	score = 0;
	enemiesKilled = 0;
	powerUpsCollected = 0;
	startTime = 0;

	reset() {
		this.score = 0;
		this.enemiesKilled = 0;
		this.powerUpsCollected = 0;
		this.startTime = Date.now();
	}

	addScore(points: number) {
		this.score += points;
	}

	addKill() {
		this.enemiesKilled++;
	}

	addPowerUp() {
		this.powerUpsCollected++;
	}

	getStats(wave: number): GameStats {
		return {
			score: this.score,
			wave,
			enemiesKilled: this.enemiesKilled,
			timePlayed: Date.now() - this.startTime,
			powerUpsCollected: this.powerUpsCollected,
		};
	}

	saveGame(wave: number): boolean {
		const data = this.load();
		const isNewHigh = this.score > data.highScore;

		if (isNewHigh) data.highScore = this.score;
		if (wave > data.highWave) data.highWave = wave;
		data.totalGames++;
		data.recentScores.unshift(this.score);
		if (data.recentScores.length > 10) data.recentScores.pop();

		this.save(data);
		return isNewHigh;
	}

	load(): SavedData {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return { ...DEFAULT_DATA };
			return { ...DEFAULT_DATA, ...JSON.parse(raw) };
		} catch {
			return { ...DEFAULT_DATA };
		}
	}

	private save(data: SavedData) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch {
			// localStorage full or unavailable
		}
	}
}
