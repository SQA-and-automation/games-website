"use client";

import Box from "@mui/material/Box";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SectionWrapper from "@/components/common/SectionWrapper";
import GlowText from "@/components/effects/GlowText";
import GameCard from "@/components/games/GameCard";
import GameModal from "@/components/games/GameModal";
import { games } from "@/data/games";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { Game } from "@/types/game";

const MotionBox = motion.create(Box);

export default function GamesGallery() {
	const [selectedGame, setSelectedGame] = useState<Game | null>(null);
	const router = useRouter();

	const handleGameClick = (game: Game) => {
		if (game.playable) {
			router.push(`/play/${game.id}`);
		} else {
			setSelectedGame(game);
		}
	};

	return (
		<SectionWrapper id="games">
			<MotionBox
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
				sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
			>
				<MotionBox variants={fadeInUp}>
					<GlowText variant="h2" glowColor="#00F0FF" intensity="medium">
						Our Games
					</GlowText>
				</MotionBox>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							sm: "repeat(2, 1fr)",
							md: "repeat(4, 1fr)",
						},
						gap: 3,
						width: "100%",
					}}
				>
					{games.map((game) => (
						<MotionBox
							key={game.id}
							variants={fadeInUp}
							sx={{
								gridColumn: {
									xs: "span 1",
									md: game.featured ? "span 2" : "span 1",
								},
							}}
						>
							<GameCard game={game} onClick={() => handleGameClick(game)} />
						</MotionBox>
					))}
				</Box>
			</MotionBox>

			<GameModal game={selectedGame} open={!!selectedGame} onClose={() => setSelectedGame(null)} />
		</SectionWrapper>
	);
}
