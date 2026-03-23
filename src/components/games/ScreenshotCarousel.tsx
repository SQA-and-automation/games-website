"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useRef, useState } from "react";
import type { GameScreenshot } from "@/types/game";

interface ScreenshotCarouselProps {
	screenshots: GameScreenshot[];
	accentColor: string;
}

export default function ScreenshotCarousel({ screenshots, accentColor }: ScreenshotCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	const scrollTo = (index: number) => {
		const container = scrollRef.current;
		if (!container) return;
		const children = container.children;
		if (children[index]) {
			(children[index] as HTMLElement).scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
			setActiveIndex(index);
		}
	};

	const handleScroll = () => {
		const container = scrollRef.current;
		if (!container) return;
		const scrollLeft = container.scrollLeft;
		const childWidth = container.children[0]?.clientWidth || 1;
		const gap = 16;
		const index = Math.round(scrollLeft / (childWidth + gap));
		setActiveIndex(Math.min(index, screenshots.length - 1));
	};

	return (
		<Box sx={{ position: "relative" }}>
			{/* Carousel container */}
			<Box
				ref={scrollRef}
				onScroll={handleScroll}
				sx={{
					display: "flex",
					gap: 2,
					overflowX: "auto",
					scrollSnapType: "x mandatory",
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": { display: "none" },
					pb: 1,
				}}
			>
				{screenshots.map((screenshot, i) => (
					<Box
						key={screenshot.src}
						sx={{
							minWidth: { xs: "85%", md: "70%" },
							scrollSnapAlign: "center",
							flexShrink: 0,
							borderRadius: 2,
							overflow: "hidden",
							border: i === activeIndex ? `2px solid ${accentColor}60` : "2px solid transparent",
							transition: "border-color 0.3s ease",
						}}
					>
						<Box
							component="img"
							src={screenshot.src}
							alt={screenshot.alt}
							sx={{
								width: "100%",
								height: "auto",
								aspectRatio: "16/9",
								objectFit: "cover",
								display: "block",
							}}
						/>
					</Box>
				))}
			</Box>

			{/* Nav arrows */}
			{screenshots.length > 1 && (
				<>
					<IconButton
						onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
						aria-label="Previous screenshot"
						sx={{
							position: "absolute",
							left: -16,
							top: "50%",
							transform: "translateY(-50%)",
							bgcolor: "rgba(10,10,15,0.8)",
							color: accentColor,
							"&:hover": { bgcolor: "rgba(10,10,15,0.95)" },
							display: { xs: "none", md: "flex" },
						}}
					>
						<ChevronLeftIcon />
					</IconButton>
					<IconButton
						onClick={() => scrollTo(Math.min(screenshots.length - 1, activeIndex + 1))}
						aria-label="Next screenshot"
						sx={{
							position: "absolute",
							right: -16,
							top: "50%",
							transform: "translateY(-50%)",
							bgcolor: "rgba(10,10,15,0.8)",
							color: accentColor,
							"&:hover": { bgcolor: "rgba(10,10,15,0.95)" },
							display: { xs: "none", md: "flex" },
						}}
					>
						<ChevronRightIcon />
					</IconButton>
				</>
			)}

			{/* Dots */}
			<Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
				{screenshots.map((_, i) => (
					<Box
						key={`dot-${screenshots[i].src}`}
						onClick={() => scrollTo(i)}
						sx={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							bgcolor: i === activeIndex ? accentColor : "rgba(255,255,255,0.2)",
							cursor: "pointer",
							transition: "all 0.3s ease",
							boxShadow: i === activeIndex ? `0 0 8px ${accentColor}60` : "none",
						}}
					/>
				))}
			</Box>
		</Box>
	);
}
