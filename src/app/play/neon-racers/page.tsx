"use client";

import HomeIcon from "@mui/icons-material/Home";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReplayIcon from "@mui/icons-material/Replay";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { VEHICLES, type VehicleId } from "@/games/neon-racers/config";
import type { GameState, GameStats, SavedData } from "@/games/neon-racers/types";

const easeOutQuart = "cubic-bezier(0.25, 1, 0.5, 1)";
const btnSx = {
	transition: "all 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
	"&:hover": { transform: "scale(1.05)", boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)" },
	"&:active": { transform: "scale(0.95)", transition: "transform 0.08s ease" },
} as const;

const vehicleIds = Object.keys(VEHICLES) as VehicleId[];

export default function NeonRacersPage() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<InstanceType<
		typeof import("@/games/neon-racers/engine/Game").Game
	> | null>(null);

	const [gameState, setGameState] = useState<GameState>("menu");
	const [stats, setStats] = useState<GameStats | null>(null);
	const [muted, setMuted] = useState(false);
	const [savedData, setSavedData] = useState<SavedData | null>(null);
	const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>("sportcar");
	const [isNewRecord, setIsNewRecord] = useState(false);
	const [nearMissFlash, setNearMissFlash] = useState(false);
	const [crashShake, setCrashShake] = useState(false);
	const [zoneText, setZoneText] = useState<string | null>(null);
	const [displayDistance, setDisplayDistance] = useState(0);

	const initGame = useCallback(async () => {
		if (!canvasRef.current) return;
		const { Game } = await import("@/games/neon-racers/engine/Game");
		const game = new Game(canvasRef.current, {
			onStateChange: setGameState,
			onStatsUpdate: setStats,
			onCrash: () => {
				setCrashShake(true);
				setTimeout(() => setCrashShake(false), 300);
			},
			onGameOver: (s, isNew) => {
				setStats(s);
				setIsNewRecord(isNew);
				setDisplayDistance(0);
			},
			onZoneChange: (z) => {
				setZoneText(z);
				setTimeout(() => setZoneText(null), 2000);
			},
			onNearMiss: () => {
				setNearMissFlash(true);
				setTimeout(() => setNearMissFlash(false), 200);
			},
		});
		gameRef.current = game;
		const data = game.getSavedData();
		setSavedData(data);
		setSelectedVehicle(data.selectedVehicle);
	}, []);

	useEffect(() => {
		initGame();
		return () => {
			gameRef.current?.destroy();
		};
	}, [initGame]);

	// Distance count-up on game over
	useEffect(() => {
		if (gameState !== "game-over" || !stats) return;
		const target = stats.distance;
		const start = performance.now();
		let frameId: number;
		const animate = (now: number) => {
			const progress = Math.min(1, (now - start) / 1200);
			setDisplayDistance(Math.floor(target * (1 - (1 - progress) ** 3)));
			if (progress < 1) frameId = requestAnimationFrame(animate);
		};
		frameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frameId);
	}, [gameState, stats]);

	const handleStart = () => {
		setIsNewRecord(false);
		// Save selected vehicle
		const data = gameRef.current?.getSavedData();
		if (data) {
			data.selectedVehicle = selectedVehicle;
			try {
				localStorage.setItem("neonRacers", JSON.stringify(data));
			} catch {}
		}
		gameRef.current?.start(selectedVehicle);
	};

	const cycleVehicle = (dir: number) => {
		const idx = vehicleIds.indexOf(selectedVehicle);
		const next = vehicleIds[(idx + dir + vehicleIds.length) % vehicleIds.length];
		setSelectedVehicle(next);
	};

	const isUnlocked = (id: VehicleId) =>
		savedData?.unlockedVehicles.includes(id) ?? id === "sportcar";

	const handleMute = () => {
		const m = gameRef.current?.toggleMute();
		setMuted(!!m);
	};
	const handleHome = () => {
		gameRef.current?.destroy();
		window.location.href = "/";
	};
	const handleRestart = () => {
		setIsNewRecord(false);
		gameRef.current?.start(selectedVehicle);
	};
	const handleMenu = () => {
		setGameState("menu");
		const data = gameRef.current?.getSavedData();
		if (data) setSavedData(data);
	};

	const v = VEHICLES[selectedVehicle];

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
				animation: crashShake ? "crashShake 0.3s ease" : "none",
				"@keyframes crashShake": {
					"0%, 100%": { transform: "translateX(0)" },
					"20%": { transform: "translateX(-6px)" },
					"40%": { transform: "translateX(6px)" },
					"60%": { transform: "translateX(-4px)" },
					"80%": { transform: "translateX(3px)" },
				},
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
				style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
			/>

			{/* Near miss flash */}
			{nearMissFlash && (
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						bgcolor: "rgba(0, 240, 255, 0.15)",
						pointerEvents: "none",
						animation: "flashOut 0.2s ease-out forwards",
						"@keyframes flashOut": { to: { opacity: 0 } },
					}}
				/>
			)}

			{/* Zone change text */}
			{zoneText && (
				<Box
					sx={{
						position: "absolute",
						top: "15%",
						left: 0,
						right: 0,
						textAlign: "center",
						pointerEvents: "none",
						animation: `zoneIn 2s ${easeOutQuart}`,
						"@keyframes zoneIn": {
							"0%": { opacity: 0, transform: "scale(1.3)" },
							"20%": { opacity: 1, transform: "scale(1)" },
							"80%": { opacity: 1 },
							"100%": { opacity: 0 },
						},
					}}
				>
					<Typography
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontSize: "1.4rem",
							color: "#00F0FF",
							fontWeight: 700,
							textShadow: "0 0 20px rgba(0,240,255,0.5)",
						}}
					>
						{zoneText}
					</Typography>
				</Box>
			)}

			{/* === HUD === */}
			{gameState === "playing" && stats && (
				<>
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
						<Box>
							<Typography
								sx={{
									fontFamily: "var(--font-orbitron)",
									fontSize: "1.1rem",
									color: "#EAEAEA",
									fontWeight: 700,
								}}
							>
								{stats.speed}{" "}
								<Typography component="span" sx={{ fontSize: "0.6rem", color: "#9E9E9E" }}>
									km/h
								</Typography>
							</Typography>
						</Box>
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.85rem",
								color: "#00F0FF",
								fontWeight: 700,
							}}
						>
							{stats.distance.toLocaleString()}m
						</Typography>
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.85rem",
								color: "#FFD700",
								fontWeight: 700,
							}}
						>
							🪙 {stats.coins}
						</Typography>
					</Box>

					{/* Combo */}
					{stats.combo > 1 && (
						<Typography
							sx={{
								position: "absolute",
								top: 44,
								right: 16,
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.9rem",
								color: stats.combo >= 4 ? "#FFD700" : stats.combo >= 3 ? "#FF00E5" : "#00F0FF",
								fontWeight: 700,
								pointerEvents: "none",
								animation: "comboPulse 0.5s ease-in-out infinite",
								"@keyframes comboPulse": {
									"0%, 100%": { transform: "scale(1)" },
									"50%": { transform: "scale(1.15)" },
								},
							}}
						>
							x{stats.combo} COMBO
						</Typography>
					)}

					{/* Crashes left */}
					<Box
						sx={{
							position: "absolute",
							bottom: 16,
							left: "50%",
							transform: "translateX(-50%)",
							display: "flex",
							gap: 0.5,
							pointerEvents: "none",
						}}
					>
						{Array.from({ length: stats.crashesLeft }).map((_, i) => (
							<Typography key={`crash-${i}`} sx={{ fontSize: "1rem", color: "#FF3131" }}>
								♥
							</Typography>
						))}
					</Box>

					{/* Power-up */}
					{stats.activePowerUp && (
						<Box
							sx={{
								position: "absolute",
								bottom: 16,
								left: 16,
								display: "flex",
								alignItems: "center",
								gap: 1,
								bgcolor: "rgba(0,0,0,0.5)",
								borderRadius: 1,
								px: 1.5,
								py: 0.5,
								pointerEvents: "none",
								animation: `slideInLeft 0.3s ${easeOutQuart}`,
								"@keyframes slideInLeft": {
									from: { transform: "translateX(-20px)", opacity: 0 },
									to: { transform: "translateX(0)", opacity: 1 },
								},
							}}
						>
							<Typography sx={{ fontSize: "0.7rem", color: "#EAEAEA", fontWeight: 600 }}>
								{stats.activePowerUp.type}
							</Typography>
							<Box sx={{ width: 40, height: 3, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
								<Box
									sx={{
										height: "100%",
										width: `${(stats.activePowerUp.remaining / stats.activePowerUp.duration) * 100}%`,
										bgcolor: "#00F0FF",
										borderRadius: 2,
										transition: "width 0.1s linear",
									}}
								/>
							</Box>
						</Box>
					)}

					{/* Controls */}
					<Box sx={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 1 }}>
						<IconButton
							onClick={handleMute}
							size="small"
							sx={{ color: "#9E9E9E", bgcolor: "rgba(0,0,0,0.4)", ...btnSx }}
						>
							{muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
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
						bgcolor: "rgba(10, 10, 15, 0.92)",
						gap: 2,
						animation: `menuIn 0.6s ${easeOutQuart}`,
						"@keyframes menuIn": { from: { opacity: 0 }, to: { opacity: 1 } },
					}}
				>
					<Typography
						variant="h2"
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontWeight: 900,
							fontSize: "clamp(2rem, 6vw, 3rem)",
							background: "linear-gradient(135deg, #00F0FF, #FF00E5)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							animation: `titleEntry 0.8s ${easeOutQuart} 0.1s both`,
							"@keyframes titleEntry": {
								from: { transform: "translateY(-20px)", opacity: 0 },
								to: { transform: "translateY(0)", opacity: 1 },
							},
						}}
					>
						NEON RACERS
					</Typography>
					<Typography sx={{ color: "#9E9E9E", fontStyle: "italic", fontSize: "1rem" }}>
						Outrun the light.
					</Typography>

					{/* Vehicle selector */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
						<IconButton onClick={() => cycleVehicle(-1)} sx={{ color: "#9E9E9E", ...btnSx }}>
							<NavigateBeforeIcon />
						</IconButton>
						<Box sx={{ textAlign: "center", minWidth: 140 }}>
							<Typography
								sx={{
									fontFamily: "var(--font-orbitron)",
									fontSize: "1rem",
									fontWeight: 700,
									color: isUnlocked(selectedVehicle) ? v.color : "#555",
								}}
							>
								{v.name}
							</Typography>
							{/* Stats bars */}
							{["Speed", "Handling", "Durability"].map((stat, si) => {
								const vals = [
									v.speedMult / 1.3,
									("handling" in v ? v.handling : 1) / 1.2,
									v.maxCrashes / 5,
								];
								return (
									<Box key={stat} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
										<Typography
											sx={{ fontSize: "0.6rem", color: "#9E9E9E", width: 55, textAlign: "right" }}
										>
											{stat}
										</Typography>
										<Box
											sx={{
												width: 60,
												height: 4,
												bgcolor: "rgba(255,255,255,0.1)",
												borderRadius: 2,
											}}
										>
											<Box
												sx={{
													height: "100%",
													width: `${vals[si] * 100}%`,
													bgcolor: v.color,
													borderRadius: 2,
													transition: "width 0.3s ease",
												}}
											/>
										</Box>
									</Box>
								);
							})}
							{!isUnlocked(selectedVehicle) && (
								<Typography sx={{ fontSize: "0.75rem", color: "#FFD700", mt: 1 }}>
									🔒 {v.cost.toLocaleString()} coins
								</Typography>
							)}
						</Box>
						<IconButton onClick={() => cycleVehicle(1)} sx={{ color: "#9E9E9E", ...btnSx }}>
							<NavigateNextIcon />
						</IconButton>
					</Box>

					{isUnlocked(selectedVehicle) ? (
						<Typography
							onClick={handleStart}
							sx={{
								color: "#00F0FF",
								fontFamily: "var(--font-orbitron)",
								fontSize: "0.9rem",
								mt: 3,
								cursor: "pointer",
								animation: "pulse 2s ease-in-out infinite",
								"@keyframes pulse": { "0%, 100%": { opacity: 0.5 }, "50%": { opacity: 1 } },
							}}
						>
							TAP TO RACE
						</Typography>
					) : (
						<Typography
							sx={{ color: "#555", fontFamily: "var(--font-orbitron)", fontSize: "0.8rem", mt: 3 }}
						>
							LOCKED — earn more coins
						</Typography>
					)}

					{savedData && savedData.bestDistance > 0 && (
						<Typography sx={{ color: "#9E9E9E", fontSize: "0.75rem" }}>
							Best: {savedData.bestDistance.toLocaleString()}m | Coins:{" "}
							{savedData.totalCoins.toLocaleString()}
						</Typography>
					)}

					<IconButton
						onClick={handleHome}
						sx={{ position: "absolute", top: 16, left: 16, color: "#9E9E9E", ...btnSx }}
					>
						<HomeIcon />
					</IconButton>
				</Box>
			)}

			{/* === GAME OVER === */}
			{gameState === "game-over" && stats && (
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
						animation: `fadeIn 0.5s ${easeOutQuart}`,
						"@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
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
								"0%": { transform: "scale(2)", opacity: 0 },
								"60%": { transform: "scale(0.95)" },
								"100%": { transform: "scale(1)" },
							},
						}}
					>
						GAME OVER
					</Typography>

					{isNewRecord && (
						<Typography
							sx={{
								fontFamily: "var(--font-orbitron)",
								color: "#FFD700",
								fontSize: "1rem",
								fontWeight: 700,
								animation: "newRecord 1s ease-in-out infinite",
								"@keyframes newRecord": {
									"0%, 100%": { opacity: 0.7, textShadow: "0 0 10px rgba(255,215,0,0.3)" },
									"50%": { opacity: 1, textShadow: "0 0 25px rgba(255,215,0,0.8)" },
								},
							}}
						>
							NEW RECORD!
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
						{displayDistance.toLocaleString()}m
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
							"@keyframes fadeUp": {
								from: { transform: "translateY(15px)", opacity: 0 },
								to: { transform: "translateY(0)", opacity: 1 },
							},
						}}
					>
						{[
							{ label: "Score", value: stats.score.toLocaleString() },
							{ label: "Overtakes", value: stats.overtakes },
							{ label: "Near Misses", value: stats.nearMisses },
							{ label: "Coins", value: `+${stats.coins}` },
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
								onClick: handleMenu,
								color: "#9E9E9E",
								bg: "rgba(255,255,255,0.05)",
								icon: <HomeIcon sx={{ mr: 0.5 }} />,
								label: "Menu",
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
									...btnSx,
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
