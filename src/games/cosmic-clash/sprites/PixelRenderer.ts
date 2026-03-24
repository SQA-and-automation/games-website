/**
 * Renders pixel art from a grid of color indices.
 * Grid is an array of strings where each character maps to a color.
 * ' ' or '.' = transparent, letters map to the palette.
 */

type Palette = Record<string, string>;

const spriteCache = new Map<string, HTMLCanvasElement>();

export function renderPixelArt(
	grid: string[],
	palette: Palette,
	scale: number,
	cacheKey?: string,
): HTMLCanvasElement {
	if (cacheKey && spriteCache.has(cacheKey)) {
		return spriteCache.get(cacheKey)!;
	}

	const rows = grid.length;
	const cols = Math.max(...grid.map((r) => r.length));
	const canvas = document.createElement("canvas");
	canvas.width = cols * scale;
	canvas.height = rows * scale;
	const ctx = canvas.getContext("2d")!;

	for (let y = 0; y < rows; y++) {
		const row = grid[y];
		for (let x = 0; x < row.length; x++) {
			const char = row[x];
			if (char === " " || char === ".") continue;
			const color = palette[char];
			if (!color) continue;
			ctx.fillStyle = color;
			ctx.fillRect(x * scale, y * scale, scale, scale);
		}
	}

	if (cacheKey) {
		spriteCache.set(cacheKey, canvas);
	}

	return canvas;
}

export function drawSprite(
	ctx: CanvasRenderingContext2D,
	sprite: HTMLCanvasElement,
	x: number,
	y: number,
	centered = true,
) {
	if (centered) {
		ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
	} else {
		ctx.drawImage(sprite, x, y);
	}
}

export function clearSpriteCache() {
	spriteCache.clear();
}
