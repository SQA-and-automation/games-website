import { POWERUPS } from "../config";
import type { ActivePowerUp, PowerUpType, Rarity } from "../types";

export class PowerUpSystem {
	active: ActivePowerUp[] = [];

	reset() {
		this.active = [];
	}

	activate(type: PowerUpType, rarity: Rarity) {
		const duration = POWERUPS.RARITY[rarity].duration;

		// Check if already active — refresh timer
		const existing = this.active.find((p) => p.type === type);
		if (existing) {
			existing.remaining = duration;
			existing.duration = duration;
			return;
		}

		// Max 2 active — remove oldest if needed
		if (this.active.length >= POWERUPS.MAX_ACTIVE) {
			this.active.shift();
		}

		this.active.push({ type, rarity, remaining: duration, duration });
	}

	update(dt: number) {
		for (const p of this.active) {
			p.remaining -= dt * 16.67;
		}
		this.active = this.active.filter((p) => p.remaining > 0);
	}

	has(type: PowerUpType): boolean {
		return this.active.some((p) => p.type === type);
	}

	get hasShield() {
		return this.has("SHIELD");
	}

	get hasDoubleShot() {
		return this.has("DOUBLE_SHOT");
	}

	get hasTripleShot() {
		return this.has("TRIPLE_SHOT");
	}

	get hasSpeedBoost() {
		return this.has("SPEED_BOOST");
	}

	get hasMagnet() {
		return this.has("MAGNET");
	}

	get hasLaser() {
		return this.has("LASER_BEAM");
	}

	get hasDrones() {
		return this.has("DRONE_COMPANION");
	}

	get hasSlowMotion() {
		return this.has("SLOW_MOTION");
	}

	get slowFactor(): number {
		return this.hasSlowMotion ? POWERUPS.TYPES.SLOW_MOTION.factor : 1;
	}
}
