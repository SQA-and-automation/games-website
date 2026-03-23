"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";

interface Particle {
	x: number;
	y: number;
	prevX: number;
	prevY: number;
	vx: number;
	vy: number;
	speed: number;
	color: string;
	alpha: number;
	life: number;
	maxLife: number;
}

const NEON_COLORS = [
	"0, 240, 255",   // cyan
	"123, 97, 255",  // purple
	"255, 0, 229",   // magenta
	"57, 255, 20",   // lime
];

function noise2D(x: number, y: number): number {
	const sin = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
	return sin - Math.floor(sin);
}

function smoothNoise(x: number, y: number, octaves: number, persistence: number): number {
	let total = 0;
	let frequency = 1;
	let amplitude = 1;
	let maxValue = 0;

	for (let i = 0; i < octaves; i++) {
		const ix = Math.floor(x * frequency);
		const iy = Math.floor(y * frequency);
		const fx = x * frequency - ix;
		const fy = y * frequency - iy;

		const a = noise2D(ix, iy);
		const b = noise2D(ix + 1, iy);
		const c = noise2D(ix, iy + 1);
		const d = noise2D(ix + 1, iy + 1);

		const sx = fx * fx * (3 - 2 * fx);
		const sy = fy * fy * (3 - 2 * fy);

		const ab = a + sx * (b - a);
		const cd = c + sx * (d - c);
		const value = ab + sy * (cd - ab);

		total += value * amplitude;
		maxValue += amplitude;
		amplitude *= persistence;
		frequency *= 2;
	}

	return total / maxValue;
}

export default function FlowFieldBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animFrameRef = useRef<number>(0);
	const mouseRef = useRef({ x: -1000, y: -1000 });
	const scrollRef = useRef(0);
	const particlesRef = useRef<Particle[]>([]);
	const timeRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReducedMotion) return;

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		if (!ctx) return;

		let width = window.innerWidth;
		let height = window.innerHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx.scale(dpr, dpr);
			initParticles();
		};

		const isMobile = width < 768;
		const PARTICLE_COUNT = isMobile ? 400 : 900;
		const NOISE_SCALE = 0.003;
		const MOUSE_RADIUS = 150;

		function createParticle(): Particle {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const maxLife = 200 + Math.random() * 300;
			return {
				x,
				y,
				prevX: x,
				prevY: y,
				vx: 0,
				vy: 0,
				speed: 0.5 + Math.random() * 1.5,
				color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
				alpha: 0.1 + Math.random() * 0.4,
				life: Math.random() * maxLife,
				maxLife,
			};
		}

		function initParticles() {
			particlesRef.current = Array.from({ length: PARTICLE_COUNT }, createParticle);
		}

		function getFlowAngle(x: number, y: number, time: number, scrollOffset: number): number {
			const nx = x * NOISE_SCALE;
			const ny = y * NOISE_SCALE;
			const nt = time * 0.0003;
			const ns = scrollOffset * 0.0005;

			const n = smoothNoise(nx + nt, ny + ns, 4, 0.5);
			return n * Math.PI * 4;
		}

		function update() {
			const time = timeRef.current;
			const scroll = scrollRef.current;
			const mx = mouseRef.current.x;
			const my = mouseRef.current.y;

			for (const p of particlesRef.current) {
				p.prevX = p.x;
				p.prevY = p.y;

				const angle = getFlowAngle(p.x, p.y, time, scroll);
				p.vx += Math.cos(angle) * 0.3;
				p.vy += Math.sin(angle) * 0.3;

				// Mouse repulsion
				const dx = p.x - mx;
				const dy = p.y - my;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < MOUSE_RADIUS && dist > 0) {
					const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
					p.vx += (dx / dist) * force * 2;
					p.vy += (dy / dist) * force * 2;
				}

				// Damping
				p.vx *= 0.92;
				p.vy *= 0.92;

				p.x += p.vx * p.speed;
				p.y += p.vy * p.speed;

				// Aging
				p.life++;
				if (
					p.life > p.maxLife ||
					p.x < -50 ||
					p.x > width + 50 ||
					p.y < -50 ||
					p.y > height + 50
				) {
					Object.assign(p, createParticle());
				}
			}
		}

		function draw() {
			// Fade trail effect
			ctx.fillStyle = "rgba(10, 10, 15, 0.08)";
			ctx.fillRect(0, 0, width, height);

			for (const p of particlesRef.current) {
				const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
				const lifeRatio = 1 - Math.abs(2 * (p.life / p.maxLife) - 1);
				const alpha = p.alpha * lifeRatio * Math.min(speed * 0.5, 1);

				if (alpha < 0.01) continue;

				ctx.beginPath();
				ctx.moveTo(p.prevX, p.prevY);
				ctx.lineTo(p.x, p.y);
				ctx.strokeStyle = `rgba(${p.color}, ${alpha})`;
				ctx.lineWidth = speed > 1.5 ? 2 : 1;
				ctx.stroke();

				// Glow for fast particles
				if (speed > 2) {
					ctx.beginPath();
					ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.5})`;
					ctx.fill();
				}
			}
		}

		function animate() {
			timeRef.current += 16;
			update();
			draw();
			animFrameRef.current = requestAnimationFrame(animate);
		}

		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current = { x: e.clientX, y: e.clientY };
		};

		const handleScroll = () => {
			scrollRef.current = window.scrollY;
		};

		const handleTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			mouseRef.current = { x: touch.clientX, y: touch.clientY };
		};

		resize();

		// Initial clear
		ctx.fillStyle = "#0A0A0F";
		ctx.fillRect(0, 0, width, height);

		window.addEventListener("resize", resize);
		window.addEventListener("mousemove", handleMouseMove, { passive: true });
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("touchmove", handleTouchMove, { passive: true });

		animFrameRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animFrameRef.current);
			window.removeEventListener("resize", resize);
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("touchmove", handleTouchMove);
		};
	}, []);

	return (
		<Box
			sx={{
				position: "fixed",
				inset: 0,
				zIndex: 0,
				pointerEvents: "none",
			}}
			aria-hidden="true"
		>
			<canvas
				ref={canvasRef}
				style={{
					display: "block",
					width: "100%",
					height: "100%",
				}}
			/>
		</Box>
	);
}
