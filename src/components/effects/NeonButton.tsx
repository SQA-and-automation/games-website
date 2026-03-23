"use client";

import Box from "@mui/material/Box";
import type { ButtonProps } from "@mui/material/Button";
import Button from "@mui/material/Button";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface NeonButtonProps extends Omit<ButtonProps, "children"> {
	children: ReactNode;
	glowColor?: string;
}

const MotionBox = motion.create(Box);

export default function NeonButton({
	children,
	glowColor = "#00F0FF",
	sx,
	...props
}: NeonButtonProps) {
	return (
		<MotionBox
			whileHover={{ scale: 1.03 }}
			whileTap={{ scale: 0.97 }}
			sx={{ display: "inline-block" }}
		>
			<Button
				variant="contained"
				sx={{
					position: "relative",
					background: `linear-gradient(135deg, ${glowColor} 0%, #7B61FF 100%)`,
					color: "#0A0A0F",
					fontWeight: 700,
					fontSize: "1rem",
					px: 5,
					py: 1.5,
					boxShadow: `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20`,
					"&:hover": {
						boxShadow: `0 0 30px ${glowColor}60, 0 0 60px ${glowColor}30`,
						background: `linear-gradient(135deg, ${glowColor} 0%, #7B61FF 100%)`,
					},
					"@keyframes pulseGlow": {
						"0%, 100%": {
							boxShadow: `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20`,
						},
						"50%": {
							boxShadow: `0 0 25px ${glowColor}50, 0 0 50px ${glowColor}25`,
						},
					},
					animation: "pulseGlow 3s ease-in-out infinite",
					"@media (prefers-reduced-motion: reduce)": {
						animation: "none",
					},
					...sx,
				}}
				{...props}
			>
				{children}
			</Button>
		</MotionBox>
	);
}
