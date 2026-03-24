import { CANVAS } from "../config";

export class ScreenEffects {
	// Screen shake
	private shakeIntensity = 0;
	private shakeDecay = 0.9;
	shakeOffsetX = 0;
	shakeOffsetY = 0;

	// Flash
	private flashColor = "";
	private flashAlpha = 0;
	private flashDecay = 0.05;

	// Boss warning
	private warningTimer = 0;
	private warningDuration = 2000; // ms
	showWarning = false;

	shake(intensity: number) {
		this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
	}

	flash(color: string, alpha = 0.6) {
		this.flashColor = color;
		this.flashAlpha = alpha;
	}

	startBossWarning() {
		this.showWarning = true;
		this.warningTimer = 0;
	}

	update(dt: number) {
		// Shake
		if (this.shakeIntensity > 0.5) {
			this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
			this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
			this.shakeIntensity *= this.shakeDecay;
		} else {
			this.shakeOffsetX = 0;
			this.shakeOffsetY = 0;
			this.shakeIntensity = 0;
		}

		// Flash
		if (this.flashAlpha > 0) {
			this.flashAlpha -= this.flashDecay * dt;
			if (this.flashAlpha < 0) this.flashAlpha = 0;
		}

		// Warning
		if (this.showWarning) {
			this.warningTimer += dt * 16.67;
			if (this.warningTimer >= this.warningDuration) {
				this.showWarning = false;
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		// Flash overlay
		if (this.flashAlpha > 0) {
			ctx.fillStyle = this.flashColor;
			ctx.globalAlpha = this.flashAlpha;
			ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
			ctx.globalAlpha = 1;
		}

		// Boss warning
		if (this.showWarning) {
			const progress = this.warningTimer / this.warningDuration;
			const blink = Math.sin(progress * Math.PI * 8) > 0;

			if (blink) {
				// Darken screen
				ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
				ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

				// Warning text
				ctx.font = "bold 28px Orbitron, monospace";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";

				ctx.shadowColor = "#FF3131";
				ctx.shadowBlur = 20;
				ctx.fillStyle = "#FF3131";
				ctx.fillText("⚠ BOSS INCOMING ⚠", CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
				ctx.shadowBlur = 0;

				// Red border flash
				ctx.strokeStyle = "rgba(255, 49, 49, 0.5)";
				ctx.lineWidth = 4;
				ctx.strokeRect(2, 2, CANVAS.WIDTH - 4, CANVAS.HEIGHT - 4);
			}
		}
	}
}
