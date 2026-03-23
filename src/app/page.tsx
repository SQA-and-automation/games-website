import Box from "@mui/material/Box";
import FlowFieldWrapper from "@/components/effects/FlowFieldWrapper";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import AboutSection from "@/components/sections/AboutSection";
import GamesGallery from "@/components/sections/GamesGallery";
import HeroSection from "@/components/sections/HeroSection";

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
