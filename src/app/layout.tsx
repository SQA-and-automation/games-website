import type { Metadata } from "next";
import { Exo_2, Orbitron } from "next/font/google";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "./globals.css";

const orbitron = Orbitron({
	subsets: ["latin"],
	variable: "--font-orbitron",
	display: "swap",
	weight: ["400", "500", "600", "700", "800", "900"],
});

const exo2 = Exo_2({
	subsets: ["latin"],
	variable: "--font-exo2",
	display: "swap",
	weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "ELLIXMMER | Play Games",
	description: "Play free web games — space shooters, racing, RPG & more. No download needed.",
	keywords: ["web games", "browser games", "play online", "space shooter", "ELLIXMMER"],
	openGraph: {
		title: "ELLIXMMER | Play Games",
		description: "Play free web games — space shooters, racing, RPG & more.",
		type: "website",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
			<body>
				<ThemeRegistry>{children}</ThemeRegistry>
			</body>
		</html>
	);
}
