"use client";

import { createTheme } from "@mui/material/styles";

const headingFontFamily = "var(--font-orbitron), Orbitron, monospace";
const bodyFontFamily = "var(--font-exo2), 'Exo 2', Arial, sans-serif";

export const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#00F0FF",
			light: "#66F7FF",
			dark: "#00B8C4",
			contrastText: "#0A0A0F",
		},
		secondary: {
			main: "#FF00E5",
			light: "#FF66EE",
			dark: "#C400B0",
			contrastText: "#0A0A0F",
		},
		background: {
			default: "#0A0A0F",
			paper: "#12121A",
		},
		text: {
			primary: "#EAEAEA",
			secondary: "#9E9E9E",
		},
		info: {
			main: "#7B61FF",
		},
		success: {
			main: "#39FF14",
		},
		error: {
			main: "#FF3131",
		},
		divider: "rgba(0, 240, 255, 0.12)",
	},
	typography: {
		fontFamily: bodyFontFamily,
		h1: {
			fontFamily: headingFontFamily,
			fontWeight: 900,
			fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
			letterSpacing: "0.05em",
			textTransform: "uppercase",
			lineHeight: 1.1,
		},
		h2: {
			fontFamily: headingFontFamily,
			fontWeight: 700,
			fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
			letterSpacing: "0.03em",
			lineHeight: 1.2,
		},
		h3: {
			fontFamily: headingFontFamily,
			fontWeight: 700,
			fontSize: "clamp(1.5rem, 3vw, 2rem)",
			lineHeight: 1.3,
		},
		h4: {
			fontFamily: headingFontFamily,
			fontWeight: 600,
			fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
		},
		h5: {
			fontFamily: bodyFontFamily,
			fontWeight: 600,
			fontSize: "1.25rem",
		},
		h6: {
			fontFamily: bodyFontFamily,
			fontWeight: 600,
			fontSize: "1.125rem",
		},
		body1: {
			fontFamily: bodyFontFamily,
			lineHeight: 1.7,
			fontSize: "clamp(1rem, 1.2vw, 1.125rem)",
		},
		body2: {
			fontFamily: bodyFontFamily,
			lineHeight: 1.6,
		},
		button: {
			fontFamily: headingFontFamily,
			fontWeight: 700,
			letterSpacing: "0.05em",
			textTransform: "uppercase",
		},
	},
	shape: {
		borderRadius: 12,
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				html: {
					scrollBehavior: "smooth",
				},
				body: {
					backgroundColor: "#0A0A0F",
					overflowX: "hidden",
				},
				"::selection": {
					backgroundColor: "rgba(0, 240, 255, 0.3)",
					color: "#FFFFFF",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					padding: "12px 32px",
					transition: "all 0.3s ease",
				},
				containedPrimary: {
					background: "linear-gradient(135deg, #00F0FF 0%, #7B61FF 100%)",
					boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)",
					"&:hover": {
						boxShadow: "0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)",
						transform: "translateY(-2px)",
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					background: "rgba(18, 18, 26, 0.7)",
					backdropFilter: "blur(12px)",
					border: "1px solid rgba(0, 240, 255, 0.1)",
					transition: "all 0.3s ease",
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 6,
					fontWeight: 600,
				},
				colorPrimary: {
					background: "rgba(0, 240, 255, 0.15)",
					color: "#00F0FF",
					border: "1px solid rgba(0, 240, 255, 0.3)",
				},
				colorSecondary: {
					background: "rgba(255, 0, 229, 0.15)",
					color: "#FF00E5",
					border: "1px solid rgba(255, 0, 229, 0.3)",
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					background: "rgba(10, 10, 15, 0.7)",
					backdropFilter: "blur(12px)",
					borderBottom: "1px solid rgba(0, 240, 255, 0.08)",
					boxShadow: "none",
				},
			},
		},
		MuiModal: {
			styleOverrides: {
				backdrop: {
					backgroundColor: "rgba(0, 0, 0, 0.85)",
					backdropFilter: "blur(8px)",
				},
			},
		},
	},
});
