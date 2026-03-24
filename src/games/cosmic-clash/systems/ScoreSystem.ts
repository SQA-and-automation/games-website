import { COMBO } from "../config";
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

	// Combo
	comboKills = 0;
	comboTimer = 0;
	comboMultiplier = 1;

	reset() {
		this.score = 0;
		this.enemiesKilled = 0;
		this.powerUpsCollected = 0;
		this.startTime = Date.now();
		this.comboKills = 0;
		this.comboTimer = 0;
		this.comboMultiplier = 1;
	}

	addScore(points: number): number {
		const total = points * this.comboMultiplier;
		this.score += total;
		return total;
	}

	addKill() {
		this.enemiesKilled++;
		this.comboKills++;
		this.comboTimer = COMBO.TIMEOUT;

		// Calculate multiplier from thresholds
		this.comboMultiplier = 1;
		for (let i = COMBO.MULTIPLIER_THRESHOLDS.length - 1; i >= 0; i--) {
			if (this.comboKills >= COMBO.MULTIPLIER_THRESHOLDS[i]) {
				this.comboMultiplier = i + 1;
				break;
			}
		}
	}

	updateCombo(dt: number) {
		if (this.comboTimer > 0) {
			this.comboTimer -= dt * 16.67;
			if (this.comboTimer <= 0) {
				this.comboKills = 0;
				this.comboMultiplier = 1;
				this.comboTimer = 0;
			}
		}
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
			combo: this.comboMultiplier,
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
