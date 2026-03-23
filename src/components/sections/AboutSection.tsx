"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SectionWrapper from "@/components/common/SectionWrapper";
import GlowText from "@/components/effects/GlowText";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

const stats = [
	{ value: 4, suffix: "", label: "Games" },
	{ value: 4.8, suffix: "M+", label: "Downloads" },
	{ value: 4.5, suffix: "", label: "Avg Rating" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
	const [count, setCount] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true });
	const isDecimal = target % 1 !== 0;

	useEffect(() => {
		if (!isInView) return;

		const duration = 1500;
		const steps = 60;
		const stepTime = duration / steps;
		let current = 0;
		const increment = target / steps;

		const timer = setInterval(() => {
			current += increment;
			if (current >= target) {
				setCount(target);
				clearInterval(timer);
			} else {
				setCount(current);
			}
		}, stepTime);

		return () => clearInterval(timer);
	}, [isInView, target]);

	return (
		<span ref={ref}>
			{isDecimal ? count.toFixed(1) : Math.floor(count)}
			{suffix}
		</span>
	);
}

export default function AboutSection() {
	return (
		<SectionWrapper id="about">
			<MotionBox
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
				sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
			>
				<MotionBox variants={fadeInUp}>
					<GlowText variant="h2" glowColor="#00F0FF" intensity="medium">
						About Us
					</GlowText>
				</MotionBox>

				<MotionCard
					variants={fadeInUp}
					sx={{
						maxWidth: 800,
						p: { xs: 3, md: 5 },
						background: "rgba(18, 18, 26, 0.6)",
						backdropFilter: "blur(16px)",
						border: "1px solid rgba(0, 240, 255, 0.08)",
					}}
				>
					<Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", mb: 4 }}>
						ELLIXMMER is an independent game studio dedicated to crafting bold, unforgettable
						mobile experiences. We believe games should be more than entertainment — they should
						be adventures that stay with you. From high-speed racers to epic RPGs, every game
						we create pushes the boundaries of what&apos;s possible on mobile.
					</Typography>

					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							gap: { xs: 4, md: 8 },
							flexWrap: "wrap",
						}}
					>
						{stats.map((stat) => (
							<Box key={stat.label} sx={{ textAlign: "center" }}>
								<Typography
									variant="h3"
									sx={{
										color: "#00F0FF",
										fontFamily: "var(--font-orbitron)",
										fontWeight: 900,
									}}
								>
									<CountUp target={stat.value} suffix={stat.suffix} />
								</Typography>
								<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
									{stat.label}
								</Typography>
							</Box>
						))}
					</Box>
				</MotionCard>
			</MotionBox>
		</SectionWrapper>
	);
}
