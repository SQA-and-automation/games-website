import { SCORE_POPUP } from "../config";

export class ScorePopup {
	x: number;
	y: number;
	text: string;
	life: number;
	maxLife: number;
	size: number;
	color: string;
	alive = true;

	constructor(x: number, y: number, points: number, combo: number) {
		this.x = x + (Math.random() - 0.5) * 20;
		this.y = y;
		this.maxLife = SCORE_POPUP.LIFE;
		this.life = this.maxLife;

		if (combo > 1) {
			this.text = `+${points} x${combo}`;
			this.size = SCORE_POPUP.COMBO_FONT_SIZE;
			this.color = combo >= 4 ? "#FFD700" : combo >= 3 ? "#FF00E5" : "#00F0FF";
		} else {
			this.text = `+${points}`;
			this.size = SCORE_POPUP.FONT_SIZE;
			this.color = "#FFFFFF";
		}
	}

	update(dt: number) {
		this.y -= SCORE_POPUP.RISE_SPEED * dt;
		this.life -= dt * 16.67;
		if (this.life <= 0) this.alive = false;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.alive) return;
		const alpha = Math.max(0, this.life / this.maxLife);
		const scale = 0.8 + (1 - alpha) * 0.4; // grows slightly as it fades

		ctx.globalAlpha = alpha;
		ctx.font = `bold ${Math.floor(this.size * scale)}px Orbitron, monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// Shadow for readability
		ctx.fillStyle = "rgba(0,0,0,0.5)";
		ctx.fillText(this.text, this.x + 1, this.y + 1);

		ctx.fillStyle = this.color;
		ctx.fillText(this.text, this.x, this.y);
		ctx.globalAlpha = 1;
	}
}
