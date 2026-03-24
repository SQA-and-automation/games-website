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
	private warningDuration = 2000;
	showWarning = false;

	// Wave sweep
	private sweepY = -1;
	private sweepActive = false;
	private sweepColor = "#00F0FF";

	// Vignette (cached)
	private vignetteCanvas: HTMLCanvasElement | null = null;

	// Scan line phase
	private scanLineOffset = 0;

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

	startWaveSweep(color = "#00F0FF") {
		this.sweepActive = true;
		this.sweepY = -10;
		this.sweepColor = color;
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

		// Wave sweep
		if (this.sweepActive) {
			this.sweepY += 8 * dt;
			if (this.sweepY > CANVAS.HEIGHT + 20) {
				this.sweepActive = false;
			}
		}

		// Scan lines scroll
		this.scanLineOffset = (this.scanLineOffset + 0.3 * dt) % 4;
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
				ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
				ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

				ctx.font = "bold 28px Orbitron, monospace";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";

				ctx.shadowColor = "#FF3131";
				ctx.shadowBlur = 20;
				ctx.fillStyle = "#FF3131";
				ctx.fillText("⚠ BOSS INCOMING ⚠", CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
				ctx.shadowBlur = 0;

				ctx.strokeStyle = "rgba(255, 49, 49, 0.5)";
				ctx.lineWidth = 4;
				ctx.strokeRect(2, 2, CANVAS.WIDTH - 4, CANVAS.HEIGHT - 4);
			}
		}

		// Wave sweep line
		if (this.sweepActive) {
			const gradient = ctx.createLinearGradient(0, this.sweepY - 15, 0, this.sweepY + 15);
			gradient.addColorStop(0, "transparent");
			gradient.addColorStop(0.4, `${this.sweepColor}40`);
			gradient.addColorStop(0.5, `${this.sweepColor}CC`);
			gradient.addColorStop(0.6, `${this.sweepColor}40`);
			gradient.addColorStop(1, "transparent");
			ctx.fillStyle = gradient;
			ctx.fillRect(0, this.sweepY - 15, CANVAS.WIDTH, 30);

			// Bright core line
			ctx.fillStyle = `${this.sweepColor}`;
			ctx.fillRect(0, this.sweepY - 0.5, CANVAS.WIDTH, 1);
		}

		// Scan lines (CRT effect)
		ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
		const startY = Math.floor(this.scanLineOffset);
		for (let y = startY; y < CANVAS.HEIGHT; y += 4) {
			ctx.fillRect(0, y, CANVAS.WIDTH, 1);
		}

		// Vignette overlay
		this.drawVignette(ctx);
	}

	private drawVignette(ctx: CanvasRenderingContext2D) {
		// Cache the vignette to avoid recreating gradient each frame
		if (!this.vignetteCanvas) {
			this.vignetteCanvas = document.createElement("canvas");
			this.vignetteCanvas.width = CANVAS.WIDTH;
			this.vignetteCanvas.height = CANVAS.HEIGHT;
			const vCtx = this.vignetteCanvas.getContext("2d")!;

			const gradient = vCtx.createRadialGradient(
				CANVAS.WIDTH / 2,
				CANVAS.HEIGHT / 2,
				CANVAS.WIDTH * 0.3,
				CANVAS.WIDTH / 2,
				CANVAS.HEIGHT / 2,
				CANVAS.WIDTH * 0.8,
			);
			gradient.addColorStop(0, "transparent");
			gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
			vCtx.fillStyle = gradient;
			vCtx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
		}

		ctx.drawImage(this.vignetteCanvas, 0, 0);
	}
}
