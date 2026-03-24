import { CANVAS } from "../config";
import type { Vec2 } from "../types";

export class Input {
	private keys = new Set<string>();
	private pointerDown = false;
	private pointerPos: Vec2 = { x: 0, y: 0 };
	private canvas: HTMLCanvasElement;
	private scaleX = 1;
	private scaleY = 1;
	isDragging = false;
	targetPos: Vec2 | null = null;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.updateScale();

		// Keyboard
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);

		// Mouse
		canvas.addEventListener("mousedown", this.onPointerStart);
		window.addEventListener("mousemove", this.onPointerMove);
		window.addEventListener("mouseup", this.onPointerEnd);

		// Touch
		canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
		window.addEventListener("touchmove", this.onTouchMove, { passive: false });
		window.addEventListener("touchend", this.onTouchEnd);

		// Resize
		window.addEventListener("resize", this.updateScale);
	}

	private updateScale = () => {
		const rect = this.canvas.getBoundingClientRect();
		this.scaleX = CANVAS.WIDTH / rect.width;
		this.scaleY = CANVAS.HEIGHT / rect.height;
	};

	private canvasPos(clientX: number, clientY: number): Vec2 {
		const rect = this.canvas.getBoundingClientRect();
		return {
			x: (clientX - rect.left) * this.scaleX,
			y: (clientY - rect.top) * this.scaleY,
		};
	}

	private onKeyDown = (e: KeyboardEvent) => {
		this.keys.add(e.key);
	};

	private onKeyUp = (e: KeyboardEvent) => {
		this.keys.delete(e.key);
	};

	private onPointerStart = (e: MouseEvent) => {
		this.pointerDown = true;
		this.pointerPos = this.canvasPos(e.clientX, e.clientY);
		this.isDragging = true;
		this.targetPos = { ...this.pointerPos };
	};

	private onPointerMove = (e: MouseEvent) => {
		if (!this.pointerDown) return;
		this.pointerPos = this.canvasPos(e.clientX, e.clientY);
		this.targetPos = { ...this.pointerPos };
	};

	private onPointerEnd = () => {
		this.pointerDown = false;
		this.isDragging = false;
		this.targetPos = null;
	};

	private onTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		const touch = e.touches[0];
		this.pointerDown = true;
		this.pointerPos = this.canvasPos(touch.clientX, touch.clientY);
		this.isDragging = true;
		this.targetPos = { ...this.pointerPos };
	};

	private onTouchMove = (e: TouchEvent) => {
		e.preventDefault();
		if (!this.pointerDown) return;
		const touch = e.touches[0];
		this.pointerPos = this.canvasPos(touch.clientX, touch.clientY);
		this.targetPos = { ...this.pointerPos };
	};

	private onTouchEnd = () => {
		this.pointerDown = false;
		this.isDragging = false;
		this.targetPos = null;
	};

	isKeyDown(key: string): boolean {
		return this.keys.has(key);
	}

	getMovement(): Vec2 {
		let dx = 0;
		let dy = 0;

		if (this.keys.has("ArrowLeft") || this.keys.has("a")) dx -= 1;
		if (this.keys.has("ArrowRight") || this.keys.has("d")) dx += 1;
		if (this.keys.has("ArrowUp") || this.keys.has("w")) dy -= 1;
		if (this.keys.has("ArrowDown") || this.keys.has("s")) dy += 1;

		// Normalize diagonal movement
		if (dx !== 0 && dy !== 0) {
			const len = Math.sqrt(dx * dx + dy * dy);
			dx /= len;
			dy /= len;
		}

		return { x: dx, y: dy };
	}

	destroy() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		this.canvas.removeEventListener("mousedown", this.onPointerStart);
		window.removeEventListener("mousemove", this.onPointerMove);
		window.removeEventListener("mouseup", this.onPointerEnd);
		this.canvas.removeEventListener("touchstart", this.onTouchStart);
		window.removeEventListener("touchmove", this.onTouchMove);
		window.removeEventListener("touchend", this.onTouchEnd);
		window.removeEventListener("resize", this.updateScale);
	}
}
