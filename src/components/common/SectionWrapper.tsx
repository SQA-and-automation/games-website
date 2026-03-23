import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface SectionWrapperProps {
	id: string;
	children: ReactNode;
	sx?: SxProps<Theme>;
	maxWidth?: "sm" | "md" | "lg" | "xl";
	disableContainer?: boolean;
}

export default function SectionWrapper({
	id,
	children,
	sx,
	maxWidth = "lg",
	disableContainer,
}: SectionWrapperProps) {
	const content = disableContainer ? (
		children
	) : (
		<Container maxWidth={maxWidth}>{children}</Container>
	);

	return (
		<Box
			component="section"
			id={id}
			sx={{
				py: { xs: 8, md: 12 },
				scrollMarginTop: "80px",
				position: "relative",
				...sx,
			}}
		>
			{content}
		</Box>
	);
}
