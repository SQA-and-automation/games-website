"use client";

import { useCallback, useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MobileDrawer from "./MobileDrawer";

const navLinks = [
	{ label: "Games", href: "#games" },
	{ label: "About", href: "#about" },
];

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 50);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleNavClick = useCallback((href: string) => {
		const el = document.querySelector(href);
		el?.scrollIntoView({ behavior: "smooth" });
		setDrawerOpen(false);
	}, []);

	return (
		<>
			<AppBar
				position="fixed"
				sx={{
					background: scrolled
						? "rgba(10, 10, 15, 0.85)"
						: "rgba(10, 10, 15, 0.4)",
					backdropFilter: "blur(12px)",
					borderBottom: scrolled
						? "1px solid rgba(0, 240, 255, 0.12)"
						: "1px solid transparent",
					transition: "all 0.3s ease",
					zIndex: theme.zIndex.appBar,
				}}
			>
				<Toolbar sx={{ justifyContent: "space-between", maxWidth: "lg", mx: "auto", width: "100%", px: { xs: 2, md: 4 } }}>
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-orbitron)",
							fontWeight: 900,
							letterSpacing: "0.1em",
							color: "#00F0FF",
							textShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
							cursor: "pointer",
						}}
						onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					>
						ELLIXMMER
					</Typography>

					{isMobile ? (
						<IconButton
							aria-label="Open navigation menu"
							onClick={() => setDrawerOpen(true)}
							sx={{ color: "text.primary" }}
						>
							<MenuIcon />
						</IconButton>
					) : (
						<Box sx={{ display: "flex", gap: 4 }}>
							{navLinks.map((link) => (
								<Box
									key={link.href}
									component="button"
									onClick={() => handleNavClick(link.href)}
									sx={{
										background: "none",
										border: "none",
										color: "text.primary",
										fontFamily: "var(--font-exo2)",
										fontSize: "0.95rem",
										fontWeight: 500,
										cursor: "pointer",
										position: "relative",
										py: 0.5,
										"&::after": {
											content: '""',
											position: "absolute",
											bottom: 0,
											left: "50%",
											width: 0,
											height: "2px",
											background: "#00F0FF",
											transition: "all 0.3s ease",
											transform: "translateX(-50%)",
											boxShadow: "0 0 8px rgba(0, 240, 255, 0.5)",
										},
										"&:hover::after": {
											width: "100%",
										},
										"&:hover": {
											color: "#00F0FF",
										},
									}}
								>
									{link.label}
								</Box>
							))}
						</Box>
					)}
				</Toolbar>
			</AppBar>

			<MobileDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				navLinks={navLinks}
				onNavClick={handleNavClick}
			/>
		</>
	);
}
