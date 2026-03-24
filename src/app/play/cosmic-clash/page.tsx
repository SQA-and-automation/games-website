"use client";

import HomeIcon from "@mui/icons-material/Home";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivePowerUp, GameState, GameStats } from "@/games/cosmic-clash/types";

// Shared button hover/press styles
const btnInteraction = {
	transition: "all 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
	"&:hover": {
		transform: "scale(1.05)",
		boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)",
	},
	"&:active": {
		transform: "scale(0.95)",
		transition: "transform 0.08s ease",
	},
} as const;

const easeOutQuart = "cubic-bezier(0.25, 1, 0.5, 1)";

export default function CosmicClashPage() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<InstanceType<
		typeof import("@/games/cosmic-clash/engine/Game").Game
	> | null>(null);

	const [gameState, setGameState] = useState<GameState>("menu");
	const [stats, setStats] = useState<GameStats>({
		score: 0,
		wave: 0,
		enemiesKilled: 0,
		timePlayed: 0,
		powerUpsCollected: 0,
		combo: 1,
	});
	const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
	const [lives, setLives] = useState(3);
	const [hp, setHp] = useState(3);
	const [bossHp, setBossHp] = useState<{ hp: number; maxHp: number } | null>(null);
	const [muted, setMuted] = useState(false);
	const [isNewHighScore, setIsNewHighScore] = useState(false);
	const [highScore, setHighScore] = useState(0);
	const [onboarding, setOnboarding] = useState<string | null>(null);
	const [displayScore, setDisplayScore] = useState(0);
	const [gameOverVisible, setGameOverVisible] = useState(false);

	// Animation triggers
	const [scorePop, setScorePop] = useState(false);
	const [heartShake, setHeartShake] = useState(false);
	const [wavePop, setWavePop] = useState(false);
	const prevScore = useRef(0);
	const prevLives = useRef(3);
	const prevWave = useRef(0);

	const initGame = useCallback(async () => {
		if (!canvasRef.current) return;

		const { Game } = await import("@/games/cosmic-clash/engine/Game");

		const game = new Game(canvasRef.current, {
			onStateChange: (state) => {
				setGameState(state);
				if (state === "game-over") {
					setDisplayScore(0);
					setGameOverVisible(false);
					setTimeout(() => setGameOverVisible(true), 100);
				}
			},
			onStatsUpdate: (s) => {
				setStats(s);
				// Score pop
				if (s.score > prevScore.current) {
					setScorePop(true);
					setTimeout(() => setScorePop(false), 200);
				}
				prevScore.current = s.score;
				// Wave pop
				if (s.wave > prevWave.current && prevWave.current > 0) {
					setWavePop(true);
					setTimeout(() => setWavePop(false), 400);
				}
				prevWave.current = s.wave;
			},
			onPowerUpsChange: setActivePowerUps,
			onLivesChange: (l, h) => {
				// Heart shake
				if (l < prevLives.current) {
					setHeartShake(true);
					setTimeout(() => setHeartShake(false), 400);
				}
				prevLives.current = l;
				setLives(l);
				setHp(h);
			},
			onBossHPChange: (currentHp, maxHp) => setBossHp(maxHp > 0 ? { hp: currentHp, maxHp } : null),
			onNewHighScore: () => setIsNewHighScore(true),
			onShowOnboarding: (isMobile) => {
				setOnboarding(isMobile ? "Drag to move your ship" : "Arrow keys or WASD to move");
				setTimeout(() => setOnboarding(null), 3000);
			},
		});

		gameRef.current = game;
		setHighScore(game.getHighScore());
	}, []);

	useEffect(() => {
		initGame();
		return () => {
			gameRef.current?.destroy();
		};
	}, [initGame]);

	// Score count-up on game over
	useEffect(() => {
		if (gameState !== "game-over" || stats.score === 0) {
			setDisplayScore(stats.score);
			return;
		}
		const target = stats.score;
		const duration = 1500;
		const start = performance.now();
		let frameId: number;
		const animate = (now: number) => {
			const progress = Math.min(1, (now - start) / duration);
			const eased = 1 - (1 - progress) ** 3;
			setDisplayScore(Math.floor(target * eased));
			if (progress < 1) frameId = requestAnimationFrame(animate);
		};
		frameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frameId);
	}, [gameState, stats.score]);

	const handleStart = () => {
		setIsNewHighScore(false);
		setOnboarding(null);
		gameRef.current?.start();
	};
	const handlePause = () => gameRef.current?.pause();
	const handleResume = () => gameRef.current?.resume();
	const handleRestart = () => {
		setIsNewHighScore(false);
		gameRef.current?.restart();
	};
	const handleMute = () => {
		const m = gameRef.current?.toggleMute();
		setMuted(!!m);
	};
	const handleHome = () => {
		gameRef.current?.destroy();
		window.location.href = "/";
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (gameState === "playing") gameRef.current?.pause();
				else if (gameState === "paused") gameRef.current?.resume();
			}
			if (e.key === " " && gameState === "menu") {
				e.preventDefault();
				gameRef.current?.start();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [gameState]);

	const formatTime = (ms: number) => {
		const s = Math.floor(ms / 1000);
		const m = Math.floor(s / 60);
		return `${m}:${String(s % 60).padStart(2, "0")}`;
	};

	return (
		<Box
			sx={{
				width: "100vw",
				height: "100dvh",
				bgcolor: "#0A0A0F",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflow: "hidden",
				userSelect: "none",
				touchAction: "none",
				// Reduced motion support
				"@media (prefers-reduced-motion: reduce)": {
					"& *": {
						animationDuration: "0.01ms !important",
						transitionDuration: "0.01ms !important",
					},
				},
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					maxWidth: "100%",
					maxHeight: "100%",
					objectFit: "contain",
					imageRendering: "pixelated",
				}}
			/>

			{/* === HUD === */}
			{gameState === "playing" && (
				<>
					{/* Top bar */}
					<Box
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							px: 2,
							py: 1,
							background: "linear-gradient(rgba(0,0,0,0.6), transparent)",
							pointerEvents: "none",
						}}
					>
						{/* Lives + HP */}
						<Box
							sx={{
								display: "flex",
								gap: 0.5,
								alignItems: "center",
								animation: heartShake ? "heartShake 0.4s ease" : "none",
								"@keyframes heartShake": {
									"0%, 100%": { transform: "translateX(0)" },
									"20%": { transform: "translateX(-4px)" },
									"40%": { transform: "translateX(4px)" },
									"60%": { transform: "translateX(-3px)" },
									"80%": { transform: "translateX(2px)" },
								},
							}}
						>
							{Array.from({ length: lives }).map((_, i) => (
								<Typography key={`life-${i}`} sx={{ fontSize: "1.2rem", color: "#FF3131" }}>
									♥
								</Typography>
							))}
							<Box sx={{ ml: 1, display: "flex", gap: 0.3 }}>
								{Array.from({ length: 3 }).map((_, i) => (
									<Box
										key={`hp-${i}`}
										sx={{
											width: 8,
											height: 8,
											borderRadius: "50%",
											bgcolor: i < hp ? "#00F0FF" : "rgba(255,255,255,0.15)",
											transition: `all 0.3s ${easeOutQuart}`,
											transform: i < hp ? "scale(1)" : "scale(0.6)",
										}}
									/>
								))}
							</Box>
						</Box>

						{/* Wave */}
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.85rem",
								color: "#00F0FF",
								fontWeight: 700,
								transition: `transform 0.4s ${easeOutQuart}`,
								transform: wavePop ? "scale(1.3)" : "scale(1)",
							}}
						>
							Wave {stats.wave}
						</Typography>

						{/* Score */}
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "1rem",
								color: "#EAEAEA",
								fontWeight: 700,
								transition: `transform 0.15s ${easeOutQuart}`,
								transform: scorePop ? "scale(1.2)" : "scale(1)",
							}}
						>
							{stats.score.toLocaleString()}
						</Typography>
					</Box>

					{/* Boss HP bar */}
					{bossHp && (
						<Box
							sx={{
								position: "absolute",
								top: 44,
								left: "10%",
								right: "10%",
								height: 6,
								bgcolor: "rgba(255,255,255,0.1)",
								borderRadius: 3,
								animation: "slideInTop 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
								"@keyframes slideInTop": {
									from: { transform: "translateY(-20px)", opacity: 0 },
									to: { transform: "translateY(0)", opacity: 1 },
								},
							}}
						>
							<Box
								sx={{
									height: "100%",
									width: `${(bossHp.hp / bossHp.maxHp) * 100}%`,
									bgcolor: "#FF00E5",
									borderRadius: 3,
									transition: `width 0.15s ${easeOutQuart}`,
									boxShadow: "0 0 10px rgba(255, 0, 229, 0.5)",
								}}
							/>
						</Box>
					)}

					{/* Active power-ups */}
					{activePowerUps.length > 0 && (
						<Box
							sx={{
								position: "absolute",
								bottom: 16,
								left: 16,
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
								pointerEvents: "none",
							}}
						>
							{activePowerUps.map((p, idx) => {
								const urgency = p.remaining / p.duration < 0.2;
								return (
									<Box
										key={p.type}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											bgcolor: "rgba(0,0,0,0.5)",
											borderRadius: 1,
											px: 1,
											py: 0.3,
											border: "1px solid",
											borderColor:
												p.rarity === "EPIC"
													? "#FFD700"
													: p.rarity === "RARE"
														? "#4488FF"
														: "rgba(255,255,255,0.3)",
											animation: `slideInLeft 0.3s ${easeOutQuart} ${idx * 0.05}s both`,
											"@keyframes slideInLeft": {
												from: { transform: "translateX(-20px)", opacity: 0 },
												to: { transform: "translateX(0)", opacity: 1 },
											},
										}}
									>
										<Typography
											sx={{
												fontSize: "0.7rem",
												color: "#EAEAEA",
												fontWeight: 600,
												animation: urgency ? "urgencyBlink 0.5s ease-in-out infinite" : "none",
												"@keyframes urgencyBlink": {
													"0%, 100%": { opacity: 1 },
													"50%": { opacity: 0.4 },
												},
											}}
										>
											{p.type.replace(/_/g, " ")}
										</Typography>
										<Box
											sx={{
												width: 40,
												height: 3,
												bgcolor: "rgba(255,255,255,0.1)",
												borderRadius: 2,
											}}
										>
											<Box
												sx={{
													height: "100%",
													width: `${(p.remaining / p.duration) * 100}%`,
													bgcolor:
														p.rarity === "EPIC"
															? "#FFD700"
															: p.rarity === "RARE"
																? "#4488FF"
																: "#FFFFFF",
													borderRadius: 2,
													transition: "width 0.1s linear",
													animation: urgency ? "urgencyPulse 0.5s ease-in-out infinite" : "none",
													"@keyframes urgencyPulse": {
														"0%, 100%": { opacity: 1 },
														"50%": { opacity: 0.5 },
													},
												}}
											/>
										</Box>
									</Box>
								);
							})}
						</Box>
					)}

					{/* Onboarding */}
					{onboarding && (
						<Box
							sx={{
								position: "absolute",
								bottom: "30%",
								left: 0,
								right: 0,
								textAlign: "center",
								pointerEvents: "none",
								animation: "fadeInOut 3s ease-in-out",
								"@keyframes fadeInOut": {
									"0%": { opacity: 0 },
									"15%": { opacity: 1 },
									"70%": { opacity: 1 },
									"100%": { opacity: 0 },
								},
							}}
						>
							<Typography
								sx={{
									fontFamily: "var(--font-orbitron)",
									fontSize: "0.85rem",
									color: "rgba(255,255,255,0.7)",
									bgcolor: "rgba(0,0,0,0.4)",
									display: "inline-block",
									px: 2,
									py: 0.5,
									borderRadius: 1,
								}}
							>
								{onboarding}
							</Typography>
						</Box>
					)}

					{/* Controls */}
					<Box sx={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 1 }}>
						<IconButton
							onClick={handleMute}
							size="small"
							sx={{ color: "#9E9E9E", bgcolor: "rgba(0,0,0,0.4)", ...btnInteraction }}
						>
							{muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
						</IconButton>
						<IconButton
							onClick={handlePause}
							size="small"
							sx={{ color: "#9E9E9E", bgcolor: "rgba(0,0,0,0.4)", ...btnInteraction }}
						>
							<PauseIcon fontSize="small" />
						</IconButton>
					</Box>
				</>
			)}

			{/* === MENU === */}
			{gameState === "menu" && (
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: "rgba(10, 10, 15, 0.9)",
						gap: 3,
						cursor: "pointer",
						animation: `menuFadeIn 0.6s ${easeOutQuart}`,
						"@keyframes menuFadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
					}}
					onClick={handleStart}
				>
					<Typography
						variant="h2"
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontWeight: 900,
							fontSize: "clamp(2rem, 6vw, 3rem)",
							background: "linear-gradient(135deg, #FF00E5, #00F0FF)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							textShadow: "none",
							animation: `titleEntry 0.8s ${easeOutQuart} 0.1s both, titleGlow 3s ease-in-out infinite 1s`,
							"@keyframes titleEntry": {
								from: { transform: "translateY(-20px) scale(0.95)", opacity: 0 },
								to: { transform: "translateY(0) scale(1)", opacity: 1 },
							},
							"@keyframes titleGlow": {
								"0%, 100%": { filter: "drop-shadow(0 0 8px rgba(0,240,255,0.3))" },
								"50%": { filter: "drop-shadow(0 0 20px rgba(255,0,229,0.5))" },
							},
						}}
					>
						COSMIC CLASH
					</Typography>

					<Typography
						sx={{
							color: "#9E9E9E",
							fontStyle: "italic",
							fontSize: "1.1rem",
							animation: `subtitleEntry 0.6s ${easeOutQuart} 0.3s both`,
							"@keyframes subtitleEntry": {
								from: { transform: "translateY(10px)", opacity: 0 },
								to: { transform: "translateY(0)", opacity: 1 },
							},
						}}
					>
						The galaxy needs a hero.
					</Typography>

					<Typography
						sx={{
							color: "#00F0FF",
							fontFamily: "var(--font-orbitron)",
							fontSize: "0.9rem",
							mt: 3,
							animation: `ctaEntry 0.5s ${easeOutQuart} 0.6s both, pulse 2s ease-in-out infinite 1.1s`,
							"@keyframes ctaEntry": { from: { opacity: 0 }, to: { opacity: 0.5 } },
							"@keyframes pulse": { "0%, 100%": { opacity: 0.5 }, "50%": { opacity: 1 } },
						}}
					>
						TAP TO START
					</Typography>

					{highScore > 0 && (
						<Typography
							sx={{
								color: "#9E9E9E",
								fontSize: "0.8rem",
								mt: 1,
								animation: `subtitleEntry 0.5s ${easeOutQuart} 0.8s both`,
							}}
						>
							Best: {highScore.toLocaleString()}
						</Typography>
					)}

					<IconButton
						onClick={(e) => {
							e.stopPropagation();
							handleHome();
						}}
						sx={{ position: "absolute", top: 16, left: 16, color: "#9E9E9E", ...btnInteraction }}
					>
						<HomeIcon />
					</IconButton>
				</Box>
			)}

			{/* === PAUSE === */}
			{gameState === "paused" && (
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: "rgba(10, 10, 15, 0.85)",
						backdropFilter: "blur(4px)",
						gap: 2,
						animation: `pauseIn 0.3s ${easeOutQuart}`,
						"@keyframes pauseIn": {
							from: { opacity: 0, backdropFilter: "blur(0px)" },
							to: { opacity: 1, backdropFilter: "blur(4px)" },
						},
					}}
				>
					<Typography
						variant="h3"
						sx={{
							fontFamily: "var(--font-orbitron)",
							color: "#EAEAEA",
							fontWeight: 700,
							animation: `slideDown 0.4s ${easeOutQuart}`,
							"@keyframes slideDown": {
								from: { transform: "translateY(-20px)", opacity: 0 },
								to: { transform: "translateY(0)", opacity: 1 },
							},
						}}
					>
						PAUSED
					</Typography>

					<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
						{[
							{
								onClick: handleResume,
								color: "#00F0FF",
								bg: "rgba(0,240,255,0.1)",
								icon: <PlayArrowIcon sx={{ mr: 0.5 }} />,
								label: "Resume",
								delay: "0.1s",
							},
							{
								onClick: handleRestart,
								color: "#FFAA33",
								bg: "rgba(255,170,51,0.1)",
								icon: <ReplayIcon sx={{ mr: 0.5 }} />,
								label: "Restart",
								delay: "0.15s",
							},
							{
								onClick: handleHome,
								color: "#9E9E9E",
								bg: "rgba(255,255,255,0.05)",
								icon: <HomeIcon sx={{ mr: 0.5 }} />,
								label: "Menu",
								delay: "0.2s",
							},
						].map((btn) => (
							<IconButton
								key={btn.label}
								onClick={btn.onClick}
								sx={{
									color: btn.color,
									bgcolor: btn.bg,
									px: 3,
									borderRadius: 2,
									...btnInteraction,
									animation: `fadeUp 0.4s ${easeOutQuart} ${btn.delay} both`,
									"@keyframes fadeUp": {
										from: { transform: "translateY(15px)", opacity: 0 },
										to: { transform: "translateY(0)", opacity: 1 },
									},
								}}
							>
								{btn.icon}
								<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
									{btn.label}
								</Typography>
							</IconButton>
						))}
					</Box>
				</Box>
			)}

			{/* === GAME OVER === */}
			{gameState === "game-over" && (
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: "rgba(10, 10, 15, 0.9)",
						gap: 2,
						opacity: gameOverVisible ? 1 : 0,
						transition: `opacity 0.5s ${easeOutQuart}`,
					}}
				>
					<Typography
						variant="h3"
						sx={{
							fontFamily: "var(--font-orbitron)",
							color: "#FF3131",
							fontWeight: 700,
							animation: `gameOverEntry 0.6s ${easeOutQuart}`,
							"@keyframes gameOverEntry": {
								"0%": { transform: "scale(2) translateY(-10px)", opacity: 0 },
								"60%": { transform: "scale(0.95)", opacity: 1 },
								"100%": { transform: "scale(1) translateY(0)" },
							},
						}}
					>
						GAME OVER
					</Typography>

					{isNewHighScore && (
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								color: "#FFD700",
								fontSize: "1rem",
								fontWeight: 700,
								animation: `newHighScore 1s ease-in-out infinite, fadeUp 0.5s ${easeOutQuart} 0.2s both`,
								"@keyframes newHighScore": {
									"0%, 100%": {
										opacity: 0.7,
										transform: "scale(1)",
										textShadow: "0 0 10px rgba(255,215,0,0.3)",
									},
									"50%": {
										opacity: 1,
										transform: "scale(1.1)",
										textShadow: "0 0 25px rgba(255,215,0,0.8)",
									},
								},
								"@keyframes fadeUp": {
									from: { transform: "translateY(15px)", opacity: 0 },
									to: { transform: "translateY(0)", opacity: 1 },
								},
							}}
						>
							NEW HIGH SCORE!
						</Typography>
					)}

					<Typography
						sx={{
							fontFamily: "var(--font-orbitron)",
							color: "#EAEAEA",
							fontSize: "2rem",
							fontWeight: 900,
							animation: `scoreEntry 0.5s ${easeOutQuart} 0.15s both`,
							"@keyframes scoreEntry": {
								from: { transform: "scale(0.5)", opacity: 0 },
								to: { transform: "scale(1)", opacity: 1 },
							},
						}}
					>
						{displayScore.toLocaleString()}
					</Typography>

					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 1.5,
							mt: 1,
							bgcolor: "rgba(255,255,255,0.03)",
							borderRadius: 2,
							p: 2,
							border: "1px solid rgba(255,255,255,0.06)",
							animation: `fadeUp 0.5s ${easeOutQuart} 0.3s both`,
						}}
					>
						{[
							{ label: "Wave", value: stats.wave },
							{ label: "Kills", value: stats.enemiesKilled },
							{ label: "Time", value: formatTime(stats.timePlayed) },
							{ label: "Power-ups", value: stats.powerUpsCollected },
						].map((s) => (
							<Box key={s.label} sx={{ textAlign: "center" }}>
								<Typography
									sx={{ color: "#9E9E9E", fontSize: "0.7rem", textTransform: "uppercase" }}
								>
									{s.label}
								</Typography>
								<Typography
									sx={{
										color: "#EAEAEA",
										fontSize: "1.1rem",
										fontWeight: 700,
										fontFamily: "var(--font-orbitron)",
									}}
								>
									{s.value}
								</Typography>
							</Box>
						))}
					</Box>

					<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
						{[
							{
								onClick: handleRestart,
								color: "#00F0FF",
								bg: "rgba(0,240,255,0.1)",
								icon: <ReplayIcon sx={{ mr: 0.5 }} />,
								label: "Retry",
								delay: "0.5s",
							},
							{
								onClick: handleHome,
								color: "#9E9E9E",
								bg: "rgba(255,255,255,0.05)",
								icon: <HomeIcon sx={{ mr: 0.5 }} />,
								label: "Home",
								delay: "0.6s",
							},
						].map((btn) => (
							<IconButton
								key={btn.label}
								onClick={btn.onClick}
								sx={{
									color: btn.color,
									bgcolor: btn.bg,
									px: 3,
									borderRadius: 2,
									...btnInteraction,
									animation: `fadeUp 0.5s ${easeOutQuart} ${btn.delay} both`,
								}}
							>
								{btn.icon}
								<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
									{btn.label}
								</Typography>
							</IconButton>
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
}
