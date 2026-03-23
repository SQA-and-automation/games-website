import AppleIcon from "@mui/icons-material/Apple";
import ShopIcon from "@mui/icons-material/Shop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { GameLinks } from "@/types/game";

interface StoreButtonsProps {
	links: GameLinks;
	accentColor: string;
}

export default function StoreButtons({ links, accentColor }: StoreButtonsProps) {
	return (
		<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
			{links.appStore && (
				<Button
					href={links.appStore}
					target="_blank"
					rel="noopener noreferrer"
					startIcon={<AppleIcon />}
					variant="outlined"
					sx={{
						borderColor: `${accentColor}40`,
						color: accentColor,
						fontFamily: "var(--font-exo2)",
						textTransform: "none",
						fontWeight: 600,
						"&:hover": {
							borderColor: accentColor,
							bgcolor: `${accentColor}10`,
						},
					}}
				>
					App Store
				</Button>
			)}
			{links.googlePlay && (
				<Button
					href={links.googlePlay}
					target="_blank"
					rel="noopener noreferrer"
					startIcon={<ShopIcon />}
					variant="outlined"
					sx={{
						borderColor: `${accentColor}40`,
						color: accentColor,
						fontFamily: "var(--font-exo2)",
						textTransform: "none",
						fontWeight: 600,
						"&:hover": {
							borderColor: accentColor,
							bgcolor: `${accentColor}10`,
						},
					}}
				>
					Google Play
				</Button>
			)}
		</Box>
	);
}
