import type { Rect } from "../types";

export function rectsOverlap(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy);
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
	return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}
