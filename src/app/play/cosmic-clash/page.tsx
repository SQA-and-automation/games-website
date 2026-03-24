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
	});
	const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
	const [lives, setLives] = useState(3);
	const [hp, setHp] = useState(3);
	const [bossHp, setBossHp] = useState<{ hp: number; maxHp: number } | null>(null);
	const [muted, setMuted] = useState(false);
	const [isNewHighScore, setIsNewHighScore] = useState(false);
	const [highScore, setHighScore] = useState(0);

	const initGame = useCallback(async () => {
		if (!canvasRef.current) return;

		// Dynamic import to avoid SSR issues with canvas/audio
		const { Game } = await import("@/games/cosmic-clash/engine/Game");

		const game = new Game(canvasRef.current, {
			onStateChange: setGameState,
			onStatsUpdate: setStats,
			onPowerUpsChange: setActivePowerUps,
			onLivesChange: (l, h) => {
				setLives(l);
				setHp(h);
			},
			onBossHPChange: (hp, maxHp) => setBossHp(maxHp > 0 ? { hp, maxHp } : null),
			onNewHighScore: () => setIsNewHighScore(true),
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

	const handleStart = () => {
		setIsNewHighScore(false);
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

	// Keyboard shortcuts
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
			}}
		>
			{/* Game Canvas */}
			<canvas
				ref={canvasRef}
				style={{
					maxWidth: "100%",
					maxHeight: "100%",
					objectFit: "contain",
					imageRendering: "pixelated",
				}}
			/>

			{/* HUD Overlay — only when playing */}
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
						<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
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
										}}
									/>
								))}
							</Box>
						</Box>

						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.85rem",
								color: "#00F0FF",
								fontWeight: 700,
							}}
						>
							Wave {stats.wave}
						</Typography>

						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "1rem",
								color: "#EAEAEA",
								fontWeight: 700,
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
							}}
						>
							<Box
								sx={{
									height: "100%",
									width: `${(bossHp.hp / bossHp.maxHp) * 100}%`,
									bgcolor: "#FF00E5",
									borderRadius: 3,
									transition: "width 0.1s ease",
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
							{activePowerUps.map((p) => (
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
									}}
								>
									<Typography sx={{ fontSize: "0.7rem", color: "#EAEAEA", fontWeight: 600 }}>
										{p.type.replace(/_/g, " ")}
									</Typography>
									<Box
										sx={{ width: 40, height: 3, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
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
											}}
										/>
									</Box>
								</Box>
							))}
						</Box>
					)}

					{/* Controls */}
					<Box
						sx={{
							position: "absolute",
							bottom: 12,
							right: 12,
							display: "flex",
							gap: 1,
						}}
					>
						<IconButton
							onClick={handleMute}
							size="small"
							sx={{ color: "#9E9E9E", bgcolor: "rgba(0,0,0,0.4)" }}
						>
							{muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
						</IconButton>
						<IconButton
							onClick={handlePause}
							size="small"
							sx={{ color: "#9E9E9E", bgcolor: "rgba(0,0,0,0.4)" }}
						>
							<PauseIcon fontSize="small" />
						</IconButton>
					</Box>
				</>
			)}

			{/* MENU SCREEN */}
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
						}}
					>
						COSMIC CLASH
					</Typography>

					<Typography sx={{ color: "#9E9E9E", fontStyle: "italic", fontSize: "1.1rem" }}>
						The galaxy needs a hero.
					</Typography>

					<Typography
						sx={{
							color: "#00F0FF",
							fontFamily: "var(--font-orbitron)",
							fontSize: "0.9rem",
							mt: 3,
							animation: "pulse 2s ease-in-out infinite",
							"@keyframes pulse": {
								"0%, 100%": { opacity: 0.5 },
								"50%": { opacity: 1 },
							},
						}}
					>
						TAP TO START
					</Typography>

					{highScore > 0 && (
						<Typography sx={{ color: "#9E9E9E", fontSize: "0.8rem", mt: 1 }}>
							Best: {highScore.toLocaleString()}
						</Typography>
					)}

					<IconButton
						onClick={(e) => {
							e.stopPropagation();
							handleHome();
						}}
						sx={{ position: "absolute", top: 16, left: 16, color: "#9E9E9E" }}
					>
						<HomeIcon />
					</IconButton>
				</Box>
			)}

			{/* PAUSE SCREEN */}
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
					}}
				>
					<Typography
						variant="h3"
						sx={{ fontFamily: "var(--font-orbitron)", color: "#EAEAEA", fontWeight: 700 }}
					>
						PAUSED
					</Typography>

					<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
						<IconButton
							onClick={handleResume}
							sx={{ color: "#00F0FF", bgcolor: "rgba(0,240,255,0.1)", px: 3, borderRadius: 2 }}
						>
							<PlayArrowIcon sx={{ mr: 0.5 }} />{" "}
							<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
								Resume
							</Typography>
						</IconButton>
						<IconButton
							onClick={handleRestart}
							sx={{ color: "#FFAA33", bgcolor: "rgba(255,170,51,0.1)", px: 3, borderRadius: 2 }}
						>
							<ReplayIcon sx={{ mr: 0.5 }} />{" "}
							<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
								Restart
							</Typography>
						</IconButton>
						<IconButton
							onClick={handleHome}
							sx={{ color: "#9E9E9E", bgcolor: "rgba(255,255,255,0.05)", px: 3, borderRadius: 2 }}
						>
							<HomeIcon sx={{ mr: 0.5 }} />{" "}
							<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
								Menu
							</Typography>
						</IconButton>
					</Box>
				</Box>
			)}

			{/* GAME OVER SCREEN */}
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
					}}
				>
					<Typography
						variant="h3"
						sx={{
							fontFamily: "var(--font-orbitron)",
							color: "#FF3131",
							fontWeight: 700,
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
								animation: "pulse 1s ease-in-out infinite",
								"@keyframes pulse": {
									"0%, 100%": { opacity: 0.7, transform: "scale(1)" },
									"50%": { opacity: 1, transform: "scale(1.1)" },
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
						}}
					>
						{stats.score.toLocaleString()}
					</Typography>

					{/* Stats grid */}
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
						<IconButton
							onClick={handleRestart}
							sx={{ color: "#00F0FF", bgcolor: "rgba(0,240,255,0.1)", px: 3, borderRadius: 2 }}
						>
							<ReplayIcon sx={{ mr: 0.5 }} />{" "}
							<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
								Retry
							</Typography>
						</IconButton>
						<IconButton
							onClick={handleHome}
							sx={{ color: "#9E9E9E", bgcolor: "rgba(255,255,255,0.05)", px: 3, borderRadius: 2 }}
						>
							<HomeIcon sx={{ mr: 0.5 }} />{" "}
							<Typography sx={{ fontFamily: "var(--font-orbitron)", fontSize: "0.8rem" }}>
								Home
							</Typography>
						</IconButton>
					</Box>
				</Box>
			)}
		</Box>
	);
}
