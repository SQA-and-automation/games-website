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
	title: "ELLIXMMER | Mobile Game Publisher",
	description:
		"Crafting bold mobile adventures for Android & iOS. Explore our games portfolio.",
	keywords: ["mobile games", "game publisher", "android", "ios", "ELLIXMMER"],
	openGraph: {
		title: "ELLIXMMER | Mobile Game Publisher",
		description: "Crafting bold mobile adventures for Android & iOS.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
			<body>
				<ThemeRegistry>{children}</ThemeRegistry>
			</body>
		</html>
	);
}
