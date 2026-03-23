import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

const socialLinks = [
	{ icon: <XIcon />, label: "X (Twitter)", href: "#" },
	{ icon: <InstagramIcon />, label: "Instagram", href: "#" },
	{ icon: <YouTubeIcon />, label: "YouTube", href: "#" },
];

export default function Footer() {
	return (
		<Box
			component="footer"
			sx={{
				position: "relative",
				py: 4,
				"&::before": {
					content: '""',
					position: "absolute",
					top: 0,
					left: "10%",
					right: "10%",
					height: "1px",
					background:
						"linear-gradient(90deg, transparent, #00F0FF40, #7B61FF40, #FF00E540, transparent)",
				},
			}}
		>
			<Container maxWidth="lg">
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						alignItems: "center",
						justifyContent: "space-between",
						gap: 3,
					}}
				>
					<Typography
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontWeight: 700,
							fontSize: "1rem",
							letterSpacing: "0.1em",
							color: "#00F0FF",
							textShadow: "0 0 8px rgba(0, 240, 255, 0.3)",
						}}
					>
						ELLIXMMER
					</Typography>

					<Box sx={{ display: "flex", gap: 1 }}>
						{socialLinks.map((link) => (
							<IconButton
								key={link.label}
								aria-label={link.label}
								href={link.href}
								sx={{
									color: "text.secondary",
									transition: "all 0.3s ease",
									"&:hover": {
										color: "#00F0FF",
										transform: "translateY(-2px)",
									},
								}}
							>
								{link.icon}
							</IconButton>
						))}
					</Box>

					<Typography variant="body2" sx={{ color: "text.secondary" }}>
						&copy; {new Date().getFullYear()} ELLIXMMER. All rights reserved.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
}
