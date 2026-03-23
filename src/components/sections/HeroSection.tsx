"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import GlowText from "@/components/effects/GlowText";
import NeonButton from "@/components/effects/NeonButton";
import { heroItem, heroStagger } from "@/lib/animations";

const MotionBox = motion.create(Box);

export default function HeroSection() {
	const handleExplore = () => {
		document.querySelector("#games")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<Box
			component="section"
			id="hero"
			sx={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Gradient overlay for content readability */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse at center, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.8) 70%)",
					zIndex: 1,
				}}
			/>

			<MotionBox
				variants={heroStagger}
				initial="hidden"
				animate="visible"
				sx={{
					position: "relative",
					zIndex: 2,
					textAlign: "center",
					px: 3,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 3,
				}}
			>
				<MotionBox variants={heroItem}>
					<GlowText
						variant="h1"
						glowColor="#00F0FF"
						intensity="high"
					>
						ELLIXMMER
					</GlowText>
				</MotionBox>

				<MotionBox variants={heroItem}>
					<Typography
						variant="h5"
						sx={{
							color: "text.secondary",
							fontWeight: 300,
							maxWidth: 500,
							letterSpacing: "0.15em",
							textTransform: "uppercase",
						}}
					>
						Crafting Mobile Adventures
					</Typography>
				</MotionBox>

				<MotionBox variants={heroItem} sx={{ mt: 2 }}>
					<NeonButton onClick={handleExplore}>
						Explore Our Games
					</NeonButton>
				</MotionBox>

				{/* Scroll indicator */}
				<MotionBox
					variants={heroItem}
					sx={{ mt: 6 }}
				>
					<Box
						sx={{
							width: 24,
							height: 40,
							border: "2px solid rgba(0, 240, 255, 0.3)",
							borderRadius: 12,
							display: "flex",
							justifyContent: "center",
							pt: 1,
						}}
					>
						<Box
							sx={{
								width: 4,
								height: 8,
								borderRadius: 2,
								bgcolor: "#00F0FF",
								"@keyframes scrollBounce": {
									"0%, 100%": { transform: "translateY(0)", opacity: 1 },
									"50%": { transform: "translateY(12px)", opacity: 0.3 },
								},
								animation: "scrollBounce 2s ease-in-out infinite",
								"@media (prefers-reduced-motion: reduce)": {
									animation: "none",
								},
							}}
						/>
					</Box>
				</MotionBox>
			</MotionBox>
		</Box>
	);
}
