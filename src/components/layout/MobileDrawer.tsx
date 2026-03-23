"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

interface MobileDrawerProps {
	open: boolean;
	onClose: () => void;
	navLinks: { label: string; href: string }[];
	onNavClick: (href: string) => void;
}

export default function MobileDrawer({ open, onClose, navLinks, onNavClick }: MobileDrawerProps) {
	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: "100%",
					maxWidth: 320,
					background: "rgba(10, 10, 15, 0.95)",
					backdropFilter: "blur(20px)",
					borderLeft: "1px solid rgba(0, 240, 255, 0.1)",
				},
			}}
		>
			<Box sx={{ p: 3 }}>
				<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 4 }}>
					<IconButton
						onClick={onClose}
						aria-label="Close navigation menu"
						sx={{ color: "text.primary" }}
					>
						<CloseIcon />
					</IconButton>
				</Box>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
					{navLinks.map((link) => (
						<Box
							key={link.href}
							component="button"
							onClick={() => onNavClick(link.href)}
							sx={{
								background: "none",
								border: "none",
								textAlign: "left",
								cursor: "pointer",
								py: 1.5,
								px: 2,
								borderRadius: 1,
								transition: "all 0.2s ease",
								"&:hover": {
									background: "rgba(0, 240, 255, 0.08)",
								},
							}}
						>
							<Typography
								variant="h4"
								sx={{
									fontFamily: "var(--font-orbitron)",
									color: "text.primary",
									fontWeight: 600,
									"&:hover": { color: "#00F0FF" },
								}}
							>
								{link.label}
							</Typography>
						</Box>
					))}
				</Box>
			</Box>
		</Drawer>
	);
}
