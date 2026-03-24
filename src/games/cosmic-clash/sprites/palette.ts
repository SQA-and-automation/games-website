// Neon cyberpunk palette for all sprites
// Each character maps to a color used in pixel art grids

export const NEON_PALETTE = {
	// Cyan (player)
	C: "#00F0FF",
	c: "#00B8C4",
	d: "#008899",

	// Magenta (boss, accents)
	M: "#FF00E5",
	m: "#C400B0",
	n: "#880077",

	// Red (enemies, danger)
	R: "#FF3131",
	r: "#CC2222",
	p: "#881111",

	// Orange
	O: "#FF6B35",
	o: "#CC5522",

	// Yellow/Gold
	Y: "#FFD700",
	y: "#CCAA00",

	// Green
	G: "#39FF14",
	g: "#22CC00",

	// Purple
	P: "#7B61FF",
	q: "#5544CC",

	// Blue
	B: "#4488FF",
	b: "#3366CC",

	// White / Light
	W: "#FFFFFF",
	w: "#CCCCCC",
	v: "#999999",

	// Dark / Structure
	D: "#333344",
	S: "#1A1A2E",
	X: "#0A0A0F",
} as const;
