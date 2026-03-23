"use client";

import { useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import StarIcon from "@mui/icons-material/Star";
import { AnimatePresence, motion } from "framer-motion";
import ScreenshotCarousel from "./ScreenshotCarousel";
import StoreButtons from "./StoreButtons";
import { modalContent, modalOverlay } from "@/lib/animations";
import type { Game } from "@/types/game";

const MotionBox = motion.create(Box);

interface GameModalProps {
	game: Game | null;
	open: boolean;
	onClose: () => void;
}

export default function GameModal({ game, open, onClose }: GameModalProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (open) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [open, handleKeyDown]);

	return (
		<AnimatePresence>
			{open && game && (
				<MotionBox
					variants={modalOverlay}
					initial="hidden"
					animate="visible"
					exit="exit"
					onClick={onClose}
					sx={{
						position: "fixed",
						inset: 0,
						zIndex: 1300,
						bgcolor: "rgba(0, 0, 0, 0.85)",
						backdropFilter: "blur(8px)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						p: { xs: 2, md: 4 },
					}}
				>
					<MotionBox
						variants={modalContent}
						initial="hidden"
						animate="visible"
						exit="exit"
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
						layoutId={`game-card-${game.id}`}
						sx={{
							width: "100%",
							maxWidth: 800,
							maxHeight: "90vh",
							overflowY: "auto",
							bgcolor: "rgba(18, 18, 26, 0.95)",
							backdropFilter: "blur(20px)",
							borderRadius: 3,
							border: `1px solid ${game.accentColor}20`,
							boxShadow: `0 0 40px ${game.accentColor}15, 0 8px 32px rgba(0,0,0,0.5)`,
							scrollbarWidth: "thin",
							scrollbarColor: `${game.accentColor}40 transparent`,
						}}
					>
						{/* Header */}
						<Box
							sx={{
								position: "sticky",
								top: 0,
								zIndex: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: { xs: 2, md: 3 },
								bgcolor: "rgba(18, 18, 26, 0.9)",
								backdropFilter: "blur(12px)",
								borderBottom: `1px solid ${game.accentColor}10`,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
								<Box
									component="img"
									src={game.icon}
									alt={`${game.name} icon`}
									sx={{
										width: 56,
										height: 56,
										borderRadius: 2,
										boxShadow: `0 0 15px ${game.accentColor}30`,
									}}
								/>
								<Box>
									<Typography
										variant="h4"
										sx={{
											fontFamily: "var(--font-orbitron)",
											fontWeight: 700,
											color: "text.primary",
										}}
									>
										{game.name}
									</Typography>
									<Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
										<Chip
											label={game.genre}
											size="small"
											sx={{
												bgcolor: `${game.accentColor}20`,
												color: game.accentColor,
												border: `1px solid ${game.accentColor}40`,
												fontWeight: 600,
												fontSize: "0.7rem",
											}}
										/>
									</Box>
								</Box>
							</Box>
							<IconButton
								onClick={onClose}
								aria-label="Close game details"
								sx={{
									color: "text.secondary",
									"&:hover": { color: "text.primary" },
								}}
							>
								<CloseIcon />
							</IconButton>
						</Box>

						{/* Content */}
						<Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
							{/* Screenshots */}
							<ScreenshotCarousel
								screenshots={game.screenshots}
								accentColor={game.accentColor}
							/>

							{/* Stats row */}
							<Box
								sx={{
									display: "flex",
									gap: 3,
									flexWrap: "wrap",
									alignItems: "center",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Rating
										value={game.rating}
										precision={0.1}
										readOnly
										size="small"
										icon={<StarIcon sx={{ color: game.accentColor }} fontSize="inherit" />}
										emptyIcon={<StarIcon sx={{ color: "rgba(255,255,255,0.15)" }} fontSize="inherit" />}
									/>
									<Typography variant="body2" sx={{ color: game.accentColor, fontWeight: 700 }}>
										{game.rating}
									</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<DownloadIcon sx={{ fontSize: 18, color: "text.secondary" }} />
									<Typography variant="body2" sx={{ color: "text.secondary" }}>
										{game.downloads} downloads
									</Typography>
								</Box>
								<Typography variant="body2" sx={{ color: "text.secondary" }}>
									Released {game.releaseYear}
								</Typography>
							</Box>

							{/* Description */}
							<Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
								{game.description}
							</Typography>

							{/* Trailer */}
							{game.trailerUrl && (
								<Box
									sx={{
										position: "relative",
										width: "100%",
										paddingTop: "56.25%",
										borderRadius: 2,
										overflow: "hidden",
										border: `1px solid ${game.accentColor}15`,
									}}
								>
									<Box
										component="iframe"
										src={game.trailerUrl}
										title={`${game.name} trailer`}
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
										loading="lazy"
										sx={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: "100%",
											border: "none",
										}}
									/>
								</Box>
							)}

							{/* Store buttons */}
							<StoreButtons links={game.links} accentColor={game.accentColor} />
						</Box>
					</MotionBox>
				</MotionBox>
			)}
		</AnimatePresence>
	);
}
