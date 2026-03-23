import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";

interface GlowTextProps extends Omit<TypographyProps, "children"> {
	children: ReactNode;
	glowColor?: string;
	intensity?: "low" | "medium" | "high";
}

const glowIntensities = {
	low: (color: string) =>
		`0 0 7px ${color}, 0 0 10px ${color}`,
	medium: (color: string) =>
		`0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}`,
	high: (color: string) =>
		`0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}, 0 0 42px ${color}`,
};

export default function GlowText({
	children,
	glowColor = "#00F0FF",
	intensity = "high",
	sx,
	...props
}: GlowTextProps) {
	return (
		<Typography
			sx={{
				textShadow: glowIntensities[intensity](glowColor),
				color: glowColor,
				...sx,
			}}
			{...props}
		>
			{children}
		</Typography>
	);
}
