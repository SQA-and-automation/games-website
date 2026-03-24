import { CANVAS, POWERUPS } from "../config";
import type { PowerUpType, Rarity, Rect } from "../types";

export class PowerUpItem {
	x: number;
	y: number;
	size = POWERUPS.SIZE;
	type: PowerUpType;
	rarity: Rarity;
	alive = true;
	private pulsePhase = Math.random() * Math.PI * 2;

	constructor(x: number, y: number, type: PowerUpType, rarity: Rarity) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.rarity = rarity;
	}

	get rect(): Rect {
		return {
			x: this.x - this.size / 2,
			y: this.y - this.size / 2,
			width: this.size,
			height: this.size,
		};
	}

	get color(): string {
		return POWERUPS.RARITY[this.rarity].color;
	}

	update(dt: number, magnetX?: number, magnetY?: number, magnetRange?: number) {
		this.pulsePhase += 0.08 * dt;

		// Magnet attraction
		if (magnetX !== undefined && magnetY !== undefined && magnetRange) {
			const dx = magnetX - this.x;
			const dy = magnetY - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < magnetRange && dist > 1) {
				this.x += (dx / dist) * 4 * dt;
				this.y += (dy / dist) * 4 * dt;
				return; // don't fall while being attracted
			}
		}

		this.y += POWERUPS.FALL_SPEED * dt;

		if (this.y > CANVAS.HEIGHT + 30) {
			this.alive = false;
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;

		const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
		const r = (this.size / 2) * pulse;
		const color = this.color;

		// Glow aura
		ctx.beginPath();
		ctx.arc(this.x, this.y, r + 6, 0, Math.PI * 2);
		ctx.fillStyle = `${color}20`;
		ctx.fill();

		// Outer ring
		ctx.beginPath();
		ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
		ctx.fillStyle = `${color}40`;
		ctx.fill();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.stroke();

		// Icon
		ctx.fillStyle = color;
		ctx.font = `bold ${Math.floor(r)}px monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(this.getIcon(), this.x, this.y);

		// Epic sparkle
		if (this.rarity === "EPIC") {
			ctx.shadowColor = color;
			ctx.shadowBlur = 15;
			ctx.beginPath();
			ctx.arc(this.x, this.y, r + 2, 0, Math.PI * 2);
			ctx.strokeStyle = `${color}80`;
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.shadowBlur = 0;
		}
	}

	private getIcon(): string {
		switch (this.type) {
			case "SPEED_BOOST":
				return "S";
			case "DOUBLE_SHOT":
				return "D";
			case "SHIELD":
				return "O";
			case "TRIPLE_SHOT":
				return "T";
			case "MAGNET":
				return "M";
			case "BOMB":
				return "B";
			case "DRONE_COMPANION":
				return "C";
			case "LASER_BEAM":
				return "L";
			case "SLOW_MOTION":
				return "~";
		}
	}
}

export function rollPowerUpType(): { type: PowerUpType; rarity: Rarity } {
	// Roll rarity
	const roll = Math.random();
	let rarity: Rarity;
	if (roll < POWERUPS.RARITY.EPIC.chance) {
		rarity = "EPIC";
	} else if (roll < POWERUPS.RARITY.EPIC.chance + POWERUPS.RARITY.RARE.chance) {
		rarity = "RARE";
	} else {
		rarity = "COMMON";
	}

	// Pick random type of that rarity
	const types = Object.entries(POWERUPS.TYPES)
		.filter(([, cfg]) => cfg.rarity === rarity)
		.map(([key]) => key as PowerUpType);

	const type = types[Math.floor(Math.random() * types.length)];
	return { type, rarity };
}

export function rollEpicPowerUp(): { type: PowerUpType; rarity: Rarity } {
	const types = Object.entries(POWERUPS.TYPES)
		.filter(([, cfg]) => cfg.rarity === "EPIC")
		.map(([key]) => key as PowerUpType);

	return {
		type: types[Math.floor(Math.random() * types.length)],
		rarity: "EPIC",
	};
}
