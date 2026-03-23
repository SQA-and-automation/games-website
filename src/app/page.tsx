import Box from "@mui/material/Box";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import FlowFieldWrapper from "@/components/effects/FlowFieldWrapper";
import HeroSection from "@/components/sections/HeroSection";
import GamesGallery from "@/components/sections/GamesGallery";
import AboutSection from "@/components/sections/AboutSection";

export default function Home() {
	return (
		<Box
			component="main"
			sx={{
				minHeight: "100vh",
				bgcolor: "background.default",
				position: "relative",
			}}
		>
			<FlowFieldWrapper />
			<NoiseOverlay />
			<Navbar />
			<HeroSection />
			<GamesGallery />
			<AboutSection />
			<Footer />
		</Box>
	);
}
