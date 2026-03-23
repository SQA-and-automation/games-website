"use client";

import { useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import type { Game } from "@/types/game";

const MotionCard = motion.create(Card);

interface GameCardProps {
	game: Game;
	onClick: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const card = cardRef.current;
			if (!card) return;
			const rect = card.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;
			card.style.setProperty("--mouse-x", `${x}%`);
			card.style.setProperty("--mouse-y", `${y}%`);

			const rotateX = ((y - 50) / 50) * -5;
			const rotateY = ((x - 50) / 50) * 5;
			card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
		},
		[],
	);

	const handleMouseLeave = useCallback(() => {
		const card = cardRef.current;
		if (!card) return;
		card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
	}, []);

	return (
		<MotionCard
			ref={cardRef}
			onClick={onClick}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			layoutId={`game-card-${game.id}`}
			sx={{
				cursor: "pointer",
				position: "relative",
				overflow: "hidden",
				height: "100%",
				minHeight: { xs: 280, md: game.featured ? 320 : 280 },
				background: "rgba(18, 18, 26, 0.6)",
				backdropFilter: "blur(12px)",
				border: "1px solid rgba(255,255,255,0.06)",
				transition: "box-shadow 0.3s ease, transform 0.15s ease",
				willChange: "transform",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: -1,
					borderRadius: "inherit",
					padding: "1px",
					background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${game.accentColor}60, transparent 60%)`,
					mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
					maskComposite: "exclude",
					pointerEvents: "none",
					opacity: 0,
					transition: "opacity 0.3s ease",
				},
				"&:hover::before": {
					opacity: 1,
				},
				"&:hover": {
					boxShadow: `0 0 30px ${game.accentColor}20, 0 4px 20px rgba(0,0,0,0.3)`,
				},
			}}
		>
			{/* Game icon area */}
			<Box
				sx={{
					height: { xs: 140, md: game.featured ? 180 : 140 },
					background: `linear-gradient(135deg, ${game.accentColor}15, ${game.accentColor}05)`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden",
				}}
			>
				<Box
					component="img"
					src={game.icon}
					alt={`${game.name} icon`}
					sx={{
						width: { xs: 80, md: game.featured ? 100 : 80 },
						height: { xs: 80, md: game.featured ? 100 : 80 },
						borderRadius: 3,
						boxShadow: `0 0 20px ${game.accentColor}30`,
					}}
				/>
				{/* Decorative gradient edge */}
				<Box
					sx={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 40,
						background: "linear-gradient(transparent, rgba(18,18,26,0.6))",
					}}
				/>
			</Box>

			<CardContent sx={{ position: "relative" }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
					<Typography
						variant="h4"
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontWeight: 700,
							fontSize: game.featured ? "1.3rem" : "1.1rem",
							color: "text.primary",
						}}
					>
						{game.name}
					</Typography>
				</Box>

				<Chip
					label={game.genre}
					size="small"
					sx={{
						mb: 1.5,
						bgcolor: `${game.accentColor}20`,
						color: game.accentColor,
						border: `1px solid ${game.accentColor}40`,
						fontWeight: 600,
						fontSize: "0.7rem",
					}}
				/>

				<Typography
					variant="body2"
					sx={{
						color: "text.secondary",
						fontStyle: "italic",
						letterSpacing: "0.02em",
					}}
				>
					{game.tagline}
				</Typography>
			</CardContent>
		</MotionCard>
	);
}
